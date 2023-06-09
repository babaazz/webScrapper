const puppeteer = require("puppeteer");
const fs = require("fs/promises");
const path = require("path");

//Saving Movies data into movies.json

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  let start = 1;
  let data = [];

  for (let i = 0; i < 10; i++) {
    await page.goto(
      `https://www.imdb.com/search/title/?groups=top_1000&sort=user_rating,desc&count=100&start=${start}&ref_=adv_nxt`
    );

    const movies = await page.evaluate(() => {
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

          const imdbRating = parseFloat(
            element.querySelector(".ratings-bar strong").textContent
          );

          const metascore = element.querySelector(".ratings-bar .metascore")
            ? parseInt(
                element.querySelector(".ratings-bar .metascore").textContent
              )
            : null;

          const directorsStars = element
            .querySelector("p:nth-child(5)")
            .textContent.replace(/[\n]/g, "")
            .split("|");

          const directors = directorsStars[0]
            .trim()
            .replace(/^Director:/, "")
            .split(",");

          const stars = directorsStars[1]
            .trim()
            .replace(/^Stars:/, "")
            .split(",");

          const plot = element
            .querySelector("p:nth-child(4)")
            .textContent.replace(/[\n]/g, "");

          const poster = title
            .split(" ")
            .join("")
            .replace(/[^\w\s]/gi, "")
            .concat(".png");

          return {
            title,
            certificate,
            runtime,
            genre,
            imdbRating,
            metascore,
            plot,
            stars,
            directors,
            poster,
          };
        }
      );
    });
    data = data.concat(movies);
    start = start + 100;
  }
  await fs.writeFile("movies.json", JSON.stringify(data));

  await browser.close();
})();

//Saving posters into poster directory

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let posters = [];

  await page.goto(
    "https://www.imdb.com/search/title/?groups=top_1000&sort=user_rating,desc&count=100&start=1&ref_=adv_nxt"
  );

  let isNextAvailable = true;

  while (isNextAvailable) {
    const postersFromPage = await page.evaluate(() => {
      let count = 1;
      return [...document.querySelectorAll(".lister-item")].map((element) => {
        const posterName = element
          .querySelector(".lister-item-content .lister-item-header a")
          .textContent.split(" ")
          .join("")
          .replace(/[^\w\s]/gi, "")
          .concat(".png");
        const posterUrl = element
          .querySelector(".lister-item-image a img")
          .getAttribute("src");

        count++;
        return {
          posterName,
          posterUrl,
        };
      });
    });

    posters = posters.concat(postersFromPage);
    isNextAvailable = (await page.$(".lister-page-next")) ? true : false;
    if (isNextAvailable) {
      await Promise.all([
        page.waitForNavigation(),
        page.click(".lister-page-next"),
      ]);
    }
  }

  for (let poster of posters) {
    const posterPage = await page.goto(poster.posterUrl);
    await fs.writeFile(
      path.join(__dirname, "img", poster.posterName),
      await posterPage.buffer()
    );
  }
  await browser.close();
})();
