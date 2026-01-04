import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config({path:'./.env'})
import connectDB from "./db/index.js"
import {app} from "./app.js"

connectDB().then(
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`the server is running on PORT: ${process.env.PORT}`)
    })
).catch(
    (err)=>{
        console.log("connection error",err)
    }
)