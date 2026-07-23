import { expect, Page } from "@playwright/test";

const API_BASE_URL = "http://127.0.0.1:8000";
const AUTH_TOKEN_KEY = "fincredit_access_token";
const AUTH_USER_KEY = "fincredit_current_user";

export async function loginAsDemo(page: Page) {
  await loginWithCredentials(page, "demo@fincredit.ai", "DemoPass123!");
}

export async function loginAsAdmin(page: Page) {
  await loginWithCredentials(page, "admin@fincredit.ai", "AdminPass123!");
}

async function loginWithCredentials(page: Page, email: string, password: string) {
  const response = await page.request.post(`${API_BASE_URL}/api/auth/login`, {
    data: {
      email,
      password,
    },
  });

  expect(response.ok()).toBeTruthy();

  const auth = await response.json();

  await page.addInitScript(
    ({ token, user }) => {
      window.localStorage.setItem("fincredit_access_token", token);
      window.localStorage.setItem("fincredit_current_user", JSON.stringify(user));
    },
    {
      token: auth.accessToken,
      user: auth.user,
    }
  );

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function clearAuth(page: Page) {
  await page.addInitScript(
    ({ tokenKey, userKey }) => {
      window.localStorage.removeItem(tokenKey);
      window.localStorage.removeItem(userKey);
    },
    { tokenKey: AUTH_TOKEN_KEY, userKey: AUTH_USER_KEY }
  );
}
