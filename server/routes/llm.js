// server/routes/llm.js
import express from "express";
import { generateMatchExplanation } from "../utils/llm.js";
import { fetchCurrentUser, fetchUser } from "../utils/db-user.js"; // Import the functions

const router = express.Router();

router.get("/generate-explanation/:userId", async (req, res) => {
  try {
    // 1. Get the logged-in user (you) from authentication
    const currentUser = await fetchCurrentUser(req.user.id);
    if (!currentUser) {
      return res.status(404).send("Logged-in user not found");
    }

    // 2. Get the target user (the one being matched)
    const targetUserId = req.params.userId;
    const targetUser = await fetchUser(targetUserId);
    if (!targetUser) {
      return res.status(404).send("Target user not found");
    }

    // 3. Generate the explanation
    const explanation = await generateMatchExplanation(currentUser, targetUser);
    res.send(explanation);
  } catch (err) {
    console.error("Error generating explanation:", err);
    res.status(500).send("Internal server error");
  }
});

export default router;  
// module.exports = router;
