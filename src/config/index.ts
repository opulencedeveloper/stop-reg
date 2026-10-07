import path from "path";

export enum AppEnvironment {
  PRODUCTION = "production",
  DEVELOPMENT = "development",
  TEST = "test",
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is missing!`);
  }
  return value;
};

const rootDir = process.cwd();

const config = {
  app: {
    port: Number(getEnv("PORT", "3000")),
    env: (getEnv("NODE_ENV", "development") as AppEnvironment),
    brandName: "StopReg",
    publicDir: path.resolve(rootDir, "public"),
    viewsDir: path.resolve(rootDir, "views"),
  },
  api: {
    baseUrl: getEnv(
      "API_BASE_URL",
      process.env.NODE_ENV === "production"
        ? "https://api.stopreg.com/api/v1"
        : "http://localhost:8080/api/v1"
    ),
  },
};

export default config;
