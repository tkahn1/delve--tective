// extension/src/storage/stats.ts
var TEMPLATE_IDS = [
  "siteList.listed",
  "siteList.builder",
  "copy.sameArticle",
  "copy.sameTitle",
  "text.page",
  "text.chunk"
];
var WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var pad = (n) => String(n).padStart(2, "0");
function dayKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseKey(k) {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}
function startOfWeek(d) {
  const dow = (d.getDay() + 6) % 7;
  return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -dow);
}
var queue = Promise.resolve();
function sumDays(stats, from, to) {
  const fromKey = from ? dayKey(from) : "";
  const toKey = dayKey(to);
  return Object.entries(stats.days).filter(([k]) => k >= fromKey && k <= toKey).map(([, v]) => v);
}
function summarize(stats, range, now = /* @__PURE__ */ new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeek = startOfWeek(today);
  let from;
  let daily;
  const dimmedOn = (d) => stats.days[dayKey(d)]?.dimmed ?? 0;
  const weekBuckets = (start) => {
    const out = [];
    for (let w = start; w <= thisWeek; w = addDays(w, 7)) {
      let v = 0;
      for (let i = 0; i < 7; i++) v += dimmedOn(addDays(w, i));
      out.push({ label: `${MONTHS[w.getMonth()]} ${w.getDate()}`, value: v });
    }
    return out;
  };
  if (range === "week") {
    from = thisWeek;
    daily = WEEKDAYS.map((label, i) => ({ label, value: dimmedOn(addDays(thisWeek, i)) }));
  } else if (range === "month") {
    from = addDays(today, -29);
    daily = weekBuckets(startOfWeek(from));
  } else {
    from = null;
    const keys = Object.keys(stats.days).sort();
    const first = keys.length ? parseKey(keys[0]) : today;
    let start = startOfWeek(first);
    const minStart = addDays(thisWeek, -21);
    if (start > minStart) start = minStart;
    daily = weekBuckets(start);
  }
  const days = sumDays(stats, from, range === "week" ? addDays(thisWeek, 6) : today);
  const totals = { dimmed: 0, pagesHigh: 0, paragraphs: 0, pagesFlagged: 0 };
  const reasonCounts = {};
  const domains = {};
  for (const d of days) {
    totals.dimmed += d.dimmed;
    totals.pagesHigh += d.pagesHigh;
    totals.paragraphs += d.paragraphs;
    totals.pagesFlagged += d.pagesFlagged;
    for (const [t, n] of Object.entries(d.reasons)) reasonCounts[t] = (reasonCounts[t] ?? 0) + n;
    for (const [dom, ds] of Object.entries(d.domains)) {
      const acc = domains[dom] ??= { count: 0, reasons: {} };
      acc.count += ds.count;
      for (const [t, n] of Object.entries(ds.reasons)) acc.reasons[t] = (acc.reasons[t] ?? 0) + n;
    }
  }
  const topDomains = Object.entries(domains).sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0])).slice(0, 4).map(([domain, ds]) => {
    const top = Object.entries(ds.reasons).sort((a, b) => b[1] - a[1])[0];
    return { domain, count: ds.count, reason: top?.[0] ?? "siteList.listed" };
  });
  const reasons = TEMPLATE_IDS.map((templateId) => ({ templateId, count: reasonCounts[templateId] ?? 0 })).filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
  return { totals, daily, topDomains, reasons };
}
export {
  summarize
};
