const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.SSL === "false" ? false : true
});

router.get("/:id", (req, res) => {
  const id = req.params.id;

  pool
    .query("SELECT * FROM users WHERE user_id = $1", [id])
    .then(result => {
      console.log(result);
    })
    .catch(error => {
      if (error) {
        console.log(error);
      }
    });
});

module.exports = router;
