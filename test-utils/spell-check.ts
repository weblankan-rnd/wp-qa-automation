/**
 * Spell checker utility using nspell + dictionary-en.
 *
 * Provides real dictionary-based spell checking instead of regex matching,
 * which catches actual spelling errors without maintaining a typos list.
 *
 * Falls back to regex-based checking if nspell is unavailable
 * (dictionary-en is ESM-only — handled via dynamic import()).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let spell: any = undefined as any;

async function getSpellChecker(): Promise<any> {
  if (spell !== undefined) return spell;
  try {
    const nspell = (await import('nspell')).default;
    const en = await import('dictionary-en');
    spell = nspell(en.default || en);
  } catch (err) {
    console.warn(`[spell-check] Dictionary failed to load — falling back to regex: ${err}`);
    spell = null;
  }
  return spell;
}

// Track initialization state to avoid repeated failed attempts
let initPromise: Promise<any> | null = null;
function ensureSpell(): Promise<any> {
  if (!initPromise) initPromise = getSpellChecker();
  return initPromise;
}

/**
 * Check text for spelling errors using the real dictionary.
 * Returns an array of error descriptions.
 */
export async function checkSpelling(text: string): Promise<string[]> {
  const errors: string[] = [];
  const checker = await ensureSpell();

  if (checker) {
    // Use nspell for real dictionary checking
    const words = text.match(/[a-zA-ZÀ-ÿ]+(?:[''][a-zA-Z]+)?/g) || [];
    const seen = new Set<string>();

    for (const word of words) {
      const lower = word.toLowerCase();
      if (lower.length <= 2) continue; // skip very short words
      if (seen.has(lower)) continue;
      seen.add(lower);

      // Skip known WordPress/CMS terms, brand names, etc.
      if (SKIP_WORDS.has(lower)) continue;

      if (!checker.correct(word)) {
        const suggestions = checker.suggest(word).slice(0, 3);
        const hint =
          suggestions.length > 0 ? ` (suggestions: ${suggestions.join(', ')})` : '';
        errors.push(`"${word}" — possible misspelling${hint}`);
      }
    }
  } else {
    // Fallback: regex-based common typos
    const commonTypos: { wrong: RegExp; fix: string }[] = [
      { wrong: /\b(recieve)\b/gi, fix: 'receive' },
      { wrong: /\b(adress)\b/gi, fix: 'address' },
      { wrong: /\b(accomodation)\b/gi, fix: 'accommodation' },
      { wrong: /\b(acheive)\b/gi, fix: 'achieve' },
      { wrong: /\b(buisness)\b/gi, fix: 'business' },
      { wrong: /\b(definately)\b/gi, fix: 'definitely' },
      { wrong: /\b(goverment)\b/gi, fix: 'government' },
      { wrong: /\b(occured)\b/gi, fix: 'occurred' },
      { wrong: /\b(pharamceutical)\b/gi, fix: 'pharmaceutical' },
      { wrong: /\b(seperate)\b/gi, fix: 'separate' },
      { wrong: /\b(untill)\b/gi, fix: 'until' },
      { wrong: /\b(wich)\b/gi, fix: 'which' },
      { wrong: /\b(comming)\b/gi, fix: 'coming' },
      { wrong: /\b(teh)\b/gi, fix: 'the' },
      { wrong: /\b(follwoing)\b/gi, fix: 'following' },
      { wrong: /\b(coloum)\b/gi, fix: 'column' },
      { wrong: /\b(artical)\b/gi, fix: 'article' },
      { wrong: /\b(carrer)\b/gi, fix: 'career' },
      { wrong: /\b(extention)\b/gi, fix: 'extension' },
      { wrong: /\b(infromation)\b/gi, fix: 'information' },
    ];
    for (const { wrong, fix } of commonTypos) {
      const match = text.match(wrong);
      if (match) errors.push(`"${match[1]}" — should be "${fix}"`);
    }
  }

  // Also check for double spaces
  const doubleSpace = text.match(/\w\s{2,}\w/g);
  if (doubleSpace) {
    errors.push(`Double spaces found: ${doubleSpace.length} occurrence(s)`);
  }

  return errors;
}

/** Words to skip in spell checking (WordPress terms, domain-specific, brand names) */
const SKIP_WORDS = new Set([
  // WordPress-related
  'wordpress',
  'woocommerce',
  'elementor',
  'divi',
  'beaver',
  'acf',
  'yoast',
  'rankmath',
  'wpml',
  'polylang',
  'litespeed',
  'wpengine',
  // Industry / marketing terms
  'dmc', 'dmcs',
  'seo', 'sem', 'smm',
  'ppc', 'roi',
  'serps', 'serp',
  'scrollers', 'scroller',
  'corporates', 'corporate',
  'scalable',
  'optimisation', 'optimise', 'optimising',
  'cannabis',
  'cbd',
  'thc',
  'hemp',
  'terpenes',
  'cannabinoid',
  'cannabinoids',
  'cannabidiol',
  'tetrahydrocannabinol',
  // Brand / location names
  'ceylon',
  'sri',
  'lanka',
  'colombo',
  'kandy',
  'galle',
  'jaffna',
  'nugegoda', 'gangodawila', 'mawatha', 'pathirage',
  'weblankan',
  'gammaaextracts',
  // Common web terms
  'href',
  'src',
  'alt',
  'meta',
  'charset',
  'utf',
  'viewport',
  'http',
  'https',
  'www',
  'com',
  'org',
  'ltd',
  'pvt',
  // Abbreviations
  'tel',
  'mailto',
  'noopener',
  'noreferrer',
]);

/**
 * Strip HTML tags to get plain text.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
