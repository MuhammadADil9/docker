CREATE TABLE IF NOT EXISTS votes (
  blockchain VARCHAR(255) PRIMARY KEY,
  vote_count INT DEFAULT 0
);