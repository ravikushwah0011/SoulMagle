// server/server.js
// const express = require("express");
import express from "express";

// const http = require("http");
import http from "http";
// import socketIo from "socket.io";
// import * as socketIo from "socket.io";
import { Server as socketIo } from "socket.io";

import bodyParser from "body-parser";
// import { Pool } from 'pg'; // Uncomment if needed
import pool from "./db.js";
import cors from "cors";
import path from "path";
import bcrypt from "bcryptjs";
// import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import chatUserRoutes from "./routes/chat-users.js";
import searchRoutes from "./routes/search-users.js";
import llmRoutes from "./routes/llm.js";

import dotenv from "dotenv";
dotenv.config();

const CLIENT_API = process.env.CLIENT_API_URL;

const app = express();

// ===== HTTP Server & Socket.IO =====
const server = http.createServer(app);
const io = new socketIo(server, {
  cors: {
    origin: [`${CLIENT_API}`, ""], // Allow frontend access
    methods: ["GET", "POST"],
  },
});

app.use(
  cors({
    origin: [`${CLIENT_API}`, ""],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Middleware to parse JSON request bodies
app.use(express.json());

// Middleware to parse URL-encoded request bodies (optional)
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Server is running!2");
});
// ✅ Authentication Route
app.use("/api", authRoutes);

// Get user profile by ID
app.get("/api/profile/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query("SELECT * FROM users WHERE id=$1", [
      userId,
    ]);
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile by ID
app.put("/api/profile/:userId", async (req, res) => {
  // console.log(req.body);
  const { userId } = req.params;
  const { name, interests, email, profile_photo } = req.body;
  try {
    const result = await pool.query(
      "UPDATE users SET name=$1, interests=$2, email=$3, profile_photo=$4 WHERE id=$5 RETURNING *",
      [name, interests, email, profile_photo, userId]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==== Fetch live users and recent users from backend ====
app.use("/api", chatUserRoutes);

// ===== AI-Vector Embedding Search =====
// Dummy embedding function: converts text to a simple vector
function embedInterest(text) {
  const vec = Array(5).fill(0);
  for (let i = 0; i < text.length; i++) {
    vec[i % 5] += text.charCodeAt(i);
  }
  return vec;
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// AI search endpoint
app.use("/api", searchRoutes);
app.use("/api", llmRoutes);

// app.post("/api/search", async (req, res) => {
//   const { interests } = req.body;
//   try {

//     // Retrieve all users’ interests from the database
//     const result = await pool.query(
//       "SELECT id, name, interests, profile_photo FROM users"
//     );
//     const queryVector = embedInterest(interests);
//     let suggestions = result.rows.map((user) => {
//       const userVector = embedInterest(user.interests);
//       const similarity = cosineSimilarity(queryVector, userVector);
//       return { ...user, similarity };
//     });
//     suggestions.sort((a, b) => b.similarity - a.similarity);
//     res.json({ suggestions });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// Serve static assets from the React build (if deployed together)
// Manually define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../client/public")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/public", "index.html"));
});

// Basic signaling server for WebRTC
// const userSockets = {};  // Store userId -> socketId mapping
const user_SocketMap = new Map(); // userId -> socketId
const socket_UserMap = new Map(); // socketId -> userId
const roomUserMap = new Map(); // roomId -> Set(userIds)
// const rooms = new Map(); // roomId -> [socketIds] 

io.on("connection", (socket) => {
  // Store user socket associations
  socket.on("register", async (userId) => {
    socket.userId = userId;
    // userSockets[userId] = socket.id;

    // Cleanup previous socket
    const oldSocketId = user_SocketMap.get(userId);
    if (oldSocketId && oldSocketId !== socket.id) {
      io.sockets.sockets.get(oldSocketId)?.disconnect(true);
    }

    user_SocketMap.set(userId, socket.id);
    socket_UserMap.set(socket.id, userId);

    console.log("New client connected", socket.id, oldSocketId);
    // Update user socket_id in DB
    await pool.query(
      "UPDATE users SET socket_id = $1 WHERE id=$2 RETURNING *",
      [socket.id, userId]
    );
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Handle chat request
  socket.on("chat-request", ({ senderId, receiverId }) => {
    const receiverSocket = user_SocketMap.get(receiverId);
    // console.log(receiverId, receiverSocket);

    if (receiverSocket) {
      io.to(receiverSocket).emit("incoming-chat-request", { senderId });
      console.log(senderId);
    }
  });

  // Handle chat acceptance
  socket.on("chat-accepted", ({ senderId, receiverId, roomId }) => {
    const senderSocket = user_SocketMap.get(senderId);
    const receiverSocket = user_SocketMap.get(receiverId);

    // console.log(senderSocket, receiverSocket, roomId);
    if (senderSocket && receiverSocket) {
      io.to(senderSocket).emit("chat-accepted-forward", { roomId });
      io.to(receiverSocket).emit("chat-accepted-forward", { roomId });
    }
  });

  // Handle chat rejection
  socket.on("chat-rejected", ({ senderId }) => {
    const senderSocket = user_SocketMap.get(senderId);
    if (senderSocket) {
      io.to(senderSocket).emit("chat-rejected");
    }
  });


  socket.on("join-room", async ({ roomId, userId }) => {
    console.log(`${socket.id} joined room ${roomId}`,"room", userId);
    // Add to room map
    if (!roomUserMap.has(roomId)) {
      roomUserMap.set(roomId, new Set());
      console.log("Created new room", roomId);
      
    }
    roomUserMap.get(roomId).add(userId);
    socket.join(roomId);

    if (!userId) {
      console.error("Error: userId is missing in join event");
      return;
    }
    // Notify others in the room that a new user has joined
    socket.to(roomId).emit("user-joined", {userId: userId, socketId: socket.id});
  });

  socket.on("rejoin-room", (roomId, userId) => {
    // Validate room membership
    if (roomUserMap.get(roomId)?.has(userId)) {
      socket.join(roomId);
      // 👇 Critical addition for WebRTC recovery
      io.to(roomId).emit("renegotiate-needed", { userId });
      socket.to(roomId).emit("user-reconnected", userId);
    }
  });

  // Handle renegotiation offers
  socket.on("renegotiate-offer", ({ to, offer }) => {
    socket.to(to).emit("renegotiate-offer-forward", {from: socket.id, offer});
  });

  // Forward answers for renegotiation
  socket.on("renegotiate-answer", ({ to, answer }) => {
    socket.to(to).emit("renegotiate-answer-forward", {from: socket.id, answer: answer});
    console.log("📥 Sending Renegotiated Answer:", answer.type, "to 👉", to);
  });

  socket.on("offer", ({ to, offer }) => {
    console.log("📥 Receive Offer:", offer.type, "from 👉", to);

    socket.to(to).emit("receive-offer", {from: socket.id, offer: offer});
  });

  socket.on("send-answer", ({ to, answer }) => {
    socket.to(to).emit("receive-answer", {from: socket.id, answer: answer});
    console.log("📥 Sending Answer:", answer.type, "to 👉", to);
  });

  socket.on("send-ice-candidate", ({ to, candidate }) => {
    socket.to(to).emit("receive-ice-candidate", {from: socket.id, candidate: candidate});
    // console.log("📥 Sending ICE Candidate to 👉", to);
  });


  socket.on("send-message", ({ roomId, text }) => {
    console.log("📥 Sending Message:", text, "to 👉", roomId);
    
    socket.to(roomId).emit("receive-message", { sender: socket.id, text: text });
  });

  socket.on("end-chat", ({ roomId }) => {
    io.to(roomId).emit("chat-ended");
    socket.leave(roomId);
  });

  socket.on("leave-room", ({ roomId, userId }) => {
    socket.leave(roomId);
    console.log(`User ${userId} left room ${roomId}`);
  });

  socket.on("disconnect", async () => {
    const userId = [...user_SocketMap.entries()].find(
      ([, sid]) => sid === socket.id
    )?.[0];

    if (userId) {
      // Delay cleanup for 15 seconds
      setTimeout(() => {
        if (user_SocketMap.get(userId) === socket.id) {
          user_SocketMap.delete(userId);
          // Remove from all rooms
          roomUserMap.forEach((users, roomId) => {
            if (users.delete(userId)) {
              socket.to(roomId).emit("user-disconnected", userId);
              console.log("Client disconnected", socket.id);
            }
          });
        }
      }, 15000);
    }

  //   // Mark user as offline
  //   // await pool.query(
  //   //   "UPDATE users SET is_live = false, last_active = NOW(), socket_id = NULL WHERE socket_id = $1",
  //   //   [socket.id]
  //   // );

  //   // Remove user from userSockets when they disconnect
  //   // delete userSockets[socket.userId];
  //   // You can add further logic to notify peers if needed.
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
