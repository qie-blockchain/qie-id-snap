import type { OnNameLookupHandler } from '@metamask/snaps-sdk';

import { PROTOCOL } from './config';
import { getNetwork } from './networks';
import { normalizeDomain, resolveDomain } from './resolver';

/**
 * Resolve a QIE ID to its owner's address on the requested chain. Address to
 * QIE ID lookups are not supported.
 *
 * @param request - The lookup request.
 * @param request.chainId - The CAIP-2 chain ID of the transaction's network.
 * @param request.domain - The domain to resolve, if resolving a domain.
 * @returns The resolution, or `null` if there is none.
 * @see https://docs.metamask.io/snaps/reference/entry-points/#onnamelookup
 */
export const onNameLookup: OnNameLookupHandler = async ({
  chainId,
  domain,
}) => {
  const network = getNetwork(chainId);
  const domainName = domain && normalizeDomain(domain);
  if (!network || !domainName) {
    return null;
  }

  try {
    const resolvedAddress = await resolveDomain(domainName, network);

    return resolvedAddress
      ? {
          resolvedAddresses: [
            { resolvedAddress, protocol: PROTOCOL, domainName },
          ],
        }
      : null;
  } catch {
    // An unreachable RPC is reported to MetaMask as "no resolution".
    return null;
  }
};
