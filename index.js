const express = require("express");
const app = express();
const { Pool } = require("pg");
const auth = require("./auth");
const userRoute = require("./routes/user");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.SSL === "false" ? false : true
});

app.use(cookieParser(process.env.COOKIE_SECRET));

app.set("port", process.env.PORT || 5000);
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

app.use(
  cors({
    credentials: true
  })
);

app.use("/auth", auth);

const authMiddleware = require("./auth/middleware");

app.use("/user", authMiddleware.ensureLoggedIn, userRoute);

app.get("/", function(request, response) {
  response.send("Hello World!");
});

app.get("/db", async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT * FROM test_table");
    const results = { results: result ? result.rows : null };
    res.send(results);
    client.release();
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

app.listen(app.get("port"), function() {
  console.log("Node app is running at localhost:" + app.get("port"));
});
