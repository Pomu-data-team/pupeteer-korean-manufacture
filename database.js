import pkg from "pg";
import { logToFile } from "./untils.js";
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
// reading factory names and urls from table factory_visit
export const readFactory = async () => {
  try {
    //  ORDER BY RANDOM() LIMIT 10
    const query = `
    SELECT manufacture_name, url FROM factory_visit
    `;
    const result = await pool.query(query);
    const factories = result.rows;
    // console.log("Factories retrieved:", factories);
    return factories;
  } catch (error) {
    console.log(`error getting data from database. error is \n ${error}`);
    return [];
  }
};

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

export const insertManufactureInfo = async (result, path) => {
  try {
    const query = `
      INSERT INTO manufacture_info (
        manufacture_name, 
        manufacture_url, 
        favorites_number, 
        inquiry_number, 
        order_number, 
        review_number, 
        ceo, 
        address, 
        country_region, 
        home_page, 
        total_employees, 
        total_annual_revenue, 
        year_established, 
        main_markets, 
        r_d_capacity,
        main_products, 
        business_type
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      )
      ON CONFLICT (manufacture_name) DO NOTHING; 
    `;
    const values = [
      result.manufacture_name,
      result.manufacture_url,
      result.favorites_num,
      result.inquiry_num,
      result.order_num,
      result.review_num,
      result.ceo,
      result.address,
      result.country_region,
      result.home_page,
      result.total_employees,
      result.total_annual_revenue,
      result.year_established,
      result.main_markets,
      result.r_d_capacity,
      result.main_products,
      result.business_type,
    ];
    await pool.query(query, values);
    console.log("Insert successful");
  } catch (error) {
    console.log(`Failed to insert manufacture info. Error is \n${error}`);
  }
};

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

export const ensureManufactureTableExists = async () => {
  try {
    const query = `
    CREATE TABLE IF NOT EXISTS manufacture_info (
      id SERIAL PRIMARY KEY, 
      manufacture_name TEXT NOT NULL, 
      manufacture_url TEXT NOT NULL, 
      favorites_number TEXT, 
      inquiry_number TEXT, 
      order_number TEXT, 
      review_number TEXT, 
      ceo TEXT, 
      address TEXT, 
      country_region TEXT, 
      home_page TEXT, 
      total_employees TEXT, 
      total_annual_revenue TEXT, 
      year_established TEXT, 
      main_markets TEXT, 
      r_d_capacity TEXT, 
      main_products TEXT, 
      business_type TEXT
    );
    ALTER TABLE manufacture_info 
    ADD CONSTRAINT unique_manufacture_name UNIQUE (manufacture_name);
    `;
    await pool.query(query);
  } catch (error) {
    console.log(
      `Failed to initialize manufacture_info table. error is \n${error}`
    );
  }
};

export const getDataCount = async (database_name) => {
  try {
    const query = `SELECT COUNT(*) AS count FROM ${database_name};`;
    const result = await pool.query(query);
    const count = result.rows[0].count;
    return parseInt(count, 10);
  } catch (error) {
    console.error(`Failed to get manufacture count. Error: ${error}`);
  }
};

export const checkManufactureExists = async (manufacture_name, tableName) => {
  try {
    const query = `
      SELECT EXISTS (
        SELECT 1
        FROM ${tableName}
        WHERE manufacture_name = $1
      ) AS exists;`;
    const values = [manufacture_name];
    const result = await pool.query(query, values);
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error checking manufacturer existence: ${error}`);
    return false;
  }
};
