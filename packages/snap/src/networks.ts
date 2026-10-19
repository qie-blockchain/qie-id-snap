import type { CaipChainId } from '@metamask/utils';
import { KnownCaipNamespace } from '@metamask/utils';

import type { AddressParser } from './address';
import {
  BITCOIN_MAINNET,
  BITCOIN_TESTNET,
  createBitcoinAddressParser,
  parseEvmAddress,
  parseSolanaAddress,
  parseTronAddress,
} from './address';

export type Network = {
  /** QIE ID record keys holding the address, in priority order. */
  recordKeys: readonly string[];
  parseAddress: AddressParser;
};

/** All EVM chains share one record. `qie` is a legacy key for the same address. */
export const EVM_NETWORK: Network = {
  recordKeys: ['evm', 'qie'],
  parseAddress: parseEvmAddress,
};

const SOLANA_NETWORK: Network = {
  recordKeys: ['solana'],
  parseAddress: parseSolanaAddress,
};

const TRON_NETWORK: Network = {
  recordKeys: ['tron'],
  parseAddress: parseTronAddress,
};

const BITCOIN_MAINNET_NETWORK: Network = {
  recordKeys: ['bitcoin'],
  parseAddress: createBitcoinAddressParser(BITCOIN_MAINNET),
};

const BITCOIN_TESTNET_NETWORK: Network = {
  recordKeys: ['bitcoin'],
  parseAddress: createBitcoinAddressParser(BITCOIN_TESTNET),
};

const NON_EVM_NETWORKS: Partial<Record<CaipChainId, Network>> = {
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': SOLANA_NETWORK,
  'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1': SOLANA_NETWORK,
  'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z': SOLANA_NETWORK,
  'bip122:000000000019d6689c085ae165831e93': BITCOIN_MAINNET_NETWORK,
  'bip122:000000000933ea01ad0ee984209779ba': BITCOIN_TESTNET_NETWORK,
  'bip122:00000000da84f2bafbbc53dee25a72ae': BITCOIN_TESTNET_NETWORK,
  'bip122:00000008819873e925422c1ff0f99f7c': BITCOIN_TESTNET_NETWORK,
  'tron:728126428': TRON_NETWORK,
  'tron:3448148188': TRON_NETWORK,
  'tron:2494104990': TRON_NETWORK,
};

/**
 * Get the QIE ID network for a chain.
 *
 * @param chainId - The CAIP-2 chain ID.
 * @returns The network, or `null` if QIE IDs do not support the chain.
 */
export function getNetwork(chainId: CaipChainId): Network | null {
  if (chainId.startsWith(`${KnownCaipNamespace.Eip155}:`)) {
    return EVM_NETWORK;
  }

  return NON_EVM_NETWORKS[chainId] ?? null;
}
