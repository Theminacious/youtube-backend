import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const {  channelId } = req.params;


  const channelStats = await User.aggregate([
    {
      $match: { _id: mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "likedBy",
        as: "likes",
      },
    },
    {
      $project: {
        totalVideos: { $size: "$videos" },
        totalSubscribers: { $size: "$subscribers" },
        totalViews: { $sum: "$videos.views" },
        totalLikes: { $size: "$likes" },
      },
    },
  ]);

  if(!channelStats.length){
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, channelStats[0], "Channel stats fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  try {
    // Get all the videos uploaded by the channel
    const videos = await Video.find({ owner: channelId });

    // Check if videos are found
    if (!videos.length) {
      throw new ApiError(404, "No videos found for this channel");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
  } catch (error) {
    // Handle any errors that occur during the query
    console.error("Error fetching channel videos:", error);
    throw new ApiError(500, "Internal server error");
  }
});

export { getChannelStats, getChannelVideos };
