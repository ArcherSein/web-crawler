const request = require('superagent');
const cheerio = require('cheerio');
const base64 = require('crypto-js/enc-base64');
const utf8 = require('crypto-js/enc-utf8');
const schedule = require('node-schedule');
const GitHub = require('github-api');
let contentCache = '';
const args = process.argv;

if (args[2]) {
  console.log('start getUrl');
  getUrl();
} else {
  schedule.scheduleJob('2 */1 * * *', getUrl);
}

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
            const newContent = base64.stringify(utf8.parse(urls.join('').trim()));
            if (newContent !== contentCache) {
              pushToGithub(newContent);
            } else {
              console.log('no need update.');
            }
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
    token: '6b9c7772067b31da92a8c8679883edc3e3b40677'
  });
  let repo = gh.getRepo('ArcherSein', 'web-crawler');
  repo.writeFile('master', 'dist/url.txt', content, 'update url list', function(
    error
  ) {
    if (error) {
      console.log(error);
    } else {
      contentCache = content;
      console.log('success.');
    }
  });
}
