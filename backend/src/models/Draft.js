// backend/src/models/Draft.js
import mongoose from "mongoose";

const DraftSchema = new mongoose.Schema(
    {
        userId: {
            type: String, // Auth0 sub, e.g. "google-oauth2|..."
            required: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        side: {
            type: String,
            default: "both"
        },
        notes: {
            type: String,
            default: ""
        },
        state: {
            type: Object, // { bluePicks, redPicks, bans }
            required: true
        }
    },
    { timestamps: true }
);

export default mongoose.model("Draft", DraftSchema);
