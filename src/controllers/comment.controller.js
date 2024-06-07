import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";

const getVideoComments = asyncHandler(async (req, res) => {
    // Get video id from the request parameters
    const { videoId } = req.params;
    // Get pagination parameters from the query string with default values
    let { page = 1, limit = 10 } = req.query;
  
    // Validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      throw new ApiError(400, "Invalid video ID");
    }
  
    // Convert page and limit to numbers
    page = parseInt(page);
    limit = parseInt(limit);
  
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
  
    // Find comments for the video
    const comments = await Comment.find({ video: videoId })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "owner",
        select: "username avatar",
      });
  
    // Get total number of comments
    const totalComments = await Comment.countDocuments({ video: videoId });
  
    // Calculate total pages for pagination
    const totalPages = Math.ceil(totalComments / limit);
  
    // Respond with comments data
    return res.status(200).json({
      success: true,
      data: {
        comments,
        totalComments,
        totalPages,
      },
      message: "Video comments fetched successfully",
    });
  });
  
const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  // get the new comment from the body
  // find video to which comment is to be applied
  // then assign the comment to the video

  const { content } = req.body;
  const { videoId } = req.params;

  if (!req.user?._id) {
    throw new ApiError(400, "User not found");
  }

  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!isValidObjectId(user)) {
    throw new ApiError(400, "Invalid user ID");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required and should not be empty");
  }

  const video = Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });

  if (!comment) {
    throw new ApiError(404, "error while creating comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { newContent } = req.body;
    const { commentId } = req.params;
  
    
      // Check if newContent is provided and not empty
      if (newContent.trim() === "") {
        throw new ApiError(400, "content is required and should not be empty")
    }
    if (!isValidObjectId(commentId)) {
        throw new ApiError(404, "Invalid Video id or not available")
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found with this comment Id")
    }
  
      // Update the comment content
      const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { content: newContent },
        { new: true } // This returns the updated comment
      );
  
      // If update failed
      if (!updatedComment) {
        throw new ApiError(404, "Failed to update comment");
      }
  
      // Respond with the updated comment
      return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
   
  });
  

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  // find video by its id
  // check if there is the comment
  const {commentId} = req.params

 
  const comment = await Comment.findByIdAndDelete(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }
  
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
