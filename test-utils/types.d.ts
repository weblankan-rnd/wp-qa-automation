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


