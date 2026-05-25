/**
 * Type declarations for untyped dependencies.
 */

declare module 'nspell' {
  interface NSpell {
    correct(word: string): boolean;
    suggest(word: string): string[];
  }
  function nspell(dictionary: unknown): NSpell;
  export default nspell;
}

declare module 'pixelmatch' {
  function pixelmatch(
    img1: Buffer,
    img2: Buffer,
    output: Buffer,
    width: number,
    height: number,
    options?: { threshold?: number }
  ): number;
  export default pixelmatch;
}

declare module 'pngjs' {
  import { Transform } from 'stream';
  export class PNG extends Transform {
    static sync: {
      read(buffer: Buffer): PNG;
      write(png: PNG, options?: { deflateLevel?: number; deflateStrategy?: number }): Buffer;
    };
    data: Buffer;
    width: number;
    height: number;
    constructor(options?: { width?: number; height?: number; fill?: boolean });
  }
}
