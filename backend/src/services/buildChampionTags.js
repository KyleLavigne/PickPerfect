// server/src/services/buildChampionTags.js

/**
 * This module enriches champions with heuristic playstyle tags.
 *
 * Input champ shape:
 * {
 *   id: "Aatrox",
 *   key: "266",
 *   name: "Aatrox",
 *   roles: ["Top","Middle"],
 *   ddTags: ["Fighter","Tank"], // Riot Data Dragon tags
 *   stats?: {...}
 * }
 *
 * Output: tags like:
 * ["Tank","Frontline","Hard Engage","Poke","Waveclear","Hypercarry","Splitpush","Enchanter", ...]
 */

/* -------------------------------------------------------------------------- */
/*  OVERRIDE LISTS – by TAG                                                   */
/* -------------------------------------------------------------------------- */

/** Big, reliable hard-engage / initiator tools */
const HARD_ENGAGE_INITIATORS = [
    "Malphite",
    "Sejuani",
    "Nautilus",
    "Leona",
    "Rell",
    "Amumu",
    "Wukong",
    "Jarvan IV",
    "Hecarim",
    "Rakan",
    "Vi",
    "Zac",
    "Skarner",
    "Rammus",
    "Galio",
    "Ornn",
    "Rengar",
    "Nocturne",
    "Kled",
    "Sion",
    "Alistar",
    "Cho'Gath",
    "Maokai",
    "Poppy",
    "Warwick",
    "Xin Zhao",
    "Naafiri",
    "Ambessa"
];

/** Long-range poke/siege champions (AP + some AD) */
const POKE_CHAMPS = [
    "Ziggs",
    "Xerath",
    "Lux",
    "Vel'Koz",
    "Jayce",
    "Zoe",
    "Varus",
    "Ezreal",
    "Corki",
    "Jhin",
    "Ashe",
    "Azir",
    "Seraphine",
    "Nidalee",
    "Aurelion Sol",
    "Kog'Maw",
    "Twisted Fate",
    "Bard",
    "Gangplank",
    "Karma",
    "Jayce",
    "Miss Fortune",
    "Smolder"
];

/** Classic enchanter supports / heavy buffers */
const ENCHANTERS = [
    "Lulu",
    "Janna",
    "Nami",
    "Yuumi",
    "Sona",
    "Soraka",
    "Renata Glasc",
    "Taric",
    "Milio",
    "Seraphine",
    "Rakan", // hybrid
    "Karma", // hybrid
    "Ivern",
    "Zilean"
];

/** Dedicated splitpush / sidelane pressure champs */
const SPLITPUSHERS = [
    "Jax",
    "Fiora",
    "Camille",
    "Tryndamere",
    "Nasus",
    "Yorick",
    "Trundle",
    "Illaoi",
    "Teemo",
    "Heimerdinger",
    "Gangplank",
    "Kayle",
    "Akali",
    "Yone",
    "Yasuo",
    "Gwen",
    "Kled",
    "Sett",
    "Olaf",
    "Renekton",
    "Mordekaiser",
    "Ambessa"
];

/** Champions that are core to wombo/AoE teamfights */
const WOMBO_COMBO_CORES = [
    "Malphite",
    "Wukong",
    "Orianna",
    "Miss Fortune",
    "Yasuo",
    "Diana",
    "Amumu",
    "Galio",
    "Rell",
    "Alistar",
    "Rakan",
    "Kennen",
    "Nunu & Willump",
    "Jarvan IV",
    "Sejuani",
    "Sona",
    "Seraphine",
    "Azir",
    "Rumble",
    "Neeko",
    "Aurora"
];

/** Disengage / anti-engage tools */
const DISENGAGE_TOOLS = [
    "Janna",
    "Gragas",
    "Alistar",
    "Bard",
    "Poppy",
    "Vayne",
    "Trundle",
    "Nami",
    "Zilean",
    "Seraphine",
    "Sona",
    "Nautilus",
    "Tahm Kench",
    "Taliyah"
];

/** Anti-tank specialists, %HP damage, armor shred etc. */
const ANTI_TANK_SPECIALISTS = [
    "Vayne",
    "Kog'Maw",
    "Kai'Sa",
    "Varus",
    "Trundle",
    "Camille",
    "Fiora",
    "Bel'Veth",
    "Kindred",
    "Gwen",
    "Cassiopeia",
    "Mel"
];

/** Notable waveclear monsters (beyond basic mages) */
const WAVECLEAR_MASTERS = [
    "Anivia",
    "Viktor",
    "Orianna",
    "Azir",
    "Ziggs",
    "Lux",
    "Twisted Fate",
    "ZerI",
    "Seraphine",
    "Taliyah",
    "Ryze",
    "Syndra",
    "Vex",
    "Smolder",
    "Aurora"
];

/** Hypercarries beyond “any ADC” */
const HYPERCARRIES = [
    "Jinx",
    "Aphelios",
    "Kog'Maw",
    "Vayne",
    "Kai'Sa",
    "Smolder",
    "Yasuo",
    "Yone",
    "Kayle",
    "Akali",
    "Bel'Veth",
    "Master Yi",
    "Nasus",
    "Veigar",
    "Aurelion Sol",
    "Mel"
];

/** True assassin burst threats */
const ASSASSIN_BURSTERS = [
    "Zed",
    "Talon",
    "Kha'Zix",
    "Evelynn",
    "Rengar",
    "Akali",
    "LeBlanc",
    "Nocturne",
    "Fizz",
    "Qiyana",
    "Naafiri",
    "Kassadin",
    "Pyke",
    "Ekko"
];

/** Global / semi-global presence */
const GLOBAL_PRESENCE = [
    "Shen",
    "Twisted Fate",
    "Galio",
    "Nocturne",
    "Pantheon",
    "Tahm Kench",
    "Karthus",
    "Taliyah",
    "Sion",
    "Ryze"
];

/* -------------------------------------------------------------------------- */
/*  BASE TAG BUILDING                                                         */
/* -------------------------------------------------------------------------- */

function addBaseFromDdTags(tags, ddTags) {
    if (ddTags.includes("Tank")) {
        tags.add("Tank");
        tags.add("Frontline");
    }
    if (ddTags.includes("Fighter")) {
        tags.add("Fighter");
        tags.add("Bruiser");
    }
    if (ddTags.includes("Mage")) {
        tags.add("Mage");
        tags.add("AP");
    }
    if (ddTags.includes("Assassin")) {
        tags.add("Assassin");
        tags.add("Burst");
    }
    if (ddTags.includes("Marksman")) {
        tags.add("Marksman");
        tags.add("AD");
    }
    if (ddTags.includes("Support")) {
        tags.add("Support");
    }
}

function addFromRoles(tags, roles, champName) {
    if (!roles) return;
    if (roles.includes("Jungle")) {
        tags.add("Jungle");
        tags.add("Skirmisher");
    }
    if (roles.includes("Support")) {
        tags.add("Peel");
        tags.add("Vision");
    }
    if (roles.includes("Bottom")) {
        tags.add("Botlane");
        // many bot champs can hypercarry; we’ll refine with overrides
        tags.add("DPS");
    }
    if (roles.includes("Top")) {
        tags.add("Solo Lane");
    }
    if (roles.includes("Middle") || roles.includes("Mid") || roles.includes("Middle Lane")) {
        tags.add("Solo Lane");
    }

    // Some lane-based guesses:
    if (roles.includes("Jungle") && champName === "Lee Sin") {
        tags.add("Early Game");
        tags.add("Playmaker");
    }
}

/* -------------------------------------------------------------------------- */
/*  OVERRIDES APPLICATION                                                     */
/* -------------------------------------------------------------------------- */

function applyOverrideLists(tags, champName) {
    if (HARD_ENGAGE_INITIATORS.includes(champName)) {
        tags.add("Engage");
        tags.add("Hard Engage");
        tags.add("Initiator");
    }
    if (POKE_CHAMPS.includes(champName)) {
        tags.add("Poke");
        tags.add("Siege");
        tags.add("Waveclear");
    }
    if (ENCHANTERS.includes(champName)) {
        tags.add("Enchanter");
        tags.add("Healer");
        tags.add("Peel");
    }
    if (SPLITPUSHERS.includes(champName)) {
        tags.add("Splitpush");
        tags.add("Duelist");
    }
    if (WOMBO_COMBO_CORES.includes(champName)) {
        tags.add("AoE");
        tags.add("Wombo");
        tags.add("Setup");
    }
    if (DISENGAGE_TOOLS.includes(champName)) {
        tags.add("Disengage");
        tags.add("Peel");
    }
    if (ANTI_TANK_SPECIALISTS.includes(champName)) {
        tags.add("Anti-Tank");
        tags.add("%HP Damage");
    }
    if (WAVECLEAR_MASTERS.includes(champName)) {
        tags.add("Waveclear");
        tags.add("Anti-Siege");
    }
    if (HYPERCARRIES.includes(champName)) {
        tags.add("Hypercarry");
        tags.add("Scaling");
    }
    if (ASSASSIN_BURSTERS.includes(champName)) {
        tags.add("Assassin");
        tags.add("Burst");
        tags.add("Pick");
    }
    if (GLOBAL_PRESENCE.includes(champName)) {
        tags.add("Global");
        tags.add("Cross-map");
    }
}

/* -------------------------------------------------------------------------- */
/*  PUBLIC FUNCTION                                                           */
/* -------------------------------------------------------------------------- */

export function buildChampionTags(champ) {
    const tags = new Set();

    const ddTags = champ.ddTags || champ.tags || [];
    const roles = champ.roles || [];
    const name = champ.name || champ.id;

    // 1. Base tags from Riot classes
    addBaseFromDdTags(tags, ddTags);

    // 2. Role-based hints
    addFromRoles(tags, roles, name);

    // 3. Champion-specific overrides
    applyOverrideLists(tags, name);

    // 4. Optional: rough stat-based hints if you store stats
    const stats = champ.stats || {};
    if (typeof stats.hp === "number" && typeof stats.armor === "number") {
        if (stats.hp > 650 && stats.armor > 38) {
            tags.add("Frontline");
            tags.add("Tank");
        }
    }

    return Array.from(tags);
}
