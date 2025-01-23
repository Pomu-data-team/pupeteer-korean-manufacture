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

// Read products from database
const manufactures = await readFactory();

// Click the button to get all images
// image_title, image_url, 

// close
await closePool();
