import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.models.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Videos } from "../models/video.models.js"
import { User } from "../models/user.models.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "channel id not valid")
    }

    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "channel does not exist")
    }

    const totalVideos = await Videos.countDocuments({ owner: channelId })

    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    })

    return res.status(200).json(
        new ApiResponse(200, { totalVideos, totalSubscribers }, "Channel stats fetched")
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const { page = 1, limit = 10 } = req.query

    const skip = (page - 1) * limit

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "channel id not valid")
    }

    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "channel does not exist")
    }

    const channelVideos = await Videos.find({ owner: channelId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))

    return res.status(200).json(
        new ApiResponse(200, channelVideos, "channel videos fetched successfully")
    )
})

export {
    getChannelStats,
    getChannelVideos
}
