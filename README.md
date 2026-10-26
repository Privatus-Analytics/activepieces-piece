# Privatus Analytics piece for Activepieces

**You want to know how your website is doing, without opening another dashboard.** This
[Activepieces](https://www.activepieces.com) piece brings the numbers of
[Privatus Analytics](https://privatusanalytics.com), cookieless website analytics, into your flows:
send a weekly visitor report to Slack, add yesterday's top pages to a sheet, or start a flow when a
goal is completed or a wave of visitors arrives.

- `privatus-analytics/` is the piece, exactly as it sits in
  `packages/pieces/community/privatus-analytics` of the Activepieces repository.
  Its own [README](privatus-analytics/README.md) lists the triggers and actions.
- `privatus-analytics/test/` holds the unit tests (run with Vitest, no network needed).
- `tests/live-test.js` runs every action, the dropdowns, the token check and both triggers against
  the live API.

## Install

The piece is on npm as
[`@privatus-analytics/piece-privatus-analytics`](https://www.npmjs.com/package/@privatus-analytics/piece-privatus-analytics).
To add it to your own (self-hosted) Activepieces:

1. Log in as a platform admin.
2. Open **Platform Admin**, then **Catalogue**, then **Pieces**. (In older versions this is
   **Settings**, then **My Pieces**.)
3. Click **Install Piece** and set **Package Type** to **NPM Registry**.
4. For **Piece Name**, type `@privatus-analytics/piece-privatus-analytics`. For **Piece Version**,
   type the latest version from the npm page.
5. Click **Install**. Look for **Privatus Analytics** in the flow builder.

Your server must be Activepieces 0.36.1 or newer and able to reach `registry.npmjs.org`.

## Build and test

The piece builds inside the Activepieces monorepo:

```sh
git clone https://github.com/Privatus-Analytics/activepieces.git
cd activepieces
git checkout npm-privatus-analytics-piece
bun install --ignore-scripts
npx turbo run build --filter=@privatus-analytics/piece-privatus-analytics
npx turbo run lint --filter=@privatus-analytics/piece-privatus-analytics
npx turbo run test --filter=@privatus-analytics/piece-privatus-analytics
PRIVATUS_API_TOKEN=pat_... node /path/to/this/repo/tests/live-test.js \
  packages/pieces/community/privatus-analytics/dist/src/index.js
```

## Release

Bump `version` in `privatus-analytics/package.json` on the `npm-privatus-analytics-piece` branch of
https://github.com/Privatus-Analytics/activepieces, then run the **Release Activepieces piece** workflow
in https://github.com/Privatus-Analytics/js (Actions tab, Run workflow).

## License

MIT
