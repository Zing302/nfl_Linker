/**
 * webOS 5.x TVs (2020 models, e.g. OLED CX) run Chromium 68, which predates
 * Array.prototype.flat and flatMap (added in Chrome 69). esbuild transpiles
 * syntax but does not polyfill missing runtime APIs, so provide them here.
 * Imported first in main.tsx, before React or app code runs.
 */
const proto = Array.prototype as unknown as {
  flat?: (depth?: number) => unknown[];
  flatMap?: (fn: (v: unknown, i: number, a: unknown[]) => unknown, thisArg?: unknown) => unknown[];
};

if (!proto.flat) {
  proto.flat = function flat(this: unknown[], depth = 1): unknown[] {
    const flatten = (arr: unknown[], d: number): unknown[] =>
      d < 1
        ? arr.slice()
        : arr.reduce<unknown[]>(
            (acc, val) => acc.concat(Array.isArray(val) ? flatten(val, d - 1) : val),
            [],
          );
    return flatten(this, depth);
  };
}

if (!proto.flatMap) {
  proto.flatMap = function flatMap(
    this: unknown[],
    fn: (v: unknown, i: number, a: unknown[]) => unknown,
    thisArg?: unknown,
  ): unknown[] {
    return (this.map((v, i, a) => fn.call(thisArg, v, i, a)) as unknown[]).flat();
  };
}
