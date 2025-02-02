import puppeteer, { Page } from "puppeteer";
import { delay, getDataNew, getValidData, urlToBase64 } from "./untils.js";

const browser = await puppeteer.launch({
  headless: false,
  defaultViewport: null,
});

const page = await browser.newPage();

const url =
  "https://buykorea.org/ec/prd/selectGoodsDetail.do?goodsSn=3507214&inFlowCd=S";

await page.goto(url);

const productImages = await page.$$(
  "xpath/" +
    "//div[@class='cp-swiper-gallery detail-gallery']//img[@style='object-fit:scale-down;']"
);

const imagesMap = new Map();

for (const image of productImages) {
  const alt = await getDataNew([image], "ALT");
  // const alt = await getValidData(altRaw);
  const src = await getDataNew([image], "IMG_SRC");
  // console.log(`src is ${src}`);
  // console.log(`alt is ${alt}`);
  // const encoding = await urlToBase64(src);
  const key = alt[0] === "" || alt[0] === -1 ? "UNDEFINED" : alt[0];
  imagesMap.set(key, {
    src: src,
    encoding: null,
  });
  console.log(Array.from(imagesMap));
}
