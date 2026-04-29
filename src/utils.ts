/**
 * Safely stringifies a value, falling back to `toString()` if `JSON.stringify` fails.
 * Useful for values that may contain circular references or non-serializable types.
 *
 * @param x - The value to stringify (could be anything, including recursive objects).
 * @returns The JSON string representation, or the `toString()` result on failure.
 */
export function saferStringify(x: unknown): string {
  try {
    return JSON.stringify(x);
  } catch (e) {
    return "" + x;
  }
}
