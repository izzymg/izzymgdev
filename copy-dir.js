const fs = require("fs").promises;
const path = require("path");

const copyAssets = async function(srcDir, dstDir) {
  const files = await fs.readdir(srcDir);
  for(const file of files) {
    let src = path.join(srcDir, file);
    let dst = path.join(dstDir, file);
    const stat = await fs.stat(src);
    if (stat && stat.isDirectory()) {
      await fs.mkdir(dst)
      await copyAssets(src, dst);
    } else {
      await fs.copyFile(src, dst);
    }
  }
}

module.exports = copyAssets;