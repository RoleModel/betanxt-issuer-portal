/**
 * Deterministic seeding helpers for mock report generation.
 * Same input always produces the same pseudo-random sequence, so generated
 * reports are stable across downloads.
 */

/**
 * Hashes a string to an unsigned 32-bit integer (FNV-1a), suitable as a seed
 * for {@link createSeededRandom}.
 *
 * @param input - Seed string (e.g. a meeting or report identifier)
 * @returns Unsigned 32-bit hash of the input
 */
export function hashString(input: string): number {
  let hash = 2_166_136_261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

/**
 * Creates a mulberry32 pseudo-random generator. Successive calls yield a
 * repeatable sequence for a given seed.
 *
 * @param seed - 32-bit seed, typically from {@link hashString}
 * @returns A function producing values in `[0, 1)`, analogous to `Math.random`
 *
 * @example
 * const random = createSeededRandom(hashString('wen-annual-meeting-2025'))
 * const value = random() // stable across calls with the same seed
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d_2b_79_f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}
