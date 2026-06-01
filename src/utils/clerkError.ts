export function extractClerkError(
  err: unknown,
  fallback = 'Something went wrong. Try again.'
): string {
  const maybe = err as { errors?: { message?: string; longMessage?: string }[]; message?: string };
  return maybe.errors?.[0]?.longMessage ?? maybe.errors?.[0]?.message ?? maybe.message ?? fallback;
}
