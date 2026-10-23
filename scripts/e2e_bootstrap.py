#!/usr/bin/env python3
"""Rootless Playwright runtime bootstrap for restricted Linux containers.

Playwright's Chromium needs system libraries (glib, nss, …) and at least one
fontconfig-visible font. On a workstation or CI runner use
`npx playwright install --with-deps chromium` instead; this script exists for
sandboxes where root/apt is unavailable.

It resolves the Debian dependency closure from the official package index,
downloads the .deb files, extracts them into a private prefix (no root, nothing
written outside the target dir) and prints the env vars to export.

Usage:
    python3 scripts/e2e_bootstrap.py
    eval "$(python3 scripts/e2e_bootstrap.py --print-env)"
"""

from __future__ import annotations

import argparse
import lzma
import os
import subprocess
import sys
import urllib.request

DEBIAN_MIRROR = "https://deb.debian.org/debian"
SUITE = "bookworm"
COMPONENT = "main"
ARCH = "amd64"

# Libraries Chrome Headless Shell links against (glibc/libstdc++ assumed present).
ROOTS = [
    "libglib2.0-0", "libnss3", "libnspr4", "libdbus-1-3", "libatk1.0-0",
    "libatk-bridge2.0-0", "libcups2", "libdrm2", "libxkbcommon0", "libatspi2.0-0",
    "libxcomposite1", "libxdamage1", "libxfixes3", "libxrandr2", "libgbm1",
    "libpango-1.0-0", "libcairo2", "libasound2", "libx11-6", "libxext6", "libxcb1",
    "libexpat1", "libpcre2-8-0", "libffi8", "libpng16-16", "libfontconfig1",
    "libharfbuzz0b", "libpixman-1-0", "libxrender1", "libxi6", "libxtst6",
    "libwayland-client0", "libudev1", "libselinux1", "libmount1", "libblkid1",
    "libuuid1", "libsystemd0", "liblz4-1", "libzstd1", "libgcrypt20", "libgpg-error0",
    "liblzma5", "libbsd0", "libmd0", "libbrotli1",
    # Fonts: without these Skia aborts with "Not implemented" (no font manager).
    "fonts-dejavu-core", "fonts-liberation2",
]
SKIP = {"libc6", "libc-bin", "libgcc-s1", "libstdc++6", "zlib1g", "multiarch-support"}

FONTCONF = """<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>{root}/usr/share/fonts</dir>
  <cachedir>{home}/font-cache</cachedir>
  <alias><family>sans-serif</family><prefer><family>DejaVu Sans</family></prefer></alias>
</fontconfig>
"""

def load_index(cache_dir: str) -> dict[str, dict[str, dict[str, str]]]:
    os.makedirs(cache_dir, exist_ok=True)
    index_path = os.path.join(cache_dir, "Packages.xz")
    if not os.path.exists(index_path):
        url = f"{DEBIAN_MIRROR}/dists/{SUITE}/{COMPONENT}/binary-{ARCH}/Packages.xz"
        urllib.request.urlretrieve(url, index_path)

    entries: dict[str, dict[str, str]] = {}
    provides: dict[str, dict[str, str]] = {}
    current: dict[str, str] = {}
    with lzma.open(index_path, "rt", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            if not line.strip():
                name = current.get("Package")
                if name:
                    entries.setdefault(name, current)
                    for provided in current.get("Provides", "").split(","):
                        parts = provided.strip().split()
                        if parts:
                            provides.setdefault(parts[0], current)
                current = {}
                continue
            if line.startswith(" ") or ":" not in line:
                continue
            key, value = line.split(":", 1)
            current[key.strip()] = value.strip()
    return {"entries": entries, "provides": provides}


def resolve(index: dict[str, dict[str, dict[str, str]]]) -> list[dict[str, str]]:
    entries, provides = index["entries"], index["provides"]
    seen: set[str] = set()
    queue = list(ROOTS)
    selected: list[dict[str, str]] = []
    while queue:
        name = queue.pop(0).split("|")[0].strip().split(":")[0].strip()
        if not name or name in seen or name in SKIP:
            continue
        seen.add(name)
        entry = entries.get(name) or provides.get(name)
        if not entry:
            continue
        selected.append(entry)
        for dep in entry.get("Depends", "").split(","):
            pkg = dep.strip().split("|")[0].split("(")[0].split(":")[0].strip()
            if pkg and pkg not in seen and pkg not in SKIP:
                queue.append(pkg)
    return selected


def main() -> int:
    parser = argparse.ArgumentParser(description="Bootstrap a rootless Playwright runtime.")
    parser.add_argument("--home", default=os.path.expanduser("~/.cache/reevita-e2e"))
    parser.add_argument("--print-env", action="store_true")
    args = parser.parse_args()

    home = os.path.abspath(args.home)
    root = os.path.join(home, "root")
    debs = os.path.join(home, "debs")
    os.makedirs(debs, exist_ok=True)

    packages = resolve(load_index(os.path.join(home, "index")))
    if not packages:
        print("Could not resolve any Debian packages; check network access.", file=sys.stderr)
        return 1

    for entry in packages:
        filename = entry["Filename"]
        path = os.path.join(debs, os.path.basename(filename))
        if not os.path.exists(path):
            try:
                urllib.request.urlretrieve(f"{DEBIAN_MIRROR}/{filename}", path)
            except Exception as exc:  # noqa: BLE001 - report and continue
                print(f"download failed: {entry['Package']}: {exc}", file=sys.stderr)
                continue
        subprocess.run(["dpkg-deb", "-x", path, root], check=False)

    fontconf = os.path.join(home, "fonts.conf")
    with open(fontconf, "w", encoding="utf-8") as handle:
        handle.write(FONTCONF.format(root=root, home=home))

    exports = {
        "LD_LIBRARY_PATH": f"{root}/usr/lib/x86_64-linux-gnu:{root}/lib/x86_64-linux-gnu",
        "FONTCONFIG_FILE": fontconf,
        "FONTCONFIG_PATH": home,
        "PLAYWRIGHT_BROWSERS_PATH": os.path.join(home, "browsers"),
    }
    if args.print_env:
        for key, value in exports.items():
            print(f"export {key}={value}")
    else:
        print(f"Bootstrap complete in {home}")
        print('Run:\n  eval "$(python3 scripts/e2e_bootstrap.py --print-env)"')
        print("  npx playwright install chromium && npm run test:e2e")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
