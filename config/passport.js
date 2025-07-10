const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const pool = require("./database");
const bcrypt = require("bcrypt");

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      // 1. fetch user info
      const { rows } = await pool.query(
        "SELECT * FROM users WHERE username = $1",
        [username]
      );
      const user = rows[0];

      // 2. check for if user doesn't exist
      if (!user) {
        return done(null, false, { message: "Incorrect Username" });
      }
      // 3. password validation
      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    const user = rows[0];
    // If user doesn't exist (was deleted), log them out
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (err) {
    return done(err);
  }
});
