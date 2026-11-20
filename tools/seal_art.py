"""Draws every picture of Clavis's seal from tools/clavis_seal.py, in one go.

    python3 -I tools/seal_art.py

art/seal/{plate,rays,keys,book,gem}-{day,night}.svg/.webp   the five layers the page stacks in depth (560px WebP)
art/seal/seal-{day,night}.svg                               the whole seal, drawn as one
art/seal/1024/seal-{day,night}.png                          the whole seal for app icons (Mac, Windows, Android, iPhone)
art/seal/128/seal-{day,night}.png/.webp                     the small seal for the bar
"""
import os, subprocess, sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(HERE, "tools"))
import clavis_seal  # noqa: E402
from PIL import Image  # noqa: E402

ART = os.path.join(HERE, "art", "seal")
TMP = os.path.join(ART, "_png")


def main():
    clavis_seal.build(ART)
    svgs = sorted(os.path.join(ART, f) for f in os.listdir(ART) if f.endswith(".svg"))
    os.makedirs(TMP, exist_ok=True)
    subprocess.run(["node", os.path.join(HERE, "tools", "render_seals.js"), TMP, "1120"] + svgs, check=True, stdout=subprocess.DEVNULL)
    for dress in ("day", "night"):
        for part in clavis_seal.LAYERS:
            im = Image.open(os.path.join(TMP, f"{part}-{dress}.png")).convert("RGBA").resize((560, 560), Image.LANCZOS)
            im.save(os.path.join(ART, f"{part}-{dress}.webp"), "WEBP", quality=90, method=6)
        whole = Image.open(os.path.join(TMP, f"seal-{dress}.png")).convert("RGBA")
        os.makedirs(os.path.join(ART, "1024"), exist_ok=True)
        os.makedirs(os.path.join(ART, "128"), exist_ok=True)
        whole.resize((1024, 1024), Image.LANCZOS).save(os.path.join(ART, "1024", f"seal-{dress}.png"), optimize=True)
        small = whole.resize((128, 128), Image.LANCZOS)
        small.save(os.path.join(ART, "128", f"seal-{dress}.png"), optimize=True)
        small.save(os.path.join(ART, "128", f"seal-{dress}.webp"), "WEBP", quality=92, method=6)
    for f in os.listdir(TMP):
        os.remove(os.path.join(TMP, f))
    os.rmdir(TMP)
    print("seal pictures written to", ART)


if __name__ == "__main__":
    main()
