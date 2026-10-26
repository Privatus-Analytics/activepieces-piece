/*
 * Runs the built piece against the live Privatus Analytics API.
 *
 * Usage (from the activepieces fork, after the build):
 *   PRIVATUS_API_TOKEN=pat_... node <this file> packages/pieces/community/privatus-analytics/dist/src/index.js [site_id]
 * The token is read from the environment and never printed.
 */
const path = require('node:path');

const token = process.env.PRIVATUS_API_TOKEN || '';
const entry = path.resolve(process.argv[2]);
const siteArg = process.argv[3];
const { privatusAnalytics } = require(entry);

const auth = { type: 'SECRET_TEXT', secret_text: token };
let failures = 0;

function memoryStore() {
  const data = new Map();
  return {
    data,
    put: async (key, value) => (data.set(key, value), value),
    get: async (key) => (data.has(key) ? data.get(key) : null),
    delete: async (key) => void data.delete(key),
  };
}

function check(name, ok, detail) {
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `\n     ${detail}` : ''}`);
}

function short(value) {
  return JSON.stringify(value).slice(0, 260);
}

async function main() {
  const actions = privatusAnalytics.actions();
  const triggers = privatusAnalytics.triggers();
  console.log(`actions: ${Object.keys(actions).join(', ')}`);
  console.log(`triggers: ${Object.keys(triggers).join(', ')}`);

  const authProp = privatusAnalytics.auth;
  const good = await authProp.validate({ auth: token });
  check('auth validate accepts the token', good.valid === true);
  const bad = await authProp.validate({ auth: 'pat_invalid' });
  check('auth validate refuses a bad token', bad.valid === false, bad.error);

  const sitesOptions = await actions.get_stats.props.site_id.options({ auth }, {});
  check('site dropdown loads', sitesOptions.options.length > 0, `${sitesOptions.options.length} sites, first: ${short(sitesOptions.options[0])}`);
  const site = siteArg || sitesOptions.options.find((o) => /privatusanalytics\.com/.test(o.label))?.value || sitesOptions.options[0].value;

  const goalOptions = await triggers.new_goal_conversion.props.goal_id.options({ auth, site_id: site }, {});
  check('goal dropdown loads', goalOptions.options.length > 0, `${goalOptions.options.length} goals`);

  const run = async (name, propsValue, validate) => {
    try {
      const result = await actions[name].run({ auth, propsValue, store: memoryStore() });
      const problem = validate(result);
      check(`${name} ${short(propsValue)}`, !problem, problem || short(result));
    } catch (error) {
      check(`${name} ${short(propsValue)}`, false, String(error.message).slice(0, 300));
    }
  };

  await run('list_sites', {}, (r) => (Array.isArray(r) && r.length > 0 && r[0].site_id ? null : 'no sites'));
  await run('list_sites', { query: 'privatus' }, (r) => (r.every((s) => /privatus/i.test(`${s.domain} ${s.name}`)) ? null : 'search not applied'));
  await run('get_stats', { site_id: site, period: '7d', compare: 'previous_period' }, (r) => (typeof r.visitors === 'number' && 'visitors_change_percent' in r ? null : 'missing metrics'));
  await run('get_stats', { site_id: site, period: 'custom', date_from: '2026-10-01T00:00:00.000Z', date_to: '2026-10-07T00:00:00.000Z', compare: 'none' }, (r) => (r.date_from === '2026-10-01' && r.date_to === '2026-10-07' ? null : `dates ${r.date_from} ${r.date_to}`));
  await run('get_timeseries', { site_id: site, period: '7d', interval: 'day' }, (r) => (Array.isArray(r) && r.length >= 7 && r[0].date ? null : 'no rows'));
  for (const dimension of ['page', 'referrer', 'country', 'goal']) {
    await run('get_top_values', { site_id: site, dimension, period: '30d', limit: 3 }, (r) => (Array.isArray(r) && r.length > 0 && r[0].rank === 1 ? null : 'no rows'));
  }
  await run('get_live_visitors', { site_id: site, limit: 3 }, (r) => (typeof r.live_visitors === 'number' ? null : 'no live count'));
  await run('list_goals', { site_id: site, period: '30d' }, (r) => (Array.isArray(r) && r.length > 0 && 'conversions' in r[0] ? null : 'no goals'));

  // Error paths
  try {
    await actions.get_stats.run({ auth, propsValue: { site_id: 'pa_DOESNOTEXIST', period: '7d' } });
    check('unknown site fails', false, 'no error');
  } catch (error) {
    check('unknown site fails with a clear message', /404/.test(error.message), error.message);
  }
  try {
    await actions.get_stats.run({ auth, propsValue: { site_id: site, period: 'custom' } });
    check('custom period without dates fails', false, 'no error');
  } catch (error) {
    check('custom period without dates fails', true, error.message);
  }

  // Triggers: enable, run, test, disable with an in-memory store
  const goalTrigger = triggers.new_goal_conversion;
  const store = memoryStore();
  const ctx = { auth, propsValue: { site_id: site }, store };
  await goalTrigger.onEnable(ctx);
  const snapshot = [...store.data.values()][0];
  check('new_goal_conversion onEnable stores today\'s counts', snapshot && snapshot.date && Object.keys(snapshot.completions).length > 0, short(snapshot));
  const firstRun = await goalTrigger.run(ctx);
  check('new_goal_conversion run right after enable', Array.isArray(firstRun), `${firstRun.length} event(s)`);
  // Pretend one goal had 1 fewer completion at the last check
  const goalId = Object.keys(snapshot.completions).find((id) => snapshot.completions[id] > 0);
  if (goalId) {
    const stored = [...store.data.values()][0];
    stored.completions[goalId] -= 1;
    const events = await goalTrigger.run(ctx);
    const event = events.find((e) => e.goal_id === goalId);
    check('new_goal_conversion emits when a count grows', event && event.new_completions >= 1, short(event));
  }
  // Pretend the last check was yesterday, before that day's last completions:
  // the next run must fetch yesterday's final counts and send the difference.
  const today = [...store.data.values()][0].date;
  const yesterdayDate = new Date(`${today}T00:00:00Z`);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);
  {
    const dayFinals = await actions.list_goals.run({
      auth,
      propsValue: { site_id: site, period: 'custom', date_from: `${yesterday}T00:00:00.000Z`, date_to: `${yesterday}T00:00:00.000Z` },
    });
    const dayGoal = dayFinals.find((g) => g.completions > 0);
    const key = [...store.data.keys()][0];
    const completions = Object.fromEntries(dayFinals.map((g) => [g.goal_id, g.completions]));
    const conversions = Object.fromEntries(dayFinals.map((g) => [g.goal_id, g.conversions]));
    if (dayGoal) {
      completions[dayGoal.goal_id] -= 1;
      store.data.set(key, { date: yesterday, completions, conversions });
      const events = await goalTrigger.run(ctx);
      const late = events.filter((e) => e.date === yesterday);
      check('new_goal_conversion sends the last completions of the previous day', late.length === 1 && late[0].goal_id === dayGoal.goal_id && late[0].new_completions === 1, short(late));
      check('new_goal_conversion moves the stored day to today', [...store.data.values()][0].date === today, [...store.data.values()][0].date);
    } else {
      // No completions yesterday: nothing may be sent for that day.
      store.data.set(key, { date: yesterday, completions, conversions });
      const events = await goalTrigger.run(ctx);
      check('new_goal_conversion sends nothing for a quiet previous day', events.every((e) => e.date === today), short(events));
    }
  }
  const goalSamples = await goalTrigger.test(ctx);
  check('new_goal_conversion test returns samples', Array.isArray(goalSamples), `${goalSamples.length} sample(s)`);
  await goalTrigger.onDisable(ctx);
  check('new_goal_conversion onDisable clears the store', store.data.size === 0);

  const spike = triggers.traffic_spike;
  const spikeStore = memoryStore();
  const spikeCtx = { auth, propsValue: { site_id: site, threshold: 0 }, store: spikeStore };
  await spike.onEnable(spikeCtx);
  const fired = await spike.run(spikeCtx);
  check('traffic_spike fires when the threshold is reached', fired.length === 1, short(fired[0]));
  const again = await spike.run(spikeCtx);
  check('traffic_spike does not fire twice in a row', again.length === 0);
  const high = await spike.run({ ...spikeCtx, propsValue: { site_id: site, threshold: 1000000 } });
  check('traffic_spike resets below the threshold', high.length === 0 && (await spikeStore.get('privatus_was_above_threshold')) === false);
  const spikeTest = await spike.test(spikeCtx);
  check('traffic_spike test returns a sample', spikeTest.length === 1);
  await spike.onDisable(spikeCtx);

  console.log(`\n${failures} failure(s)`);
  process.exit(failures ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
