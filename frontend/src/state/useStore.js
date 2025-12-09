// src/state/useStore.js
import { create } from "zustand";
import { api } from "../api/client";

export const useStore = create((set, get) => ({
    champions: [],
    roles: [],
    filters: { role: "", q: "", tag: "" },
    loading: false,
    error: "",

    async loadRoles() {
        try {
            const { data } = await api.get("/roles"); // baseURL already includes /api
            set({ roles: data, error: "" });
        } catch (e) {
            set({ error: "Failed to load roles." });
        }
    },

    async loadChampions() {
        set({ loading: true, error: "" });
        try {
            const { role, q, tag } = get().filters;
            const params = {};
            if (role) params.role = role; // "Top" | "Jungle" | ...
            if (q) params.q = q; // search text
            if (tag) params.tag = tag; // playstyle tag

            const { data } = await api.get("/champions", { params });
            set({ champions: data, loading: false });
        } catch (e) {
            set({ loading: false, error: "Failed to load champions." });
        }
    },

    setFilter(key, value) {
        set((state) => ({ filters: { ...state.filters, [key]: value } }));
    }
}));
