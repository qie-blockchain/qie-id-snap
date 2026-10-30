# QIE ID Snap: User Guide

The QIE ID Snap lets you send crypto to a QIE ID, such as `alice.qie`, instead of a long wallet address. Type the QIE ID in the recipient field of MetaMask's send screen, and MetaMask shows the address the ID owner has set for the network you are sending on.

> **Never share your Secret Recovery Phrase or private keys.** The QIE ID team will never ask for them, by email, Discord, GitHub or anywhere else. Anyone who asks is a scammer.

## Contents

- [Getting started](#getting-started)
- [Supported networks](#supported-networks)
- [Troubleshooting](#troubleshooting)
- [Safety tips](#safety-tips)
- [Privacy](#privacy)
- [Updating and removing the Snap](#updating-and-removing-the-snap)
- [Getting help](#getting-help)

## Getting started

1. Install the QIE ID Snap from the [MetaMask Snaps Directory](https://snaps.metamask.io/).
2. In MetaMask, select the network you want to send on.
3. Click **Send** and type a QIE ID, such as `alice.qie`, in the recipient field.
4. MetaMask shows the resolved address. Check it, then continue as with any other transfer.

## Supported networks

A QIE ID can hold a different address for each type of network. The Snap picks the address that matches the network you are sending on.

| You are sending on                                                             | Address the Snap uses    |
| ------------------------------------------------------------------------------ | ------------------------ |
| Any EVM network (Ethereum, QIE, BNB Chain, Polygon, Base, Arbitrum and others) | The ID's EVM address     |
| Bitcoin mainnet and testnets                                                   | The ID's Bitcoin address |
| Solana mainnet, devnet and testnet                                             | The ID's Solana address  |
| TRON mainnet, Nile and Shasta                                                  | The ID's TRON address    |

All EVM networks share one address, because an EVM address is the same on every EVM chain.

QIE IDs are always looked up on QIE Mainnet, whichever network you are sending on. You don't need QIE Mainnet added to MetaMask, and the lookup costs no gas.

## Troubleshooting

### Nothing appears when I type a QIE ID

Check each of these:

- **The ID is spelled correctly** and ends in `.qie`. QIE IDs contain only letters, numbers and hyphens. Capital letters are fine; `Alice.QIE` is treated as `alice.qie`.
- **The ID is registered.** An unregistered ID resolves to nothing.
- **The owner has set an address for this network.** For example, if the owner has set only an EVM address, the ID resolves on Ethereum but not on Solana. Ask the owner to add an address for the network you want.
- **The network is supported.** See [Supported networks](#supported-networks).
- **The Snap is installed and enabled.** See [Updating and removing the Snap](#updating-and-removing-the-snap).

### The ID works on one network but not another

The owner has set an address for some networks but not others, or the address they set isn't valid for that network. The Snap hides an address that doesn't match the network's format, so you can't send Bitcoin to a Solana address by mistake. Ask the owner to set an address for the network you are using.

### Lookups fail now and then

The Snap reads QIE IDs from the QIE Mainnet RPC servers. If none of them responds within a few seconds, the lookup returns nothing. Check your internet connection, wait a moment, and type the ID again.

### I typed an address, but MetaMask doesn't show its QIE ID

The Snap only looks up names, not addresses: it turns `alice.qie` into an address, but it can't find which QIE ID belongs to an address.

### The address changed since I last sent to this ID

A QIE ID owner can change their addresses at any time, and the Snap always shows the current one. If you didn't expect the change, confirm the new address with the owner before sending.

## Safety tips

- **Check the resolved address before you confirm,** especially for large amounts. A typo in the ID can resolve to someone else's address.
- **Watch for look-alike IDs** such as `alice-.qie` or `a1ice.qie`.
- **Transfers can't be reversed.** If you're unsure, send a small test amount first.
- **The Snap can't move your funds.** It only looks up addresses. It can't see your accounts, sign transactions or access your keys.

## Privacy

Each lookup sends the QIE ID you typed to the QIE RPC service (`rpc1mainnet.qie.digital` to `rpc4mainnet.qie.digital`) to read its public records. The Snap stores nothing and sends no other data: no wallet addresses, balances or transaction details.

## Updating and removing the Snap

MetaMask lists installed Snaps under **Settings > Snaps**. From there you can view the QIE ID Snap's permissions, disable it, or remove it.

## Getting help

- Report a problem or ask a question at [GitHub Issues](https://github.com/qie-blockchain/qie-id-snap/issues). Say which network you were sending on and which QIE ID you typed.
- GitHub issues are public. **Never post your Secret Recovery Phrase, private keys or other personal information.**
- Beware of anyone who contacts you privately offering support. Official replies come only on the GitHub issue itself.
