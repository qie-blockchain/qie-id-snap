import { decodeSingle, encode } from '@metamask/abi-utils';
import type { Hex } from '@metamask/utils';
import { bytesToHex, concatBytes, hexToBytes } from '@metamask/utils';

import { ethCall } from './rpc';

export const RESOLVE_METADATA_SELECTOR = '0xb1a84f20'; // resolveMetadata(string,string)

/**
 * Read a QIE ID record, such as the address stored for a network.
 *
 * @param contract - The metadata contract to query.
 * @param domain - The normalized QIE ID, e.g. `alice.qie`.
 * @param key - The record key, e.g. `evm` or `solana`.
 * @returns The record value, or `null` if the contract does not hold the ID.
 */
export async function getRecord(
  contract: Hex,
  domain: string,
  key: string,
): Promise<string | null> {
  const data = concatBytes([
    hexToBytes(RESOLVE_METADATA_SELECTOR),
    encode(['string', 'string'], [domain, key]),
  ]);

  const result = await ethCall(contract, bytesToHex(data));

  if (!result || result === '0x') {
    return null;
  }

  return decodeSingle('string', result) || null;
}
