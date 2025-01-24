import puppeteer from "puppeteer";
import {
  closePool,
  ensureProductInfoTableExists,
  readProducts,
  checkProductExists,
  insertProductInfo,
} from "./database.js";
import { getDataNew, logToFile, delay } from "./untils.js";

// open the browser
const browser = await puppeteer.launch({
  // headless: false,
  // defaultViewport: null,
});

const page = await browser.newPage();

// load 10 factories from database
const products = await readProducts();

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const filePath = `logs/products_info_${timestamp}`;

await ensureProductInfoTableExists();

// page.goto visit one by one
let i = 0;
for (const product of products) {
  i++; // manufacture number

  const manufacture_url = product["manufacture_url"];
  const manufacture_id = product["manufacture_id"];
  const product_name = product["product_name"];
  const product_url = product["product_url"];

  // Check if current product exists in database
  if (await checkProductExists(product_name, "product_info")) {
    console.log(`\product ${product_name} exists. skipping...\n`);
    continue;
  }

  try {
    await page.goto(product_url);
  } catch (err) {
    console.error(
      `Error visiting product URL: ${product_url}\nerror is\n${err}`
    );
    continue;
  }

  console.log(`\n\n${i}th product ${product_name}, url: ${product_url}\n`);

  await page
    .evaluate(() => {
      window.scrollBy(0, 3000);
      return new Promise((resolve) => setTimeout(resolve, 2500));
    })
    .then(() =>
      page.evaluate(() => {
        window.scrollBy(0, -2000);
        return new Promise((resolve) => setTimeout(resolve, 2500));
      })
    );

  // Get all product information
  const priceHandle = await page.$$(
    "xpath/" + "//div[@class='goods-info']//div[@class='price-before']"
  );
  const price = await getDataNew(priceHandle, "TEXT");

  const overview_introHandle = await page.$$(
    "xpath/" + "//div[@class='goods-info']//div[@class='overview-intro']"
  );
  const overview_intro = await getDataNew(overview_introHandle, "TEXT");

  const MOQHandle = await page.$$(
    "xpath/" + "//div[@class='quantity-area']//dd"
  );
  const MOQ = await getDataNew(MOQHandle, "TEXT");
  // console.log("MOQ: ", MOQ);

  const product_detailsHandle = await page.$$(
    "xpath/" + "//div[@class='product-detail']"
  );
  let product_details = await getDataNew(product_detailsHandle, "TEXT");
  if (product_details.length > 1) {
    product_details = product_details.map((detail) => detail.join("\n"));
  } else if (product_details !== -1) {
    product_details = product_details[0];
  }
  // remember to delete "#"
  const keywordsHandle = await page.$$(
    "xpath/" + "//div[@class='tag-group']//span"
  );
  const keywords = await getDataNew(keywordsHandle, "TEXT");

  const product_item = {
    manufacture_id: manufacture_id,
    manufacture_url: manufacture_url,
    product_name: product_name,
    product_url: product_url,
    price: price !== -1 ? price[0] : -1,
    overview_intro: overview_intro !== -1 ? overview_intro[0] : -1,
    MOQ: MOQ !== -1 ? MOQ[0] : -1,
    product_details: product_details,
    keywords: keywords !== -1 ? keywords.map((keyword) => keyword.slice(1)).join(", ") : -1,
  };

  console.log("product_item: \n", product_item);

  // Write all the data to database
  insertProductInfo(product_item);

  await delay(2500);

  // LOGGING
  logToFile(
    `
  ${i}th product ${product_name}, url: ${product_url}\n
  `,
    filePath
  );
}

// close
await closePool();
