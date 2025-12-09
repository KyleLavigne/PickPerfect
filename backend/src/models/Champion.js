import mongoose from "mongoose";

const ChampionSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    iconUrl: { type: String },
    roles: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    synergy: { type: [String], default: [] },
    counters: { type: [String], default: [] },
    updatedAt: { type: Date, default: Date.now }
});

export const Champion = mongoose.model("Champion", ChampionSchema);
export default Champion;
