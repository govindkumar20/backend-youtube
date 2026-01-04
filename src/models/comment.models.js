import mongoose from "mongoose"

const commentsSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: true
    }
}, { timestamps: true })

export const Comment = mongoose.model("Comment", commentsSchema)
