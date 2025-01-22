import puppeteer from "puppeteer";
import {
  readFactory,
  closePool,
  ensureProductTableExists,
  insertProductVisit,
  checkManufactureExistsURL,
} from "./database.js";
import { getDataNew, logToFile, isButtonClickale } from "./untils.js";
import { delay } from "./untils.js";

// open the browser
const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
});

const page = await browser.newPage();

// load 10 factories from database
const manufactures = await readFactory();

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const filePath = `logs/products_info_${timestamp}`;

await ensureProductTableExists();

// page.goto visit one by one
let i = 0;
for (const manufacture of manufactures) {
  i++; // manufacture number

  const manufacture_name = manufacture["manufacture_name"];
  const manufacture_url = manufacture["manufacture_url"];
  const manufacture_id = manufacture["id"];

  // Check if current manufacture exists in database
  if (await checkManufactureExistsURL(manufacture_url, "product_visit")) {
    console.log(`\nManufacture ${manufacture_name} exists. skipping...\n`);
    continue;
  }
  try {
    await page.goto(manufacture_url);
  } catch (err) {
    console.error(
      `Error visiting manufacture URL: ${manufacture_url}\nerror is\n${err}`
    );
    continue;
  }

  console.log(
    `\n\n${i}th manufacture ${manufacture_name}, url: ${manufacture_url}\n`
  );

  const nextButton = await page.$x(
    "//button[@class='bk-icon-only btn-page-next']"
  );

  await page.evaluate(() => {
    window.scrollBy(0, 2000);
  });

  await delay(2500);

  let pg = 0;
  do {
    let products = [];
    let product_items = await page.$$(
      "xpath/" + "//div[@id='dv-CtgryGoodsList-area']//dl"
    );
    if (product_items.length === 0) {
      console.error(
        `No product items found for manufacture ${manufacture_name}`
      );
      continue; // Skip to the next manufacture if no products found
    }
    let product_name_handle = await product_items[0].$$(
      "xpath/" + "//div[@class='goods-name ellipsis']"
    );
    let product_url_handle = await product_items[0].$$(
      "xpath/" +
        "//div[@class='img-goods img-xlarge']/a[@class='dv-goodsUnit-img-area']"
    );

    if (!product_url_handle || product_url_handle.length === 0) {
      throw new Error(
        `No product URLs found for manufacture ${manufacture_name}`
      );
    }

    let product_names = await getDataNew(product_name_handle, "TEXT");
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

    console.log(`Get ${products.length} products on page ${++pg}`);

    // Write all the data to database
    for (const product of products) {
      console.log(
        `product["name"]=${product["name"]}, product["url"]=${product["url"]}, manufacture_id=${manufacture_id}`
      );
      insertProductVisit(
        product["name"],
        product["url"],
        manufacture_url,
        manufacture_id
      );
    }

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
  ${i}th manufacture ${manufacture_name}, url: ${manufacture_url}\n
  `,
    filePath
  );
}

// close
await closePool();
