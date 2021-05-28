const postcss = require("postcss");
const autoprefixer = require("autoprefixer");

const fs = require("fs").promises;

const inputPath = "./src/css/index.css";
const outputPath = "./dist/css/index.css";

const readCss = async() => {
  return fs.readFile(inputPath);
};

const process = buffer => {
  return new Promise((resolve) => {
    postcss([autoprefixer]).process(buffer, { from: inputPath, to: outputPath }).then(v => {
      resolve(v.css);
    });
  });
};

const writeCss = str => {
  return fs.writeFile(outputPath, str);
};

readCss().then(process).then(writeCss).then(() => {
  console.log("Build done!");
});