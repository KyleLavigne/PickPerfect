export function laneFromTimeline(lane) {
    const x = (lane || "").toLowerCase();
    if (x.includes("top")) return "Top";
    if (x.includes("jungle")) return "Jungle";
    if (x.includes("middle") || x.includes("mid")) return "Middle";
    if (x.includes("bottom") || x.includes("bot") || x.includes("carry")) return "Bottom";
    if (x.includes("utility") || x.includes("supp")) return "Support";
    return null;
}
