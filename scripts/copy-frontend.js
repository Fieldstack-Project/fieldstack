const fs = require("node:fs");
const path = require("node:path");

function copyFrontendBuild() {
  const sourceDir = path.resolve(__dirname, "../apps/web/dist");
  const targetDir = path.resolve(__dirname, "../apps/api/public");

  if (!fs.existsSync(sourceDir)) {
    console.warn(`[postbuild] Skip: source not found at ${sourceDir}`);
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  console.log(`[postbuild] Copied frontend build to ${targetDir}`);
}

copyFrontendBuild();
