import type { Hex } from '@metamask/utils';
import {
  isJsonRpcFailure,
  isJsonRpcSuccess,
  isStrictHexString,
} from '@metamask/utils';

import { QIE_RPC_URLS, RPC_TIMEOUT_MS } from './config';

const EXECUTION_REVERTED_CODE = 3;

export type Call = {
  to: Hex;
  data: Hex;
};

/**
 * Execute `eth_call`s on QIE Mainnet as one JSON-RPC batch. The batch is sent
 * to every RPC endpoint at once, and the first valid response wins.
 *
 * @param calls - The calls to execute.
 * @returns The return data of each call, in order, or `null` for a call that
 * reverted.
 * @throws If no endpoint returns a valid response.
 */
export async function ethCalls(
  calls: readonly Call[],
): Promise<(Hex | null)[]> {
  return new Promise((resolve, reject) => {
    Promise.all(
      QIE_RPC_URLS.map(async (url) =>
        request(url, calls).then(resolve, () => undefined),
      ),
    )
      .then(() => reject(new Error('All QIE RPC endpoints failed.')))
      .catch(reject);
  });
}

/**
 * Send a batch of `eth_call` requests to an RPC endpoint.
 *
 * @param url - The RPC endpoint.
 * @param calls - The calls to execute.
 * @returns The return data of each call, in order, or `null` for a call that
 * reverted.
 * @throws If the endpoint is unreachable or returns an unexpected response.
 */
async function request(
  url: string,
  calls: readonly Call[],
): Promise<(Hex | null)[]> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      calls.map((call, id) => ({
        jsonrpc: '2.0',
        id,
        method: 'eth_call',
        params: [call, 'latest'],
      })),
    ),
    signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`RPC request failed with status ${response.status}.`);
  }

  const body: unknown = await response.json();

  if (!Array.isArray(body)) {
    throw new Error('Invalid RPC response.');
  }

  // Batch responses may arrive in any order, so match them by ID.
  return calls.map((_call, id) => {
    const item: unknown = body.find(
      (entry: { id?: unknown } | null) => entry?.id === id,
    );

    if (isJsonRpcFailure(item) && item.error.code === EXECUTION_REVERTED_CODE) {
      return null;
    }

    if (!isJsonRpcSuccess(item) || !isStrictHexString(item.result)) {
      throw new Error('Invalid RPC response.');
    }

    return item.result;
  });
}
