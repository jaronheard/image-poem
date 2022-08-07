/**
* This is an api file.
* You will need import 'puppeteer' on local env and 'puppeteer-core' on production env.
* for that, you can import both in a file and export based on process.env.NODE_ENV like this:
*
import puppeteerProd from 'puppeteer-core';
import puppeteerDev from 'puppeteer';

export default process.env.NODE_ENV === 'production'
  ? puppeteerProd
  : puppeteerDev;
*/

import puppeteer from "../../utils/puppeteer";
import chrome from "@sparticuz/chrome-aws-lambda";
import { NextApiRequest, NextApiResponse } from "next";

async function getScreenshot(req: NextApiRequest, res: NextApiResponse) {
  try {
    const browser = await puppeteer.launch(
      process.env.NODE_ENV === "production"
        ? {
            args: chrome.args,
            executablePath: await chrome.executablePath,
            headless: chrome.headless,
          }
        : {}
    );
    const page = await browser.newPage();
    page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:86.0) Gecko/20100101 Firefox/86.0"
    );
    await page.setViewport({
      width: 900,
      height: 1600,
    });

    await page.goto((req.query.url as string) || "https://amazon.com");
    const screenshot = await page.screenshot({
      encoding: "base64",
    });

    await browser.close();
    res.json({ blob: `data:image/jpeg;base64,${screenshot}` });
  } catch (error) {
    console.log(error);
  }
}

export default getScreenshot;
