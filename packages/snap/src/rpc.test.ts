import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { QIE_RPC_URLS } from './config';
import { ethCalls } from './rpc';

const CALLS = [
  { to: '0x8777d01d509D0eA71FB38F88F79867da558d5018', data: '0xb1a84f20' },
  { to: '0xCFBcBCA93c607590b211c81C7DBcdbd7eD6CC6ED', data: '0xb1a84f21' },
] as const;

type Fetch = typeof globalThis.fetch;

const jsonResponse = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Awaited<
    ReturnType<Fetch>
  >;

const success = (id: number, result: string) => ({
  jsonrpc: '2.0',
  id,
  result,
});

describe('ethCalls', () => {
  const fetchMock = jest.fn<Fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    jest.spyOn(globalThis, 'fetch').mockImplementation(fetchMock);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends the calls as one batch to every endpoint', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([success(0, '0x1234'), success(1, '0x5678')]),
    );

    expect(await ethCalls(CALLS)).toStrictEqual(['0x1234', '0x5678']);
    expect(fetchMock.mock.calls.map(([url]) => url)).toStrictEqual([
      ...QIE_RPC_URLS,
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      QIE_RPC_URLS[0],
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(
          CALLS.map((call, id) => ({
            jsonrpc: '2.0',
            id,
            method: 'eth_call',
            params: [call, 'latest'],
          })),
        ),
      }),
    );
  });

  it('matches batch responses by ID', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([success(1, '0x5678'), success(0, '0x1234')]),
    );

    expect(await ethCalls(CALLS)).toStrictEqual(['0x1234', '0x5678']);
  });

  it('returns null for a call that reverts', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: 3,
            message: 'execution reverted: Metadata:domain expired',
          },
        },
        success(1, '0x5678'),
      ]),
    );

    expect(await ethCalls(CALLS)).toStrictEqual([null, '0x5678']);
  });

  it('uses the first endpoint to respond', async () => {
    let resolveSlow: (response: Awaited<ReturnType<Fetch>>) => void = () =>
      undefined;
    fetchMock
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSlow = resolve;
        }),
      )
      .mockResolvedValue(
        jsonResponse([success(0, '0xabcd'), success(1, '0xef01')]),
      );

    expect(await ethCalls(CALLS)).toStrictEqual(['0xabcd', '0xef01']);
    resolveSlow(jsonResponse([success(0, '0x1234'), success(1, '0x5678')]));
  });

  it('ignores endpoints that fail', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(jsonResponse({}, 502))
      .mockResolvedValueOnce(
        jsonResponse({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32000, message: 'header not found' },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse([success(0, '0xabcd'), success(1, '0xef01')]),
      );

    expect(await ethCalls(CALLS)).toStrictEqual(['0xabcd', '0xef01']);
  });

  it('rejects a batch with a missing response', async () => {
    fetchMock.mockResolvedValue(jsonResponse([success(0, '0x1234')]));

    await expect(ethCalls(CALLS)).rejects.toThrow(
      'All QIE RPC endpoints failed.',
    );
  });

  it('throws when every endpoint fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(ethCalls(CALLS)).rejects.toThrow(
      'All QIE RPC endpoints failed.',
    );
    expect(fetchMock).toHaveBeenCalledTimes(QIE_RPC_URLS.length);
  });
});
