import mongoose, { isValidObjectId } from "mongoose"
import { Tweets } from "../models/tweet.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body

    if (!content) throw new ApiError(400, "Content is missing")

    const createdTweet = await Tweets.create({
        content,
        owner: req.user?._id
    })

    if (!createdTweet) throw new ApiError(400, "Tweet not created, try again")

    return res.status(201).json(
        new ApiResponse(201, createdTweet, "Tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    if (!isValidObjectId(userId)) throw new ApiError(400, "User ID not valid")

    const user = await User.findById(userId)
    if (!user) throw new ApiError(404, "User does not exist")

    const userTweets = await Tweets.find({ owner: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)

    return res.status(200).json(
        new ApiResponse(200, userTweets, "User tweets fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { newContent } = req.body
    const { tweetId } = req.params

    if (!newContent) throw new ApiError(400, "All fields are required")
    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Tweet ID is not valid")

    const tweet = await Tweets.findById(tweetId)
    if (!tweet) throw new ApiError(404, "Tweet does not exist")
    if (req.user?._id.toString() !== tweet?.owner.toString()) throw new ApiError(403, "Unauthorised user")

    const updatedTweet = await Tweets.findByIdAndUpdate(
        tweetId,
        { content: newContent },
        { new: true }
    )

    if (!updatedTweet) throw new ApiError(400, "Unable to update the tweet")

    return res.status(200).json(
        new ApiResponse(200, updatedTweet, "Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet ID")

    const tweet = await Tweets.findById(tweetId)
    if (!tweet) throw new ApiError(404, "Tweet does not exist")
    if (tweet.owner.toString() !== req.user?._id.toString()) throw new ApiError(403, "Unauthorised user")

    await Tweets.findByIdAndDelete(tweetId)

    return res.status(200).json(
        new ApiResponse(200, {}, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
