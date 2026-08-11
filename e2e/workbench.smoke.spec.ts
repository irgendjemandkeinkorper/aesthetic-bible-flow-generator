import { expect, test } from '@playwright/test';
import { INITIAL_PRESETS } from '../src/data/presets';

test('opens settings and renders mocked run data in comparison workspace', async ({ page }) => {
  const providerRequests: string[] = [];
  await page.route(/generativelanguage\.googleapis\.com|api\.openai\.com|api\.anthropic\.com/, async (route) => {
    providerRequests.push(route.request().url());
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  await page.route('**/api/health', (route) => route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false}' }));

  await page.addInitScript(({ bible }) => {
    localStorage.setItem('aesthetic-bible:gemini-api-key', 'mock-gemini-key-1234567890');
    localStorage.setItem('aesthetic-bible:openai-api-key', 'sk-mock-openai-key-1234567890');
    localStorage.setItem('aesthetic-bible:anthropic-api-key', 'sk-ant-mock-anthropic-key-1234567890');
    localStorage.setItem('aesthetic-bible.run-history.v1', JSON.stringify([
      { id: 'mock-run-a', completedAt: '2026-08-11T00:00:00.000Z', pinned: false, providerId: 'openai', modelId: 'mock-a', latencyMs: 10, inputTokens: 1, outputTokens: 2, costUsd: 0, status: 'success', bible: { ...bible, id: 'mock-bible-a', title: 'Mocked Aurora Bible' } },
      { id: 'mock-run-b', completedAt: '2026-08-11T00:01:00.000Z', pinned: false, providerId: 'anthropic', modelId: 'mock-b', latencyMs: 12, inputTokens: 1, outputTokens: 2, costUsd: 0, status: 'success', bible: { ...bible, id: 'mock-bible-b', title: 'Mocked Ember Bible' } },
    ]));
  }, { bible: INITIAL_PRESETS[0] });

  await page.goto('./');
  await page.locator('#btn-open-settings').click();
  await expect(page.getByRole('heading', { name: 'Provider Settings' })).toBeVisible();
  await expect(page.locator('#provider-key-openai')).toHaveValue('sk-mock-openai-key-1234567890');
  await page.getByRole('button', { name: 'Close settings' }).click();

  await page.getByRole('button', { name: /History & Compare \(2\)/ }).click();
  await expect(page.getByRole('heading', { name: 'Run history & comparison' })).toBeVisible();
  await expect(page.getByText('Mocked Aurora Bible').first()).toBeVisible();
  await expect(page.getByText('Mocked Ember Bible').first()).toBeVisible();
  await expect(page.getByText('Convergence & divergence audit')).toBeVisible();

  expect(providerRequests.every((url) => /googleapis|openai|anthropic/.test(url))).toBe(true);
});
