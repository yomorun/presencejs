export class Logger {
  enabled: boolean = false;
  module: string = '';
  constructor({
    enabled = false,
    module = '',
  }: {
    enabled?: boolean;
    module?: string;
  }) {
    this.enabled = enabled;
    this.module = module;
  }

  log(...args: any) {
    if (this.enabled) {
      console.log(`[${this.module}]`, ...args);
      console.log('------------------')
    }
  }
}
