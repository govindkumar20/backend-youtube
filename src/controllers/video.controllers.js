import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query = "",
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query

    const matchStage = {
        isPublished: true
    }

    if (query) {
        matchStage.title = { $regex: query, $options: "i" }
    }

    if (userId && isValidObjectId(userId)) {
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }

    const videos = await Video.aggregate([
        { $match: matchStage },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        },
        {
            $skip: (Number(page) - 1) * Number(limit)
        },
        {
            $limit: Number(limit)
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    )
})


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    const videoLocalPath = req.files?.video?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required")
    }

    const videoUpload = await uploadOnCloudinary(videoLocalPath)
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)

    if (!videoUpload?.url) {
        throw new ApiError(500, "Video upload failed")
    }

    if (!thumbnailUpload?.url) {
        throw new ApiError(500, "Thumbnail upload failed")
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        owner: req.user._id,
        isPublished: true
    })

    return res.status(201).json(
        new ApiResponse(201, video, "Video published successfully")
    )
})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId).populate(
        "owner",
        "username avatar"
    )

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (!video.isPublished && video.owner._id.toString() !== req.user?._id?.toString()) {
        throw new ApiError(403, "Video is private")
    }

    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    )
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this video")
    }

    if (title) video.title = title
    if (description) video.description = description

    if (req.file?.path) {
        const thumbnailUpload = await uploadOnCloudinary(req.file.path)
        if (!thumbnailUpload?.url) {
            throw new ApiError(500, "Thumbnail upload failed")
        }
        video.thumbnail = thumbnailUpload.url
    }

    await video.save()

    return res.status(200).json(
        new ApiResponse(200, video, "Video updated successfully")
    )
})


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this video")
    }

    await video.deleteOne()

    return res.status(200).json(
        new ApiResponse(200, {}, "Video deleted successfully")
    )
})


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to change status")
    }

    video.isPublished = !video.isPublished
    await video.save()

    return res.status(200).json(
        new ApiResponse(
            200,
            { isPublished: video.isPublished },
            "Publish status updated"
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
