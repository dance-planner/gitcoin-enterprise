// const { setHeadlessWhen } = require("@codeceptjs/configure");

// // turn on headless mode when running with HEADLESS=true environment variable
// // HEADLESS=true npx codecept run
// setHeadlessWhen(process.env.HEADLESS);

exports.config = {
  tests: "./test-files/*-test.js",
  output: "./output",
  helpers: {
    Puppeteer: {
      url: "http://gitcoin-enterprise.org",
      show: false,
      chrome: {
        args: ["--no-sandbox"]
      },
    }
  },
  bootstrap: "./initialize.js",
  mocha: {},
  name: "acceptance-tests",
  plugins: {
    screenshotOnFail: {
      enabled: true
    }
  },
};
