import { describe, expect, it } from '@jest/globals';

import {
  BITCOIN_MAINNET,
  BITCOIN_TESTNET,
  createBitcoinAddressParser,
  parseEvmAddress,
  parseSolanaAddress,
  parseTronAddress,
} from './address';

describe('parseEvmAddress', () => {
  it('returns the checksummed address', () => {
    expect(parseEvmAddress('0xe63a7e2c9b068056916d02807a976d42d460c92f')).toBe(
      '0xE63A7e2C9B068056916d02807A976d42d460C92f',
    );
  });

  it.each([
    '',
    'e63a7e2c9b068056916d02807a976d42d460c92f',
    '0xe63a7e2c9b068056916d02807a976d42d460c9',
    '0xE63A7e2C9B068056916d02807A976d42d460C92F',
    'bc1q862t69r2c8ffmpdnq80y2h0wfrkrdw9hjcw5cs',
  ])('rejects %p', (value) => {
    expect(parseEvmAddress(value)).toBeNull();
  });
});

describe('parseSolanaAddress', () => {
  it('accepts a 32-byte base58 key', () => {
    const address = 'So11111111111111111111111111111111111111112';
    expect(parseSolanaAddress(address)).toBe(address);
  });

  it.each(['', '0xe63a7e2c9b068056916d02807a976d42d460c92f', 'So1111111O'])(
    'rejects %p',
    (value) => {
      expect(parseSolanaAddress(value)).toBeNull();
    },
  );
});

describe('parseTronAddress', () => {
  it('accepts a base58check address', () => {
    const address = 'TUNGxJisrxezhZaHcJCQn4mmnaE6vZnQ6g';
    expect(parseTronAddress(address)).toBe(address);
  });

  it.each([
    '',
    'TUNGxJisrxezhZaHcJCQn4mmnaE6vZnQ6h',
    '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
  ])('rejects %p', (value) => {
    expect(parseTronAddress(value)).toBeNull();
  });
});

describe('createBitcoinAddressParser', () => {
  const parseMainnet = createBitcoinAddressParser(BITCOIN_MAINNET);
  const parseTestnet = createBitcoinAddressParser(BITCOIN_TESTNET);

  it.each([
    'bc1q862t69r2c8ffmpdnq80y2h0wfrkrdw9hjcw5cs',
    'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297',
    '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',
  ])('accepts mainnet address %p', (address) => {
    expect(parseMainnet(address)).toBe(address);
  });

  it('normalizes bech32 addresses to lowercase', () => {
    expect(parseMainnet('BC1Q862T69R2C8FFMPDNQ80Y2H0WFRKRDW9HJCW5CS')).toBe(
      'bc1q862t69r2c8ffmpdnq80y2h0wfrkrdw9hjcw5cs',
    );
  });

  it.each([
    'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
    'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn',
  ])('accepts testnet address %p', (address) => {
    expect(parseTestnet(address)).toBe(address);
    expect(parseMainnet(address)).toBeNull();
  });

  it.each([
    '',
    'bc1q862t69r2c8ffmpdnq80y2h0wfrkrdw9hjcw5cx',
    'bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297'.replace(
      'p',
      'q',
    ),
    'TUNGxJisrxezhZaHcJCQn4mmnaE6vZnQ6g',
  ])('rejects %p', (value) => {
    expect(parseMainnet(value)).toBeNull();
  });
});
