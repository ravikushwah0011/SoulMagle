import express from "express";

import bcrypt from "bcryptjs";
import pool from "../db.js";


const router = express.Router();

// ✅ Signup Route
router.post("/signup", async (req, res) => {
    // console.log(req.body);
  
    try {
      const { name, email, password, interests, profile_photo } = req.body;
  
      // Hash password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert user into database
      const newUser = await pool.query(
        "INSERT INTO users (name, email, password, interests, profile_photo) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [name, email, hashedPassword, interests, profile_photo || null]
      );
  
      await pool.query("UPDATE users SET is_live = true, last_active = NOW() WHERE name = $1", [
        name,
      ]);
      
        res.json({
          message: "User registered successfully!",
          user: newUser.rows[0],
        }
      );
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error" });
    }
  });
  
// ✅ Login Route
router.post("/login", async (req, res) => {
    try {
      const { email, password} = req.body;
  
      // Find user in database
      const user = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
  
      if (user.rows.length === 0) {
        return res.status(400).json({ message: "User not found!" });
      }
  
      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.rows[0].password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid password!" });
      }
  
      const userId = user.rows[0].id;
      console.log(userId);
      
      await pool.query("UPDATE users SET is_live = true, last_active = NOW() WHERE id = $1", [
        userId,
      ]);
  
      res.json({ message: "Login successful!", user: user.rows[0], userId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server Error" });
    }
  });
  
// ✅ LogOut Route
router.post("/logout", async (req, res) => {
    const { userId } = req.body;
    // Find user in database
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [
      userId,
    ]);
    
    // console.log(userId, user.rows[0]);
    try {
      // ✅ Ensure userId is provided
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
  
      // ✅ Update database on logout
      await pool.query(
        "UPDATE users SET is_live = false, last_active = NOW(), socket_id = NULL WHERE id = $1",
        [userId]
      );
  
      res.json({ message: "LogOut Successfully" , user: user.rows[0]});
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

export default router;  

