# QIE ID Snap site

Install page for the QIE ID Snap, built with [Gatsby](https://www.gatsbyjs.com/).

## Scripts

- `yarn start`: serve the site at http://localhost:8000.
- `yarn build`: build the site into `public/`.

## Environment

`SNAP_ORIGIN` sets the Snap the site installs. It defaults to the locally
served Snap, `local:http://localhost:8080`. To build against the published
Snap, copy `.env.production.dist` to `.env.production`.
