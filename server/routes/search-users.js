import express from "express";
import pool from "../db.js";

import { generateEmbedding } from "../utils/embeddingGenerator.js";
import { generateMatchExplanation } from "../utils/llm.js";

const router = express.Router();

// Search for similar users
router.post("/search-users", async (req, res) => {
  try {
    const { query, userId } = req.body;
    const queryEmbedding = await generateEmbedding(query);

    const result = await pool.query(
      `SELECT 
        u.id, 
        u.name,
        u.interests,
        u.is_live,
        u.profile_photo,
        u.last_active,
        1 - (ue.embedding <=> $1) AS similarity 
       FROM user_embeddings ue
       JOIN users u ON ue.user_id = u.id
       WHERE u.id != $2 
         -- AND u.is_live = true  -- Optional: filter for online users
       ORDER BY similarity DESC 
       LIMIT 5`,
      [JSON.stringify(queryEmbedding), userId]
    );

    const explanations = await Promise.all(
        result.rows.map(async (user) => {
          return {
            ...user,
            explanation: await generateMatchExplanation(
              { name: "You", interests: query.split(", ") },
              { name: user.name, interests: user.interests }
            ),
          };
        })
      );

    // res.json(result.rows);
    res.json(explanations);
  } catch (err) {
    console.error("Error searching for users:", err);
    res.status(500).json({ error: "Internal Server Error | Explanation generation failed" });
  }
});

export default router; 
// module.exports = router;
