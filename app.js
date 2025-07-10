const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const pool = require("./config/database");
const passport = require("passport");
const routes = require("./routes");
const path = require("path");
const { Cookie } = require("express-session");

/**
 * -------------- GENERAL SETUP ----------------
 */

// Gives us access to variables set in the .env file via `process.env.VARIABLE_NAME` syntax
require("dotenv").config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/**
 * -------------- VIEWS SETUP ----------------
 */

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

/**
 * -------------- STYLES SETUP ----------------
 */

app.use(express.static(path.join(__dirname, "public")));

/**
 * -------------- SESSION SETUP ----------------
 */

app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: "session",
      createTableIfMissing: false,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // a day
  })
);

/**
 * -------------- PASSPORT AUTHENTICATION ----------------
 *
 */

require("./config/passport");
app.use(passport.initialize()); // refresh passport middleware every route refresh
app.use(passport.session()); // enable session support

// Then your routes
app.use(routes);

/**
 * -------------- ROUTES ----------------
 */

app.use(routes);

/**
 * -------------- SERVER ----------------
 */

// Server listens on http://localhost:3000

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
