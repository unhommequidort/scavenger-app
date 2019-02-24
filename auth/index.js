const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.SSL === "false" ? false : true
});

router.get("/", (req, res) => {
  res.json({
    message: "🔐"
  });
});

const validUser = user => {
  const validEmail = typeof user.email == "string" && user.email.trim() != "";
  const validPassword =
    typeof user.password == "string" &&
    user.password.trim() != "" &&
    user.password.trim().length >= 6;

  return validEmail && validPassword;
};

router.post("/signup", async (req, res) => {
  if (validUser(req.body)) {
    try {
      const email = req.body.email;
      console.log(email);
      const client = await pool.connect();
      const result = await client.query(
        "SELECT * FROM users WHERE email = $1",
        [email]
      );
      const results = result ? result.rows : null;
      console.log(results);
      if (results.length == 0) {
        // this is a unique email
        // hash password
        bcrypt.hash(req.body.password, 10).then(hash => {
          // insert user into db
          const user = {
            email: req.body.email,
            hashPass: hash
          };

          const text =
            "INSERT INTO users (email, hash_pass, active_ind) values($1, $2, $3) RETURNING *";
          const values = [user.email, user.hashPass, true];

          client.query(text, values, (err, result) => {
            if (err) {
              return res.json({ err: err.stack });
            } else {
              return res.json({ results: result.rows[0] });
            }
          });

          // redirect
        });
      } else {
        // User with that email already exists
        res.statusCode = 409;
        return res.json({
          message: "That email address already exists"
        });
      }

      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }

    // res.json({
    //   message: "✅"
    // });
  } else {
    res.json({
      message: "Invalid user"
    });
  }
});

router.post("/login", (req, res) => {
  if (validUser(req.body)) {
    var email = req.body.email;
    // check to see if user in db
    pool
      .query("SELECT * FROM users WHERE email = $1", [email])
      .then(result => {
        if (result.rowCount == 0) {
          return res.json({
            userId: null,
            auth: false,
            message: "User does not exist"
          });
        } else {
          // user exists
          const user = result.rows[0];
          console.log(user);
          //compare password with hashed password
          bcrypt.compare(req.body.password, user.hash_pass).then(match => {
            if (match) {
              // set the 'set-cookie' header
              res.cookie("user_id", user.user_id, {
                httpOnly: true,
                secure: process.env.SSL,
                signed: true
              });
              res.json({
                userId: user.user_id,
                auth: true,
                message: "Logged in!"
              });
            } else {
              return res.json({
                userId: null,
                auth: false,
                message: "Invalid password"
              });
            }
          });
        }
      })
      .catch(err =>
        setImmediate(() => {
          throw err;
        })
      );
  } else {
    return res.json({
      message: "Invalid login"
    });
  }
});

module.exports = router;
