import mysql from "mysql2/promise";
import { configDotenv } from "dotenv";
configDotenv();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  charset: "utf8mb4_unicode_ci", // Combined charset and collation
  timezone: "local",
});

export default db;
