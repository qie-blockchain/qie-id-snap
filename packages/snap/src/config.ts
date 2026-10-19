import type { Hex } from '@metamask/utils';

export const PROTOCOL = 'QIE ID';

export const TLD = 'qie';

export const QIE_RPC_URLS = [
  'https://rpc1mainnet.qie.digital',
  'https://rpc2mainnet.qie.digital',
  'https://rpc3mainnet.qie.digital',
  'https://rpc4mainnet.qie.digital',
] as const;

export const RPC_TIMEOUT_MS = 3_000;

/**
 * QIE ID metadata contracts on QIE Mainnet, in lookup priority order:
 * free (wallet) IDs first, then premium (Hovr) IDs.
 */
export const METADATA_CONTRACTS: readonly Hex[] = [
  '0x8777d01d509D0eA71FB38F88F79867da558d5018',
  '0xCFBcBCA93c607590b211c81C7DBcdbd7eD6CC6ED',
];
