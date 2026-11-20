"""The seal of Clavis, struck in layers, as the family's seals are drawn and animated.

The seal is drawn as four layers that the app stacks in depth (src/seal3d.js tilts them under the pointer and gives them
the family's motion): the plate (an onyx rim with a beaded gold edge, an ivory face, the gold ring, the rays, laurel
branches, the carved name and the day it was begun), the book (open, gilt-edged, with a claret ribbon), the key (gold,
with a filigree bow) and the gem (a cut ruby at the heart of the bow). Flattened, the same layers make the icons.

    python3 -I tools/clavis_seal.py OUT_DIR     writes plate|book|key|gem-{day,night}.svg and seal-{day,night}.svg
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seal_engine import P, polar, star4, bevel, arc, DATE  # noqa: E402

PAL = {
    "day": dict(rim=("#5c5c68", "#26262e", "#0b0b0e"), bead=("#fff2c2", "#d9b25e", "#8a6424"), face=("#fffdf6", "#f8f1e2", "#e9dcc2"),
                ink=("#4a4a56", "#1c1c22", "#060608", "#0b0b0e"), inkline="#d9b25e", gold=("#f8e7b0", "#d8b05c", "#8f6726"),
                cover=("#3a3a44", "#1f1f26", "#0b0b0e"), paper=("#fffaf0", "#f1e6cf"), ribbon=("#c4364f", "#8a1d31", "#4f0a17"),
                ruby=("#ffd0d6", "#e0233f", "#7d0a1c", "#3d020b"), shadow="#1a1408", laurel=("#e8cf8c", "#b48a3c", "#7a5a1f")),
    "night": dict(rim=("#6e6e7c", "#2a2a33", "#09090b"), bead=("#fff2c2", "#e0b964", "#8a6424"), face=("#2c2b31", "#212026", "#151418"),
                  ink=("#fff1c9", "#e3c27a", "#3a2a0a", "#22180a"), inkline="#fff6d8", gold=("#fbe9b6", "#e0b964", "#9a7230"),
                  cover=("#45454f", "#26262e", "#0e0e12"), paper=("#efe6d2", "#d9cbb0"), ribbon=("#e0526a", "#a32640", "#5a0c1c"),
                  ruby=("#ffd6dc", "#f03a55", "#8f0c21", "#45030d"), shadow="#000000", laurel=("#f0d79a", "#c49a48", "#86622a")),
}


def defs(k, p):
    g, r, f, ink, c, rb = p["gold"], p["rim"], p["face"], p["ink"], p["cover"], p["ruby"]
    return f"""<defs>
<radialGradient id="{k}-rim" cx="38%" cy="28%" r="82%"><stop offset="0" stop-color="{r[0]}"/><stop offset=".48" stop-color="{r[1]}"/><stop offset="1" stop-color="{r[2]}"/></radialGradient>
<radialGradient id="{k}-face" cx="44%" cy="34%" r="74%"><stop offset="0" stop-color="{f[0]}"/><stop offset=".64" stop-color="{f[1]}"/><stop offset="1" stop-color="{f[2]}"/></radialGradient>
<linearGradient id="{k}-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{g[0]}"/><stop offset=".42" stop-color="{g[1]}"/><stop offset="1" stop-color="{g[2]}"/></linearGradient>
<linearGradient id="{k}-goldv" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{g[2]}"/><stop offset=".35" stop-color="{g[0]}"/><stop offset=".62" stop-color="{g[1]}"/><stop offset="1" stop-color="{g[2]}"/></linearGradient>
<linearGradient id="{k}-ink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{ink[0]}"/><stop offset=".5" stop-color="{ink[1]}"/><stop offset="1" stop-color="{ink[1]}"/></linearGradient>
<linearGradient id="{k}-cover" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c[0]}"/><stop offset=".5" stop-color="{c[1]}"/><stop offset="1" stop-color="{c[2]}"/></linearGradient>
<linearGradient id="{k}-ribbon" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{p['ribbon'][2]}"/><stop offset=".45" stop-color="{p['ribbon'][0]}"/><stop offset="1" stop-color="{p['ribbon'][1]}"/></linearGradient>
<radialGradient id="{k}-ruby" cx="36%" cy="30%" r="72%"><stop offset="0" stop-color="{rb[0]}"/><stop offset=".3" stop-color="{rb[1]}"/><stop offset=".75" stop-color="{rb[2]}"/><stop offset="1" stop-color="{rb[3]}"/></radialGradient>
<radialGradient id="{k}-halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff6d8" stop-opacity=".7"/><stop offset=".55" stop-color="{g[0]}" stop-opacity=".22"/><stop offset="1" stop-color="{g[0]}" stop-opacity="0"/></radialGradient>
<radialGradient id="{k}-inner" cx="50%" cy="50%" r="50%"><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="{p['shadow']}" stop-opacity=".22"/></radialGradient>
<filter id="{k}-blur3"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="{k}-lift" x="-12%" y="-12%" width="124%" height="128%"><feDropShadow dx="0" dy="8" stdDeviation="9" flood-color="{p['shadow']}" flood-opacity=".38"/></filter>
<filter id="{k}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 .2  0 0 0 0 .16  0 0 0 0 .08  0 0 0 .5 -.2"/><feComposite in2="SourceGraphic" operator="in"/></filter>
{bevel(k + "-bevel-rim", blur=5, scale=7, gloss=1.0, exp=18, elev=38, shadow=p["shadow"], sop=0, sblur=1, dy=0)}
{bevel(k + "-bevel", blur=2.2, scale=4.5, gloss=1.0, exp=26, elev=46, shadow=p["shadow"], sop=.36, sblur=3.2, dy=3.6)}
{bevel(k + "-bevel-soft", blur=1.4, scale=2.6, gloss=.85, exp=30, elev=52, shadow=p["shadow"], sop=.24, sblur=2, dy=1.8)}
{bevel(k + "-bevel-hi", blur=3.2, scale=6.5, gloss=1.25, exp=16, elev=40, shadow=p["shadow"], sop=.42, sblur=5, dy=6)}
{bevel(k + "-bevel-text", blur=1.2, scale=3.4, gloss=1.15, exp=20, elev=48, shadow=p["shadow"], sop=0, sblur=1, dy=0)}
<clipPath id="{k}-faceclip"><circle cx="320" cy="320" r="279"/></clipPath>
<path id="{k}-top" d="{arc(213, 194, 346, 1)}"/><path id="{k}-bot" d="{arc(262, 160, 20, 0)}"/>
</defs>"""


def carved(k, p, text, size, path, depth, spacing):
    ink = p["ink"]
    tf = 'font-family="\'Clavis Cinzel B\',Cinzel,Georgia,serif" font-weight="900" text-anchor="middle"'
    out = [f'<text {tf} font-size="{size}" letter-spacing="{spacing}" fill="{p["shadow"]}" opacity=".35" filter="url(#{k}-blur3)" transform="translate(0,{depth + 4})"><textPath href="#{path}" startOffset="50%">{text}</textPath></text>']
    for i in range(depth, 0, -1):
        out.append(f'<text {tf} font-size="{size}" letter-spacing="{spacing}" fill="{ink[2] if i > depth * .34 else ink[3]}" transform="translate(0,{i * 1.15:.2f})"><textPath href="#{path}" startOffset="50%">{text}</textPath></text>')
    out.append(f'<text {tf} font-size="{size}" letter-spacing="{spacing}" fill="url(#{k}-ink)" stroke="{ink[2]}" stroke-width=".9" filter="url(#{k}-bevel-text)"><textPath href="#{path}" startOffset="50%">{text}</textPath></text>')
    # a fine gilt line inside each letter's upper edge, as engraved capitals carry
    out.append(f'<text {tf} font-size="{size}" letter-spacing="{spacing}" fill="none" stroke="{p["inkline"]}" stroke-width=".9" opacity=".75" transform="translate(0,-.9)"><textPath href="#{path}" startOffset="50%">{text}</textPath></text>')
    return "".join(out)


def laurel(k, side):
    """A gold laurel branch along the lower curve inside the ring, its leaves paired along the stem."""
    out = []
    sgn = 1 if side == "right" else -1
    pts = [polar(172, 90 - sgn * a) for a in range(14, 112, 2)]
    out.append(f'<path d="M{" L".join(P(x, y) for x, y in pts)}" fill="none" stroke="url(#{k}-gold)" stroke-width="3" stroke-linecap="round"/>')
    for i, a in enumerate(range(18, 108, 7.5) if False else [18 + 7.5 * j for j in range(12)]):
        x, y = polar(172, 90 - sgn * a)
        ang = 90 - sgn * a + sgn * 90
        for s2 in (-1, 1):
            rot = ang + s2 * 38 * sgn - (sgn * 8)
            lx, ly = x + 14 * math.cos(math.radians(rot)), y + 14 * math.sin(math.radians(rot))
            out.append(f'<ellipse cx="{lx:.1f}" cy="{ly:.1f}" rx="12.5" ry="5.2" transform="rotate({rot:.1f} {lx:.1f} {ly:.1f})" fill="url(#{k}-gold)"/>')
    tx, ty = polar(172, 90 - sgn * 112)
    out.append(f'<ellipse cx="{tx:.1f}" cy="{ty:.1f}" rx="12" ry="5" transform="rotate({90 - sgn * 112 + sgn * 90:.1f} {tx:.1f} {ty:.1f})" fill="url(#{k}-gold)"/>')
    return "".join(out)


def plate(k, p):
    beads = "".join(f'<circle cx="{polar(296, a)[0]:.2f}" cy="{polar(296, a)[1]:.2f}" r="3.3" fill="url(#{k}-gold)"/>' for a in [i * 4 for i in range(90)])
    return f"""<g filter="url(#{k}-lift)"><circle cx="320" cy="320" r="310" fill="url(#{k}-rim)"/></g>
<path d="M320,10 a310,310 0 1,0 0.01,0 Z M320,38 a282,282 0 1,1 -0.01,0 Z" fill="url(#{k}-rim)" fill-rule="evenodd" filter="url(#{k}-bevel-rim)"/>
<g filter="url(#{k}-bevel-soft)">{beads}</g>
<circle cx="320" cy="320" r="283" fill="url(#{k}-gold)"/>
<circle cx="320" cy="320" r="280" fill="url(#{k}-face)"/>
<g clip-path="url(#{k}-faceclip)"><rect x="30" y="30" width="580" height="580" filter="url(#{k}-grain)" fill="#fff"/></g>
<circle cx="320" cy="320" r="280" fill="url(#{k}-inner)"/>
<g filter="url(#{k}-bevel-soft)"><circle cx="320" cy="320" r="202" fill="none" stroke="url(#{k}-gold)" stroke-width="8"/><circle cx="320" cy="320" r="191" fill="none" stroke="url(#{k}-gold)" stroke-width="2.2"/></g>
<g filter="url(#{k}-bevel)">{star4(70, 320, 18, 4.8, f"url(#{k}-gold)")}{star4(570, 320, 18, 4.8, f"url(#{k}-gold)")}</g>
{carved(k, p, "CLAVIS", 78, k + "-top", 8, 10)}
{carved(k, p, DATE, 30, k + "-bot", 4, 3)}"""


def rays(k, p):
    """The gold rays between the key and the ring: a layer of their own, so the app can turn them slowly."""
    out = []
    for i in range(56):
        a = i * 360 / 56 + 360 / 112
        long_ = i % 2 == 0
        r0, r1, w = 74, (186 if long_ else 150), (3.2 if long_ else 1.9)
        ax, ay = math.cos(math.radians(a)), math.sin(math.radians(a))
        px, py = -ay * w, ax * w
        out.append(f'<polygon points="{P(320 + ax * r0 + px, 320 + ay * r0 + py)} {P(320 + ax * r0 - px, 320 + ay * r0 - py)} {P(320 + ax * r1, 320 + ay * r1)}" fill="url(#{k}-gold)" opacity="{1 if long_ else .7}"/>')
    return f'<g filter="url(#{k}-bevel-soft)" opacity=".92">{"".join(out)}</g>'


def _key(k, p, cx, cy, ang, L=262, mirror=False):
    """One key drawn along its own axis (bow at the top, bit at the foot), then turned into place: a quatrefoil bow with
    pierced lobes and a finial, a ringed collar, a turned shaft with a band, and a warded bit."""
    g = p["gold"]
    holes = "".join(f'<circle cx="{polar(22, a, 0, 0)[0]:.2f}" cy="{polar(22, a, 0, 0)[1]:.2f}" r="5" fill="{p["face"][1]}"/>'
                    f'<circle cx="{polar(22, a, 0, 0)[0]:.2f}" cy="{polar(22, a, 0, 0)[1]:.2f}" r="5" fill="none" stroke="{g[2]}" stroke-width="1" opacity=".55"/>'
                    for a in (-90, 0, 180))
    body = (f'<circle cx="0" cy="-19" r="15" fill="url(#{k}-gold)"/><circle cx="-19" cy="0" r="15" fill="url(#{k}-gold)"/>'
            f'<circle cx="19" cy="0" r="15" fill="url(#{k}-gold)"/><circle cx="0" cy="17" r="13" fill="url(#{k}-gold)"/>'
            f'<circle cx="0" cy="0" r="21" fill="url(#{k}-gold)"/>{holes}'
            f'<circle cx="0" cy="-41" r="5.5" fill="url(#{k}-gold)"/><path d="M-6,-32 L0,-46 L6,-32 Z" fill="url(#{k}-gold)"/>'
            f'<rect x="-15" y="30" width="30" height="9" rx="4.5" fill="url(#{k}-gold)"/><rect x="-11" y="41" width="22" height="7" rx="3.5" fill="url(#{k}-gold)"/>'
            f'<rect x="-6.5" y="47" width="13" height="{L - 47}" rx="6" fill="url(#{k}-goldv)"/>'
            f'<rect x="-10" y="{L * .58:.0f}" width="20" height="6" rx="3" fill="url(#{k}-gold)"/>'
            f'<path d="M6,{L - 44} H30 V{L - 34} H23 V{L - 26} H33 V{L - 16} H18 V{L - 22} H12 V{L} H6 Z" fill="url(#{k}-gold)"/>')
    return f'<g transform="translate({cx},{cy}) rotate({ang}){" scale(-1,1)" if mirror else ""}">{body}</g>'


KEYS = [(-45, 229.5, 239.5), (45, 410.5, 239.5)]   # in saltire, crossing at (320, 330) behind the book: bows above, wards below


def keys(k, p):
    """Two gold keys in saltire, their bows above, their wards below, crossing behind the book."""
    # the right key is the left key's mirror, so the two bits turn outwards alike
    out = [_key(k, p, x, y, ang, 278, mirror=(ang > 0)) for ang, x, y in KEYS]
    return f'<g filter="url(#{k}-bevel-hi)">{"".join(out)}</g>'


def gem(k, p):
    """A cut ruby set in each bow."""
    out = []
    for ang, x, y in KEYS:
        facets = "".join(f'<line x1="{x}" y1="{y}" x2="{polar(11, a, x, y)[0]:.1f}" y2="{polar(11, a, x, y)[1]:.1f}" stroke="#ffffff" stroke-width=".7" opacity=".35"/>' for a in range(0, 360, 45))
        out.append(f'<circle cx="{x}" cy="{y}" r="13.5" fill="url(#{k}-gold)"/><circle cx="{x}" cy="{y}" r="10.5" fill="url(#{k}-ruby)"/>{facets}'
                   f'<path d="M{x - 6},{y - 4} Q{x - 3},{y - 9} {x + 3},{y - 8.5}" stroke="#ffffff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".9"/>')
    return f'<g filter="url(#{k}-bevel)">{"".join(out)}</g>'


def book(k, p):
    """An open book, held up to the reader: a tooled onyx cover, ivory pages that dip to the gutter, gilt fore-edges,
    lines of text, and a claret ribbon."""
    cx, top, w, h = 320, 302, 74, 74
    L, R = cx - w, cx + w
    cov = (f'<path d="M{L - 12},{top + 4} Q{cx - 40},{top - 6} {cx},{top + 12} Q{cx + 40},{top - 6} {R + 12},{top + 4} L{R + 12},{top + h + 16} '
           f'Q{cx + 40},{top + h + 4} {cx},{top + h + 24} Q{cx - 40},{top + h + 4} {L - 12},{top + h + 16} Z" fill="url(#{k}-cover)"/>'
           f'<path d="M{L - 6},{top + 9} Q{cx - 40},{top} {cx},{top + 17} Q{cx + 40},{top} {R + 6},{top + 9} L{R + 6},{top + h + 11} Q{cx + 40},{top + h + 1} {cx},{top + h + 19} '
           f'Q{cx - 40},{top + h + 1} {L - 6},{top + h + 11} Z" fill="none" stroke="url(#{k}-gold)" stroke-width="1.6" opacity=".9"/>')
    pages = (f'<path d="M{cx},{top + 10} Q{cx - 40},{top - 8} {L},{top} L{L},{top + h} Q{cx - 40},{top + h - 8} {cx},{top + h + 10} Z" fill="{p["paper"][0]}"/>'
             f'<path d="M{cx},{top + 10} Q{cx + 40},{top - 8} {R},{top} L{R},{top + h} Q{cx + 40},{top + h - 8} {cx},{top + h + 10} Z" fill="{p["paper"][1]}"/>'
             f'<path d="M{L},{top + h} Q{cx - 40},{top + h - 8} {cx},{top + h + 10} Q{cx + 40},{top + h - 8} {R},{top + h}" fill="none" stroke="url(#{k}-gold)" stroke-width="3.2"/>'
             f'<path d="M{L},{top} L{L},{top + h} M{R},{top} L{R},{top + h}" stroke="url(#{k}-gold)" stroke-width="3.2"/>'
             f'<path d="M{cx},{top + 10} L{cx},{top + h + 10}" stroke="{p["cover"][2]}" stroke-width="1.8" opacity=".5"/>')
    lines = "".join(f'<path d="M{L + 10},{top + 15 + i * 11} Q{cx - 34},{top + 7 + i * 11} {cx - 9},{top + 20 + i * 11}" fill="none" stroke="{p["cover"][2]}" stroke-width="1.5" opacity=".32"/>'
                    f'<path d="M{R - 10},{top + 15 + i * 11} Q{cx + 34},{top + 7 + i * 11} {cx + 9},{top + 20 + i * 11}" fill="none" stroke="{p["cover"][2]}" stroke-width="1.5" opacity=".32"/>' for i in range(5))
    ribbon = f'<path d="M{cx - 6},{top + h + 14} L{cx - 6},{top + h + 52} L{cx + 2},{top + h + 43} L{cx + 10},{top + h + 52} L{cx + 10},{top + h + 14} Z" fill="url(#{k}-ribbon)"/>'
    return f'<g filter="url(#{k}-bevel)">{cov}{pages}{lines}</g><g filter="url(#{k}-bevel-soft)">{ribbon}</g>'


LAYERS = {"plate": plate, "rays": rays, "keys": keys, "book": book, "gem": gem}


EMBLEM = ("keys", "book", "gem")   # the device itself, drawn a little larger so it fills the gold ring as Carpe Diem's does


def place(name, body):
    return f'<g transform="translate(320,330) scale(1.12) translate(-320,-330)">{body}</g>' if name in EMBLEM else body


def svg(k, p, body):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="640" height="640" role="img" aria-label="Clavis">{defs(k, p)}{body}</svg>'


def build(out):
    os.makedirs(out, exist_ok=True)
    for dress in ("day", "night"):
        p = PAL[dress]
        for name, fn in LAYERS.items():
            k = "cv" + dress[0] + name[0]
            with open(os.path.join(out, f"{name}-{dress}.svg"), "w", encoding="utf-8") as f:
                f.write(svg(k, p, place(name, fn(k, p))))
        k = "cv" + dress[0]
        with open(os.path.join(out, f"seal-{dress}.svg"), "w", encoding="utf-8") as f:
            f.write(svg(k, p, "".join(place(n, fn(k, p)) for n, fn in LAYERS.items())))
    print("Clavis seal layers written to", out)


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else ".")
