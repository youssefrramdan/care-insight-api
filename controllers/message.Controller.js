import asyncHandler from 'express-async-handler';
import messageModel from '../models/messageModel.js';
import User from '../models/userModel.js';
import ApiError from '../utils/apiError.js';

const getUsersForSidebar = asyncHandler(async (req, res, next) => {
  const loggedInUserId = req.user._id;

  const usersWithLastMessage = await messageModel.aggregate([
    {
      $match: {
        $or: [
          { senderId: loggedInUserId },
          { receiverId: loggedInUserId }
        ]
      }
    },
    {
      $addFields: {
        chatKey: {
          $cond: {
            if: { $gt: ["$senderId", "$receiverId"] },
            then: { $concat: [{ $toString: "$senderId" }, "_", { $toString: "$receiverId" }] },
            else: { $concat: [{ $toString: "$receiverId" }, "_", { $toString: "$senderId" }] }
          }
        }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: "$chatKey",
        lastMessage: { $first: "$$ROOT" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "lastMessage.senderId",
        foreignField: "_id",
        as: "senderUser"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "lastMessage.receiverId",
        foreignField: "_id",
        as: "receiverUser"
      }
    },
    {
      $unwind: "$senderUser"
    },
    {
      $unwind: "$receiverUser"
    },
    {
      $project: {
        _id: {
          $cond: {
            if: { $eq: ["$lastMessage.senderId", loggedInUserId] },
            then: "$receiverUser._id",
            else: "$senderUser._id"
          }
        },
        fullName: {
          $cond: {
            if: { $eq: ["$lastMessage.senderId", loggedInUserId] },
            then: "$receiverUser.fullName",
            else: "$senderUser.fullName"
          }
        },
        email: {
          $cond: {
            if: { $eq: ["$lastMessage.senderId", loggedInUserId] },
            then: "$receiverUser.email",
            else: "$senderUser.email"
          }
        },
        profileImage: {
          $cond: {
            if: { $eq: ["$lastMessage.senderId", loggedInUserId] },
            then: "$receiverUser.profileImage",
            else: "$senderUser.profileImage"
          }
        },
        lastMessage: {
          text: "$lastMessage.text",
          createdAt: "$lastMessage.createdAt",
          senderId: "$lastMessage.senderId"
        }
      }
    },
    {
      $sort: { "lastMessage.createdAt": -1 }
    }
  ]);

  res.status(200).json(usersWithLastMessage);
});

const sendMessage = asyncHandler(async(req, res, next) => {
    const { text } = req.body;
    const image=req.file?.path
    const { id: receiverId } = req.params;

    const senderId = req.user._id;
    // req.body.receiverId = receiverId;
    // req.body.senderId = senderId;

    const sender = await User.findById(senderId).select('firstname lastname profileImage');
    const receiver = await User.findById(receiverId).select('firstname lastname fcmToken');

    const message = await messageModel.create({
      receiverId,
      senderId,
      text:req.body.text,
      image:req.file?.path,

    });

    if(!message) {
        return next(new ApiError("There is an error creating message", 400));
    }

    res.status(200).json({ message });
});

const getMessage = asyncHandler(async(req, res, next) => {
    const messages = await messageModel.find({
        $or: [
            {receiverId: req.params.id, senderId: req.user._id},
            {receiverId: req.user._id, senderId: req.params.id}
        ]
    });

    res.status(200).json(messages);
});

export { getUsersForSidebar, sendMessage, getMessage };






