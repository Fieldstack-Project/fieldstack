const { spawn } = require("node:child_process");

const target = process.argv[2] ?? "all";

const commandMap = {
  all: {
    args: ["--parallel", "dev"],
    env: {
      NODE_ENV: "development",
      INSTALL_MODE: "bypass",
      VITE_INSTALL_MODE: "bypass",
    },
  },
  api: {
    args: ["--filter", "api", "dev"],
    env: {
      NODE_ENV: "development",
      INSTALL_MODE: "bypass",
    },
  },
  web: {
    args: ["--filter", "web", "dev"],
    env: {
      VITE_INSTALL_MODE: "bypass",
    },
  },
};

if (!Object.prototype.hasOwnProperty.call(commandMap, target)) {
  console.error(`[dev-bypass] Unknown target: ${target}`);
  console.error("[dev-bypass] Use one of: all, api, web");
  process.exit(1);
}

const selected = commandMap[target];

function buildEnv(baseEnv, overrideEnv) {
  const merged = { ...baseEnv, ...overrideEnv };
  const normalized = {};

  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined) {
      normalized[key] = String(value);
    }
  }

  return normalized;
}

function spawnPnpm(args, env) {
  const npmExecPath = process.env.npm_execpath;
  if (typeof npmExecPath === "string" && npmExecPath.toLowerCase().includes("pnpm")) {
    return spawn(process.execPath, [npmExecPath, ...args], {
      stdio: "inherit",
      env,
    });
  }

  return spawn("pnpm", args, {
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  });
}

const child = spawnPnpm(selected.args, buildEnv(process.env, selected.env));

child.on("exit", (code, signal) => {
  if (signal !== null) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
