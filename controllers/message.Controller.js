import asyncHandler from 'express-async-handler';
import messageModel from '../models/messageModel.js';
import User from '../models/userModel.js';

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
        firstname: {
          $cond: {
            if: { $eq: ["$lastMessage.senderId", loggedInUserId] },
            then: "$receiverUser.firstname",
            else: "$senderUser.firstname"
          }
        },
        lastname: {
          $cond: {
            if: { $eq: ["$lastMessage.senderId", loggedInUserId] },
            then: "$receiverUser.lastname",
            else: "$senderUser.lastname"
          }
        },
        phone: {
          $cond: {
            if: { $eq: ["$lastMessage.senderId", loggedInUserId] },
            then: "$receiverUser.phone",
            else: "$senderUser.phone"
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
            then: { $concat: [process.env.BASE_URL, "/users/", "$receiverUser.profileImage"] },
            else: { $concat: [process.env.BASE_URL, "/users/", "$senderUser.profileImage"] }
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
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
   
    const senderId = req.user._id;
    req.body.receiverId = receiverId;
    req.body.senderId = senderId;

    const sender = await User.findById(senderId).select('firstname lastname profileImage');
    const receiver = await User.findById(receiverId).select('firstname lastname fcmToken');

    const message = await messageModel.create(req.body);

    if(!message) {
        return next(new AppError("There is an error creating message", 400));
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