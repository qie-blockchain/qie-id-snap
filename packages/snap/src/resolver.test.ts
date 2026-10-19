import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { METADATA_CONTRACTS } from './config';
import { getRecord } from './contracts';
import type { Network } from './networks';
import { EVM_NETWORK, getNetwork } from './networks';
import { normalizeDomain, resolveDomain } from './resolver';

jest.mock('./contracts');

const getRecordMock = jest.mocked(getRecord);

const [WALLET_CONTRACT, HOVR_CONTRACT] = METADATA_CONTRACTS;
const ADDRESS = '0xE63A7e2C9B068056916d02807A976d42d460C92f';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Mock the metadata contracts with the given records.
 *
 * @param records - Record values keyed by `contract:key`.
 */
function mockRecords(records: Record<string, string>) {
  getRecordMock.mockImplementation(
    async (contract, _domain, key) => records[`${contract}:${key}`] ?? null,
  );
}

describe('normalizeDomain', () => {
  it.each([
    ['alice.qie', 'alice.qie'],
    ['  Alice.QIE ', 'alice.qie'],
    ['my-name42.qie', 'my-name42.qie'],
  ])('normalizes %p to %p', (input, expected) => {
    expect(normalizeDomain(input)).toBe(expected);
  });

  it.each(['alice', 'alice.eth', '.qie', 'al ice.qie', 'sub.alice.qie'])(
    'rejects %p',
    (input) => {
      expect(normalizeDomain(input)).toBeNull();
    },
  );
});

describe('resolveDomain', () => {
  beforeEach(() => {
    getRecordMock.mockReset();
  });

  it('prefers the wallet contract over the Hovr contract', async () => {
    mockRecords({
      [`${WALLET_CONTRACT}:evm`]: ADDRESS.toLowerCase(),
      [`${HOVR_CONTRACT}:evm`]: '0x1111111111111111111111111111111111111111',
    });

    expect(await resolveDomain('alice.qie', EVM_NETWORK)).toBe(ADDRESS);
  });

  it('falls back to the Hovr contract', async () => {
    mockRecords({ [`${HOVR_CONTRACT}:evm`]: ADDRESS });

    expect(await resolveDomain('alice.qie', EVM_NETWORK)).toBe(ADDRESS);
  });

  it('falls back to the legacy qie record for EVM chains', async () => {
    mockRecords({ [`${HOVR_CONTRACT}:qie`]: ADDRESS });

    expect(await resolveDomain('alice.qie', EVM_NETWORK)).toBe(ADDRESS);
  });

  it('reads the record for the requested network', async () => {
    const network = getNetwork('tron:728126428') as Network;
    mockRecords({
      [`${HOVR_CONTRACT}:evm`]: ADDRESS,
      [`${HOVR_CONTRACT}:tron`]: 'TUNGxJisrxezhZaHcJCQn4mmnaE6vZnQ6g',
    });

    expect(await resolveDomain('alice.qie', network)).toBe(
      'TUNGxJisrxezhZaHcJCQn4mmnaE6vZnQ6g',
    );
  });

  it('treats the zero address as unset', async () => {
    mockRecords({
      [`${WALLET_CONTRACT}:evm`]: ZERO_ADDRESS,
      [`${HOVR_CONTRACT}:evm`]: ADDRESS,
    });

    expect(await resolveDomain('alice.qie', EVM_NETWORK)).toBe(ADDRESS);
  });

  it('returns null when no record is set', async () => {
    mockRecords({});

    expect(await resolveDomain('alice.qie', EVM_NETWORK)).toBeNull();
  });

  it('returns null when the record is not valid for the network', async () => {
    mockRecords({
      [`${HOVR_CONTRACT}:evm`]: 'bc1q862t69r2c8ffmpdnq80y2h0wfrkrdw9hjcw5cs',
    });

    expect(await resolveDomain('alice.qie', EVM_NETWORK)).toBeNull();
  });
});
