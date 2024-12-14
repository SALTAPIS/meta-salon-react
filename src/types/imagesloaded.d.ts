declare module 'imagesloaded' {
  interface ImagesLoadedOptions {
    background?: boolean;
  }

  interface ImagesLoaded {
    images: Array<{ img: HTMLImageElement }>;
    on(event: 'always' | 'done' | 'fail' | 'progress', fn: (instance?: ImagesLoaded) => void): void;
    off(event: string, fn?: Function): void;
  }

  function imagesLoaded(
    element: Element | NodeList | Array<Element> | string,
    options?: ImagesLoadedOptions,
    callback?: (instance?: ImagesLoaded) => void
  ): ImagesLoaded;

  export = imagesLoaded;
} 