import mongoose, { isValidObjectId } from "mongoose"
import { Likes } from "../models/like.models.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const existingLike = await Likes.findOne({ // fixed
        video: videoId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await existingLike.deleteOne()
        return res.status(200).json(
            new ApiResponse(200, { liked: false }, "Video unliked")
        )
    }

    await Likes.create({
        video: videoId,
        likedBy: req.user._id
    })

    return res.status(200).json(
        new ApiResponse(200, { liked: true }, "Video liked")
    )
})

// Same fix for toggleCommentLike
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    const existingLike = await Likes.findOne({ // fixed
        comment: commentId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await existingLike.deleteOne()
        return res.status(200).json(
            new ApiResponse(200, { liked: false }, "Comment unliked")
        )
    }

    await Likes.create({
        comment: commentId,
        likedBy: req.user._id
    })

    return res.status(200).json(
        new ApiResponse(200, { liked: true }, "Comment liked")
    )
})



const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    const existingLike = await Likes.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await existingLike.deleteOne()
        return res.status(200).json(
            new ApiResponse(200, { liked: false }, "Tweet unliked")
        )
    }

    await Likes.create({
        tweet: tweetId,
        likedBy: req.user._id
    })

    return res.status(200).json(
        new ApiResponse(200, { liked: true }, "Tweet liked")
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const likes = await Likes.find({
        likedBy: req.user._id,
        video: { $exists: true }
    })
        .populate({
            path: "video",
            select: "title thumbnail owner",
            populate: {
                path: "owner",
                select: "username avatar"
            }
        })
        .sort({ createdAt: -1 })

    const likedVideos = likes.map((like) => like.video)

    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
