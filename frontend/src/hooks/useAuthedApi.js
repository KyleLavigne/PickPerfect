// src/hooks/useAuthedApi.js
import { useAuth0 } from "@auth0/auth0-react";

export default function useAuthedApi() {
    const { getAccessTokenSilently } = useAuth0();
    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000/api";
    const API_AUDIENCE = import.meta.env.VITE_AUTH0_AUDIENCE;

    const authedFetch = async (path, options = {}) => {
        console.log("[useAuthedApi] requesting token for audience:", API_AUDIENCE);

        const token = await getAccessTokenSilently({
            authorizationParams: {
                audience: API_AUDIENCE
            }
        });

        // TEMP: decode payload to inspect `aud`
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            console.log("[useAuthedApi] access token aud:", payload.aud);
        } catch (e) {
            console.warn("[useAuthedApi] failed to decode token payload", e);
        }

        const res = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    };

    return { authedFetch };
}
