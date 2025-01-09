import pkg from "pg";
const { Pool } = pkg;

// Set up the PostgreSQL connection pool
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "qiming1021",
  port: 5432, // Default PostgreSQL port
});

// Database operations

// This function is for insert factory names and url to factroy_visit
export const insertFactory = async (manufacture_name, url) => {
  try {
    const query = `
      INSERT INTO factory_visit (manufacture_name, url)
      VALUES ($1, $2)
      ON CONFLICT (url) DO NOTHING;
    `;
    await pool.query(query, [manufacture_name, url]);
  } catch (err) {
    console.error("Error inserting factory:", err);
  }
};

// reading factory names and urls from table factory_visit

// Function to close the pool when the app finishes
export const closePool = async () => {
  await pool.end();
};

// ensure Table Exists; if not create one
export const ensureTableExists = async () => {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS factory_visit (
        id SERIAL PRIMARY KEY,
        manufacture_name TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE
      );
      ALTER TABLE factory_visit ADD CONSTRAINT unique_url UNIQUE (url);
    `;
    await pool.query(query);
  } catch (err) {
    console.error("Error creating table:", err);
  }
};
