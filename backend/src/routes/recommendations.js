import express from "express";
import Champion from "../models/Champion.js";
import { recommendForRole } from "../services/draftHeuristic.js";

const router = express.Router();

router.post("/draft/recommend", async (req, res, next) => {
    try {
        const { role, allyTeam = [], enemyTeam = [], bans = [], phase = "mid" } = req.body;

        const champs = await Champion.find().lean();

        const champions = champs.map((c) => ({
            id: c.key,
            key: c.key,
            name: c.name,
            iconUrl: c.iconUrl,
            roles: c.roles || [],
            tags: c.tags || [],
            synergies: c.synergy || [],
            counters: c.counters || {}
        }));

        const state = { allyTeam, enemyTeam, bans, phase };

        const recommendations = recommendForRole({
            role,
            champions,
            state,
            // weights: DEFAULT_WEIGHTS // optional override
            limit: 20
        });

        res.json({ recommendations });
    } catch (err) {
        next(err);
    }
});

export default router;
