// server/src/routes/adminChampions.js
import express from "express";
import { Champion } from "../models/Champion.js";
import { requireAdminRole } from "../middleware/requireAdminRole.js";

const router = express.Router();

/**
 * GET /api/admin/champions
 * Optional query:
 *   - search: name substring
 *   - role: filter by role (Top/Jungle/etc)
 */
router.get("/", async (req, res) => {
    // 🔐 Identify the authenticated user making the request
    const userId = req.auth?.payload?.sub;
    console.log("GET /admin/champions requested by:", userId);

    try {
        const { search, role } = req.query;

        const filter = {};
        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }
        if (role) {
            filter.roles = role;
        }

        const champs = await Champion.find(filter)
            .select("id name roles tags iconUrl ddTags")
            .sort({ name: 1 })
            .lean();

        res.json(champs);
    } catch (err) {
        console.error("GET /admin/champions error:", err);
        res.status(500).json({ error: "Failed to fetch champions" });
    }
});

// PATCH /api/admin/champions/:id/tags
router.patch("/admin/champions/:id/tags", requireAdminRole, async (req, res) => {
    try {
        const { id } = req.params;
        const { tags } = req.body;

        console.log("PATCH tags for champ", id, "by:", req.auth.payload.sub);

        if (!Array.isArray(tags)) {
            return res.status(400).json({ ok: false, error: "tags_must_be_array" });
        }

        // ✅ use Mongo _id here
        const champ = await Champion.findByIdAndUpdate(
            id,
            { $set: { tags } },
            { new: true }
        ).lean();

        if (!champ) {
            return res.status(404).json({ ok: false, error: "not_found" });
        }

        return res.json({ ok: true, tags: champ.tags, champion: champ });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, error: "internal_error" });
    }
});

export default router;
