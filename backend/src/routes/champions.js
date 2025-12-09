import { Router } from "express";
import Champion from "../models/Champion.js";
import { requireAdminRole } from "../middleware/requireAdminRole.js";

const router = Router();

// GET /api/champions
router.get("/", async (req, res, next) => {
    try {
        const { q = "", role = "", tag = "" } = req.query;

        const filter = {};

        // text search by name or key
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { key: { $regex: q, $options: "i" } }
            ];
        }

        // optional role filter
        if (role) filter.roles = role;

        // optional tag filter
        if (tag) filter.tags = tag;

        // find champions matching filters
        const champs = await Champion.find(filter)
            .select("key name iconUrl roles tags synergy counters -_id")
            .sort({ name: 1 })
            .limit(500)
            .lean();

        res.json(champs);
    } catch (err) {
        console.error("Error fetching champions:", err);
        next(err);
    }
});

// GET /api/champions/:key
router.get("/:key", async (req, res, next) => {
    try {
        const champ = await Champion.findOne({ key: req.params.key }).lean();
        if (!champ) return res.status(404).json({ message: "Champion not found" });
        res.json(champ);
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /api/champions/:name
 * Body: { tags: string[] }
 * Requires admin permissions.
 */
router.patch("/:name", async (req, res) => {
    try {
        const { name } = req.params;
        const { tags } = req.body;

        if (!Array.isArray(tags)) {
            return res.status(400).json({ error: "tags must be an array of strings" });
        }

        const champ = await Champion.findOne({ name });

        if (!champ) {
            return res.status(404).json({ error: `Champion not found: ${name}` });
        }

        champ.tags = tags;
        await champ.save();

        return res.json({
            id: champ.id,
            name: champ.name,
            key: champ.key,
            roles: champ.roles,
            tags: champ.tags
        });
    } catch (err) {
        console.error("Error updating champion tags:", err);
        return res.status(500).json({ error: "Failed to update champion tags" });
    }
});

export default router;
