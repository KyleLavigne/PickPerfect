// src/api/client.js
import axios from "axios";

// Priority: runtime window override → Vite env → relative "/api" (good with Vite proxy)
const API_BASE =
    (typeof window !== "undefined" && window.__DRAFT_API_BASE) ||
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE) ||
    "/api"; // works with dev proxy and prod reverse-proxy

export const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000
});

// Optional: simple error logging
api.interceptors.response.use(
    (res) => res,
    (err) => {
        console.error("[API ERROR]", err?.response?.status, err?.response?.data || err.message);
        return Promise.reject(err);
    }
);
