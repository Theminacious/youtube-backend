import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username , email
  // check for images , check for avatar
  // upload them to cloudinary,avatar
  // create user object - create entry in db
  // remove password and refresh token field from response 
  // check for user creation
  // return res

  const {fullName,username,email,password}=req.body
  console.log("email:",email);

  if (
     [fullName,email,username,password].some((field)=>field?.trim()==="")
  ){
    throw new ApiError(400,"All fields are  required")
  }

  const existedUser = User.findOne({
    $or:[{ username },{ email }]
  })

  if (existedUser) {
    throw new ApiError(409,"User with email and username alreay exists")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  const coverLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400,"Avatar file is required")
  }

 const avatar = await uploadOnCloudinary(avatarLocalPath)
 const coverImage = await uploadOnCloudinary(coverLocalPath)

 if (!avatar) {
  throw new ApiError(400,'Avatar file is required')
 }

const user = await User.create({
  fullName,
  avatar:avatar.url,
  coverImage : coverImage?.url || "",
  email,
  password,
  username:username.toLowerCase()
 })

const createdUser = await User.findById(user._id).select(
  "-password -refreshToken"
)

if(!createdUser){
  throw new ApiError(500,"Something went wrong while registering the user")
}

return res.status(201).json(
  new ApiResponse(200,createdUser,"User Registered successfully")
)


});


export {registerUser,}