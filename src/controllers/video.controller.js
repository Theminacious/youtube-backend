import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  // get video by user id
  // define pagination //
  // paginate the video using query and options

  const pageNumber = parseInt(page);
  const pageLimit = parseInt(limit);
  const skip = (pageNumber - 1) * pageLimit;
  const sortDirection = sortType === "ascending" ? 1 : -1;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "userId is not found, userId is required!");
  }

  let filter = { owner: new mongoose.Types.ObjectId(userId) };
  if (query) {
    try {
      filter = { ...filter, ...JSON.parse(query) };
    } catch (error) {
      throw new ApiError(400, "Invalid query format");
    }
  }

  try {
    const videos = await Video.aggregate([
      {
        $match: filter,
        
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: pageLimit,
      },
      {
        $sort: { [sortBy]: sortDirection },
      },
    ]);

    const totalVideos = await Video.countDocuments({ owner: userId });
    const totalPages = Math.ceil(totalVideos / pageLimit);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { videos, totalPages, totalVideos },
          "All videos fetched successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400, "Error while fetching videos", error);
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  // get video from body
  // check if there is a video
  // check for user to which video
  // upload on cloudinary
  // check if there is a url if not throw error

  // Check if title and description are provided and not empty
  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "all fields are required or not be empty !");
  }

  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath) {
    throw new ApiError(400, "video file is required !");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail file is required !");
  }

  // Upload video to Cloudinary (Assuming this function exists and returns a URL)
  const videoFile = await uploadOnCloudinary(videoLocalPath);

  const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(400, "Error uploading video");
  }

  if (!thumbnailFile) {
    throw new ApiError(400, "Error uploading thumbnail");
  }

  // Create new video document
  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnailFile.url,
    title,
    time: new Date(),
    description,
    duration: videoFile.duration,
    owner: req.user?._id,
  });

  // Update user's videos array
  const videoUploaded = await Video.findById(video?._id);

  if (!videoUploaded) {
    throw new ApiError(500, "Video is not Uploaded !");
  }
  // Respond with success
  return res
    .status(201)
    .json(new ApiResponse(201, videoUploaded, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "videoId is not correct to find video");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const user = await User.findById(req.user?._id);

  if (!user.watchHistory.includes(videoId)) {
    await Video.findByIdAndUpdate(
      videoId,
      {
        $inc: {
          views: 1,
        },
      },
      {
        new: true,
      }
    );
  }

  ////set video_id in watchHistory of user

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $addToSet: {
        watchHistory: videoId,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  // check of the id
  // find the video by the id
  // get title thumbnail description from body
  // change them by the video help

  // Check if title and description are provided and not empty
  const { title, description } = req.body;

  if (
    !title ||
    !description ||
    title.trim() === "" ||
    description.trim() === ""
  ) {
    throw new ApiError(400, "Title and description are required");
  }

  ///

  const video = await Video.findById(videoId);

  ///previous video publicId

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

 

  // Check if a thumbnail file is uploaded
  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required");
  }

  try {
    // Upload thumbnail to Cloudinary
    const thumbnailUploadResponse =
      await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnailUploadResponse.url) {
      throw new ApiError(400, "Error uploading thumbnail");
    }

    // Find and update the video
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
            thumbnail: thumbnailUploadResponse.url,
            title,
            description

        },
      },
      { new: true }
    );

    if (!updatedVideo) {
      throw new ApiError(404, "error updating video");
    }

    // Respond with success
    return res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
  } catch (error) {
    // Handle known errors
    if (error.name === "Errpr while updating video detail") {
      throw error;
    }

    // Handle other errors
    console.error("Error updating video:", error);
    throw new ApiError(500, "Internal server error");
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  try {
    // Find the video by its ID
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    // Delete the video
    await Video.findByIdAndDelete(videoId);

    // Respond with success
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video deleted successfully"));
  } catch (error) {
    // Handle errors
    console.error("Error deleting video:", error);
    throw new ApiError(500, "Internal server error");
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  video.isPublished = !video.isPublished;

  const publishStatus = await Video.findByIdAndUpdate(
    videoId,
    {
      isPublished: video.isPublished,
    },
    {
      new: true,
    }
  ).select("-video -thumbnail -title -description -views -duration -owner");

  return res
    .status(200)
    .json(
      new ApiResponse(200, publishStatus, "Video status updated successfully")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
