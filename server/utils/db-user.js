// server/utils/db.js
import { pool } from "../db.js"; // Import your PostgreSQL pool

export const fetchCurrentUser = async (userId) => {
  try {
    const result = await pool.query(
      "SELECT id, username, interests FROM users WHERE id = $1",
      [userId]
    );
    return result.rows[0];
  } catch (err) {
    console.error("Error fetching current user:", err);
    return null;
  }
};

export const fetchUser = async (userId) => {
  try {
    const result = await pool.query(
      "SELECT id, username, interests FROM users WHERE id = $1",
      [userId]
    );
    return result.rows[0];
  } catch (err) {
    console.error("Error fetching target user:", err);
    return null;
  }
};