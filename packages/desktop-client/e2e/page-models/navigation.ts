// White-label version: Budget-specific navigation methods removed
// This file is kept for potential future generic e2e tests
import { type Page } from '@playwright/test';

import { SettingsPage } from './settings-page';

export class Navigation {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goToSettingsPage() {
    const settingsLink = this.page.getByRole('link', { name: 'Settings' });

    // Expand the "more" menu only if it is not already expanded
    if (!(await settingsLink.isVisible())) {
      await this.page.getByRole('button', { name: 'More' }).click();
    }

    await settingsLink.click();

    return new SettingsPage(this.page);
  }

  async clickOnNoServer() {
    await this.page.getByRole('button', { name: 'No server' }).click();
  }
}
