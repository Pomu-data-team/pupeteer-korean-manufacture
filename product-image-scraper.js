import puppeteer from "puppeteer";
import {
  closePool,
  readProductsWithID,
  ensureProductImageTableExists,
  insertProductImage,
} from "./database.js";
import { delay, getDataNew, urlToBase64 } from "./untils.js";

// open the browser
const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
});

const page = await browser.newPage();

// Read products from database - remember differently. maybe divided into 2 more programs
const products = await readProductsWithID();

// await ensureProductInfoTableExists();
// const num_of_pro = 0
// const total_products = length of products

await ensureProductImageTableExists();

for (const product of products) {
  const productId = product["id"];
  const productName = product["product_name"];
  const productUrl = product["product_url"];
  console.log(`\nGetting id=${productId}: ${productName} with ${productUrl}\n`);
  // store as: {image_name_1: {image_url, image_encoding}, image_name_2: {image_url, image_encoding}, ...
  const imagesMap = new Map();
  // visit product websites
  await page.goto(productUrl);
  // Get the current image url and add it to list
  const productImages = await page.$$(
    "xpath/" +
      "//div[@class='cp-swiper-gallery detail-gallery']//img[@style='object-fit:scale-down;']"
  );
  for (const image of productImages) {
    const alt = await getDataNew([image], "ALT");
    const key = alt[0] === "" || alt[0] === -1 ? productName : alt[0];
    const src = await getDataNew([image], "IMG_SRC");
    const encoding = await urlToBase64(src);
    imagesMap.set(key, {
      productId: productId,
      productName: productName,
      productUrl: productUrl,
      src: src ? src[0] : -1,
      encoding: encoding ? encoding : -1,
    });
    insertProductImage(imagesMap);
  }

  // imagesMap.forEach((value, key) => {
  //   console.log(`\nimage name: ${key}, image url: ${value.src}\n`);
  // });

  // insert into database url and encodings
}

// close
await closePool();
