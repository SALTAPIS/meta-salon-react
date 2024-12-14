declare module 'masonry-layout' {
  interface MasonryOptions {
    itemSelector?: string;
    columnWidth?: number | string;
    gutter?: number;
    percentPosition?: boolean;
    stamp?: string;
    fitWidth?: boolean;
    originLeft?: boolean;
    originTop?: boolean;
    containerStyle?: object;
    transitionDuration?: string;
    stagger?: number;
    resize?: boolean;
    initLayout?: boolean;
  }

  class Masonry {
    constructor(element: Element | string, options?: MasonryOptions);
    layout(): void;
    reloadItems(): void;
    destroy(): void;
    getItemElements(): Element[];
    once(eventName: string, callback: () => void): void;
    off(eventName: string, callback: () => void): void;
    on(eventName: string, callback: () => void): void;
  }

  export = Masonry;
} 