import { test, expect } from '@playwright/test';
import { resetDatabaseAndImportDataFromPath } from '../../scripts/dts-import';
import { login } from '../../utils/login';

test.describe('List view', () => {
  test.beforeEach(async ({ page }) => {
    await resetDatabaseAndImportDataFromPath('./e2e/data/with-admin.tar');
    await page.goto('/admin');
    await login({ page });
  });

  const LOCALES = ['English (en)', 'French (fr)', 'German (de)', 'Spanish (es)'];

  test('As a user I want a locale column to be injected in the table & a locale switcher only if the content-type has i18n enabled.', async ({
    page,
  }) => {
    /**
     * Navigate to the products list-view (this content-type has i18n enabled)
     */
    await page.getByRole('link', { name: 'Content Manager' }).click();
    await page.getByRole('link', { name: 'Products' }).click();
    await page.waitForURL(
      /\/admin\/content-manager\/collection-types\/api::product.product(\?.*)?/
    );
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();

    /**
     * Verify that the page has the injected ListView components for i18n
     * - A locale column
     * - A locale switcher
     */
    await expect(page.getByRole('row', { name: 'Nike Mens 23/24 Away Stadium' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: 'Available in' })).toBeVisible();
    await expect(page.getByRole('gridcell', { name: 'English (en) (default)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'English (en) (default)' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Select a locale' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Select a locale' }).click();
    for (const locale of LOCALES) {
      await expect(page.getByRole('option', { name: locale })).toBeVisible();
    }
    await page.getByRole('option', { name: 'French (fr)' }).click();
    expect(new URL(page.url()).searchParams.get('plugins[i18n][locale]')).toEqual('fr');
    await expect(page.getByRole('row', { name: 'No content found' })).toBeVisible();

    /**
     * Navigate to the authors list-view (this content-type does not have i18n enabled)
     */
    await page.getByRole('link', { name: 'Author' }).click();
    await page.waitForURL(/\/admin\/content-manager\/collection-types\/api::author.author(\?.*)?/);
    await expect(page.getByRole('heading', { name: 'Author' })).toBeVisible();

    /**
     * Verify that the page does not have the injected ListView components for i18n
     */
    await expect(page.getByRole('combobox', { name: 'Select a locale' })).not.toBeVisible();
    await expect(page.getByRole('gridcell', { name: 'Available in' })).not.toBeVisible();
  });

  test('As a user I want to be able to navigate to the locale of a document and when I go back to my list-view i expect to still be showing that locale, not the default.', async ({
    page,
  }) => {
    /**
     * Navigate to the products list-view (this content-type has i18n enabled)
     */
    await page.getByRole('link', { name: 'Content Manager' }).click();
    await page.getByRole('link', { name: 'Products' }).click();
    await page.waitForURL(
      /\/admin\/content-manager\/collection-types\/api::product.product(\?.*)?/
    );
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();

    /**
     * Swap to the Spanish locale and create it.
     */
    await page.getByRole('combobox', { name: 'Select a locale' }).click();
    await page.getByRole('option', { name: 'Spanish (es)' }).click();
    await expect(page.getByRole('row', { name: 'No content found' })).toBeVisible();
    await page.getByRole('link', { name: 'Create new entry' }).first().click();
    expect(new URL(page.url()).searchParams.get('plugins[i18n][locale]')).toEqual('es');
    await expect(page.getByRole('heading', { name: 'Create an entry' })).toBeVisible();
    await page
      .getByRole('textbox', { name: 'name' })
      .fill('Programa de la Final de la Copa Carabao 2024 - AFC Richmond Vs Chelsea');
    await page.getByRole('button', { name: 'Publish' }).click();

    /**
     * Go to the list-view and assert that the locale is still Spanish
     */
    await page.getByRole('link', { name: 'Products' }).click();
    await page.waitForURL(
      /\/admin\/content-manager\/collection-types\/api::product.product(\?.*)?/
    );
    expect(new URL(page.url()).searchParams.get('plugins[i18n][locale]')).toEqual('es');

    /**
     * Go to a different content-type that doesn't have i18n enabled and check the query persists
     */
    await page.getByRole('link', { name: 'Author' }).click();
    await page.waitForURL(/\/admin\/content-manager\/collection-types\/api::author.author(\?.*)?/);
    await expect(page.getByRole('heading', { name: 'Author' })).toBeVisible();
    expect(new URL(page.url()).searchParams.get('plugins[i18n][locale]')).toEqual('es');

    /**
     * Go back to the products list-view and assert that the locale is still es
     * even though the current content-type does not have i18n enabled
     */
    await page.getByRole('link', { name: 'Products' }).click();
    await page.waitForURL(
      /\/admin\/content-manager\/collection-types\/api::product.product(\?.*)?/
    );
    await expect(page.getByRole('heading', { name: 'Products' })).toBeVisible();
    expect(new URL(page.url()).searchParams.get('plugins[i18n][locale]')).toEqual('es');
  });
});