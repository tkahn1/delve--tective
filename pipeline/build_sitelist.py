"""Build the shipped site lists.

Inputs (pipeline/data/):
  sites.csv      domain,reason,note   reason is 'farm' or 'builder' (our own, hand-verified)
  imported/*.csv domain,reason,note   third-party lists, one file per source; licences in
                 pipeline/data/imported/NOTICE.md. Delete a file to drop that source.
  allowlist.txt  one domain per line, '#' comments
  builders.json  { generators: [...], scriptHosts: [...] }  AI site-builder fingerprints

Outputs (extension/src/data/):
  sites.json, allowlist.json, builders.json   (formats in extension/CONTRACT.md)

Usage:  python pipeline/build_sitelist.py
"""
from __future__ import annotations

import csv
import json
import sys

from common import EXT_DATA, PIPE_DATA, registrable_domain, write_json

REASONS = {"farm", "builder"}


def clean_domain(d: str) -> str:
    d = d.strip().lower()
    for prefix in ("https://", "http://"):
        if d.startswith(prefix):
            d = d[len(prefix):]
    d = d.split("/")[0].split(":")[0]
    return registrable_domain(d)


def load_sites() -> dict[str, str]:
    sites: dict[str, str] = {}
    files = [PIPE_DATA / "sites.csv"] + sorted((PIPE_DATA / "imported").glob("*.csv"))
    for path in files:
        with open(path, newline="", encoding="utf-8") as f:
            for n, row in enumerate(csv.DictReader(f), start=2):
                dom = clean_domain(row.get("domain") or "")
                reason = (row.get("reason") or "").strip().lower()
                if not dom:
                    continue
                if reason not in REASONS:
                    sys.exit(f"{path.name} line {n}: reason must be farm|builder, got {reason!r}")
                if dom in sites and sites[dom] != reason:
                    print(f"warning: {dom} listed twice with different reasons; keeping 'farm'")
                    reason = "farm"
                sites[dom] = reason
    return sites


def load_allowlist() -> list[str]:
    out: list[str] = []
    for line in (PIPE_DATA / "allowlist.txt").read_text(encoding="utf-8").splitlines():
        line = line.split("#", 1)[0].strip()
        if line:
            d = clean_domain(line) if "." in line else line.lower()
            if d not in out:
                out.append(d)
    return out


def load_builders() -> dict[str, list[str]]:
    data = json.loads((PIPE_DATA / "builders.json").read_text(encoding="utf-8"))
    gens = sorted({g.strip().lower() for g in data.get("generators", []) if g.strip()})
    hosts = sorted({h.strip().lower() for h in data.get("scriptHosts", []) if h.strip()})
    return {"generators": gens, "scriptHosts": hosts}


def main() -> None:
    sites = load_sites()
    allow = load_allowlist()
    builders = load_builders()

    clash = sorted(set(sites) & set(allow))
    if clash:
        sys.exit(f"domains on both the site list and the allowlist: {clash}")

    write_json(EXT_DATA / "sites.json", dict(sorted(sites.items())))
    write_json(EXT_DATA / "allowlist.json", allow)
    write_json(EXT_DATA / "builders.json", builders)

    farms = sum(1 for r in sites.values() if r == "farm")
    print(f"sites.json: {len(sites)} domains ({farms} farm, {len(sites) - farms} builder)")
    print(f"allowlist.json: {len(allow)} domains")
    print(f"builders.json: {len(builders['generators'])} generators, {len(builders['scriptHosts'])} script hosts")


if __name__ == "__main__":
    main()
