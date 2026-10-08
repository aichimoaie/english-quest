import { expect, type Page } from '@playwright/test';

/** Signs the learner in through the public sign-in page and waits for the day overview. */
export async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Your 30 days' })).toBeVisible();
}
