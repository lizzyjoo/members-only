// import Pool class from the PostgreSQL library
const { Pool } = require("pg");
// loads environment variables from .env file into process.env
require("dotenv").config();

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://localhost/members_only",
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});
module.exports = pool;
