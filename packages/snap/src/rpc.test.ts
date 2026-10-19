import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { QIE_RPC_URLS } from './config';
import { ethCall } from './rpc';

const TO = '0x8777d01d509D0eA71FB38F88F79867da558d5018';
const DATA = '0xb1a84f20';

type Fetch = typeof globalThis.fetch;

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Awaited<
    ReturnType<Fetch>
  >;

describe('ethCall', () => {
  const fetchMock = jest.fn<Fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends an eth_call and returns the result', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ jsonrpc: '2.0', id: 1, result: '0x1234' }),
    );

    expect(await ethCall(TO, DATA)).toBe('0x1234');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      QIE_RPC_URLS[0],
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{ to: TO, data: DATA }, 'latest'],
        }),
      }),
    );
  });

  it('returns null when the call reverts', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: 3,
          message: 'execution reverted: Metadata:domain expired',
        },
      }),
    );

    expect(await ethCall(TO, DATA)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to the next endpoint on failure', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse({}, 502))
      .mockResolvedValueOnce(
        jsonResponse({
          jsonrpc: '2.0',
          id: 1,
          error: { code: -32000, message: 'header not found' },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ jsonrpc: '2.0', id: 1, result: '0xabcd' }),
      );

    expect(await ethCall(TO, DATA)).toBe('0xabcd');
    expect(fetchMock.mock.calls.map(([url]) => url)).toStrictEqual([
      ...QIE_RPC_URLS,
    ]);
  });

  it('throws when every endpoint fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(ethCall(TO, DATA)).rejects.toThrow(
      'All QIE RPC endpoints failed.',
    );
    expect(fetchMock).toHaveBeenCalledTimes(QIE_RPC_URLS.length);
  });
});
