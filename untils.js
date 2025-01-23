export const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Extract data from promise object obtained by page.$x()
export const getData = async (elements, page) => {
  if (!elements || elements.length == 0) {
    console.error(`Get data failed. Elements passed in is: ${elements}`);
    return -1;
  }
  return Promise.all(
    elements.map((element) => {
      // console.log(`in getData function the element is \n${element}`);
      return element.evaluate((el) => el.textContent.trim(), element);
    })
  );
};

export const getDataNew = async (elements, type) => {
  if (!elements || elements.length == 0) {
    console.error(`GetDataNew failed. Elements passed in is: ${elements}`);
    return -1;
  }
  if (type === "TEXT") {
    return Promise.all(
      elements.map((element) => {
        return element.evaluate((el) => el.textContent.trim(), element);
      })
    );
  } else if (type === "IMG_SRC") {
    return Promise.all(
      elements.map((element) => {
        return element.evaluate((el) => el.getAttribute("src"), element);
      })
    );
  } else if (type === "URL") {
    return Promise.all(
      elements.map((element) => {
        return element.evaluate((el) => el.getAttribute("href"), element);
      })
    );
  }
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

export const isButtonClickale = async (button) => {
  // check if button is null
  if (!button || button.length === 0) {
    console.log("Button not found");
    return false;
  }
  const isVisible = await button[0].isIntersectingViewport();
  const isDisabled = await button[0].evaluate((el) =>
    el.hasAttribute("disabled")
  );

  // check if it's clickable
  if (isVisible && !isDisabled) {
    console.log("The button is visible and clickable.");
    return true;
  } else {
    console.log("The button is either not visible or not clickable.");
    return false;
  }
};
