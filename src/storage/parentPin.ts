import type { ParentPin } from '../models'

function bytes(hex: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(hex.match(/.{2}/g) ?? [], (part) => parseInt(part, 16))
}

function hex(value: ArrayBuffer | Uint8Array): string {
  return Array.from(new Uint8Array(value), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function validatePin(pin: string) {
  if (!/^[0-9]{4,6}$/.test(pin)) throw new Error('Bitte gib einen PIN aus 4 bis 6 Ziffern ein.')
}

async function derive(pin: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits'])
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: bytes(salt), iterations: 100_000, hash: 'SHA-256' }, key, 256))
}

export async function createParentPin(pin: string): Promise<ParentPin> {
  validatePin(pin)
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)))
  return { version: 1, salt, hash: await derive(pin, salt) }
}

export async function verifyParentPin(pin: string, stored: ParentPin): Promise<void> {
  validatePin(pin)
  if (stored.version !== 1) throw new Error('Diese Eltern-PIN-Version wird nicht unterstützt.')
  if (await derive(pin, stored.salt) !== stored.hash) throw new Error('Der Eltern-PIN stimmt nicht. Es wurden keine Sterne vergeben.')
}
