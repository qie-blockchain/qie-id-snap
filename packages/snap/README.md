# QIE ID Snap

Send to QIE IDs in MetaMask. Type a QIE ID such as `alice.qie` in the send
field and MetaMask shows the address that the ID owner has set for the network
you are sending on.

## Supported networks

| Network                            | QIE ID record     |
| ---------------------------------- | ----------------- |
| All EVM networks (`eip155:*`)      | `evm`, then `qie` |
| Bitcoin mainnet and testnets       | `bitcoin`         |
| Solana mainnet, devnet and testnet | `solana`          |
| TRON mainnet, Nile and Shasta      | `tron`            |

Resolved addresses are checked against the target network's address format
before they are shown. The Snap does not look up QIE IDs for addresses.

## Permissions

| Permission                 | Why                                           |
| -------------------------- | --------------------------------------------- |
| `endowment:name-lookup`    | Resolve `.qie` names in the send flow.        |
| `endowment:network-access` | Read QIE ID records from the QIE Mainnet RPC. |

## Privacy

The Snap reads public records from the QIE ID contracts on QIE Mainnet through
the QIE RPC service (`rpc*mainnet.qie.digital`). Each lookup sends the QIE ID
being resolved to that service. The Snap
stores nothing and sends no other data.

## Development

```shell
yarn install
yarn start       # serve the Snap at http://localhost:8080
yarn build       # bundle and update the manifest shasum
yarn test        # run the tests (requires a build)
```

Install [MetaMask Flask](https://metamask.io/flask/) to test a locally served
Snap.

## Support

Report issues at https://github.com/qie-blockchain/qie-id-snap/issues.
