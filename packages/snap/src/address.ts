import type { Hex } from '@metamask/utils';
import {
  getChecksumAddress,
  isStrictHexString,
  isValidHexAddress,
} from '@metamask/utils';
import { sha256 } from '@noble/hashes/sha256';
import { base58, bech32, bech32m, createBase58check } from '@scure/base';

export type AddressParser = (value: string) => string | null;

type BitcoinNetwork = {
  hrp: string;
  base58Versions: readonly number[];
};

export const BITCOIN_MAINNET: BitcoinNetwork = {
  hrp: 'bc',
  base58Versions: [0x00, 0x05],
};

export const BITCOIN_TESTNET: BitcoinNetwork = {
  hrp: 'tb',
  base58Versions: [0x6f, 0xc4],
};

const TRON_VERSION = 0x41;

const base58check = createBase58check(sha256);

/**
 * Parse an EVM address.
 *
 * @param value - The candidate address.
 * @returns The checksummed address, or `null` if invalid.
 */
export function parseEvmAddress(value: string): Hex | null {
  if (!isStrictHexString(value) || !isValidHexAddress(value)) {
    return null;
  }

  return getChecksumAddress(value);
}

/**
 * Parse a Solana address.
 *
 * @param value - The candidate address.
 * @returns The address, or `null` if it is not a base58-encoded 32-byte key.
 */
export function parseSolanaAddress(value: string): string | null {
  return tryDecode(() => base58.decode(value))?.length === 32 ? value : null;
}

/**
 * Parse a TRON address.
 *
 * @param value - The candidate address.
 * @returns The address, or `null` if invalid.
 */
export function parseTronAddress(value: string): string | null {
  const payload = tryDecode(() => base58check.decode(value));

  return payload?.length === 21 && payload[0] === TRON_VERSION ? value : null;
}

/**
 * Create a parser for Bitcoin addresses on the given network. Accepts SegWit
 * v0 (bech32), Taproot (bech32m), P2PKH and P2SH addresses.
 *
 * @param network - The Bitcoin network parameters.
 * @returns The address parser.
 */
export function createBitcoinAddressParser(
  network: BitcoinNetwork,
): AddressParser {
  return (value) => {
    if (value.toLowerCase().startsWith(`${network.hrp}1`)) {
      return isSegwitAddress(value, network.hrp) ? value.toLowerCase() : null;
    }

    const payload = tryDecode(() => base58check.decode(value));
    const version = payload?.[0];

    return payload?.length === 21 &&
      version !== undefined &&
      network.base58Versions.includes(version)
      ? value
      : null;
  };
}

/**
 * Check whether a value is a valid SegWit v0 or Taproot address.
 *
 * @param value - The candidate address.
 * @param hrp - The expected human-readable part.
 * @returns Whether the address is valid.
 */
function isSegwitAddress(value: string, hrp: string): boolean {
  const v0 = tryDecode(() => bech32.decode(value as `${string}1${string}`));
  if (v0?.prefix === hrp && v0.words[0] === 0) {
    const program = bech32.fromWords(v0.words.slice(1));
    return program.length === 20 || program.length === 32;
  }

  const v1 = tryDecode(() => bech32m.decode(value as `${string}1${string}`));
  if (v1?.prefix === hrp && v1.words[0] === 1) {
    return bech32m.fromWords(v1.words.slice(1)).length === 32;
  }

  return false;
}

/**
 * Run a decoder, treating any thrown error as an invalid input.
 *
 * @param decode - The decoder to run.
 * @returns The decoded value, or `null` if decoding failed.
 */
function tryDecode<Result>(decode: () => Result): Result | null {
  try {
    return decode();
  } catch {
    return null;
  }
}
