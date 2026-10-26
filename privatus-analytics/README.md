# Privatus Analytics

**You want to know how your website is doing, without opening another dashboard.** Most analytics
tools are slow to click through, and many use cookies. In many countries that means a cookie pop-up
(the box that asks visitors to accept cookies), and lots of people click "reject", so you never see
them.

**[Privatus Analytics](https://privatusanalytics.com) counts the visitors to your website without
cookies.** It never stores IP addresses and keeps bots out of your numbers. This piece brings those
numbers into your flows.

**So your numbers come to you.** Send a weekly visitor report to Slack, add yesterday's top pages to
a Google Sheet, or get a message the moment a goal is completed or a big wave of visitors arrives.

## Install the piece

This piece is on npm as
[`@privatus-analytics/piece-privatus-analytics`](https://www.npmjs.com/package/@privatus-analytics/piece-privatus-analytics).
It is not in the built-in list of pieces, so you add it to your own Activepieces by its npm name.

1. Log in to your Activepieces as a platform admin.
2. Open **Platform Admin**, then **Catalogue**, then **Pieces**. (In older versions this is
   **Settings**, then **My Pieces**.)
3. Click **Install Piece**.
4. Set **Package Type** to **NPM Registry**.
5. For **Piece Name**, type `@privatus-analytics/piece-privatus-analytics`.
6. For **Piece Version**, type the latest version shown on the npm page, for example `0.0.1`.
7. Click **Install**. The piece now shows up in the flow builder as **Privatus Analytics**.

Your Activepieces server needs to reach `registry.npmjs.org` to download it, and must be version
0.36.1 or newer. To update later, install the new version the same way.

## Triggers

- **New Goal Conversion:** starts when a goal is completed again, like a sign-up or a purchase.
  Checked every few minutes. Pick one goal or watch them all.
- **Traffic Spike:** starts once when the number of people on the site right now reaches a number
  you pick, and again only after it drops below.

## Actions

- **Get Stats:** visitors, visits, pageviews, bounce rate and visit time for a period, with the
  change against the period before.
- **Get Visitors Over Time:** the same numbers for each hour, day, week or month.
- **Get Top Pages, Referrers and More:** the top pages, entry and exit pages, referrers, channels,
  campaigns, countries, languages, devices, browsers, custom events or goals.
- **Get Live Visitors:** how many people are on the site right now and what they look at.
- **List Goal Conversions:** each goal with its conversions, conversion rate and change.
- **List Sites:** your websites with their IDs and domains.
- **Custom API Call:** any other request to the [Privatus Analytics API](https://privatusanalytics.com/docs/api).

Every action only reads. None of them changes or deletes anything.

## Connect your account

1. Log in to Privatus Analytics (the Free plan has 10,000 events a month and 3 sites, with no card).
2. Open **Workspace settings**, then **API tokens**, and create a token. It starts with `pat_`.
3. Paste it into the **API Token** field of the connection.

The piece talks only to `https://privatusanalytics.com`.
