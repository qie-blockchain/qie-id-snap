import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';

import { onNameLookup } from '.';
import { resolveDomain } from './resolver';

jest.mock('./resolver', () => ({
  ...jest.requireActual<object>('./resolver'),
  resolveDomain: jest.fn(),
}));

const resolveDomainMock = jest.mocked(resolveDomain);

const ADDRESS = '0xE63A7e2C9B068056916d02807A976d42d460C92f';

describe('onNameLookup', () => {
  beforeEach(() => {
    resolveDomainMock.mockReset();
  });

  it('resolves a QIE ID to an address', async () => {
    resolveDomainMock.mockResolvedValue(ADDRESS);

    expect(
      await onNameLookup({ chainId: 'eip155:1', domain: 'Alice.qie' }),
    ).toStrictEqual({
      resolvedAddresses: [
        {
          resolvedAddress: ADDRESS,
          protocol: 'QIE ID',
          domainName: 'alice.qie',
        },
      ],
    });
  });

  it('returns null when the QIE ID has no address', async () => {
    resolveDomainMock.mockResolvedValue(null);

    expect(
      await onNameLookup({ chainId: 'eip155:1', domain: 'alice.qie' }),
    ).toBeNull();
  });

  it('returns null when resolution fails', async () => {
    resolveDomainMock.mockRejectedValue(
      new Error('All QIE RPC endpoints failed.'),
    );

    expect(
      await onNameLookup({ chainId: 'eip155:1', domain: 'alice.qie' }),
    ).toBeNull();
  });

  it('does not resolve addresses to QIE IDs', async () => {
    expect(
      await onNameLookup({ chainId: 'eip155:1990', address: ADDRESS }),
    ).toBeNull();
    expect(resolveDomainMock).not.toHaveBeenCalled();
  });
});

describe('installed snap', () => {
  it.each([
    { chainId: 'eip155:1', domain: 'alice.eth' },
    { chainId: 'cosmos:cosmoshub-4', domain: 'alice.qie' },
    {
      chainId: 'eip155:1',
      address: '0xE63A7e2C9B068056916d02807A976d42d460C92f',
    },
  ] as const)(
    'returns null without a network request for %p',
    async (request) => {
      const snap = await installSnap();

      expect(await snap.onNameLookup(request)).toRespondWith(null);
    },
  );
});
