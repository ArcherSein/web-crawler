const request = require('superagent');
const cheerio = require('cheerio');
const base64 = require('crypto-js/enc-base64');
const utf8 = require('crypto-js/enc-utf8');
const schedule = require('node-schedule');
const GitHub = require('github-api');

schedule.scheduleJob('3 */6 * * *', getUrl);

function getUrl() {
  console.log('start to get url.');
  request
    .get('https://d.ishadowx.com/')
    .query({
      _: Date.now()
    })
    .then(
      res => {
        if (res.ok) {
          try {
            const $ = cheerio.load(res.text);
            const btns = $('.v2 .copybtn');
            const urls = Array.from(btns).map(btn => {
              return $(btn).data('clipboardText');
            });
            const content = base64.stringify(utf8.parse(urls.join('')));
            pushToGithub(content);
          } catch (e) {
            console.log(e);
          }
        }
      },
      e => {
        console.log(e);
      }
    );
}

function pushToGithub(content) {
  const gh = new GitHub({
    token: process.env.GITHUB_API_TOKEN
  });
  let repo = gh.getRepo('ArcherSein', 'web-crawler');
  repo.writeFile('master', 'dist/url.txt', content, 'update url list', function(
    error,
    result
  ) {
    if (error) {
      console.log(error);
    }
    console.log(result);
  });
}
