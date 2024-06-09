import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  try {
    const subscription = await Subscription.findOne({
      channel: channelId,
      subscriber: req.user?._id,
    });

    if (subscription) {
      await Subscription.findByIdAndDelete(subscription._id);
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            subscription,
            "Subscription removed successfully"
          )
        );
    } else {
      const newSubscription = await Subscription.create({
        channel: channelId,
        subscriber: req.user?._id,
      });
      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            newSubscription,
            "Subscription created successfully"
          )
        );
    }
  } catch (error) {
    console.error("Error toggling subscription:", error);
    throw new ApiError(500, "Internal server error");
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }
//   const subscribers = await Subscription.find({ channel: channelId }).populate(
//     "subscriber",
//     "username avatar"
//   );

//   if (!subscribers.length) {
//     throw new ApiError(404, "No subscribers found for this channel");
//   }
  const subscriber = Subscription.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
      },
    },
    {
      $project: {
        subscriber: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscriber[0], "Subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(401, "Invalid subscriber Id!")
    }

    const userchannel = await Subscription.aggregate(
        [
            {
                $match: {
                    subscriber: new mongoose.Types.ObjectId(subscriberId)
                }
            },

            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "subscribedTo",
                    pipeline: [
                        {
                            $project: {
                                fullname: 1,
                                username: 1,
                                isSubscribed: 1
                            }
                        }
                    ]
                }
            },

            {
                $addFields: {
                    subscribedTo: {
                        $first: "$subscribedTo"
                    }
                }
            }
        ]
    )

    const channelsList = userchannel.map(i => i.subscribedTo)

    return res
        .status(200)
        .json(
            new ApiResponse(200, channelsList, "subscribed channels fetched")
        )
})
  
  

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
