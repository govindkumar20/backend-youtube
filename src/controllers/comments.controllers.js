import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.models.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const skip=(page-1)*limit

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"invalid video id")
    }

    const video= await Video.findById(videoId)

    if(!video){
        throw new ApiError(400,"video does not exist")
    }

    const videoComments= await Comment.find({video:videoId}).sort({createdAt:-1}).skip(skip).limit(limit)

    return res.status(200)
    .json(
        new ApiResponse(200,videoComments,"comments fetched successfully")
    )


})

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body
    const { videoId } = req.params

    if (!content) {
        throw new ApiError(400, "content is missing")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "video id is not valid")
    }

    const createdComment = await Comment.create({
        content,
        owner: req.user?._id,
        video: videoId
    })

    if (!createdComment) {
        throw new ApiError(400, "something went wrong while creating comment, try again")
    }

    return res.status(200).json(
        new ApiResponse(200, createdComment, "comment created successfully")
    )
})


const updateComment = asyncHandler(async (req, res) => {
    const { newContent } = req.body
    const { commentId } = req.params

    if (!newContent) {
        throw new ApiError(400, "content is missing")
    }

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "invalid comment id")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(400, "comment does not exist")
    }

    if (comment.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Unauthorised user access")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { content: newContent },
        { new: true }
    )

    if (!updatedComment) {
        throw new ApiError(400, "unable to update the comment try again")
    }

    return res.status(200).json(
        new ApiResponse(200, updatedComment, "comment updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "invalid comment id")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(400, "comment does not exist")
    }

    if (comment.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "Unauthorised user access")
    }

    await Comment.findByIdAndDelete(commentId)

    return res.status(200).json(
        new ApiResponse(200, {}, "comment deleted successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
