const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const fs = require("fs").promises;
const copyDir = require("./copy-dir");

const cssInputPath = "./src/css/210606.css";
const cssOutputPath = "./dist/css/210606.css";

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

const makeDist = async() => {
  await fs.mkdir("./dist/css", { recursive: true })
  await fs.mkdir("./dist/assets", { recursive: true })
};

const readCss = () => fs.readFile(cssInputPath, "utf8");
const writeCss = buffer => fs.writeFile(cssOutputPath, buffer);
const copyHtml = () => fs.copyFile("./src/index.html", "./dist/index.html");
const copyAssets = () => copyDir("./src/assets", "./dist/assets", {  });

const processCss = buffer => {
  return new Promise((resolve) => {
    postcss([autoprefixer]).process(buffer, { from: cssInputPath, to: cssOutputPath }).then(v => {
      resolve(v.css);
    });
  });
};

const buildAll = () => {

  // chain reading css -> processing -> writing
  let buildCss = readCss().then(processCss).then(writeCss)
    .then(() => console.log("css built successfully.."));


  // write html & assets in sync
  let copyRest = new Promise(async resolve => {
    await copyHtml();
    console.log("html built successfully..");
    await copyAssets();
    console.log("assets built successfully..");
    resolve();
  });

  return Promise.all([buildCss, copyRest]);
};

// delete and re-create ./dist before building
const main = async() => {
  console.log("build started");
  const start = Date.now();

  try {
    await clearDist();
    await makeDist();
  } catch(e) {
    console.error("failed to regenerate ./dist", e);
    process.exit(1);
  } finally {
    console.log("./dist generated");
  }

  try {
    await buildAll();
    console.log(`build done in ${Date.now() - start}ms`);
  } catch(e) {
    console.error("build errored: ", e);
    process.exit(1);
  }
};

main();