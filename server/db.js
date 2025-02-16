// require("dotenv").config();
import dotenv from "dotenv";
dotenv.config();
import pkg from "pg"
const { Pool } = pkg;

// Create a PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Test the connection
pool.connect()
  .then(() => console.log("Connected to PostgreSQL Database ✅"))
  .catch((err) => console.error("Database Connection Error ❌", err));

export default pool; 
  
  // module.exports = pool;