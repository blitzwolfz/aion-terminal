declare module '@xterm/addon-webgl' {
  export class WebglAddon {
    constructor(preserveDrawingBuffer?: boolean);
    activate(terminal: unknown): void;
    onContextLoss(callback: (e: Event) => void): { dispose(): void };
    dispose(): void;
  }
}
