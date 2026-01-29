import { type Locator, type Page } from '@playwright/test';

export class ConfigurationPage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole('heading');
  }

  async clickOnNoServer() {
    await this.page.getByRole('button', { name: "Don't use a server" }).click();
  }

  async importFile(file: string) {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.page.getByRole('button', { name: 'Import my budget' }).click();
    await this.page.getByRole('button', { name: 'Select file...' }).click();

    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(file);
  }
}
