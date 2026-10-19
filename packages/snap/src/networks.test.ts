import { describe, expect, it } from '@jest/globals';
import type { CaipChainId } from '@metamask/utils';

import { EVM_NETWORK, getNetwork } from './networks';

describe('getNetwork', () => {
  it.each([
    'eip155:1',
    'eip155:1990',
    'eip155:137',
    'eip155:11155111',
  ] as const)('maps %p to the EVM network', (chainId) => {
    expect(getNetwork(chainId)).toBe(EVM_NETWORK);
  });

  it.each<[CaipChainId, string]>([
    ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', 'solana'],
    ['bip122:000000000019d6689c085ae165831e93', 'bitcoin'],
    ['bip122:00000000da84f2bafbbc53dee25a72ae', 'bitcoin'],
    ['tron:728126428', 'tron'],
  ])('maps %p to the %p record', (chainId, key) => {
    expect(getNetwork(chainId)?.recordKeys).toStrictEqual([key]);
  });

  it.each(['cosmos:cosmoshub-4', 'bip122:regtest', 'solana:unknown'] as const)(
    'returns null for unsupported chain %p',
    (chainId) => {
      expect(getNetwork(chainId)).toBeNull();
    },
  );
});
