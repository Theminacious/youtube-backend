import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"

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
    const {commentId} = req.params
    //TODO: toggle like on comment

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}