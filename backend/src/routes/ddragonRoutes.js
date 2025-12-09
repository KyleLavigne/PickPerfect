// backend/src/routes/ddragonRoutes.js
import express from "express";
import { getChampions, getChampionDetails } from "../services/ddragon.js";

const router = express.Router();

// GET /api/ddragon/champions/:key
router.get("/champions/:key", async (req, res) => {
    try {
        const { key } = req.params;

        const { version, champ } = await getChampionDetails(key);

        if (!champ) {
            return res.status(404).json({ error: "Champion not found" });
        }

        // pass version along so frontend can build icon URLs
        res.json({ version, champ });
    } catch (err) {
        console.error("Error in /api/ddragon/champions/:key:", err.message);
        res.status(500).json({ error: "Failed to fetch champion details" });
    }
});

// GET /api/ddragon/splashes
router.get("/splashes", async (req, res) => {
    try {
        const { version, champions } = await getChampions();
        const splashes = champions.map((c) => ({
            key: c.key,
            name: c.name,
            splash: c.splash
        }));
        res.json({ version, splashes });
    } catch (err) {
        console.error("Error in /api/ddragon/splashes:", err.message);
        res.status(500).json({ error: "Failed to fetch splash art" });
    }
});

export default router;
