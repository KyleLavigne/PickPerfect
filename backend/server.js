import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import { auth } from "express-oauth2-jwt-bearer";

import { requireAdminRole } from "./src/middleware/requireAdminRole.js";

import championsRouter from "./src/routes/champions.js";
import rolesRouter from "./src/routes/roles.js";
import draftRouter from "./src/routes/draft.js";
import ddragonRouter from "./src/routes/ddragonRoutes.js";
import adminChampionsRouter from "./src/routes/adminChampions.js";
import recommendationsRouter from "./src/routes/recommendations.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || "*",
        credentials: true
    })
);
app.use(express.json());
app.use(morgan("dev"));
app.use("/static", express.static("static"));

const jwtCheck = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
    tokenSigningAlg: "RS256"
});

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/champions", championsRouter);
app.use("/api/roles", rolesRouter);
app.use("/api/ddragon", ddragonRouter);
app.use("/api", recommendationsRouter);
app.use("/api", draftRouter);
app.use("/api/admin/champions", jwtCheck, requireAdminRole, adminChampionsRouter);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/loldraft";
mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log("MongoDB connected");
        app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
    })
    .catch((err) => {
        console.error("MongoDB connection error", err);
        process.exit(1);
    });
