const pool = require("../config/database");

async function setupDatabase() {
  try {
    // make users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        is_member BOOLEAN DEFAULT FALSE,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // make messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        message_content TEXT NOT NULL,
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // makes session table
    await pool.query(`
  CREATE TABLE IF NOT EXISTS "session" (
    "sid" varchar NOT NULL COLLATE "default" PRIMARY KEY,
    "sess" json NOT NULL,
    "expire" timestamp(6) NOT NULL
  );
`);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);

    console.log("all tables created successfully");
    process.exit(0);
  } catch (error) {
    console.log("error creating tables", error);
    process.exit(1);
  }
}

setupDatabase();
