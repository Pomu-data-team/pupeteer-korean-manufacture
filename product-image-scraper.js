import puppeteer from "puppeteer";
import {
  closePool,
  readProductsWithID,
  ensureProductImageTableExists,
  insertProductImage,
  checkProductExists,
} from "./database.js";
import { delay, getDataNew, urlToBase64 } from "./untils.js";

const MAX_CONCURRENT_BROWSERS = 5;

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
    console.error(`Error processing product ID=${productId}:`, err);
  }

  await browser.close();
}

async function main() {
  await ensureProductImageTableExists();
  const products = await readProductsWithID();
  const totalProducts = products.length;
  console.log(`Total products: ${totalProducts}`);

  const productChunks = [];
  for (let i = 0; i < products.length; i += MAX_CONCURRENT_BROWSERS) {
    productChunks.push(products.slice(i, i + MAX_CONCURRENT_BROWSERS));
  }

  let processedCount = 0;
  async function wrappedScrapeProduct(product) {
    processedCount++;

    const exist = await checkProductExists("product_name", "product_image");
    if (exist) {
      console.log(`Skipping already existing product: ${product.product_name}`);
      return;
    }

    await scrapeProduct(product);

    if (processedCount % 10 === 0 || processedCount === totalProducts) {
      console.log(
        `Progress: ${processedCount}/${totalProducts} (${(
          (processedCount / totalProducts) *
          100
        ).toFixed(2)}%)`
      );
    }
  }

  let chunk_number = 0;

  for (const chunk of productChunks) {
    chunk_number++;
    await Promise.all(chunk.map(wrappedScrapeProduct));
    console.log(`Chunk ${chunk_number}/${productChunks.length} completed.`);
  }

  await closePool();
  console.log(`✅ Finished processing all ${totalProducts} products!`);
}

main().catch(console.error);
