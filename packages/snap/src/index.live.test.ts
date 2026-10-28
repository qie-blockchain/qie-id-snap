/* eslint jest/no-standalone-expect: ['error', { additionalTestBlockFunctions: ['itLive'] }] */
import { describe, expect, it } from '@jest/globals';
import { installSnap } from '@metamask/snaps-jest';

import { PROTOCOL } from './config';

// Runs the built Snap against QIE Mainnet. Skipped unless QIE_LIVE=1, since it
// depends on the network and on a QIE ID that is registered on-chain.
// eslint-disable-next-line n/no-process-env
const { QIE_LIVE, QIE_LIVE_DOMAIN, QIE_LIVE_ADDRESS } = process.env;

const itLive = QIE_LIVE === '1' ? it : it.skip;
const DOMAIN = QIE_LIVE_DOMAIN ?? 'anish.qie';
// Pin the exact address with QIE_LIVE_ADDRESS; otherwise any EVM address.
const ADDRESS =
  QIE_LIVE_ADDRESS ?? expect.stringMatching(/^0x[0-9a-fA-F]{40}$/u);

const TIMEOUT = 30_000;

describe('installed snap (live QIE Mainnet)', () => {
  itLive(
    `resolves ${DOMAIN} to an EVM address`,
    async () => {
      const snap = await installSnap();

      const response = await snap.onNameLookup({
        chainId: 'eip155:1',
        domain: DOMAIN,
      });

      expect(response).toRespondWith({
        resolvedAddresses: [
          {
            resolvedAddress: ADDRESS,
            protocol: PROTOCOL,
            domainName: DOMAIN,
          },
        ],
      });
    },
    TIMEOUT,
  );

  itLive(
    'returns null for an unregistered QIE ID',
    async () => {
      const snap = await installSnap();

      expect(
        await snap.onNameLookup({
          chainId: 'eip155:1',
          domain: 'doesnotexist-snap-live-test.qie',
        }),
      ).toRespondWith(null);
    },
    TIMEOUT,
  );
});
