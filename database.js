import pkg from "pg";
const { Pool } = pkg;

import dotenv from "dotenv";
dotenv.config();

// Set up the PostgreSQL connection pool
const db_password = process.env.db_password;
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "qiming",
  password: db_password,
  port: 5432, // Default PostgreSQL port
});

// Database operations
// reading factory names and urls from table factory_visit
export const readFactory = async () => {
  try {
    //  ORDER BY RANDOM() LIMIT 10
    const query = `
    SELECT manufacture_name, manufacture_url, id FROM manufacture_info
    `;
    const result = await pool.query(query);
    const factories = result.rows;
    return factories;
  } catch (error) {
    console.log(`error readFactory: \n ${error}`);
    return [];
  }
};

export const readProducts = async () => {
  try {
    const query = `
    SELECT product_name, product_url, manufacture_url, manufacture_id 
    FROM product_visit 
    `;
    const result = await pool.query(query);
    const products = result.rows;
    return products;
  } catch (error) {
    console.error("Error read products\nerror is\n".error);
  }
};

export const readProductsWithID = async () => {
  try {
    const query = `
    SELECT id, product_name, product_url, manufacture_url, manufacture_id 
    FROM product_visit 
    ORDER BY RANDOM()
    LIMIT 10
    `;
    const result = await pool.query(query);
    const products = result.rows;
    return products;
  } catch (error) {
    console.error("Error read products\nerror is\n".error);
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

export const insertProductImage = async (imageMap) => {
  try {
    for (const [key, value] of imageMap.entries())
      try {
        console.log(
          `Inserting...\nname: ${key},\nproduct: ${value.productUrl}`
        );
        const query = `
      INSERT INTO product_image (product_id, image_name, product_name, product_url, image_url, image_encoding)
      VALUES ($1, $2, $3, $4, $5, $6)
      `;
        await pool.query(query, [
          value.productId,
          key,
          value.productName,
          value.productUrl,
          value.src,
          value.encoding,
        ]);
      } catch (err) {
        console.error(
          `Error in inserting loop ${key} with ${value.productUrl}:`,
          err
        );
      }
  } catch (err) {
    console.error("Error inserting product images:", err);
  }
};

export const insertProductVisit = async (
  product_name,
  product_url,
  manufacture_url,
  manufacture_id
) => {
  try {
    const query = `
      INSERT INTO product_visit (product_name, product_url, manufacture_url, manufacture_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (product_name) DO NOTHING;
    `;
    await pool.query(query, [
      product_name,
      product_url,
      manufacture_url,
      manufacture_id,
    ]);
  } catch (err) {
    console.error("Error inserting product:", err);
  }
};

export const insertProductInfo = async (product_item) => {
  try {
    const query = `
      INSERT INTO product_info (manufacture_id, manufacture_url, product_name, product_url, price, overview_intro, MOQ, product_details, keywords)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (product_name) DO NOTHING;
    `;
    await pool.query(query, [
      product_item.manufacture_id,
      product_item.manufacture_url,
      product_item.product_name,
      product_item.product_url,
      product_item.price,
      product_item.overview_intro,
      product_item.MOQ,
      product_item.product_details,
      product_item.keywords,
    ]);
  } catch (error) {
    console.error(`Error inserting into product_info: \n${error}`);
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

// ensure factory_visit Exists; if not create one
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

// ensure manufacture_info exits
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

// ensure product_visit exists
export const ensureProductTableExists = async () => {
  try {
    const query = `
    CREATE TABLE IF NOT EXISTS product_visit (
      id SERIAL PRIMARY KEY, 
      product_name TEXT NOT NULL UNIQUE, 
      product_url TEXT NOT NULL, 
      manufacture_url TEXT NOT NULL, 
      manufacture_id INTEGER NOT NULL, 
      CONSTRAINT fk_manufacture FOREIGN KEY (manufacture_id) REFERENCES manufacture_info (id) ON DELETE CASCADE
    );
    `;
    await pool.query(query);
  } catch (error) {
    console.log(
      `Failed to initialize product_visit table. error is \n${error}`
    );
  }
};

export const ensureProductInfoTableExists = async () => {
  try {
    const query = `
    CREATE TABLE IF NOT EXISTS product_info (
      product_id SERIAL PRIMARY KEY, 
      manufacture_id INTEGER NOT NULL, 
      manufacture_url TEXT NOT NULL, 
      product_name TEXT NOT NULL UNIQUE, 
      product_url TEXT NOT NULL, 
      price TEXT NOT NULL, 
      overview_intro TEXT NOT NULL, 
      MOQ TEXT NOT NULL, 
      product_details TEXT NOT NULL, 
      keywords TEXT NOT NULL, 
      CONSTRAINT fk_manufacture FOREIGN KEY (manufacture_id) REFERENCES manufacture_info (id) ON DELETE CASCADE
    );
    `;
    await pool.query(query);
  } catch (error) {
    console.log(`Failed to initialize productInfo table. error is \n${error}`);
  }
};

export const ensureProductImageTableExists = async () => {
  try {
    const query = `
    CREATE TABLE IF NOT EXISTS product_image (
      image_id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL,
      image_name TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_url TEXT NOT NULL,
      image_url TEXT NOT NULL, 
      image_encoding TEXT NOT NULL,
      CONSTRAINT fk_product FOREIGN KEY (product_id) REFERENCES product_info (product_id) ON DELETE CASCADE
    );
    `;
    await pool.query(query);
  } catch (error) {
    console.log(`Failed to initialize product_image table:\n${error}`);
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

export const checkManufactureExistsURL = async (manufacture_url, tableName) => {
  try {
    const query = `
      SELECT EXISTS (
        SELECT 1
        FROM ${tableName}
        WHERE manufacture_url = $1
      ) AS exists;`;
    const values = [manufacture_url];
    const result = await pool.query(query, values);
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Error checking manufacturer existence: ${error}`);
    return false;
  }
};

export const checkProductExists = async (product_name, table_name) => {
  try {
    const query = `SELECT EXISTS (
      SELECT 1 FROM ${table_name} WHERE product_name=$1
    ) AS exists`;
    const values = [product_name];
    const result = await pool.query(query, values);
    return result.rows[0].exists;
  } catch (error) {
    console.log(`Error checking product exists\n${error}`);
  }
};

// Function to close the pool when the app finishes
export const closePool = async () => {
  await pool.end();
};
