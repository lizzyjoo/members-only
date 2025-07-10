const router = require("express").Router();
const passport = require("passport");
const pool = require("../config/database");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");

/**
 * -------------- CUSTOM MIDDLEWARE ----------------
 */

function ensureMember(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect("/log-in");
  }
  if (!req.user.is_member) {
    return res.redirect("/join-club");
  }
  next();
}

// checks for user's admin credential for deleting messages
function ensureAdmin(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect("/log-in");
  }
  if (!req.user.is_admin) {
    return res.status(403).send("Unauthorized - Admin access required");
  }
  next();
}

/**
 * -------------- POST ROUTES ----------------
 */

// login
router.post("/log-in", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      // Authentication failed - render login page with error
      return res.render("login", {
        user: null,
        error: info.message || "Invalid username or password",
      });
    }

    // Authentication successful - log the user in
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      console.log("Login successful for user:", user.username);
      res.redirect("/");
    });
  })(req, res, next);
});

// register: save new user info to db
router.post(
  "/register",
  [
    body("first_name")
      .notEmpty()
      .withMessage("First name is required.")
      .isAlphanumeric()
      .withMessage("First name must be alphanumeric."),
    body("last_name")
      .notEmpty()
      .withMessage("Last name is required.")
      .isAlphanumeric()
      .withMessage("Last name must be alphanumeric."),
    body("username")
      .notEmpty()
      .withMessage("Username is required.")
      .isAlphanumeric()
      .withMessage("Username must be alphanumeric."),
    body("password")
      .isLength({ min: 5 })
      .withMessage("Password must be at least 5 characters."),
    body("passwordConfirmation").custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match.");
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { first_name, last_name, username, password } = req.body;
      const existingUser = await pool.query(
        "SELECT id from users WHERE username = $1",
        [username]
      );
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: "Username is already taken." });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        "INSERT INTO users (first_name, last_name, username, password_hash) VALUES ($1, $2, $3, $4)",
        [first_name, last_name, username, hashedPassword]
      );
      res.redirect("/");
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  }
);
router.post("/join-club", async (req, res) => {
  // Check if user is already a member
  if (req.user.is_member) {
    return res.redirect("/member-only");
  }

  const answer = req.body.answer?.toLowerCase();
  console.log(answer);

  if (answer === "schubert") {
    try {
      // Update user member status in database
      await pool.query("UPDATE users SET is_member = TRUE WHERE id = $1", [
        req.user.id,
      ]);

      // Fetch fresh user data from database
      const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
        req.user.id,
      ]);

      // Update the session with fresh data
      req.user = rows[0];

      res.redirect("/new-message"); // Redirect to chat instead of showing message
    } catch (error) {
      console.error(error);
      return res.status(500).send("Database error.");
    }
  } else {
    res.send("Incorrect answer. Try again.");
  }
});
// will confirm if the user can be an admin or not based on form submission
// update admin status
router.post("/admin", async (req, res) => {
  // Check if user is already a member
  if (req.user.is_admin) {
    return res.redirect("/admin-only"); //
  }
  const answer = req.body.answer?.toLowerCase();
  console.log(answer);
  if (answer === "brahms") {
    try {
      // Update user member status in database
      await pool.query("UPDATE users SET is_admin = TRUE WHERE id = $1", [
        req.user.id,
      ]);

      // fetch fresh user data from database
      const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
        req.user.id,
      ]);

      // Update the session with fresh data
      req.user = rows[0];

      res.redirect("/new-message"); // Redirect to chat instead of showing message
    } catch (error) {
      console.error(error);
      return res.status(500).send("Database error.");
    }
  } else {
    res.send("Incorrect answer. Try again.");
  }
});
router.post(
  "/new-message",
  ensureMember, // Add this to ensure only members can post
  [
    body("message_content")
      .notEmpty()
      .withMessage("Message content is required.")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Message must be between 1 and 1000 characters."),
  ],
  async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { message_content } = req.body; // Only get what's actually sent from form

      // Insert message with user ID from session
      await pool.query(
        "INSERT INTO messages (message_content, author_id) VALUES ($1, $2)",
        [message_content, req.user.id] // Use logged-in user's ID
      );

      res.redirect("/new-message"); // Redirect back to chat page
    } catch (error) {
      console.error("Error posting message:", error);
      res.status(500).json({ error: "Failed to post message" });
    }
  }
);

router.post("/delete-message/:id", ensureAdmin, async (req, res) => {
  // Only admins can reach this code
  await pool.query("DELETE FROM messages WHERE id = $1", [req.params.id]);
  res.redirect("/new-message");
});
/**
 * -------------- GET ROUTES ----------------
 */

// ejs
router.get("/", (req, res) => res.render("index", { user: req.user }));
router.get("/log-in", (req, res) =>
  res.render("login", { user: req.user, error: null })
);

router.get("/register", (req, res) =>
  res.render("register", { user: req.user })
);

router.get("/join-club", (req, res) => {
  // Redirect if not logged in
  if (!req.user) {
    return res.redirect("/log-in");
  }

  // Redirect if already a member
  if (req.user.is_member) {
    return res.redirect("/member-only");
  }

  res.render("join-club", {
    user: req.user,
  });
});

router.get("/profile", (req, res) => {
  if (!req.user) {
    return res.redirect("/log-in");
  }
  res.render("profile", { user: req.user });
});

router.get("/new-message", ensureMember, async (req, res) => {
  try {
    // Fetch messages with user info - match your table structure
    const { rows: messages } = await pool.query(`
      SELECT 
        m.id,
        m.message_content,
        m.created_at,
        u.username,
        u.is_admin,
        m.author_id
      FROM messages m 
      JOIN users u ON m.author_id = u.id 
      ORDER BY m.created_at ASC
    `);

    res.render("new-message", {
      user: req.user,
      messages: messages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.render("new-message", {
      user: req.user,
      messages: [],
    });
  }
});

router.get("/admin", ensureMember, (req, res) => {
  // Redirect if not logged in
  if (!req.user) {
    return res.redirect("/log-in");
  }

  // Redirect if already an admin
  if (req.user.is_admin) {
    return res.redirect("/admin-only");
  }
  res.render("admin", {
    user: req.user,
  });
});

router.get("/admin-only", (req, res) => {
  if (!req.user) {
    return res.redirect("/log-in");
  }
  if (!req.user.is_admin) {
    return res.redirect("/admin");
  }
  res.render("admin-only", { user: req.user });
});

router.get("/member-only", (req, res) => {
  if (!req.user) {
    return res.redirect("/log-in");
  }
  res.render("member-only", { user: req.user });
});

router.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

module.exports = router;
