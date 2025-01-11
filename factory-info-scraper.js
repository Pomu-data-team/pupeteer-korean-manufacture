import puppeteer from "puppeteer";
import {
  readFactory,
  ensureManufactureTableExists,
  insertManufactureInfo,
  closePool,
  getDataCount,
  checkManufactureExists,
} from "./database.js";
import { getData, getValidData, logToFile } from "./untils.js";
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

ensureManufactureTableExists();
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const filePath = `logs/log_${timestamp}`;

// page.goto visit one by one
let i = await getDataCount("manufacture_info");
let numberSkipped = 0;
for (const factories of factory_name_url) {
  // Check if this manufacture exists
  const manufacture_name = factories["manufacture_name"];
  const url = factories["url"];
  if (await checkManufactureExists(manufacture_name, "manufacture_info")) {
    numberSkipped++;
    console.log(
      `\n${numberSkipped} manufacture ${manufacture_name} exists, skip\n`
    );
    continue;
  }
  i++;
  // navigate to the page
  await page.goto(url);
  // PROBLEM - delay seems doesn't work
  delay(2000);
  const [companyPage] = await page.$x(
    "//ul[@class='shm-head-link']//a[contains(text(), 'Our')]"
  );
  console.log(`\n${i}th manufacture ${manufacture_name}, url: ${url}\n`);
  delay(2000);
  await companyPage.click();
  await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  // get the data
  let classification = await page.$x("//div[@class='shm-classification']//dd");
  classification = await getData(classification, page);
  classification = getValidData(classification);
  let general_four = await page.$x("//div[@class='shm-data']//dd/text()");
  let basic_info = await page.$x("//ul[@class='shm-basic-box']/li/p");
  basic_info = await getData(basic_info, page);
  basic_info = getValidData(basic_info);
  general_four = await getData(general_four, page);
  general_four = getValidData(general_four);
  let r_d_capacity = await page.$x(
    "//div[@class='focus-detail-block']//strong[contains(text(), 'Research')]/following-sibling::div"
  );
  r_d_capacity = await getData(r_d_capacity, page);

  const result = {
    manufacture_name: factories["manufacture_name"],
    manufacture_url: factories["url"],
    favorites_num: general_four[0],
    inquiry_num: general_four[1],
    order_num: general_four[2],
    review_num: general_four[3],
    ceo: basic_info[0],
    address: basic_info[1],
    country_region: basic_info[2],
    home_page: basic_info[3],
    total_employees: basic_info[4],
    total_annual_revenue: basic_info[5],
    year_established: basic_info[6],
    main_markets: basic_info[7],
    r_d_capacity: r_d_capacity[0],
    main_products: classification[0],
    business_type: classification[1],
  };

  // LOGGING
  logToFile(
    `
  ${i}th manufacture ${result.manufacture_name}, url: ${
      result.manufacture_url
    }\n
  ${JSON.stringify(result, null, 2)}\n
  `,
    filePath
  );
  // write into database
  await insertManufactureInfo(result, filePath);
}

// close
await closePool();
