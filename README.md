# Privatus Analytics piece for Activepieces

**You want to know how your website is doing, without opening another dashboard.** This
[Activepieces](https://www.activepieces.com) piece brings the numbers of
[Privatus Analytics](https://privatusanalytics.com), cookieless website analytics, into your flows:
send a weekly visitor report to Slack, add yesterday's top pages to a sheet, or start a flow when a
goal is completed or a wave of visitors arrives.

- `privatus-analytics/` is the piece, exactly as it sits in
  `packages/pieces/community/privatus-analytics` of the Activepieces repository.
  Its own [README](privatus-analytics/README.md) lists the triggers and actions.
- `tests/live-test.js` runs every action, the dropdowns, the token check and both triggers against
  the live API.

## Build and test

The piece builds inside the Activepieces monorepo:

```sh
git clone https://github.com/Privatus-Analytics/activepieces.git
cd activepieces
git checkout feat/privatus-analytics-piece
bun install --ignore-scripts
npx turbo run build --filter=@activepieces/piece-privatus-analytics
npx turbo run lint --filter=@activepieces/piece-privatus-analytics
PRIVATUS_API_TOKEN=pat_... node /path/to/this/repo/tests/live-test.js \
  packages/pieces/community/privatus-analytics/dist/src/index.js
```

## License

MIT
