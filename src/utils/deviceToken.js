const toHex = (bytes) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

// Crée un jeton secret + son empreinte (seule l'empreinte est stockée en base)
export async function generateDeviceToken() {
  const token = toHex(crypto.getRandomValues(new Uint8Array(24)));
  const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return { token, tokenHash: toHex(new Uint8Array(hashBuf)) };
}