import crypto from 'node:crypto';
import fs from 'node:fs';

export function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

export function normalizeArtifactBytes(buffer) {
  let bytes = buffer;
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    bytes = bytes.subarray(3);
  }
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  return Buffer.from(text.replaceAll('\r\n', '\n'), 'utf8');
}

export function hashArtifact(filePath) {
  return sha256(normalizeArtifactBytes(fs.readFileSync(filePath)));
}

export function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function hashCanonicalJson(value) {
  return sha256(Buffer.from(stableStringify(value), 'utf8'));
}
