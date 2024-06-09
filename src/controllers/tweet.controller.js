import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweets.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body

    if(!content || content.trim() === "") {
        throw new ApiError(400, "content is required and should not be empty")
    }

    if(!isValidObjectId(req.user?._id)) {
        throw new ApiError(400, "Invalid user ID")
    }

    const tweet = await Tweet.create({
        content,
        owner:req.user._id
    })
    if (!tweet) {
        
        throw new ApiError(500, "Failed to create tweet")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"))
    
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user ID")
    }

    const tweets = await Tweet.find({owner:userId})
    if (!tweets || tweets.length === 0) {
        throw new ApiError(404, "No tweets found for this user");
    }

    return res
    .status(200)
    .json(new ApiResponse(201, tweets, "Tweet fetched successfully"))

    

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const {newContent} = req.body
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    if(!newContent || newContent.trim() === "") {
        throw new ApiError(400, "content is required and should not be empty")
    }

    const tweet = await Tweet.findByIdAndUpdate(tweetId, {
        content:newContent
    }, {
        new:true
    })

    if(!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet 
    const{tweetId} = req.params
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet deleted successfully"));

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
