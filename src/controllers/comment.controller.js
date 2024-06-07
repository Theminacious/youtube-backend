import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from '../models/video.models.js'

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video

    // Get video id from the video 
    // check if there is actually a video with that id
    // from videoid get the comments associated with it

  
        // Get video id from the request parameters
        const { videoId } = req.params;
        // Get pagination parameters from the query string with default values
        const { page = 1, limit = 10 } = req.query;
    
        // Validate videoId
        if (!videoId?.trim() || !mongoose.Types.ObjectId.isValid(videoId)) {
            throw new ApiError(400, "Invalid or missing video ID");
        }
    
        // Aggregate comments for the video
        const commentsData = await Video.aggregate([
            {
                // Match the video by its ID
                $match: { _id: mongoose.Types.ObjectId(videoId) }
            },
            {
                // Lookup comments associated with the video
                $lookup: {
                    from: "comments",
                    localField: "_id",
                    foreignField: "video",
                    as: "comments"
                }
            },
            {
                // Add a field to slice the comments array for pagination
                $addFields: {
                    comments: {
                        $slice: ["$comments", (page - 1) * limit, parseInt(limit)]
                    }
                }
            },
            {
                // Project only the comments field
                $project: {
                    comments: 1
                }
            }
        ]);
    
        // Check if video was found and comments were fetched
        if (!commentsData?.length) {
            throw new ApiError(404, "Video not found");
        }
    
        // Respond with the comments
        return res
            .status(200)
            .json(new ApiResponse(200, commentsData[0].comments, "Comments fetched successfully"));
    });
const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    // get the new comment from the body
    // find video to which comment is to be applied
    // then assign the comment to the video

    const {newComment}  = req.body

    const video = Video.findById(req.video?._id) 
    if(!video?._id){
        throw new ApiError(404,"Video not found")
    }

    const comment = await Comment.create({
        ...newComment,
        video:video._id,
        owner:req.user?._id,

    })

    video.comments.push(comment._id)
    await video.save({validateBeforeSave:true})

    return res
    .status(200)
    .json(new ApiResponse(200,comment,"Comment created successfully"))

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    // get old comment and new comment from body
    // find video by its id
    // check if there is the oldcomment

    const { oldComment, newComment } = req.body;

    try {
        // Check if oldComment and newComment are provided
        if (!oldComment || !newComment) {
            throw new ApiError(400, "Old comment and new comment are required");
        }
    
        // Find the video by its ID
        const video = await Video.findById(req.video?._id);
        if (!video) {
            throw new ApiError(404, "Video not found");
        }
    
        // Find the comment by its ID
        const comment = await Comment.findById(oldComment);
        if (!comment) {
            throw new ApiError(404, "Comment to be edited not found");
        }
    
        // Ensure the comment belongs to the video (optional, based on your use case)
        if (!video.comments.includes(comment._id)) {
            throw new ApiError(403, "Comment does not belong to this video");
        }
    
        // Update the comment
        comment.comment = newComment;
        await comment.save({ validateBeforeSave: true });
    
        return res
            .status(200)
            .json(new ApiResponse(200, comment, "Comment updated successfully"));
    } catch (error) {
        
        throw new ApiError(500, error.message);
    }
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    // find video by its id
    // check if there is the comment
    // check the comment is vali
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
