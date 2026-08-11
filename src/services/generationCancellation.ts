export class GenerationCancellationRegistry {
  private readonly controllers = new Map<string, AbortController>();

  start(key: string): AbortController {
    this.cancel(key);
    const controller = new AbortController();
    this.controllers.set(key, controller);
    return controller;
  }

  cancel(key: string): boolean {
    const controller = this.controllers.get(key);
    if (!controller) return false;
    controller.abort();
    this.controllers.delete(key);
    return true;
  }

  finish(key: string, controller: AbortController): void {
    if (this.controllers.get(key) === controller) this.controllers.delete(key);
  }

  cancelAll(): void {
    this.controllers.forEach((controller) => controller.abort());
    this.controllers.clear();
  }

  isActive(key: string): boolean {
    return this.controllers.has(key);
  }
}
