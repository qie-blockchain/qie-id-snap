import { decodeSingle, encode } from '@metamask/abi-utils';
import type { Hex } from '@metamask/utils';
import { bytesToHex, concatBytes, hexToBytes } from '@metamask/utils';

import { ethCalls } from './rpc';

export const RESOLVE_METADATA_SELECTOR = '0xb1a84f20'; // resolveMetadata(string,string)

export type RecordQuery = {
  contract: Hex;
  key: string;
};

/**
 * Read QIE ID records, such as the address stored for a network, in one RPC
 * request.
 *
 * @param domain - The normalized QIE ID, e.g. `alice.qie`.
 * @param queries - The contract and record key of each record, e.g. `evm` or
 * `solana`.
 * @returns Each record value, in order, or `null` if the contract does not
 * hold the ID or the record is empty.
 */
export async function getRecords(
  domain: string,
  queries: readonly RecordQuery[],
): Promise<(string | null)[]> {
  const results = await ethCalls(
    queries.map(({ contract, key }) => ({
      to: contract,
      data: bytesToHex(
        concatBytes([
          hexToBytes(RESOLVE_METADATA_SELECTOR),
          encode(['string', 'string'], [domain, key]),
        ]),
      ),
    })),
  );

  return results.map((result) =>
    result && result !== '0x' ? decodeSingle('string', result) || null : null,
  );
}
