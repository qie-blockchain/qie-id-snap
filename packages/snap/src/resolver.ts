import { METADATA_CONTRACTS, TLD } from './config';
import { getRecords } from './contracts';
import type { Network } from './networks';

const DOMAIN_PATTERN = new RegExp(`^[a-z0-9-]+\\.${TLD}$`, 'u');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Normalize a QIE ID. QIE IDs are lowercase, and contract lookups are
 * case-sensitive.
 *
 * @param domain - The QIE ID as entered by the user.
 * @returns The normalized QIE ID, or `null` if it is not a valid QIE ID.
 */
export function normalizeDomain(domain: string): string | null {
  const normalized = domain.trim().toLowerCase();

  return DOMAIN_PATTERN.test(normalized) ? normalized : null;
}

/**
 * Resolve a QIE ID to its address on a network.
 *
 * @param domain - The normalized QIE ID.
 * @param network - The network to resolve for.
 * @returns The address, or `null` if none is set or it is invalid.
 */
export async function resolveDomain(
  domain: string,
  network: Network,
): Promise<string | null> {
  const records = await getRecords(
    domain,
    network.recordKeys.flatMap((key) =>
      METADATA_CONTRACTS.map((contract) => ({ contract, key })),
    ),
  );

  const record = records.find(
    (value) => value && value.toLowerCase() !== ZERO_ADDRESS,
  );

  return record ? network.parseAddress(record) : null;
}
