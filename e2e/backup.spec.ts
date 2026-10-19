import { test, expect } from '@playwright/test';
test('backuproom loads and creates job', async ({ page }) => {
  await page.goto('http://localhost:3000/room/demo');
  await expect(page.locator('h1')).toContainText('BackupRoom: demo');
  await page.locator('.name-input').fill('prod-db-daily');
  await page.locator('.source-input').fill('prod-db');
  await page.locator('.destination-input').fill('s3://backups/db');
  await page.locator('.schedule-input').selectOption('daily');
  await page.locator('.retention-input').fill('30');
  await page.locator('.add-btn').click();
  await expect(page.locator('.job-list').locator('div').first()).toBeVisible();
});