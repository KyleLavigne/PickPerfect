// server/src/services/draftHeuristic.js (ESM version, expanded)

/**
 * Champion shape (expected):
 * {
 *   id: string,
 *   key?: string,
 *   name: string,
 *   roles: string[],                 // ["Top","Jungle","Middle","Bottom","Support"]
 *   tags?: string[],                 // Gameplay + comp tags
 *   synergies?: string[],            // champIds it synergizes with
 *   counters?: {
 *     weakAgainst?: string[],        // champIds it's weak to
 *     strongAgainst?: string[]       // champIds it's strong into
 *   },
 *   masteryScore?: number,           // optional comfort / mastery metric (0–1 / 0–100)
 *   comfortScore?: number            // alias for masteryScore if you prefer
 * }
 *
 * Draft state (expected):
 * {
 *   allyTeam: [{ id: string, role?: string }],
 *   enemyTeam: [{ id: string, role?: string }],
 *   bans?: string[],
 *   phase?: "early" | "mid" | "late",
 *   comfortByChampId?: { [champId: string]: number } // optional player comfort map
 * }
 */

export const DEFAULT_WEIGHTS = {
    roleFit: 3.0,
    synergy: 2.2,
    antiSynergyPenalty: -1.2,
    counter: 2.0,
    antiCounterPenalty: -1.5,
    teamNeeds: 2.6,
    flexValue: 0.8,
    comfortBoost: 0.0
};

export const ROLE_KEYS = ["Top", "Jungle", "Middle", "Bottom", "Support"];

/* ---- Tag Groups / Helpers ------------------------------------------------ */

const FRONTLINE_TAGS = ["Tank", "Bruiser", "Warden", "Vanguard"];
const ENGAGE_TAGS = ["Engage", "Hard Engage", "Initiator", "Diver"];
const POKE_TAGS = ["Poke", "Siege"];
const ENCHANTER_TAGS = ["Enchanter", "Healer", "Peel"];
const HYPERCARRY_TAGS = ["Hypercarry", "Scaling", "Marksman"];
const ASSASSIN_TAGS = ["Assassin", "Burst", "Pick"];
const AP_TAGS = ["Mage", "AP", "Battle Mage", "Artillery"];
const AD_TAGS = ["AD", "Marksman", "Skirmisher", "Fighter"];
const CC_TAGS = ["CC", "Hard CC", "Root", "Stun", "Knockup", "Charm", "Fear"];
const WAVECLEAR_TAGS = ["Waveclear", "Clear", "Control Mage"];

const SYNERGY_RULES = [
    {
        withAllyTags: ["Hard Engage", "Tank", "Diver", "Initiator"],
        candidateTags: ["AoE", "Follow-up", "Burst", "Skirmisher"],
        score: 12
    },
    { withAllyTags: ["AoE", "Wombo"], candidateTags: ["AoE", "CC Chain", "Setup"], score: 12 },
    { withAllyTags: ["Poke", "Siege"], candidateTags: ["Disengage", "Peel"], score: 8 },
    { withAllyTags: ["Hypercarry", "Scaling"], candidateTags: ["Enchanter", "Peel"], score: 10 },
    { withAllyTags: ["Assassin", "Pick"], candidateTags: ["Vision", "Pick", "Hard CC"], score: 8 },
    { withAllyTags: ["Splitpush"], candidateTags: ["Waveclear", "Global", "Cross-map"], score: 6 }
];

// “Enemy tag → what counters it”
const TAG_COUNTERS = {
    Poke: { counters: ["Engage", "Hard Engage", "Gapclose"], score: 8 },
    "Hard Engage": { counters: ["Disengage", "Peel"], score: 8 },
    Assassin: { counters: ["Tank", "Peel", "Point-and-Click CC"], score: 7 },
    Hypercarry: { counters: ["Diver", "Burst", "Assassin"], score: 7 },
    Splitpush: { counters: ["Waveclear", "Hard Engage"], score: 6 }
};

function hasAnyTag(obj, tags) {
    if (!obj?.tags) return false;
    const set = new Set(obj.tags);
    return tags.some((t) => set.has(t));
}

function countWhere(list, pred) {
    return list.reduce((acc, x) => (pred(x) ? acc + 1 : acc), 0);
}

/* ---- Team Needs / Comp Shape -------------------------------------------- */

function evaluateTeamNeeds(candidate, allyTeam, allById, desiredRole, phase) {
    const allies = allyTeam.map((a) => allById.get(a.id)).filter(Boolean);

    const isFrontline = (c) => hasAnyTag(c, FRONTLINE_TAGS);
    const hasEngage = (c) => hasAnyTag(c, ENGAGE_TAGS);
    const isAP = (c) => hasAnyTag(c, AP_TAGS);
    const isAD = (c) => hasAnyTag(c, AD_TAGS);
    const hasCC = (c) => hasAnyTag(c, CC_TAGS);
    const isPoke = (c) => hasAnyTag(c, POKE_TAGS);
    const isHyper = (c) => hasAnyTag(c, HYPERCARRY_TAGS);
    const isEnchanter = (c) => hasAnyTag(c, ENCHANTER_TAGS);
    const hasWaveclear = (c) => hasAnyTag(c, WAVECLEAR_TAGS);

    const frontline = countWhere(allies, isFrontline);
    const engage = countWhere(allies, hasEngage);
    const apCount = countWhere(allies, isAP);
    const adCount = countWhere(allies, isAD);
    const ccCount = countWhere(allies, hasCC);
    const pokeCount = countWhere(allies, isPoke);
    const hyperCount = countWhere(allies, isHyper);
    const enchanterCount = countWhere(allies, isEnchanter);
    const waveclearCount = countWhere(allies, hasWaveclear);

    const candFrontline = isFrontline(candidate);
    const candEngage = hasEngage(candidate);
    const candAP = isAP(candidate);
    const candAD = isAD(candidate);
    const candCC = hasCC(candidate);
    const candPoke = isPoke(candidate);
    const candHyper = isHyper(candidate);
    const candEnchanter = isEnchanter(candidate);
    const candWaveclear = hasWaveclear(candidate);

    let score = 0;

    // 1. Frontline balance
    if (frontline === 0 && candFrontline) score += 10;
    else if (frontline === 1 && candFrontline) score += 4;
    else if (frontline >= 2 && candFrontline) score -= 3;

    // 2. Engage presence
    if (engage === 0 && candEngage) score += 8;
    else if (engage >= 2 && candEngage) score -= 2;

    // 3. Damage profile (AP / AD)
    if (apCount === 0 && candAP) score += 6;
    if (adCount === 0 && candAD) score += 6;
    if (apCount >= 3 && candAP) score -= 4;
    if (adCount >= 3 && candAD) score -= 4;

    // 4. CC baseline
    if (ccCount < 2 && candCC) score += 5;

    // 5. Waveclear & Anti-Deathball
    if (waveclearCount === 0 && candWaveclear) score += 4;
    else if (waveclearCount >= 3 && candWaveclear) score -= 2;

    // 6. Hypercarry + Enchanter pairing
    if (hyperCount >= 1 && candEnchanter) score += 6;
    if (candHyper && enchanterCount >= 1) score += 4;

    // 7. Poke vs Engage / Phase nuance
    if (phase === "early" && candPoke && frontline === 0 && engage === 0) {
        // Pure poke early + no frontline/engage = risky, small penalty
        score -= 3;
    }
    if (phase === "late" && candHyper) {
        score += 3; // scaling is king late-game
    }

    // 8. Role-specific nudges
    if (desiredRole === "Support") {
        if (candEnchanter && hyperCount > 0) score += 3;
        if (candEngage && pokeCount > 0 && frontline === 0) score += 2; // hard engage support to complement poke
    }

    if (desiredRole === "Jungle") {
        // Jungler often responsible for engage + early pressure
        if (candEngage && engage === 0) score += 4;
        if (phase === "early" && candEngage) score += 2;
    }

    if (desiredRole === "Top") {
        // Top as additional frontline
        if (candFrontline && frontline === 0) score += 4;
    }

    return score;
}

/* ---- Flex Value ---------------------------------------------------------- */

function flexValue(candidate, phase) {
    if (!candidate.roles) return 0;
    const r = candidate.roles.length;
    if (r <= 1) return 0;

    const flexFactor = phase === "early" ? 2 : phase === "mid" ? 1 : phase === "late" ? 0.3 : 1;

    return flexFactor * Math.min(r - 1, 2);
}

/* ---- Role Fit ------------------------------------------------------------ */

function roleFit(candidate, desiredRole) {
    if (!desiredRole) return 0;
    if (!candidate.roles) return -5;
    return candidate.roles.includes(desiredRole) ? 10 : -6;
}

/* ---- Synergy (positive + negative) -------------------------------------- */

function synergyScore(candidate, allyTeam, allById) {
    let positive = 0;
    let negative = 0;

    const candTags = new Set(candidate.tags || []);

    for (const ally of allyTeam) {
        const A = allById.get(ally.id);
        if (!A) continue;
        const allyTags = new Set(A.tags || []);

        // Rule-based positive synergy
        for (const rule of SYNERGY_RULES) {
            const hitAlly = rule.withAllyTags.some((t) => allyTags.has(t));
            const hitCand = rule.candidateTags.some((t) => candTags.has(t));
            if (hitAlly && hitCand) positive += rule.score;
        }

        // Edge-based synergy (manual champion pairs)
        if (Array.isArray(A.synergies) && A.synergies.includes(candidate.id)) positive += 6;
        if (Array.isArray(candidate.synergies) && candidate.synergies.includes(A.id)) positive += 6;

        // Mild penalty for over-stacking identical poke
        if (allyTags.has("Poke") && candTags.has("Poke")) negative -= 2;

        // Anti-synergy: too many assassins with no frontline
        if (allyTags.has("Assassin") && candTags.has("Assassin")) {
            negative -= 4;
        }

        // Anti-synergy: hypercarry + hypercarry (only one wants all the gold)
        if (allyTags.has("Hypercarry") && candTags.has("Hypercarry")) {
            negative -= 5;
        }

        // Anti-synergy: double enchanter lanes (support + mid or bot)
        if (allyTags.has("Enchanter") && candTags.has("Enchanter")) {
            negative -= 4;
        }
    }

    return { positive, negative };
}

/* ---- Counter (positive + negative) -------------------------------------- */

function counterScore(candidate, enemyTeam, allById) {
    let positive = 0;
    let negative = 0;

    const candTags = new Set(candidate.tags || []);

    for (const enemy of enemyTeam) {
        const E = allById.get(enemy.id);
        if (!E) continue;

        // Tag-based counters: "enemy tag → what counters it"
        for (const tag of E.tags || []) {
            const def = TAG_COUNTERS[tag];
            if (!def) continue;
            const hits = def.counters.some((ct) => candTags.has(ct));
            if (hits) positive += def.score;
        }

        // Explicit matchups from data
        if (E.counters?.weakAgainst?.includes(candidate.id)) {
            positive += 7; // candidate is good into this enemy
        }
        if (E.counters?.strongAgainst?.includes(candidate.id)) {
            negative -= 7; // enemy is good into candidate
        }
    }

    return { positive, negative };
}

/* ---- Comfort / Mastery --------------------------------------------------- */

function comfortScore(candidate, state) {
    let score = 0;

    // State-level comfort map
    const byId = state?.comfortByChampId;
    if (byId && typeof byId[candidate.id] === "number") {
        score += byId[candidate.id];
    }

    // Champion-level mastery/comfort
    const mastery =
        typeof candidate.masteryScore === "number"
            ? candidate.masteryScore
            : typeof candidate.comfortScore === "number"
              ? candidate.comfortScore
              : 0;

    score += mastery;

    return score;
}

/* ---- Index / State Helpers ---------------------------------------------- */

function buildIndex(champions) {
    const byId = new Map(champions.map((c) => [c.id, c]));
    return { byId };
}

function isBannedOrTaken(id, state) {
    const bans = Array.isArray(state?.bans) ? state.bans : [];
    const allyTeam = Array.isArray(state?.allyTeam) ? state.allyTeam : [];
    const enemyTeam = Array.isArray(state?.enemyTeam) ? state.enemyTeam : [];

    const banned = bans.includes(id);
    const taken = allyTeam.some((a) => a?.id === id) || enemyTeam.some((e) => e?.id === id);

    return banned || taken;
}

/* ---- Main Recommendation Entry ------------------------------------------ */

/* ---- small helpers reused for highlights -------------------------------- */

function champHasAnyTag(champ, tagList) {
    if (!champ?.tags) return false;
    const set = new Set(champ.tags);
    return tagList.some((t) => set.has(t));
}

function buildHighlights({
    candidate,
    role,
    state,
    allById,
    breakdown,
    roleScoreRaw,
    needsScoreRaw,
    counterRawPos
}) {
    const highlights = [];
    const allies = state.allyTeam.map((a) => allById.get(a.id)).filter(Boolean);
    const enemies = state.enemyTeam.map((e) => allById.get(e.id)).filter(Boolean);

    const FRONTLINE_TAGS = ["Tank", "Bruiser", "Warden", "Frontline"];
    const ENGAGE_TAGS = ["Engage", "Hard Engage", "Initiator", "Diver"];
    const POKE_TAGS = ["Poke", "Siege"];
    const ENCHANTER_TAGS = ["Enchanter", "Healer", "Peel"];
    const WAVECLEAR_TAGS = ["Waveclear", "Anti-Siege"];
    const HYPERCARRY_TAGS = ["Hypercarry", "Scaling", "Marksman", "DPS"];

    const isFrontline = champHasAnyTag(candidate, FRONTLINE_TAGS);
    const hasEngage = champHasAnyTag(candidate, ENGAGE_TAGS);
    const isPoke = champHasAnyTag(candidate, POKE_TAGS);
    const isEnchanter = champHasAnyTag(candidate, ENCHANTER_TAGS);
    const hasWaveclear = champHasAnyTag(candidate, WAVECLEAR_TAGS);
    const isHyper = champHasAnyTag(candidate, HYPERCARRY_TAGS);

    const frontlineCount = allies.filter((c) => champHasAnyTag(c, FRONTLINE_TAGS)).length;
    const engageCount = allies.filter((c) => champHasAnyTag(c, ENGAGE_TAGS)).length;
    const pokeCount = allies.filter((c) => champHasAnyTag(c, POKE_TAGS)).length;
    const hyperAllies = allies.filter((c) => champHasAnyTag(c, HYPERCARRY_TAGS));

    // 1. Role fit
    if (role && roleScoreRaw > 0) {
        highlights.push(`${candidate.name} is a strong ${role}.`);
    } else if (role && roleScoreRaw < 0) {
        highlights.push(`Off-role ${role} pick – more of a flex choice.`);
    }

    // 2. Team needs / comp shape – headline
    if (needsScoreRaw >= 12) {
        highlights.push("Covers multiple team needs for this comp.");
    } else if (needsScoreRaw >= 6) {
        highlights.push("Helps round out your team’s composition.");
    }

    // 3. Specific contributions
    if (isFrontline && frontlineCount === 0) {
        highlights.push("Adds much-needed frontline.");
    } else if (isFrontline && frontlineCount === 1) {
        highlights.push("Strengthens your frontline.");
    }

    if (hasEngage && engageCount === 0) {
        highlights.push("Gives your team reliable engage tools.");
    } else if (hasEngage && engageCount >= 1) {
        highlights.push("Adds extra engage to start fights.");
    }

    if (isPoke && pokeCount === 0) {
        highlights.push("Adds long-range poke and siege pressure.");
    }

    if (hasWaveclear) {
        highlights.push("Provides strong waveclear and anti-siege.");
    }

    if (isHyper) {
        highlights.push("Functions as a high-scaling late game carry.");
    }

    if (isEnchanter && hyperAllies.length > 0) {
        const names = hyperAllies
            .slice(0, 2)
            .map((c) => c?.name)
            .filter(Boolean);
        if (names.length) {
            highlights.push(`Pairs well with your hypercarries (${names.join(", ")}).`);
        } else {
            highlights.push("Protects and buffs your carries as an enchanter.");
        }
    } else if (isEnchanter) {
        highlights.push("Adds peel, shields, and utility to protect teammates.");
    }

    // 4. Synergy headline
    if (breakdown.sSynPositive > 10) {
        highlights.push("Has strong synergy with your current picks.");
    } else if (breakdown.sSynPositive > 4) {
        highlights.push("Synergizes reasonably well with your team.");
    }

    // 5. Counter headline
    if (counterRawPos >= 8) {
        // try to name a couple of enemies it specifically answers
        const TAG_COUNTERS = {
            Poke: ["Poke", "Siege"],
            Hypercarry: ["Hypercarry", "Scaling", "Marksman"],
            Assassin: ["Assassin", "Burst"]
        };

        const enemyNamesGoodInto = [];
        for (const enemy of enemies) {
            if (!enemy?.tags) continue;
            for (const tag of enemy.tags) {
                const countersArr = TAG_COUNTERS[tag]?.length ? TAG_COUNTERS[tag] : null;
                if (!countersArr) continue;
                const candidateHasCounter = champHasAnyTag(candidate, countersArr);
                if (candidateHasCounter) {
                    enemyNamesGoodInto.push(enemy.name);
                    break;
                }
            }
        }

        if (enemyNamesGoodInto.length) {
            highlights.push(`Good into ${enemyNamesGoodInto.slice(0, 2).join(", ")}.`);
        } else {
            highlights.push("Has strong tools into the enemy composition.");
        }
    }

    // 6. Last resort: if somehow we ended with nothing, give at least one line
    if (highlights.length === 0) {
        highlights.push("Solid situational pick for this draft.");
    }

    return highlights;
}

/* ---- Main Recommendation Entry ------------------------------------------ */

export function recommendForRole({
    role,
    champions,
    state,
    weights = DEFAULT_WEIGHTS,
    limit = 10
}) {
    const { byId } = buildIndex(champions);

    // Normalize state so we never blow up on undefined fields
    const safeState = {
        allyTeam: Array.isArray(state?.allyTeam) ? state.allyTeam : [],
        enemyTeam: Array.isArray(state?.enemyTeam) ? state.enemyTeam : [],
        bans: Array.isArray(state?.bans) ? state.bans : [],
        phase: state?.phase || "mid",
        comfortByChampId: state?.comfortByChampId || {}
    };

    const phase = safeState.phase;
    const scored = [];

    for (const c of champions) {
        // 1) If a role is specified, only consider champs that can actually play that role
        if (role && (!Array.isArray(c.roles) || !c.roles.includes(role))) {
            continue;
        }

        // 2) Skip anything banned or already taken in ally/enemy teams
        if (isBannedOrTaken(c.id, safeState)) continue;

        // Role fit (still used for highlights & scoring nuance)
        const sRoleRaw = roleFit(c, role);
        const sRole = sRoleRaw * (weights.roleFit ?? 0);

        // Synergy
        const { positive: synPos, negative: synNeg } = synergyScore(c, safeState.allyTeam, byId);
        const sSynPositive = synPos * (weights.synergy ?? 0);
        const sSynNegative = synNeg * (weights.antiSynergyPenalty ?? -1);
        const sSyn = sSynPositive + sSynNegative;

        // Counter
        const { positive: ctrPos, negative: ctrNeg } = counterScore(c, safeState.enemyTeam, byId);
        const sCounterPositive = ctrPos * (weights.counter ?? 0);
        const sCounterNegative = ctrNeg * (weights.antiCounterPenalty ?? -1);
        const sCounter = sCounterPositive + sCounterNegative;

        // Team needs
        const sNeedsRaw = evaluateTeamNeeds(c, safeState.allyTeam, byId, role, phase);
        const sNeeds = sNeedsRaw * (weights.teamNeeds ?? 0);

        // Flex value
        const sFlexRaw = flexValue(c, phase);
        const sFlex = sFlexRaw * (weights.flexValue ?? 0);

        // Comfort / mastery
        const sComfortRaw = comfortScore(c, safeState);
        const sComfort = sComfortRaw * (weights.comfortBoost ?? 0);

        const total = sRole + sSyn + sCounter + sNeeds + sFlex + sComfort;

        const scoreBreakdown = {
            sRole,
            sSyn,
            sSynPositive,
            sSynNegative,
            sCounter,
            sCounterPositive,
            sCounterNegative,
            sNeeds,
            sFlex,
            sComfort
        };

        const highlights = buildHighlights({
            candidate: c,
            role,
            state: safeState,
            allById: byId,
            breakdown: scoreBreakdown,
            roleScoreRaw: sRoleRaw,
            needsScoreRaw: sNeedsRaw,
            counterRawPos: ctrPos
        });

        scored.push({
            champId: c.id,
            id: c.id,
            key: c.key ?? c.id, // <- used by your tests
            name: c.name,
            iconUrl: c.iconUrl,
            roles: c.roles,
            tags: c.tags,
            scoreBreakdown,
            highlights,
            total
        });
    }

    scored.sort((a, b) => b.total - a.total);
    return scored.slice(0, limit);
}
