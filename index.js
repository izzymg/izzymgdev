const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const fs = require("fs").promises;
const copyDir = require("./copy-dir");

const cssInputPath = "./src/css/index.css";
const cssOutputPath = "./dist/css/index.css";

// Ignore dist not already existing when clearing it
const clearDist = async() => {
  try {
    await fs.rm("./dist", { recursive: true })
  } catch(e) {
    if(e.code !== "ENOENT") {
      throw e;
    }
  }
};

const makeDist = () => fs.mkdir("./dist/css", { recursive: true });

const readCss = () => fs.readFile(cssInputPath, "utf8");
const writeCss = () => fs.writeFile(cssOutputPath, "utf8");
const copyHtml = () => fs.copyFile("./src/index.html", "./dist/index.html");
const copyAssets = () => copyDir("./src/assets", "./dist", {  });

const processCss = buffer => {
  return new Promise((resolve) => {
    postcss([autoprefixer]).process(buffer, { from: cssInputPath, to: cssOutputPath }).then(v => {
      resolve(v.css);
    });
  });
};

const buildAll = () => {
  let buildCss = readCss().
    then(processCss)
    .then(writeCss)
    .then(() => console.log("css built successfully.."));

  let copyRest = copyHtml()
    .then(() => console.log("html built successfully.."))
    .then(() => copyAssets()
    .then(() => console.log("assets built successfully..")));

  Promise.all([buildCss, copyRest])
    .then(() => {
      console.log("Build finished");
    }).catch(e => {
      console.error("Build errored:", e);
    });
};

const main = async() => {

  try {
    await clearDist();
    // await new Promise(resolve => setTimeout(resolve, 1500));
    await makeDist();
  } catch(e) {
    console.error("failed to regenerate ./dist", e);
  } finally {
    console.log("./dist generated");
  }

  try {
    await buildAll();
  } catch(e) {
    console.error("build errored: ", e);
  }
};

main();