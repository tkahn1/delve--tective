import { describe, expect, it } from 'vitest';
import { campaignTokens, groupComments, normalize } from '../src/checks/commentCopies/group';
import type { VideoComment } from '../src/checks/commentCopies/types';
import { describe as describeFlag } from '../src/ui/commentFlag';

let seq = 0;
const c = (author: string, text: string, reply = false): VideoComment => ({ id: `c${seq++}`, author, text, reply });

describe('normalize', () => {
  it('drops case, punctuation, links and mentions', () => {
    expect(normalize('Piers is 100% RIGHT!! https://x.co/abc @someone')).toBe('piers is 100 right');
  });
});

describe('campaignTokens', () => {
  it('finds promoted names and folds a trailing s', () => {
    expect([...campaignTokens('Watching AMS39Ks price, buy $PEPE now')].sort()).toEqual(['$pepe', 'ams39k']);
  });
  it('ignores @mentions and links (replies start with @handle)', () => {
    expect(campaignTokens('@sethh1943 agreed, see https://x.co/ab12cd34').size).toBe(0);
    expect([...campaignTokens('@sethh1943 buy AMS39K')]).toEqual(['ams39k']);
  });
  it('skips ordinals, decades, sizes and years', () => {
    expect(campaignTokens('the 1st time in the 90s, 10k views, 1080p, 2026').size).toBe(0);
  });
});

describe('groupComments', () => {
  it('groups exact copies after normalising', () => {
    const list = [
      c('@a', 'He is mostly on Telegram, using the user name below'),
      c('@b', 'he is mostly on telegram using the user name below!!'),
      c('@c', 'Great video, learned a lot about investing today'),
    ];
    const g = groupComments(list);
    expect(g).toHaveLength(1);
    expect(g[0]).toMatchObject({ kind: 'exact', authors: 2 });
    expect(g[0].ids).toEqual([list[0].id, list[1].id]);
  });

  it('groups near copies that share most words', () => {
    const list = [
      c('@a', 'Seven months ago I left my manual labor job to do daytrading and never looked back'),
      c('@b', 'Seven months ago I left my manual labor job to start daytrading, never looked back since'),
    ];
    expect(groupComments(list)[0]?.kind).toBe('near');
  });

  it('does not group short comments that agree by chance', () => {
    const list = [c('@a', 'I love Douglas Murray!'), c('@b', 'Totally love Douglas Murray what a legend')];
    expect(groupComments(list)).toHaveLength(0);
  });

  it('finds a campaign: the same promoted name from 3+ accounts with different wording', () => {
    const list = [
      c('@p', 'The launch of AMS39K is like the opening act of a grand opera'),
      c('@k', 'Watching AMS39Ks numbers go up is like a home game where we are all winning'),
      c('@h', 'That feeling when you see AMS39Ks price tick up, like a rocket launch'),
      c('@x', 'Unrelated comment about the debate and the host'),
    ];
    const g = groupComments(list);
    expect(g).toHaveLength(1);
    expect(g[0]).toMatchObject({ kind: 'campaign', label: 'AMS39K', authors: 3 });
  });

  it('replies to the same person do not form a campaign', () => {
    const list = [
      c('@a', '@sethh1943 Mizzy will end up pranking the wrong person', true),
      c('@b', '@sethh1943 honestly he deserved that interview', true),
      c('@c', '@sethh1943 Piers handled it really well I think', true),
    ];
    expect(groupComments(list)).toHaveLength(0);
  });

  it('needs 3 different accounts for a campaign', () => {
    const list = [
      c('@same', 'AMS39K launch is like the opening act of an opera'),
      c('@same', 'AMS39K numbers are going up like a scoreboard'),
      c('@b', 'AMS39K feels like a rocket launch'),
    ];
    expect(groupComments(list).some((g) => g.kind === 'campaign')).toBe(false);
  });

  it('keeps the campaign label when an exact group joins a campaign group', () => {
    const spam = 'Thanks to RAYMONDLE1 on telegram for the trading help';
    const list = [c('@a', spam), c('@b', spam), c('@c', 'RAYMONDLE1 helped me grow my account a lot'), c('@d', 'Message RAYMONDLE1, he replies fast')];
    const g = groupComments(list);
    expect(g).toHaveLength(1);
    expect(g[0]).toMatchObject({ kind: 'campaign', label: 'RAYMONDLE1' });
    expect(g[0].ids).toHaveLength(4);
  });

  it('a quick pass with maxDf still finds exact copies', () => {
    const base = Array.from({ length: 200 }, (_, i) => c(`@u${i}`, `comment number ${i} about something different entirely ${i * 7}`));
    const dupe = [c('@x', 'Please make sure you write the user name complete'), c('@y', 'please make sure you write the USER NAME complete')];
    const g = groupComments([...base, ...dupe], { maxDf: 5 });
    expect(g.some((x) => x.ids.includes(dupe[0].id) && x.ids.includes(dupe[1].id))).toBe(true);
  });
});

describe('flag wording', () => {
  it('describes what was seen without judging intent', () => {
    const exact = describeFlag({ kind: 'exact', label: null, ids: ['a', 'b', 'c'], authors: 2 });
    expect(exact.pill).toEqual({ lead: 'Repeated ', count: '3', tail: ' times' });
    expect(exact.detail).toBe('The same comment appears 3 times on this video, from 2 accounts.');
    const camp = describeFlag({ kind: 'campaign', label: 'AMS39K', ids: ['a', 'b', 'c', 'd', 'e'], authors: 5 });
    expect(camp.detail).toBe('AMS39K is named in 5 comments on this video, from 5 accounts.');
    for (const s of [exact.detail, camp.detail, exact.title, camp.title]) expect(s).not.toMatch(/fake|bot|AI/i);
  });
});

describe('reddit collect', () => {
  // Made-up data in the shape of <origin>/comments/<id>.json and /api/morechildren.json.
  const t1 = (id: string, author: string, body: string, parent: string, replies: unknown = '') =>
    ({ kind: 't1', data: { id, name: `t1_${id}`, author, body, parent_id: parent, replies } });
  const listing = (...children: unknown[]) => ({ kind: 'Listing', data: { children } });

  it('walks nested replies, skips deleted, queues load-more and continue-thread placeholders', async () => {
    const { collect } = await import('../src/content/reddit/fetch');
    const tree = [
      t1('a', 'alice', 'Top comment', 't3_post', listing(
        t1('b', 'bob', 'A reply', 't1_a', listing(
          { kind: 'more', data: { id: '_', name: 't1__', parent_id: 't1_b', count: 0, children: [] } },
        )),
        t1('c', '[deleted]', '[deleted]', 't1_a'),
      )),
      t1('d', 'dan', '[removed]', 't3_post'),
      { kind: 'more', data: { id: 'x1', name: 't1_x1', parent_id: 't3_post', count: 3, children: ['x1', 'x2', 'x3'] } },
    ];
    const out: VideoComment[] = [];
    const more: string[] = [];
    const deep: string[] = [];
    collect(tree, out, more, deep);
    expect(out.map((c) => [c.id, c.reply])).toEqual([['t1_a', false], ['t1_b', true]]);
    expect(more).toEqual(['x1', 'x2', 'x3']);
    expect(deep).toEqual(['b']);
  });

  it('describes Reddit groups "in this thread"', () => {
    const d = describeFlag({ kind: 'exact', label: null, ids: ['t1_a', 't1_b'], authors: 2 }, 'in this thread');
    expect(d.detail).toBe('The same comment appears 2 times in this thread, from 2 accounts.');
  });
});

describe('sensitivity for comments', () => {
  it('relaxed keeps exact copies and shared names of 3+, balanced and strict keep 2+', async () => {
    const { keepGroup } = await import('../src/content/copies/controller');
    const g = (kind: 'exact' | 'near' | 'campaign', n: number) => ({ kind, label: kind === 'campaign' ? 'X1' : null, ids: Array.from({ length: n }, (_, i) => `i${i}`), authors: n });
    expect(keepGroup(g('exact', 2), 'relaxed')).toBe(false);
    expect(keepGroup(g('exact', 3), 'relaxed')).toBe(true);
    expect(keepGroup(g('near', 9), 'relaxed')).toBe(false);
    expect(keepGroup(g('campaign', 3), 'relaxed')).toBe(true);
    expect(keepGroup(g('near', 2), 'balanced')).toBe(true);
    expect(keepGroup(g('near', 2), 'strict')).toBe(true);
  });
});

describe('weekly counts', () => {
  it('a video with repeated comments counts its comments and one flagged page', async () => {
    const { applyComments, summarize } = await import('../src/storage/stats');
    const now = new Date(2026, 10, 15);
    let s = applyComments({ days: {} }, { comments: 230 }, now);
    s = applyComments(s, { comments: 0 }, now); // nothing repeated: not counted
    const t = summarize(s, 'week', now).totals;
    expect(t.comments).toBe(230);
    expect(t.pagesFlagged).toBe(1);
  });
});
