import mysql from "mysql2/promise";
import "dotenv/config";

console.log("DB CONFIG:", {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
});

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || "127.0.0.1",
  port: Number(process.env.MYSQL_PORT || 3306),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query(sql, values = []) {
  try {
    const [results] = await pool.query(sql, values);
    return results;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export default pool;
