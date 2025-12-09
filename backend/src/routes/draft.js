// backend/src/routes/draft.js
import express from "express";
import Draft from "../models/Draft.js";
import { requireAuth, getUserIdFromRequest } from "../middleware/auth.js";

const router = express.Router();

/**
 * Everything below here requires a valid Auth0 token.
 */
router.use(requireAuth);

/**
 * Helper: get current Auth0 user id ("sub")
 */
function requireUserId(req, res) {
    const userId = getUserIdFromRequest(req); // returns req.auth.payload.sub
    if (!userId) {
        res.status(401).json({ ok: false, error: "unauthorized" });
        return null;
    }
    return userId;
}

/**
 * GET /api/drafts
 * List drafts for current user
 */
router.get("/drafts", async (req, res) => {
    try {
        const userId = requireUserId(req, res);
        if (!userId) return;

        const drafts = await Draft.find({ userId }).sort({ updatedAt: -1 }).lean();

        res.json({ ok: true, drafts });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: "internal_error" });
    }
});

/**
 * POST /api/drafts
 * Create new draft
 */
router.post("/drafts", async (req, res) => {
    try {
        const userId = requireUserId(req, res);
        if (!userId) return;

        const { name, state, side = "both", notes = "" } = req.body;

        const draft = await Draft.create({
            userId,
            name: name || "Untitled Draft",
            side,
            notes,
            state
        });

        res.status(201).json({ ok: true, draft });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: "internal_error" });
    }
});

/**
 * PUT /api/drafts/:id
 * Update existing draft (must belong to this user)
 */
router.put("/drafts/:id", async (req, res) => {
    try {
        const userId = requireUserId(req, res);
        if (!userId) return;

        const { id } = req.params;
        const { name, state, side = "both", notes = "" } = req.body;

        const draft = await Draft.findOneAndUpdate(
            { _id: id, userId }, // note: userId is a String in schema
            { name, state, side, notes },
            { new: true }
        );

        if (!draft) {
            return res.status(404).json({ ok: false, error: "not_found" });
        }

        res.json({ ok: true, draft });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: "internal_error" });
    }
});

/**
 * DELETE /api/drafts/:id
 * Delete draft (must belong to this user)
 */
router.delete("/drafts/:id", async (req, res) => {
    try {
        const userId = requireUserId(req, res);
        if (!userId) return;

        const { id } = req.params;

        const draft = await Draft.findOneAndDelete({ _id: id, userId });

        if (!draft) {
            return res.status(404).json({ ok: false, error: "not_found" });
        }

        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ ok: false, error: "internal_error" });
    }
});

export default router;
