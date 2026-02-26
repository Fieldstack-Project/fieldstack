import "dotenv/config";

type InstallMode = "normal" | "bypass";

const BOOTSTRAP_MESSAGE = "Fieldstack API bootstrap initialized";

function resolveInstallMode(env: NodeJS.ProcessEnv): InstallMode {
  const requestedMode = env.INSTALL_MODE;
  const isDevelopment = env.NODE_ENV === "development";

  if (requestedMode === "bypass") {
    if (isDevelopment) {
      return "bypass";
    }

    console.warn("[fieldstack][api] INSTALL_MODE=bypass ignored outside development");
  }

  return "normal";
}

const installMode = resolveInstallMode(process.env);

console.log(BOOTSTRAP_MESSAGE);
console.log(`[fieldstack][api] install mode: ${installMode}`);

if (installMode === "bypass") {
  console.warn("[fieldstack][api] DEV INSTALL BYPASS ACTIVE");
}
