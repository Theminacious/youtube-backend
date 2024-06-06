import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'

// Utility function for deep copying objects
const deepCopy = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

// Function to generate access and refresh tokens
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token");
  }
};

// Route handler for user registration
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

  const { fullName, username, email, password } = req.body;
  console.log("email:", email);

  if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, "User with email and username alreay exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  // const coverLocalPath = req.files?.coverImage[0]?.path;

  let coverLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverLocalPath = req.files.coverImage[0].path;
  }


  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

 const avatar = await uploadOnCloudinary(avatarLocalPath)
 const coverImage = await uploadOnCloudinary(coverLocalPath)

 if (!avatar) {
  throw new ApiError(400, 'Avatar file is required');
 }

const user = await User.create({
  fullName,
  avatar: avatar.url,
  coverImage : coverImage?.url || "",
  email,
  password,
  username: username.toLowerCase()
 })

const createdUser = await User.findById(user._id).select(
  "-password -refreshToken"
)

if(!createdUser){
  throw new ApiError(500, "Something went wrong while registering the user");
}

return res.status(201).json(
  new ApiResponse(200, createdUser, "User Registered successfully")
)


});

// Route handler for user login
const loginUser = asyncHandler(async(req,res)=>{

  // get user detail from frontend(req body -> data)
  // check if the user is in the database using username,email
  // check password
  // generate accessToken and RefreshTOken for the user
  // send cookies

  const {email,username,password} = req.body

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{username}, {email}]
})


  if (!user) {
    throw new ApiError(404, "User Not Found");
  }

  const ispasswordValid = await user.isPasswordCorrect(password)

  if (!ispasswordValid) {
    throw new ApiError(401, "Invalid Password");
  }

  const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options= {
    httpOnly:true,
    secure:true
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken".refreshToken,options)
  .json(
    new ApiResponse(
      200,
      {
        user: deepCopy(loggedInUser.toObject()),accessToken,refreshToken
      },
      "User Logged in Successfully"
    )
  )
  

})

// Route handler for user logout
const logoutUser = asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:
      {
        refreshToken:undefined
      }
    },
    {
      new:true
    }
  )

  const options= {
    httpOnly:true,
    secure:true
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User Logged Out Successfully"))

})


const refreshAccessToken =asyncHandler(async(req,res)=>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"unautharized request")
  }


  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
  
    )
  
    const user =await User.findById(decodedToken?._id)
  
    if(!user){
      throw new ApiError(401,"invalid refresh token")
    }
  
    if (incomingRefreshToken!==user?.refreshToken) {
      throw new ApiError(401,"Refresh token is expired or used")
    }
  
    const options={
      httpOnly:true,
      secure:true
    }
  
    const {accessToken,newrefreshToken}=await  generateAccessAndRefreshToken(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {accessToken,refreshToken:newrefreshToken},
          "Access Token Refreshed"
      )
    )
  
  } catch (error) {
throw new ApiError(401,error?.message || "invalid Refresh token")
    
  }

})


const changeCurrentPassword = asyncHandler(async(req,res)=>{
  
  const {oldpassword,newPassword} = req.body

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldpassword)

  if(!isPasswordCorrect){
    throw new ApiError(401,"Invalid Password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave:false})

  return res
  .status(200)
  .json(new ApiResponse(200,{},"Password Changed Successfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{

  return res
  .status(200)
  .json(200,req.user,"Current User fetched successfully")
})

const updateAccountDetails =asyncHandler(async(req,res)=>{

  const{fullName,email} = req.body
  if (!fullName || !email) {
    throw new ApiError(400,)
  }
  const user = await User.findByIdAndUpdate(req.user?._id
    ,
    {
      $set:{
        email:email,
        fullName:fullName
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user.toObject(), "User details updated successfully"))
  

})

const updateUserAvatar =asyncHandler(async(req,res)=>{
  const avatarLocalPath = await req.file?.path

  if (!avatarLocalPath) {
    throw new ApiError(400,"Avatar file missing")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)

if (!avatar.url) {
    throw new ApiError(400,"Error while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {new:true}
  ).select('-password')

  return res
  .status(200)
  .json(new ApiResponse(200, user.toObject(), "User avatar updated successfully"))
  
 
})

const updateUserCoverImage =asyncHandler(async(req,res)=>{
  const coverImageLocalPath = await req.file?.path

  if (!coverImageLocalPath) {
    throw new ApiError(400,"Cover image file missing")
  }
  const coverImage = await uploadOnCloudinary(coverLocalPath)

if (!coverImage.url) {
    throw new ApiError(400,"Error while uploading  cover image")
  }


  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{
        coverImage:coverImage.url
      }
    },
    {new:true}
  ).select('-password')

  return res
  .status(200)
  .json(new ApiResponse(200, user.toObject(), "User cover image updated successfully"))
 
})


// Exporting route handlers
export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage}

