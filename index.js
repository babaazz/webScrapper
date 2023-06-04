const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(
    "https://www.imdb.com/search/title/?count=100&groups=top_1000&sort=user_rating"
  );

  const names = await page.evaluate(() => {
    return [...document.querySelectorAll(".lister-item-content")].map(
      (element) => {
        const title = element.querySelector(
          ".lister-item-header a"
        ).textContent;
        const certificate = element.querySelector("span.certificate")
          ? element.querySelector("span.certificate").textContent
          : null;
        const runtime = element.querySelector("span.runtime").textContent;
        const genre = element
          .querySelector("span.genre")
          .textContent.replace(/[\r\n\s]/g, "")
          .split(",");
        return { title, certificate, runtime, genre };
      }
    );
  });

  console.log(names);

  await browser.close();
})();
