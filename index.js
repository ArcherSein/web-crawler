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
    throw new Error('GITHUB_API_TOKEN=xxx node example.js');
  }
  gitCommitPush({
    // commit to https://github.com/azu/commit-to-github-test
    owner: 'azu',
    repo: 'commit-to-github-test',
    // commit files
    files: [
      {
        path: 'README.md',
        content: fs.readFileSync(__dirname + '/README.md', 'utf-8')
      },
      {
        path: 'dir/input.txt',
        content: fs.readFileSync(__dirname + '/dir/input.txt', 'utf-8')
      },
      // Pass binary as Buffer
      {
        path: 'next-item.mp3',
        content: fs.readFileSync(__dirname + '/next-item.mp3')
      },
      { path: 'image.png', content: fs.readFileSync(__dirname + '/image.png') }
    ],
    fullyQualifiedRef: 'heads/master',
    forceUpdate: false, // optional default = false
    commitMessage: 'HELLO'
  })
    .then(res => {
      console.log('success', res);
    })
    .catch(err => {
      console.error(err);
    });
}
