export type Portfolio = {
  /** unique 3-letter lowercase code */
  code: string;
  name: string;
  portfolioUrl: string;
};

export const portfolios = [
  {
    code: "tim",
    name: "Timothy Lum",
    portfolioUrl: "https://tclum.forpono.com",
  },
] as const;

/**
 * Exact-match lookup, generic over the registry: normalize (trim + lowercase)
 * and find by code. Nothing hardcodes a specific code — add a teammate to the
 * array and they resolve for free. `registry` is a parameter (defaulting to the
 * real `portfolios`) so the lookup can be exercised generically in tests.
 */
export function resolvePortfolio(
  input: string,
  registry: readonly Portfolio[] = portfolios,
): Portfolio | null {
  const code = input.trim().toLowerCase();
  return registry.find((entry) => entry.code === code) ?? null;
}
