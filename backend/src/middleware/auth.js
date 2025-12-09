// backend/src/middleware/auth.js
import { auth } from "express-oauth2-jwt-bearer";

export const requireAuth = auth({
    audience: process.env.AUTH0_AUDIENCE, // same as your SPA audience
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
    tokenSigningAlg: "RS256"
});

// Optional helper to pull a consistent user ID
export const getUserIdFromRequest = (req) => {
    return req.auth?.payload?.sub || null;
};
