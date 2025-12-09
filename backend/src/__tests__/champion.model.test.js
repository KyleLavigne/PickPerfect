import Champion from "../models/Champion.js";

describe("Champion model", () => {
    test("requires key and name", () => {
        const champ = new Champion({});
        const err = champ.validateSync();

        expect(err).toBeDefined();
        expect(err.errors.key).toBeDefined();
        expect(err.errors.name).toBeDefined();
    });

    test("defaults roles to empty array when not provided", () => {
        const champ = new Champion({
            key: "Aatrox",
            name: "Aatrox"
        });

        const err = champ.validateSync();
        expect(err).toBeUndefined();

        expect(Array.isArray(champ.roles)).toBe(true);
        expect(champ.roles.length).toBe(0);
    });

    test("casts single string role into an array", () => {
        const champ = new Champion({
            key: "Aatrox",
            name: "Aatrox",
            roles: "Top"
        });

        const err = champ.validateSync();
        expect(err).toBeUndefined();

        expect(Array.isArray(champ.roles)).toBe(true);
        expect(champ.roles).toContain("Top");
    });
});
