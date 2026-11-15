# Third-party site lists

The CSV files in this folder are converted from public community blocklists of AI-generated
content sites. `pipeline/build_sitelist.py` merges them with our own `../sites.csv` into
`extension/src/data/sites.json`. To drop a source, delete its CSV and rebuild.

Conversion (2026-11-14): kept whole-domain entries only. Dropped single-page/blog entries
(e.g. one Medium blog), subdomain-only entries, shared hosts (pages.dev, medium.com, ...),
domains on our allowlist, and domains already in `sites.csv`. Removed incognito.com
(a real software company, found in a spot check), and on 2026-11-15 five more that look like
real businesses or real sites: zenrows.com, flatirons.com, farmaciaintroini.it, scienceblog.com,
eluxemagazine.com, and 101 `.com.ar`/`.com.mx` domains: the
builder's domain parser treats those country suffixes as the domain, which would dim every site
under them. TODO(hack): teach `registrable_domain` more country suffixes, then restore them. Entries are NOT individually verified by us.

| File | Source | Commit | License |
|---|---|---|---|
| `agsimmons-ai-content-blocklist.csv` (55 domains) | https://github.com/agsimmons/ai-content-blocklist | `91e0b84` | CC0 1.0 Universal (`licenses/CC0-1.0-agsimmons-ai-content-blocklist.txt`) |
| `alvi-se-ai-ublock-blacklist.csv` (2,327 domains) | https://github.com/alvi-se/ai-ublock-blacklist | `a8a9644` | GNU GPL v3 (`licenses/GPL-3.0-alvi-se-ai-ublock-blacklist.txt`) |

Domains on both lists are kept in the CC0 file only.

## GPL-3.0 note

The `alvi-se-ai-ublock-blacklist.csv` data is a modified version of alvi-se/ai-ublock-blacklist
and is distributed under the GNU General Public License v3. Its source is this file and the
upstream repository above. Anyone may use, modify and redistribute it under the GPL.

Because of this, the shipped `sites.json` includes GPL-licensed data. Before licensing the site
list commercially, rebuild without this file (or get the maintainer's permission). TODO(hack).
