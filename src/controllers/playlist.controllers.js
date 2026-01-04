import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.models.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name) {
        throw new ApiError(400, "Playlist name is required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
        videos: []
    })

    return res.status(201).json(
        new ApiResponse(201, playlist, "Playlist created successfully")
    )
})


const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    const playlists = await Playlist.find({ owner: userId })
        .populate("videos", "title thumbnail")
        .sort({ createdAt: -1 })

    return res.status(200).json(
        new ApiResponse(200, playlists, "User playlists fetched successfully")
    )
})


const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)
        .populate("videos", "title description thumbnail")
        .populate("owner", "username avatar")

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    )
})


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to modify this playlist")
    }

    const alreadyExists = playlist.videos.some(
        (id) => id.toString() === videoId
    )

    if (alreadyExists) {
        throw new ApiError(400, "Video already exists in playlist")
    }

    playlist.videos.push(videoId)
    await playlist.save()

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video added to playlist")
    )
})


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to modify this playlist")
    }

    playlist.videos = playlist.videos.filter(
        (id) => id.toString() !== videoId
    )

    await playlist.save()

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video removed from playlist")
    )
})


const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this playlist")
    }

    await playlist.deleteOne()

    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    )
})


const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this playlist")
    }

    if (name) playlist.name = name
    if (description) playlist.description = description

    await playlist.save()

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
