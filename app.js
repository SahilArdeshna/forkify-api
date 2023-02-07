require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const compression = require("compression");

const db = require("./db");
const recipeRoutes = require("./routes/recipe");
const userRoutes = require("./routes/user");

const app = express();

app.use(helmet());
app.use(compression());

// for parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// for parse application/json
app.use(bodyParser.json());

app.use((req, res, next) => {
  // Set CORS headers so that frontend is able to communicate with this server
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Authorization, Content-Type, X-Requested-With, Access-Control-Request-Headers, Access-Control-Allow-Methods"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Type", "multipart/form-data  ");
  res.setHeader(
    "Accept",
    "text/html, application/xhtml+xml, image/png, image/webp,image/apng,image/*, image/jpeg application/xml;q=0.9, */*;q=0.8"
  );

  next();
});

app.use("/images", express.static("images"));

// app routes
app.use(recipeRoutes);
app.use(userRoutes);

db.initDb((err, db) => {
  if (err) {
    console.log(err);
  } else {
    app.listen(process.env.PORT);
  }
});
