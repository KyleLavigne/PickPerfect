import React, { useEffect } from "react";
import { useStore } from "../state/useStore";
export default function RoleFilter() {
    const { roles, loadRoles, filters, setFilter, loadChampions } = useStore();
    useEffect(() => {
        loadRoles();
    }, []);
    return (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <label>Role:</label>
            <select
                value={filters.role}
                onChange={(e) => {
                    setFilter("role", e.target.value);
                    loadChampions();
                }}
            >
                <option style={{ color: "#222222" }} value="">
                    Any
                </option>
                {roles.map((r) => (
                    <option style={{ color: "#222222" }} key={r} value={r}>
                        {r}
                    </option>
                ))}
            </select>
        </div>
    );
}
