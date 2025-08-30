// Ambient module stubs for test-only dependencies
// These are used by Playwright/E2E tests and not required for app runtime.

declare module 'sharp' {
  const sharp: any;
  export default sharp;
}

declare module 'pngjs' {
  export const PNG: any;
}

declare module 'pixelmatch' {
  const pixelmatch: any;
  export default pixelmatch;
}

declare module '@axe-core/playwright' {
  export class AxeBuilder {
    constructor(page?: any);
    withTags(tags: string[]): this;
    analyze(): Promise<any>;
  }
}
