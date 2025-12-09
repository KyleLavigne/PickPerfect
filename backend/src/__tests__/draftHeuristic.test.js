// backend/src/__tests__/draftHeuristic.test.js
import { recommendForRole } from "../services/draftHeuristic.js";

const champions = [
    {
        id: "Aatrox",
        key: "Aatrox",
        name: "Aatrox",
        roles: ["Top"],
        tags: ["Fighter", "Frontline", "Diver"]
    },
    {
        id: "Alistar",
        key: "Alistar",
        name: "Alistar",
        roles: ["Support"],
        tags: ["Tank", "Frontline", "Engage", "Hard Engage", "Support"]
    },
    {
        id: "Ashe",
        key: "Ashe",
        name: "Ashe",
        roles: ["Bottom", "Support"],
        tags: ["Marksman", "Hypercarry", "Poke"]
    },
    {
        id: "Ahri",
        key: "Ahri",
        name: "Ahri",
        roles: ["Middle"],
        tags: ["Mage", "Assassin", "Pick"]
    }
];

describe("draftHeuristic.recommendForRole", () => {
    test("excludes already picked champions", () => {
        const state = {
            allyTeam: [{ id: "Aatrox" }], // already on our team
            enemyTeam: [],
            bans: [],
            phase: "mid"
        };

        const recs = recommendForRole({
            role: "Top",
            champions,
            state,
            limit: 10
        });

        const keys = recs.map((c) => c.key);
        // Aatrox is already picked, so should not be recommended
        expect(keys).not.toContain("Aatrox");
    });

    test("excludes banned champions", () => {
        const state = {
            allyTeam: [],
            enemyTeam: [],
            bans: ["Ahri"], // banned
            phase: "mid"
        };

        const recs = recommendForRole({
            role: "Middle",
            champions,
            state,
            limit: 10
        });

        const keys = recs.map((c) => c.key);
        expect(keys).not.toContain("Ahri");
    });

    test("filters champions by desired role when provided", () => {
        const state = {
            allyTeam: [],
            enemyTeam: [],
            bans: [],
            phase: "mid"
        };

        const recs = recommendForRole({
            role: "Support",
            champions,
            state,
            limit: 10
        });

        const keys = recs.map((c) => c.key);

        // Only Alistar + Ashe are supports in this pool
        expect(keys).toEqual(expect.arrayContaining(["Alistar", "Ashe"]));
        // Aatrox should not appear in Support recs
        expect(keys).not.toContain("Aatrox");
    });

    test("prefers frontline when comp lacks frontline", () => {
        const state = {
            allyTeam: [
                { id: "Ashe" }, // backline hypercarry
                { id: "Ahri" } // damage, but not frontline
            ],
            enemyTeam: [],
            bans: [],
            phase: "mid"
        };

        const recs = recommendForRole({
            role: "Support",
            champions,
            state,
            limit: 5
        });

        const topRec = recs[0];

        // With no frontline yet, it should prefer Alistar over Ashe
        expect(topRec.key).toBe("Alistar");
    });
});
