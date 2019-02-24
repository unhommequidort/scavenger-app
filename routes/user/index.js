const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.SSL === "false" ? false : true
});

const authMiddleware = require("../../auth/middleware");

router.get("/:id", authMiddleware.allowAccess, (req, res) => {
  const id = req.params.id;

  pool
    .query(
      "SELECT user_id, email, first_name, last_name, avatar FROM users WHERE user_id = $1",
      [id]
    )
    .then(result => {
      res.json({ user: result.rows[0] });
    })
    .catch(error => {
      if (error) {
        console.log(error);
      }
    });
});

module.exports = router;
