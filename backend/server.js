const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import CORS middleware
const { Pool } = require("pg");

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

// PostgreSQL Database Connection
const pool = new Pool({
  user: "Adil", // Should match the DB_USER in docker-compose.yml
  host: "db", // 'db' matches the service name in docker-compose.yml
  database: "votes_Database", // Should match the DB_NAME in docker-compose.yml
  password: "abcd123", // Should match the DB_PASSWORD in docker-compose.yml
  port: 5432, // PostgreSQL default port is 5432
});

// Test Database Connection
pool
  .connect()
  .then(() => console.log("Connected to the PostgreSQL database successfully."))
  .catch((err) => console.error("Database connection failed:", err.stack));

// API Routes
app.post("/vote", async (req, res) => {
  const { blockchain } = req.body;

  if (!blockchain) {
    return res
      .status(400)
      .json({ success: false, error: "Blockchain name is required." });
  }

  let newVoteCount = 1;

  // Check if there is an existing vote record
  const existingCount = await pool.query(
    "SELECT vote_count FROM votes WHERE blockchain = $1",
    [blockchain]
  );

  if (existingCount.rows.length > 0) {
    // If record exists, increment the vote count
    newVoteCount = existingCount.rows[0].vote_count + 1;
  }

  // Now update the votes table
  try {
    await pool.query(
      `INSERT INTO votes (blockchain, vote_count) 
         VALUES ($1, $2)
         ON CONFLICT (blockchain) 
         DO UPDATE SET vote_count = votes.vote_count + 1;`, // Increment vote_count by 1
      [blockchain, newVoteCount]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Database error:", error);
    res
      .status(500)
      .json({ success: false, error: "Database error: " + error.message });
  }
});

app.get("/results", async (req, res) => {
  try {
    const results = await pool.query("SELECT blockchain, votes FROM votes;");
    const response = results.rows.reduce((acc, row) => {
      acc[row.blockchain] = row.votes;
      return acc;
    }, {});
    console.log(response);
    res.json(response);
  } catch (err) {
    console.error("Database error:", err);
    res
      .status(500)
      .json({ success: false, error: `Database error: ${err.message}` });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// app.post("/vote", async (req, res) => {
//   const { blockchain } = req.body;

//   if (!blockchain) {
//     return res
//       .status(400)
//       .json({ success: false, error: "Blockchain name is required." });
//   }

//   let newVoteCount = 1;

//   // Check if there is an existing vote record
//   const existingCount = await pool.query(
//     "SELECT vote_count FROM votes WHERE blockchain = $1",
//     [blockchain]
//   );

//   if (existingCount.rows.length > 0) {
//     // If record exists, increment the vote count
//     newVoteCount = existingCount.rows[0].vote_count + 1;
//   }

//   // Now update the votes table
//   try {
//     await pool.query(
//       `INSERT INTO votes (blockchain, vote_count)
//          VALUES ($1, $2)
//          ON CONFLICT (blockchain)
//          DO UPDATE SET vote_count = votes.vote_count + EXCLUDED.vote_count;`,
//       [blockchain, newVoteCount]
//     );

//     res.json({ success: true });
//   } catch (error) {
//     console.error("Database error:", error);
//     res
//       .status(500)
//       .json({ success: false, error: "Database error: " + error.message });
//   }
// });
