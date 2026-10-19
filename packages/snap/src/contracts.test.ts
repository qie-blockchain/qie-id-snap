import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { bytesToHex, stringToBytes } from '@metamask/utils';
import { keccak_256 as keccak256 } from '@noble/hashes/sha3';

import { getRecord, RESOLVE_METADATA_SELECTOR } from './contracts';
import { ethCall } from './rpc';

jest.mock('./rpc');

const ethCallMock = jest.mocked(ethCall);

const CONTRACT = '0x8777d01d509D0eA71FB38F88F79867da558d5018';

// ABI encoding of the string "etherium.qie".
const ENCODED_STRING =
  '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c657468657269756d2e7169650000000000000000000000000000000000000000';

const selector = (signature: string) =>
  bytesToHex(keccak256(stringToBytes(signature)).slice(0, 4));

describe('RESOLVE_METADATA_SELECTOR', () => {
  it('matches the contract function signature', () => {
    expect(RESOLVE_METADATA_SELECTOR).toBe(
      selector('resolveMetadata(string,string)'),
    );
  });
});

describe('getRecord', () => {
  beforeEach(() => {
    ethCallMock.mockReset();
  });

  it('encodes the call and decodes the result', async () => {
    ethCallMock.mockResolvedValue(ENCODED_STRING);

    expect(await getRecord(CONTRACT, 'alice.qie', 'evm')).toBe('etherium.qie');
    expect(ethCallMock).toHaveBeenCalledWith(
      CONTRACT,
      '0xb1a84f20000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000009616c6963652e7169650000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000365766d0000000000000000000000000000000000000000000000000000000000',
    );
  });

  it.each([null, '0x'] as const)(
    'returns null when the call returns %p',
    async (result) => {
      ethCallMock.mockResolvedValue(result);

      expect(await getRecord(CONTRACT, 'alice.qie', 'evm')).toBeNull();
    },
  );

  it('returns null for an empty string', async () => {
    ethCallMock.mockResolvedValue(
      '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000',
    );

    expect(await getRecord(CONTRACT, 'alice.qie', 'evm')).toBeNull();
  });
});
