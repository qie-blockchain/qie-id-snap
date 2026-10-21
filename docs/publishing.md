# Publishing the QIE ID Snap

This guide takes the Snap from source to installable in regular MetaMask. It
has three stages:

1. Publish the package to npm.
2. Get the published version allowlisted by MetaMask.
3. Repeat both for every update.

MetaMask Flask can install any npm Snap right after stage 1. Regular MetaMask
only installs it after stage 2: the Snap uses `endowment:network-access`, which
is a protected permission, so it must be allowlisted.

Source: [Publish a Snap](https://docs.metamask.io/snaps/how-to/publish-a-snap/)
and [Get allowlisted](https://docs.metamask.io/snaps/how-to/get-allowlisted/).
Check both pages before each release, because MetaMask changes the process from
time to time.

## 1. Before the first release

These only need to be set up once, but check them again if anything changes.

- **Public source.** The GitHub repository in `repository.url`
  (`qie-blockchain/qie-id-snap`) must be public. MetaMask requires users to be
  able to read the source.
- **npm access.** You need an npm account with publish rights to the
  `@qie-blockchain` scope.
- **Manifest metadata** (`packages/snap/snap.manifest.json`):
  - `proposedName` is a human-readable name (`QIE ID`). It must not contain
    "MetaMask", "Meta", "Mask" or "Snap".
  - `source.location.npm.packageName` matches `name` in
    `packages/snap/package.json`.
  - `repository.url` matches `package.json`.
- **Icon.** `packages/snap/images/icon.svg` must be a valid SVG. MetaMask crops
  it to a circle, so keep the logo inside the circle. A transparent background
  is only allowed if the icon is clearly visible on light and dark themes.
- **No leftovers.** No `console` calls, TODO comments, or unused permissions or
  methods in `packages/snap/src`.
- **Security scan.** Run [Snapper](https://github.com/sayfer-io/Snapper) on
  the Snap and fix everything it reports.
- **Audit.** Not required. MetaMask only requires an audit for Snaps that use
  key-management methods (`snap_getBip32Entropy`, `snap_getBip32PublicKey`,
  `snap_getBip44Entropy`, `snap_getEntropy`, `snap_manageAccounts`). This Snap
  uses only `endowment:name-lookup` and `endowment:network-access`. If either
  of those methods is ever added, an audit from an
  [approved auditor](https://github.com/MetaMask/snaps/wiki/Audits) becomes
  required.

## 2. Publish to npm

1. Set the new `version` in `packages/snap/package.json`. Use
   [semantic versioning](https://semver.org/).
2. Add an entry for the version to `packages/snap/CHANGELOG.md`.
3. If permissions changed, update the permission and privacy tables in
   `packages/snap/README.md`.
4. Build, lint and test from the repository root:

   ```shell
   yarn build
   yarn lint
   yarn test
   ```

   `yarn build` copies the version into `snap.manifest.json` and updates
   `source.shasum`. MetaMask rejects the Snap if the version or shasum in the
   manifest doesn't match the published bundle.

5. Commit the changes, including the regenerated `snap.manifest.json`, and get
   them merged to `main`. CI fails if the build leaves the working tree dirty.
6. Tag the release (the changelog links point to these tags):

   ```shell
   git tag v<version>
   git push origin v<version>
   ```

7. Publish the Snap package only. Never publish the root or `packages/site`.

   ```shell
   cd packages/snap
   npm publish --access public
   ```

   `prepublishOnly` runs `mm-snap manifest` to check the manifest again before
   upload.

npm never lets you reuse a version number, and you can only unpublish within
72 hours. Treat every publish as permanent.

### Pre-releases for testers

To share a build with testers before release, publish a pre-release version
(for example `0.2.0-beta.0`) under the `next` tag so it doesn't become
`latest`:

```shell
npm publish --tag next --access public
```

Testers install it in MetaMask Flask from any `https://` page's browser
console:

```js
await ethereum.request({
  method: 'wallet_requestSnaps',
  params: { 'npm:@qie-blockchain/qie-id-snap': { version: '0.2.0-beta.0' } },
});
```

Don't submit pre-releases for allowlisting.

### Verify the published package

1. Install it in MetaMask Flask, either with the console snippet above or with
   the [Snap Install Tester](https://montoya.github.io/snaps-install-tester/)
   and the Snap ID `npm:@qie-blockchain/qie-id-snap`.
2. Run the manual checks in [Manual test checklist](#manual-test-checklist).

## 3. Get allowlisted (first release)

1. Prepare the submission:
   - Short description (one or two sentences) and long description (plain
     text, no HTML). The `description` in `package.json` and the README are a
     good starting point.
   - Screenshots of a resolved QIE ID in the send flow.
   - A short demo video: install the Snap, type a QIE ID in the send field,
     show the resolved address.
   - Support details: an escalation contact (kept confidential by MetaMask)
     and at least one public support channel, such as the GitHub issues page.
     See [User Support Information](https://github.com/MetaMask/snaps/wiki/User-Support-Information).
2. Fill out the
   [MetaMask Snaps Directory Information form](https://go.metamask.io/snaps-directory-request):
   - Snap name: `QIE ID` (must match `proposedName`).
   - Builder name and URL.
   - Website URL, for example the hosted install page from `packages/site`
     (optional).
   - GitHub repository: `https://github.com/qie-blockchain/qie-id-snap`.
   - npm package: `https://www.npmjs.com/package/@qie-blockchain/qie-id-snap`.
   - Version to allowlist: the version you just published.
   - Auditor and audit report: leave blank (no audit required, see above).
   - Support details, images and demo video from step 1.
3. Wait for review. Every Snap needs at least two approvals from the MetaMask
   team, who check that it works and is well designed. MetaMask doesn't publish
   a timeline. Respond to any questions they send.
4. Once approved, the Snap is listed in the
   [Snaps Directory](https://snaps.metamask.io) and installs in regular
   MetaMask.

### Install page

The install page in `packages/site` is optional. To host it against the
published Snap:

```shell
cp packages/site/.env.production.dist packages/site/.env.production
yarn workspace site build
```

After allowlisting, it works with regular MetaMask, not just Flask.

## 4. Release an update

The allowlist is pinned to exact versions. Users can't install or update to a
new version until MetaMask allowlists it.

1. Publish the new version to npm as in [Publish to npm](#2-publish-to-npm).
2. Fill out the
   [Snaps Directory Information Update form](https://go.metamask.io/snaps-directory-update-request)
   with the new version. Fields you aren't changing can be left blank or set
   to "N/A".
3. State whether earlier versions should be removed from the allowlist.
4. If the update adds a key-management method, include a third-party audit.
   Ask MetaMask whether any other change requires a review beyond the normal
   one.

## Manual test checklist

Run these in MetaMask Flask with the version being released, using QIE IDs
whose records you know.

| Case                                                 | Expected                    |
| ---------------------------------------------------- | --------------------------- |
| Registered name on an EVM account                    | Checksummed `0x…` address   |
| Registered name on Bitcoin, Solana and TRON accounts | That chain's record         |
| Unregistered name, for example `doesnotexist123.qie` | No address resolution found |
| Registered name on a network with no matching record | No address resolution found |
| Mixed-case name, for example `Alice.qie`             | Resolves like `alice.qie`   |
| Uppercase TLD, for example `alice.QIE`               | Not resolved (see note)     |

Note: MetaMask appears to match the TLD case-sensitively, so it doesn't send `.QIE`
names to the Snap. This is expected.
