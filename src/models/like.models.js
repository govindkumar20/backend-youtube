import mongoose from "mongoose"

const likesSchema = new mongoose.Schema({
    tweet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweets"
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comments"
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    likedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true })

export const Like = mongoose.model("Like", likesSchema)
