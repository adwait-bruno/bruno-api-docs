import type { Page } from '@playwright/test';
import { test, expect } from '../../playwright';

const VARS_PLAYGROUND = '/?fixture=vars#/?pg=1&dock=bottom';

const reopenWithoutReload = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    window.location.hash = '#/?pg=1&dock=bottom';
  });
};

const markPageLoad = (page: Page) => page.evaluate(() => {
  (window as unknown as { __sameLoad: boolean }).__sameLoad = true;
});

const isSamePageLoad = (page: Page) =>
  page.evaluate(() => (window as unknown as { __sameLoad?: boolean }).__sameLoad === true);

test.describe('Playground edits survive closing and reopening, not a reload', () => {
  test.beforeEach(async ({ page, playground }) => {
    await page.goto(VARS_PLAYGROUND);
    await playground.runner.waitFor({ state: 'visible' });
    await playground.openTreeItem(['Customers', 'Variables Demo']);
    await playground.view.waitFor({ state: 'visible' });
    await playground.envSwitcher.selectEnvironment('Dev');
  });

  test('a typed secret environment value is still set after close and reopen', async ({ page, playground }) => {
    await playground.variable.hoverInputToken('unsetSecret');
    await playground.variable.editTo('typed-secret');
    await expect(playground.variable.value).toHaveText('*'.repeat('typed-secret'.length));

    await markPageLoad(page);
    await playground.close();
    await expect(playground.header).toHaveCount(0);
    await reopenWithoutReload(page);
    await expect(playground.header).toBeVisible();
    expect(await isSamePageLoad(page)).toBe(true);

    await playground.openTreeItem(['Customers', 'Variables Demo']);
    await playground.view.waitFor({ state: 'visible' });
    await playground.variable.hoverInputToken('unsetSecret');
    await playground.variable.revealToggle.click();
    await expect(playground.variable.value).toHaveText('typed-secret');
  });

  test('an edited environment value and request URL are kept after close and reopen', async ({
    page,
    playground
  }) => {
    await playground.variable.hoverInputToken('host');
    await playground.variable.editTo('https://edited.example.com');
    await expect(playground.variable.value).toHaveText('https://edited.example.com');

    await playground.urlInput.click();
    await page.keyboard.press('End');
    await page.keyboard.type('&edited=1');
    await expect(playground.urlInput).toHaveValue(/&edited=1$/);

    await markPageLoad(page);
    await playground.close();
    await expect(playground.header).toHaveCount(0);
    await reopenWithoutReload(page);
    await expect(playground.header).toBeVisible();
    expect(await isSamePageLoad(page)).toBe(true);

    await playground.openTreeItem(['Customers', 'Variables Demo']);
    await playground.view.waitFor({ state: 'visible' });
    await expect(playground.urlInput).toHaveValue(/&edited=1$/);
    await expect(playground.envSwitcher.trigger).toContainText('Dev');
    await playground.variable.hoverInputToken('host');
    await expect(playground.variable.value).toHaveText('https://edited.example.com');
  });

  test('a reload restores the collection\'s original values', async ({ page, playground }) => {
    await playground.variable.hoverInputToken('unsetSecret');
    await playground.variable.editTo('typed-secret');
    await playground.variable.hoverInputToken('host');
    await playground.variable.editTo('https://edited.example.com');

    await page.reload();
    await playground.runner.waitFor({ state: 'visible' });
    await playground.openTreeItem(['Customers', 'Variables Demo']);
    await playground.view.waitFor({ state: 'visible' });

    await playground.variable.hoverInputToken('host');
    await expect(playground.variable.value).toHaveText('https://api.dev.example.com');
    await playground.variable.hoverInputToken('unsetSecret');
    await expect(playground.variable.value).toHaveText('');
  });
});
