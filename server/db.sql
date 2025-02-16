-- Connect to database "soulmagle" and run:
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(100),
  interest TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users 
ADD COLUMN profile_photo TEXT DEFAULT NULL, 
ADD COLUMN is_live BOOLEAN DEFAULT FALSE, 
ADD COLUMN last_active TIMESTAMP DEFAULT NOW(), 
ADD COLUMN socket_id TEXT DEFAULT NULL;

SELECT * FROM users;


SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'users';


CREATE TABLE user_embeddings (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  embedding VECTOR(384) -- Adjust dimension based on your embedding model (e.g., 384 for all-MiniLM-L6-v2)
);
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE user_embeddings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    embedding VECTOR(384) -- Adjust the dimension if needed
);

SELECT 
        u.id, 
        u.name,
        u.interests,
        1 - (ue.embedding <=> $1) AS similarity 
       FROM user_embeddings ue
       JOIN users u ON ue.user_id = u.id
       WHERE u.id != $2 
         -- AND u.is_live = true  -- Optional: filter for online users
       ORDER BY similarity DESC 
       LIMIT 5;

JOIN users u ON ue.user_id = u.id;