# QIE ID Snap

A [MetaMask Snap](https://docs.metamask.io/snaps/) that resolves QIE IDs
(`alice.qie`) to the owner's address on the network the user is sending on.

| Package                          | Description                 |
| -------------------------------- | --------------------------- |
| [`packages/snap`](packages/snap) | The Snap, published to npm. |
| [`packages/site`](packages/site) | Install page for the Snap.  |

See [docs/implementation-plan.md](docs/implementation-plan.md) for the design
and release plan.

## Getting started

Requires Node.js 20 or later and [MetaMask Flask](https://metamask.io/flask/).

```shell
corepack enable
yarn install
yarn start
```

This serves the Snap at http://localhost:8080 and the install page at
http://localhost:8000.

## Scripts

| Command         | Description                                         |
| --------------- | --------------------------------------------------- |
| `yarn start`    | Serve the Snap and the site with live reload.       |
| `yarn build`    | Build both packages and update the manifest shasum. |
| `yarn test`     | Run the Snap tests. Build first.                    |
| `yarn lint`     | Run ESLint and Prettier checks.                     |
| `yarn lint:fix` | Fix lint and formatting issues.                     |

## Releasing

1. Update `version` in `packages/snap/package.json` and add a
   `CHANGELOG.md` entry.
2. Run `yarn build`. This syncs the manifest version and shasum.
3. Publish only the Snap package: `cd packages/snap && npm publish`.
4. Verify the published Snap on Flask with the
   [Snap Install Tester](https://montoya.github.io/snap-install-tester/).
5. Submit the version for allowlisting with the
   [Snaps Directory update form](https://go.metamask.io/snaps-directory-update-request).
   Users cannot install a version until it is allowlisted.

See [Publish a Snap](https://docs.metamask.io/snaps/how-to/publish-a-snap/) and
[Get allowlisted](https://docs.metamask.io/snaps/how-to/get-allowlisted/).

## Installing scripts

Install scripts are disabled by default. To allow one, run
`yarn allow-scripts auto` and enable it under `lavamoat.allowScripts` in
`package.json`. See [@lavamoat/allow-scripts](https://github.com/LavaMoat/LavaMoat/tree/main/packages/allow-scripts).
