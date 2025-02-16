import express from "express";

import pool from "../db.js";

const router = express.Router();

import { generateEmbedding } from "../utils/embeddingGenerator.js";

// Fetch live and recent users

router.get("/users/live", async (req, res) => {
    const { userId } = req.params;
    console.log("API /api/users/live hit!"); // ✅ Debugging
    try {
      const liveUsers = await pool.query(
        "SELECT id, name, interests, profile_photo FROM users WHERE is_live = true ORDER BY last_active DESC LIMIT 10"
      );
      const recentUsers = await pool.query(
        "SELECT id, name, interests, profile_photo, is_live, last_active FROM users WHERE is_live = false ORDER BY last_active DESC LIMIT 10"
      );
  
      // console.log("Live Users:", liveUsers.rows); // ✅ Check data before sending
      // console.log("Recent Users:", recentUsers.rows);
  
      res.json({ live_Users: liveUsers.rows, recent_Users: recentUsers.rows });
    } catch (err) {
      console.error("Database error:", err);
      res.status(500).json({ error: "Server Error" });
    }
  });

// Update user interests and store embeddings
router.post("/interests-embeddings", async (req, res) => {
    try {
      const { userId, interests } = req.body;
      // const user = await pool.query("SELECT * FROM users WHERE interests=$1", [
      //       interests,
      //     ]);
      console.log(req.body, "\n", userId, interests);
      
      const embedding = await generateEmbedding(interests);
  
      await pool.query(
        `INSERT INTO user_embeddings (user_id, embedding) 
         VALUES ($1, $2) 
         ON CONFLICT (user_id) 
         DO UPDATE SET embedding = $2`,
        [userId, JSON.stringify(embedding)]
      );
  
      res.status(200).json({ success: true, message: "Interests updated successfully!" });
    } catch (err) {
      console.error("Error updating interests:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });  

export default router;  

