export const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Extract data from promise object obtained by page.$x()
export const getData = async (elements, page) => {
  return Promise.all(
    elements.map((element) => {
      // console.log(`in getData function the element is \n${element}`);
      return page.evaluate((el) => el.textContent.trim(), element);
    })
  );
};

// see if data exists else will return -1. cases are : "-", "- / -", http://, NaN
export const getValidData = (elements) => {
  return elements.map((el) => {
    if (
      el === "-" ||
      el === "- / -" ||
      el === "http://" ||
      el === "NaN" ||
      el === null
    ) {
      return -1;
    }
    return el;
  });
};

import fs from "fs";
export const logToFile = (logMessage, path) => {
  fs.appendFile(path, logMessage, (err) => {
    if (err) {
      console.log(`Failed to write into log:${err}`);
    }
  });
};

export const createFolder = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dirName = `logs_${timestamp}`;
  fs.mkdir(dirName, { recursive: true }, (err) => {
    if (err) {
      console.error(`Failed to create directory: ${err}`);
    } else {
      console.log(`Directory created: ${dirName}`);
    }
  });
  return dirName;
};
