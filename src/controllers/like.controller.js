import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"
import { Tweet } from "../models/tweets.models.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id; // Assuming user ID is available in the request (e.g., from a middleware)

    // Check if videoId is a valid MongoDB ObjectId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "videoId is not correct to find video");
    }

    // Find the video by its ID
    const video = await Video.findById(videoId);

    // Check if video exists
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check if the user has already liked the video
    const likeIndex = video.likes.indexOf(userId);

    if (likeIndex === -1) {
        // User has not liked the video, add like
        video.likes.push(userId);
    } else {
        // User has liked the video, remove like
        video.likes.splice(likeIndex, 1);
    }

    // Save the updated video document
    await video.save();

    // Return the appropriate response
    const action = likeIndex === -1 ? "liked" : "unliked";
    return res.status(200).json(new ApiResponse(200, video.likes, action));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    // Validate commentId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    // Find the comment by its ID
    const comment = await Comment.findById(commentId);

    // Check if the comment exists
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the user has already liked the comment
    const userId = req.user._id.toString();
    const likeIndex = comment.likes.indexOf(userId);

    if (likeIndex === -1) {
        // User has not liked the comment, add like
        comment.likes.push(userId);
    } else {
        // User has liked the comment, remove like
        comment.likes.splice(likeIndex, 1);
    }

    // Save the updated comment
    await comment.save();

    // Return the appropriate response
    const action = likeIndex === -1 ? "liked" : "unliked";
    return res.status(200).json(new ApiResponse(200, comment.likes, `Comment ${action} successfully`));
});
const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

if(!isValidObjectId(tweetId)){
    throw new ApiError(400, "Invalid tweet ID")
}


const tweet = await Tweet.findById(tweetId)

if(!tweet){
    throw new ApiError(404, "Tweet not found")

}

const userId = req.user._id.toString();
const likeIndex = tweet.likes.indexOf(userId);

if (likeIndex === -1) {
    // User has not liked the comment, add like
    tweet.likes.push(userId);
} else {
    // User has liked the comment, remove like
    tweet.likes.splice(likeIndex, 1);
}

// Save the updated comment
await tweet.save();

// Return the appropriate response
const action = likeIndex === -1 ? "liked" : "unliked";
return res.status(200).json(new ApiResponse(200, tweet.likes, `Tweet ${action} successfully`));

})

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    try {
        const videos = await Video.find({ likes: { $in: [userId] } })
            .populate({
                path: 'owner',
                select: 'username avatar'
            });

        if (!videos.length) {
            throw new ApiError(404, "No liked videos found");
        }

        return res.status(200).json(new ApiResponse(200, videos, "Liked videos fetched successfully"));
    } catch (error) {
        console.error("Error fetching liked videos:", error);
        throw new ApiError(500, "Internal server error");
    }
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}