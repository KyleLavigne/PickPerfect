// server/src/middleware/requireAdminRole.js

// Custom claim key – must match what you configured in your Auth0 rule / action
const ROLES_CLAIM = process.env.AUTH0_ROLES_CLAIM || "https://pickperfect.app/roles";

export function requireAdminRole(req, res, next) {
    // `express-oauth2-jwt-bearer` puts the decoded token in `req.auth`
    const payload = req.auth?.payload;

    if (!payload) {
        return res.status(401).json({ error: "Missing token payload" });
    }

    const rawRoles = payload[ROLES_CLAIM];

    // Normalize to lowercase so "Admin" / "admin" both work
    const roles = Array.isArray(rawRoles) ? rawRoles.map((r) => String(r).toLowerCase()) : [];

    const isAdmin = roles.includes("admin");

    console.log("requireAdminRole:", {
        sub: payload.sub,
        rolesClaim: ROLES_CLAIM,
        rawRoles,
        isAdmin
    });

    if (!isAdmin) {
        return res.status(403).json({ error: "Admin role required" });
    }

    return next();
}
