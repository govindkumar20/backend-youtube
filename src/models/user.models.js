import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema=new mongoose.Schema({

    userName:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        index:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        index:true
    },
    fullName:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    avatar:{
        type:String,  //cloudinary url
        required:true
    },
    coverImage:{
        type:String,  //cloudinary url
        required:true
    },
    watchHistory:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    }],
    refreshToken:{
        type:String,
    }
},{ timestamps:true})

//password hashing

userSchema.pre("save",async function(next) {
    if(!this.isModified("password")) return next()
        this.password=await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password,this.password)
}

// generate access token and refresh token
userSchema.methods.generateAccessToken = function() {
    return jwt.sign({
        _id: this._id,
        fullName: this.fullName,   
        userName: this.userName,
        email: this.email
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    })
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign({
        _id: this._id   
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    })
}



export const User=mongoose.model("User",userSchema)