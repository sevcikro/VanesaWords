"use strict";

const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
  });
  page.on("console", (message) => console.error(`browser:${message.type()}: ${message.text()}`));
  page.on("pageerror", (error) => console.error(`browser:pageerror: ${error.message}`));

  await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => !document.querySelector("#start-button")?.disabled);
  const setup = await page.evaluate(() => ({
    viewportHeight: innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
    status: document.querySelector("#database-status").textContent.trim(),
    startDisabled: document.querySelector("#start-button").disabled,
  }));

  await page.click('[data-direction="en-sk"]');
  await page.click('[data-size="10"]');
  await page.click("#start-button");
  await page.waitForSelector("#game-view:not([hidden])");
  const audioResponsePromise = page.waitForResponse(
    (response) => response.url().endsWith(".mp3") && response.status() === 200,
    { timeout: 10_000 }
  );
  await page.click("#speak-button");
  const audioResponse = await audioResponsePromise;
  const game = await page.evaluate(() => ({
    prompt: document.querySelector("#word-prompt").textContent.trim(),
    label: document.querySelector("#prompt-label").textContent.trim(),
    speakText: document.querySelector("#speak-button-text").textContent.trim(),
    buttonVisible: document.querySelector("#speak-button").getBoundingClientRect().width > 0,
  }));

  console.log(
    JSON.stringify(
      { setup, game, audio: { status: audioResponse.status(), url: audioResponse.url() } },
      null,
      2
    )
  );
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
