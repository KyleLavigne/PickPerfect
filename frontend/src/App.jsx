// src/App.jsx
import React from "react";
import { Routes, Route, Link, NavLink, Navigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

import Home from "./pages/Home.jsx";
import DraftPage from "./pages/DraftPage.jsx";
import Champions from "./pages/Champions.jsx";
import About from "./pages/About.jsx";
import TagAdminPage from "./pages/TagAdminPage.jsx";
import ErrorBoundary from "./components/ErrorBoundary";
import RotatingBackground from "./components/RotatingBackground";

// This is the namespace we *intended* to use in the Auth0 Action
const ROLES_CLAIM = "https://pickperfect.app/roles";

const navClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium ${
        isActive ? "bg-blue-600 text-white" : "text-neutral-300 hover:bg-neutral-800"
    }`;

export default function App() {
    const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0();

    // 🔍 Debug: inspect what we actually get from Auth0
    console.log("Auth0 user:", user);
    if (user) {
        console.log("User keys:", Object.keys(user));
    }

    // Try explicit claim first
    let roles = (user && user[ROLES_CLAIM]) || [];

    // If that didn't work, try to auto-detect any claim ending in "/roles"
    if ((!roles || roles.length === 0) && user) {
        const dynamicRolesKey = Object.keys(user).find((k) => k.endsWith("/roles"));
        if (dynamicRolesKey) {
            console.log("Detected roles claim key:", dynamicRolesKey);
            roles = user[dynamicRolesKey];
        }
    }

    const isAdmin = Array.isArray(roles) && roles.includes("Admin");
    console.log("Resolved roles:", roles, "isAdmin:", isAdmin);

    return (
        <div className="relative min-h-screen text-neutral-100">
            {/* Background */}
            <RotatingBackground />

            {/* Navbar */}
            <nav className="relative z-20 flex items-center justify-between border-b border-neutral-800 px-6 py-3 bg-neutral-900/80 backdrop-blur">
                <div className="flex items-center gap-6">
                    <h1 className="text-lg font-bold">
                        <Link to="/">PickPerfect</Link>
                    </h1>
                    <div className="flex gap-2">
                        <NavLink to="/" className={navClass} end>
                            Home
                        </NavLink>
                        <NavLink to="/champions" className={navClass}>
                            Champions
                        </NavLink>
                        <NavLink to="/draft" className={navClass}>
                            Draft
                        </NavLink>
                        <NavLink to="/about" className={navClass}>
                            About
                        </NavLink>

                        {/* Only show admin link when user really has admin role */}
                        {isAdmin && (
                            <NavLink to="/admin/tags" className={navClass}>
                                Tag Admin
                            </NavLink>
                        )}
                    </div>
                </div>

                {/* Auth controls */}
                <div className="flex items-center gap-3">
                    {isLoading ? (
                        <span className="text-xs text-neutral-400">Checking session…</span>
                    ) : isAuthenticated ? (
                        <>
                            <span className="text-xs text-neutral-300 max-w-[150px] truncate">
                                {user?.nickname || user?.email}
                            </span>
                            {isAdmin && (
                                <span className="text-[10px] rounded-full border border-amber-400 px-2 py-0.5 text-amber-300">
                                    Admin
                                </span>
                            )}
                            <button
                                onClick={() =>
                                    logout({ logoutParams: { returnTo: window.location.origin } })
                                }
                                className="text-xs px-3 py-1 rounded-md border border-neutral-700 hover:bg-neutral-800"
                            >
                                Log out
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => loginWithRedirect()}
                            className="text-xs px-3 py-1 rounded-md border border-emerald-500 text-emerald-300 hover:bg-emerald-600/20"
                        >
                            Log in
                        </button>
                    )}
                </div>
            </nav>

            {/* Main content */}
            <main className="relative z-10 p-6 min-h-screen">
                <ErrorBoundary>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/champions" element={<Champions />} />
                        <Route path="/draft" element={<DraftPage />} />
                        <Route path="/about" element={<About />} />

                        {/* Admin route guard */}
                        <Route
                            path="/admin/tags"
                            element={
                                isAdmin ? (
                                    <TagAdminPage />
                                ) : isAuthenticated ? (
                                    <div className="text-sm text-red-300">
                                        You are logged in but do not have permission to view this
                                        page.
                                    </div>
                                ) : (
                                    <Navigate to="/" replace />
                                )
                            }
                        />
                    </Routes>
                </ErrorBoundary>
            </main>
        </div>
    );
}
