// Fictional development data matching extension/src/storage/stats.ts: Stats -> DayStats.
// Never use this as fallback data in the installed extension.
export const previewDate = new Date(2026, 10, 14, 12);
export const sampleStats = { days: {} };
const ids = ['siteList.listed', 'siteList.builder', 'copy.sameArticle', 'copy.sameTitle', 'text.page', 'text.chunk'];
const values = [4, 8, 3, 7, 2, 6, 0, 5, 12, 8, 9, 4, 3, 0, 9, 14, 7, 17, 12, 6, 0, 12, 18, 9, 24, 31, 20];
sampleStats.days['2026-09-21'] = {dimmed:9,pagesFlagged:2,pagesHigh:1,paragraphs:6,reasons:Object.fromEntries(ids.map(id => [id,id === 'siteList.listed' ? 9 : 0])),domains:{'archive-guides.example':{count:9,reasons:{'siteList.listed':9}}}};
for (let i = 0; i < values.length; i++) {
 const date = new Date(2026, 9, 19 + i);
 const key = [date.getFullYear(), String(date.getMonth() + 1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
 const n = values[i];
 const listed = Math.floor(n * .6), copies = n - listed, pages = n ? 1 + (i % 3) : 0;
 const reasons = Object.fromEntries(ids.map(id => [id, 0]));
 reasons['siteList.listed'] = listed;
 reasons['copy.sameArticle'] = copies;
 reasons['text.page'] = pages;
 sampleStats.days[key] = {dimmed:n,pagesFlagged:pages,pagesHigh:pages ? 1 : 0,paragraphs:pages * 3,reasons,domains:n ? {'bestkitchenpicks.example':{count:listed,reasons:{'siteList.listed':listed}},'dailybrews.example':{count:copies,reasons:{'copy.sameArticle':copies}}} : {}};
}
