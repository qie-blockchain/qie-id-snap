import type { Hex } from '@metamask/utils';
import {
  isJsonRpcFailure,
  isJsonRpcSuccess,
  isStrictHexString,
} from '@metamask/utils';

import { QIE_RPC_URLS, RPC_TIMEOUT_MS } from './config';

const EXECUTION_REVERTED_CODE = 3;

/**
 * Execute an `eth_call` on QIE Mainnet, falling back through each RPC endpoint.
 *
 * @param to - The contract address.
 * @param data - The ABI-encoded call data.
 * @returns The return data, or `null` if the call reverted.
 * @throws If no endpoint returns a valid response.
 */
export async function ethCall(to: Hex, data: Hex): Promise<Hex | null> {
  for (const url of QIE_RPC_URLS) {
    try {
      return await request(url, to, data);
    } catch {
      continue;
    }
  }

  throw new Error('All QIE RPC endpoints failed.');
}

/**
 * Send a single `eth_call` request to an RPC endpoint.
 *
 * @param url - The RPC endpoint.
 * @param to - The contract address.
 * @param data - The ABI-encoded call data.
 * @returns The return data, or `null` if the call reverted.
 * @throws If the endpoint is unreachable or returns an unexpected response.
 */
async function request(url: string, to: Hex, data: Hex): Promise<Hex | null> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_call',
      params: [{ to, data }, 'latest'],
    }),
    signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`RPC request failed with status ${response.status}.`);
  }

  const body: unknown = await response.json();

  if (isJsonRpcFailure(body) && body.error.code === EXECUTION_REVERTED_CODE) {
    return null;
  }

  if (!isJsonRpcSuccess(body) || !isStrictHexString(body.result)) {
    throw new Error('Invalid RPC response.');
  }

  return body.result;
}
