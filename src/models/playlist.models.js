import mongoose from "mongoose"

const playlistsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    description: {
        type: String,
        required: true
    },
    videos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    }]
}, { timestamps: true })

export const Playlist = mongoose.model("Playlist", playlistsSchema)
