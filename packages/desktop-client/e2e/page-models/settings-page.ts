import { type Locator, type Page } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly settings: Locator;
  readonly exportDataButton: Locator;
  readonly advancedSettingsButton: Locator;
  readonly experimentalSettingsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.settings = page.getByTestId('settings');
    this.exportDataButton = this.settings.getByRole('button', {
      name: 'Export data',
    });
    this.advancedSettingsButton =
      this.settings.getByTestId('advanced-settings');
    this.experimentalSettingsButton = this.settings.getByTestId(
      'experimental-settings',
    );
  }

  async waitFor(...options: Parameters<Locator['waitFor']>) {
    await this.settings.waitFor(...options);
  }

  async exportData() {
    await this.exportDataButton.click();
  }

  async enableExperimentalFeature(featureName: string) {
    if (await this.advancedSettingsButton.isVisible()) {
      await this.advancedSettingsButton.click();
    }

    if (await this.experimentalSettingsButton.isVisible()) {
      await this.experimentalSettingsButton.click();
    }

    const featureCheckbox = this.page.getByRole('checkbox', {
      name: featureName,
    });
    if (!(await featureCheckbox.isChecked())) {
      await featureCheckbox.click();
    }
  }
}
