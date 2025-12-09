import React from "react";

export default function About() {
    return (
        <div className="relative min-h-screen text-slate-50 overflow-hidden">
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-2/3 bg-neutral-950/70 rounded-xl backdrop-blur-sm z-10">
                <div className="min-h-screen px-6 py-10 text-neutral-200">
                    <h1 className="text-3xl font-bold mb-4">About PickPerfect</h1>

                    <p className="text-neutral-400 max-w-3xl">
                        PickPerfect is a League of Legends draft assistant designed to help players,
                        coaches, and teams make smarter decisions during champion select. It
                        combines your stored champion data with real-time recommendations, bans, and
                        role-based filtering to streamline the drafting process and reduce
                        guesswork.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-2">What PickPerfect Does</h2>
                    <ul className="list-disc ml-6 space-y-2 text-neutral-400">
                        <li>
                            Tracks picks and bans for both teams and automatically removes
                            unavailable champions from suggestions.
                        </li>
                        <li>
                            Provides lane-specific champion recommendations that adjust based on
                            your team’s composition and the enemy’s threats.
                        </li>
                        <li>
                            Uses champion roles, tags, and metadata sourced from your backend
                            database and live Data Dragon versions.
                        </li>
                        <li>
                            Allows you to save and load drafts using secure Auth0 login, enabling
                            preparation for tournaments, scrims, or multi-game series.
                        </li>
                        <li>
                            Syncs champion icons, splash art, and details dynamically through the
                            API.
                        </li>
                    </ul>

                    <h2 className="text-xl font-semibold mt-8 mb-2">How It Works</h2>
                    <p className="text-neutral-400 max-w-3xl">
                        PickPerfect communicates with a custom backend service that stores champion
                        information, roles, tags, and user-saved drafts. The drafting UI updates
                        instantly as you assign picks or bans. Recommendations are generated using
                        lightweight heuristic scoring that considers team balance, damage profile,
                        class diversity, and lane needs.
                    </p>
                    <p className="text-neutral-400 max-w-3xl mt-3">
                        Authentication is handled by Auth0, allowing each user to maintain their own
                        saved drafts securely. Draft data is stored in MongoDB and linked to your
                        unique Auth0 user ID.
                    </p>

                    <h2 className="text-xl font-semibold mt-8 mb-2">Why PickPerfect?</h2>
                    <p className="text-neutral-400 max-w-3xl">
                        Drafting well is one of the strongest predictors of in-game success. Whether
                        you're preparing for Clash, coaching a competitive team, or just want an
                        easier way to explore compositions, PickPerfect helps you visualize your
                        options and avoid common drafting mistakes—before the game even begins.
                    </p>

                    <p className="text-neutral-500 mt-10 text-sm">
                        PickPerfect is an independent tool and is not endorsed by Riot Games.
                    </p>
                </div>
            </div>
        </div>
    );
}
