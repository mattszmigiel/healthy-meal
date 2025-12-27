import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  globalTeardown: path.join(process.cwd(), "tests/e2e/global.teardown.ts"),
  use: {
    baseURL: process.env.SITE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Setup project - runs first to authenticate
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    // Unauthenticated tests (login, registration, etc.)
    {
      name: "unauthenticated",
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch: /.*\/(login|register|homepage)\.spec\.ts/,
    },
    // Authenticated tests (recipes, profile, etc.)
    {
      name: "authenticated",
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(process.cwd(), "playwright/.auth/user.json"),
      },
      dependencies: ["setup"],
      testIgnore: /.*\/(login|register|homepage)\.spec\.ts/,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: process.env.SITE_URL,
    reuseExistingServer: !process.env.CI,
  },
});
