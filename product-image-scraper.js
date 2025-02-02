import puppeteer from "puppeteer";
import {
  closePool,
  readProductsWithID,
  ensureProductImageTableExists,
  insertProductImage,
} from "./database.js";
import { delay, getDataNew, urlToBase64 } from "./untils.js";

const MAX_CONCURRENT_BROWSERS = 2;

async function scrapeProduct(product) {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();

  const productId = product["product_id"];
  const productName = product["product_name"];
  const productUrl = product["product_url"];
  console.log(`\nGetting id=${productId}: ${productName} with ${productUrl}\n`);

  const imagesMap = new Map();

  try {
    await page.goto(productUrl);

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
    }
    insertProductImage(imagesMap);
  } catch (err) {
    console.error(`Error processing product ID=${productId}:`, error);
  }

  await browser.close();
}

async function main() {
  await ensureProductImageTableExists();
  const products = await readProductsWithID();
  console.log(`Total products: ${products.length}`);

  const productChunks = [];
  for (let i = 0; i < products.length; i += MAX_CONCURRENT_BROWSERS) {
    productChunks.push(products.slice(i, i + MAX_CONCURRENT_BROWSERS));
  }

  for (const chunk of productChunks) {
    await Promise.all(chunk.map(scrapeProduct));
  }

  await closePool();
}

main().catch(console.error);
