import puppeteer from "puppeteer";
import {
  readFactory,
  ensureManufactureTableExists,
  insertManufactureInfo,
  closePool,
  getDataCount,
  checkManufactureExists,
  ensureProductTableExists,
} from "./database.js";
import {
  getDataNew,
  getValidData,
  logToFile,
  isButtonClickale,
} from "./untils.js";
import fs from "fs";
import { delay } from "./untils.js";

// open the browser
const browser = await puppeteer.launch({
  // headless: false,
  // defaultViewport: null,
});

const page = await browser.newPage();

// load 10 factories from database
const factory_name_url = await readFactory();

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const filePath = `logs/log_products_${timestamp}`;

await ensureProductTableExists();

// page.goto visit one by one
let i = 0;
for (const factories of factory_name_url) {
  i++; // manufacture number

  const manufacture_name = factories["manufacture_name"];
  const manufacture_url = factories["url"];

  await page.goto(manufacture_url);

  const nextButton = await page.$x(
    "//button[@class='bk-icon-only btn-page-next']"
  );

  console.log(
    `\n\n${i}th manufacture ${manufacture_name}, url: ${manufacture_url}\n`
  );

  await page.evaluate(() => {
    window.scrollBy(0, 2000);
  });

  await delay(2500);

  let pg = 0;
  do {
    console.log(`At page ${++pg}`);
    let products = [];
    let product_items = await page.$$(
      "xpath/" + "//div[@id='dv-CtgryGoodsList-area']//dl"
    );
    // console.log("product_items: ", product_items);
    let product_name_handle = await product_items[0].$$(
      "xpath/" + "//div[@class='goods-name ellipsis']"
    );

    let product_names = await getDataNew(product_name_handle, "TEXT");
    let product_url_handle = await product_items[0].$$(
      "xpath/" +
        "//div[@class='img-goods img-xlarge']/a[@class='dv-goodsUnit-img-area']"
    );
    product_url_handle = await getDataNew(product_url_handle, "URL");
    let product_urls = product_url_handle.map(
      (url) => "https://buykorea.org" + url
    );
    if (product_names.length === product_urls.length) {
      products = product_names.map((name, index) => ({
        name: name,
        url: product_urls[index],
      }));
    } else {
      console.error(
        "Mismatch in product names and URLs count",
        product_names,
        product_urls
      );
    }

    console.log("\n\nproducts array is: ", products);

    // Write all the data to database

    if (await isButtonClickale(nextButton)) {
      await nextButton.click();
      await delay(2500);
    } else {
      break;
    }
  } while (true);
  await delay(2500);

  // LOGGING
  logToFile(
    `
  ${i}th manufacture ${manufacture_name}, url: ${manufacture_url}
  `,
    filePath
  );
}

// close
await closePool();
