console.log("hi");
const signale = require("signale");
const chalk = require("chalk");
const ProgressBar = require("progress");

signale.success("done");
signale.debug("test...");
signale.info(chalk.blue("scraping from google drive"));
signale.fatal(new Error("oh oh..."));

const bar = new ProgressBar(":bar", { total: 100 });

setTimeout(() => {
  bar.tick(25);
}, 1000);

setTimeout(() => {
  bar.tick(50);
}, 2000);

setTimeout(() => {
  bar.tick(75);
}, 3000);

setTimeout(() => {
  bar.tick(80);
}, 4000);

setTimeout(() => {
  bar.tick(90);
}, 5000);

setTimeout(() => {
  bar.tick(100);
}, 6000);
