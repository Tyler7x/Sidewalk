export type ResetLinkContext = { token: string };

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseResetLink(url: string): ResetLinkContext | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const tokenParamMatch = trimmed.match(/[?&]token=([^&#]+)/i);
  if (tokenParamMatch?.[1]) {
    return { token: safeDecode(tokenParamMatch[1]) };
  }

  const pathMatch = trimmed.match(/\/reset-password\/([^/?#]+)/i);
  if (pathMatch?.[1]) {
    return { token: safeDecode(pathMatch[1]) };
  }

  return null;
}

