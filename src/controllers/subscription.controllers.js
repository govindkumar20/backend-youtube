import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscriptions.models.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { application } from "express"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const subscriberId= req.user?._id

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"channel id not valid")
    }

    const channel=await User.findById(channelId)

    if(!channel){
        throw new ApiError(404,"channel not found")
    }

    const existingSubscription= await Subscription.findOne({
        subscriber:subscriberId,
        channel:channelId
    })

    if(existingSubscription){
        await Subscription.findByIdAndDelete(existingSubscription._id)

        return res.status(200)
        .json(
            new ApiResponse(200,{isSubscribed:false},"unsubscribed successfully")
        )
    }

    const newSubscriber=await Subscription.create({
        channel:channelId,
        subscriber:subscriberId
    })

     return res.status(200)
        .json(
            new ApiResponse(200,{isSubscribed:true,newSubscriber},"subscribed successfully")
        )



})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    
    const {channelId} = req.params
    const { page=1, limit=10}=req.query

    const skip=(page-1)*limit

    if(!isValidObjectId(channelId)){
        throw new ApiError(400,"channel id invalid")
    }
    const channel= await User.findById(channelId)

    if(!channel){
        throw new ApiError(404,"channel not found")
    }

    const channelSubscribers= await Subscription.find({channel:channelId}).sort({createdAt:-1}).skip(skip).limit(limit)

    return res.status(200)
    .json(
        new ApiResponse(200,channelSubscribers,"channel subscribers fetched successfully")
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const { page=1, limit=10}=req.query

    const skip=(page-1)*limit

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400,"subscriber id invalid")
    }
    const subscriber= await User.findById(subscriberId)

    if(!subscriber){
        throw new ApiError(404,"subscriber not found")
    }

    const subscribedChannels= await Subscription.find({subscriber:subscriberId}).sort({createdAt:-1}).skip(skip).limit(limit)

    return res.status(200)
    .json(
        new ApiResponse(200,subscribedChannels,"subscribed Channels fetched successfully")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}