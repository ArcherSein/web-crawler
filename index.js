const fs = require('fs');
const request = require('superagent');
const cheerio = require('cheerio');
const base64 = require('crypto-js/enc-base64');
const utf8 = require('crypto-js/enc-utf8');
const schedule = require('node-schedule');
const { gitCommitPush } = require('git-commit-push-via-github-api');

schedule.scheduleJob('3 0 * * *', getUrl);

function getUrl() {
  request
    .get('https://d.ishadowx.com/')
    .query({
      _: Date.now()
    })
    .then(res => {
      if (res.ok) {
        try{
          const $ = cheerio.load(res.text);
          const btns = $('.v2 .copybtn');
          const urls = Array.from(btns).map(btn => {
            return $(btn).data('clipboardText');
          });
          const result = base64.stringify(utf8.parse(urls.join('')));
          fs.writeFileSync('dist/url.txt', result);
          pushToGithub();
        }catch(e) {
          console.log(e);
        }
      }
    },(e) => {
      console.log(e);
    });
}

function pushToGithub() {
  
  process.on('unhandledRejection', console.dir);
  if (!process.env.GITHUB_API_TOKEN) {
    throw new Error('need GITHUB_API_TOKEN');
  }
  gitCommitPush({
    owner: 'ArcherSein',
    repo: 'web-crawler',
    files: [
      {
        path: 'dist/url.txt',
        content: fs.readFileSync(__dirname + '/dist/url.txt', 'utf-8')
      }
    ],
    fullyQualifiedRef: 'heads/master',
    forceUpdate: false, 
    commitMessage: 'update at' + Date.now()
  })
    .then(res => {
      console.log('success', res);
    })
    .catch(err => {
      console.error(err);
    });
}
