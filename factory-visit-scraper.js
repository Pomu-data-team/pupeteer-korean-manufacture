import puppeteer from "puppeteer";
// import fs, { link } from "fs";
import { insertFactory, closePool, ensureTableExists } from "./database.js";
import delay from "./untils.js";

const getQuotes = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();

  await page.goto("https://buykorea.org/cp/cpy/selectCompaniesList.do#none", {
    waitUntil: "load",
  });

  await page.evaluate(() => {
    window.scrollBy(0, 1000);
  });

  const [expandButton] = await page.$x(
    "//ul[@class='list-accordion']/li[2]//div[@class='right-area']//button"
  );

  await expandButton.click();

  // select fashion and click search
  const [fahionLi] = await page.$x(
    "//ul[@class='list-accordion']/li[2]//a[contains(text(), 'Fashion')]"
  );

  await fahionLi.click();

  const [seachButton] = await page.$x(
    "//div[@class='filter-body']//div[@class='search-area']"
  );
  await delay(500);

  // view more all the way to last
  let i = 0;
  // let veewMoreExist = true;
  while (true) {
    i++;
    const [viewMore] = await page.$x("//div[@class='cp-more-row']/button");
    let manufacture_list = await page.$x("//ul[@class='cp-companies-list']/li");
    console.log(
      `click viewMore ${i} time, having ${manufacture_list.length} manufactures now\n`
    );
    await delay(2000);
    try {
      await viewMore.click();
    } catch (error) {
      console.log(
        `Not successful click this time.\n viewMore is ${viewMore} \n error is \n ${error}`
      );
      break;
    }
  }

  const manufacture_list = await page.$x("//ul[@class='cp-companies-list']/li");
  console.log(`${manufacture_list.length} manufactures in total`);

  // get all fashion factory names and links and store them
  const links = await page.evaluate(() => {
    // Fetch the first element with class "quote"
    const anchors = Array.from(
      document.querySelectorAll(".cp-companies-list li > a")
      // page.$("::-p-xpath(.//ul[@class='cp-companies-list'])")
    );

    return anchors.map((anchor) => ({
      manufacture_name: anchor.textContent.trim(),
      url: `https://buykorea.org${anchor.getAttribute("href")}`,
    }));
  });

  for (const { manufacture_name, url } of links) {
    await insertFactory(manufacture_name, url);
  }

  // await browser.close();
};

await ensureTableExists();
await getQuotes();
await closePool();
