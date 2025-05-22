import http from "http";
import { Server } from "socket.io";
import express from "express";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: true,
        credentials: true
    }
});
const userSocketMap = {};

const getReceiverSocketId = userId => userSocketMap[userId];

// Function to get all online users
const getOnlineUsers = () => Object.keys(userSocketMap);

// Function to add user to online users
const addOnlineUser = (userId, socketId) => {
    userSocketMap[userId] = socketId;
    io.emit("getOnlineUsers", getOnlineUsers());
};

// Function to remove user from online users
const removeOnlineUser = (userId) => {
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", getOnlineUsers());
};

io.on("connection", (socket) => {
    try {
        console.log("A user connected with socket id:", socket.id);
        
        const { userId } = socket.handshake.query;
        if (!userId) {
            console.warn("Connection attempt without userId");
            return;
        }

        // Add user to online users
        addOnlineUser(userId, socket.id);

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log("A user disconnected:", socket.id);
            if (userId) {
                removeOnlineUser(userId);
            }
        });

        // Handle user going offline
        socket.on("userOffline", () => {
            if (userId) {
                removeOnlineUser(userId);
            }
        });

    } catch (error) {
        console.error("Error in socket connection:", error);
    }
});

export { 
    io, 
    app, 
    server, 
    getReceiverSocketId, 
    getOnlineUsers,
    addOnlineUser,
    removeOnlineUser
};