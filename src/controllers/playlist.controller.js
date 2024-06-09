import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const {name, description} = req.body

    const playlist = new Playlist({
        name,
        description,
        owner: req.user?._id
    })

    await playlist.save()

    return res
    .status(201)
    .json(new ApiResponse(201,playlist,"Playlist created successfully"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    const playlists = await Playlist.find({owner: userId})

    return res
    .status(200)
    .json(new ApiResponse(200,playlists,"Playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
  
    // Validate IDs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid playlist or video ID");
    }
  
    // Find the playlist
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found");
    }
  
    // Find the video
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
  
    // Check if video is already in the playlist
    if (playlist.videos.includes(videoId)) {
      throw new ApiError(400, "Video is already in the playlist");
    }
  
    // Add video to playlist
    playlist.videos.push(videoId);
    await playlist.save();
  
    return res.status(200).json(new ApiResponse(200, playlist, "Video added to playlist successfully"));
  });
  

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID")
    }
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video is not in the playlist")
    }
    

    

    // TODO: check if video is already in playlist
    const playlistremove = await Playlist.findByIdAndUpdate(playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200,playlistremove,"Video removed from playlist successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    await Playlist.findByIdAndDelete(playlistId)    

    return res
    .status(200)
    .json(new ApiResponse(200,null,"Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }
    if(!name?.trim==="" || !description?.trim===""){
        throw new ApiError(400, "Name and description cannot be empty")
    }

    const playlist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
