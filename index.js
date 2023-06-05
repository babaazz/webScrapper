const puppeteer = require("puppeteer");
const fs = require("fs/promises");

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
