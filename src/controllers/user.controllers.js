import mongoose from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js"
import { jwt } from "jsonwebtoken"
import { uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"


const generateAccessAndRefreshTokens= async (userId)=>{
    try {
        const user=User.findById(userId)
        const accessToken=User.generateAccessToken()
        const refreshToken=User.generateRefreshToken()

        user.refreshToken=refreshToken
        user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}
        
    } catch (error) {
        throw new ApiError(400,"Something went wrong while generation Access and Refresh tokens")
    }
}

const registerUser= asyncHandler( async (req,res) => {

    //get user details from the frontend
    //validation of details
    //check whether user already exists
    //check for avatar and coverimage
    //upload them on cloudinary
    //create user object, create entry in database
    //remove refreshtoken and password from response
    //check for user creation return response

    const{fullName, userName, email, password}=req.body

    if([fullName, userName, email, password].some((field)=> {return field?.trim() ===""})){
        throw new ApiError(400,"All fields are required")
    }

    const isExist= await User.findOne({
        $or: [{email}, {userName}]
    })
 
    if(isExist) throw new ApiError(400,"User already exist in database")

    const avatarLocalPath=req.files?.avatar?.[0]?.path
    const coverImageLocalPath=req.files?.coverImage?.[0]?.path

    if(!avatarLocalPath){ throw new ApiError(400,"Avatar file is required")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) {
        throw new ApiError(400,"Avatar uploading failed")
    }

    const user= await User.create({
        fullName,
        userName:userName.toLowerCase(),
        email:email,
        password:password,
        avatar:avatar.url,
        coverImage:coverImage?.url || ""
    })

    const createdUser=await User.findById(user._id).select( "-password -refreshToken")

    if(!createdUser) {
        throw new ApiError(400,"Something went wrong while creating user")
    }

    return res.status(200),json(
        new ApiResponse(200,createdUser,"user successfully registered")
    )
})

const loginUser= asyncHandler( async (req,res) => {

    //get user login details from fromtend
    //validation of details
    //check password correct or not
    //check whether user exist in db with same details
    // provide access and refresh tokens to user
    //send cookies

    const{userName, email, password}=req.body

    if([userName, email, password].some((fiels)=>{return field?.trim()===""})){
        throw new ApiError(400," Enter all the required fields")
    }

    const user= await User.findOne({
        $or: [{email}, {userName}]
    })
    if(!isExist){
        throw new ApiError(400,"User does not exixi in database")
    }

    const isPasswordValid=user.isPsswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(400,"Password not correct")
    }

    const {accessToken,refreshToken}= generateAccessAndRefreshTokens(user._id)

    const loggedInUser=User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200).json(
        new ApiResponse(200,loggedInUser,"user successfully logged in")
    )
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
})

const logoutUser= asyncHandler( async(req,res) => {
  
    User.findByIdAndUpdate(
        req.user._id,
        {
            refreshTokenn:null
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .json(
        new ApiResponse(200,{},"User logged out")
    )
    .cookie("refreshToken",refreshToken,options)
    .cookie("accessToken",accessToken,options)

})

const refreshAccessToken= asyncHandler( async(req,res) => {

    const incomingRefreshToken= req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(400,"invalid refresh token")
    }

    try {
        const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

        const user=User.findById(decodedToken?._id)

        if(!user){
            throw new ApiError(400,"invalid refresh token")
        }

        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(400,"refresh token invalid or expired")
        }

        const {accessToken,newRefreshToken}= generateAccessAndRefreshTokens(user._id)

        const options={
            httpOnly:true,
            secure:true
        }

        return res.status(200)
        .json(
            new ApiResponse(200,{accessToken,refreshToken:newRefreshToken},"access token refreshed")
        )
        .cookie("assessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
    } catch (error) {
        throw new ApiError(400, error?.message || "invalid refresh token")
    }
})

const changeCurrentPassword= asyncHandler( async(req,res) => {

    const {oldPassword, newPassword}=req.body

    if([oldPassword, newPassword].some((field)=> { return field?.trim()===""})){
        throw new ApiError(400,"both the fields are required")
    }

    const user=User.findById(req.user._id)
    const isPasswordValid= user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new ApiError(400,"incorrect old password")
    }

    user.password=newPassword
    user.save({validateBeforeSave:false})

    return res(200)
    .json(
        new ApiResponse(200,{},"password changed successfully")
    )
})

const getCurrentUser= asyncHandler( async (req,res) => {

    return res(200)
    .json(
        new ApiResponse(200,req.user,"current user fetched successfully")
    )
})

const updateAccountDetails= asyncHandler( async(req,res) => {
    
    const{fullName, email, userName}=req.body

    if([fullName, email, userName].some((field)=>{return field?.trim()===""})){
        throw new ApiError(400,"all fields are required")
    }

    const user= await User.findByIdAndUpdate(
        req.user._id,
        {
            userName,
            email,
            fullName
        },
        {
            new:true
        }
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200,user,"accounts details updated successfully")
    )


})

const updateUserAvatar= asyncHandler( async(req,res) => {

    const avatarLocalPath=req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar file required")
    }

    const avatar= await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"uploading of avatar failed")
    }

    const existingUser=await User.findById(req.user._id)
    
    //deleting old image
    if(existingUser.avatar){
        const parts=existingUser.avatar.split("/")
        const fileName=parts.pop();
        const folderName=parts.pop();
        const publicId=`${folderName}/${fileName.split(".")[0]}`
        await cloudinary.uploader.destroy(publicId)
    }
    
    const user= await User.findByIdAndUpdate(
        req.user._id,
        {
            avatar:avatar.url
        },
        {
            new:true
        }
    ).select("-password")

    fs.unlinkSync(avatarLocalPath)

    return res.status(200)
    .json(
        new ApiResponse(200,user,"avatar image updated successfully")
    )
})

const updateUserCoverImage= asyncHandler( async (req,res)=> {

    const coverImageLocalPath=req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"cover image required")
    }

    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage){
        throw new ApiError(400,"cover image upload on cloudinary failed")
    }

    const existingUser=User.findById(req.user._id)

    if(existingUser.coverImage){
        const parts=existingUser.coverImage.split("/")
        const fileName=parts.pop()
        const folderName=parts.pop()
        const publicId=`${folderName}/${fileName.split(".")[0]}`
        await cloudinary.uploader.destroy(publicId)
    }

    const user= await User.findByIdAndUpdate(
        req.user._id,
        {
            coverImage:coverImage.url
        },
        {
            new:true
        }
    ).select("-password")

    fs.unlinkSync(coverImageLocalPath)

    return res.status(200)
    .json(
        new ApiResponse(200,{user},"cover image updated successfully")
    )
})

const getUserChannelProfile= asyncHandler( async (req,res) => {

    const{userName}=req.params

    if(!userName?.trim()){
        throw new ApiError(400,"username is required")
    }

    const channel= await User.aggregate([

        {
            $match:{
                userName:userName?.toLowerCase()
            }
        },{
            $lookup:{
                from: "Subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"Subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount:{
                    $size: "$subscriber"
                },
                subscribedToCount:{
                    $size: "subscribedTo"
                },
                isPublished:{
                    if:{ $in:[req.user._id,subscribers.subscriber]},
                    then: true,
                    else: false
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(400,"channel does not exist")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,channel,"channel data")
    )

})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
}