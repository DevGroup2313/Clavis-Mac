"""The seal engine: a medallion struck the way the family's seals are (Carpe Diem's, The Forge's), in SVG with real light.

Every raised part is lit, not painted: the rim is an enamel torus with a bevel, the face is domed and grained, the gold
ring and the rays catch the light, the emblem is embossed and casts a shadow, and the name is carved in Cinzel Black with
a stacked extrusion beneath each letter and a gloss along its edges. The light comes from the upper left, as in the
family's seals. seal(palette, emblem_svg, carve, date) returns the SVG; tools/render_seals.js turns it into pictures.
"""
import math

DATE = "XIX · NOVEMBRIS · MMXXVI"


def P(x, y):
    return f"{x:.2f},{y:.2f}"


def polar(r, deg, cx=320.0, cy=320.0):
    a = math.radians(deg)
    return cx + r * math.cos(a), cy + r * math.sin(a)


def arc(r, a0, a1, sweep):
    x0, y0 = polar(r, a0)
    x1, y1 = polar(r, a1)
    return f"M{P(x0, y0)} A{r},{r} 0 0 {sweep} {P(x1, y1)}"


def star4(cx, cy, r, inner, fill, rot=0):
    pts = []
    for i in range(8):
        a = math.radians(-90 + rot + i * 45)
        rr = r if i % 2 == 0 else inner
        pts.append(P(cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return f'<polygon points="{" ".join(pts)}" fill="{fill}"/>'


def bevel(fid, blur=2.2, scale=4.0, gloss=0.85, exp=24, elev=48, shadow="#000", sop=0.32, sblur=3.0, dy=3.0, diffuse=True):
    """A filter that turns a flat shape into a struck one: diffuse light shades its far edges, specular light glosses its
    near ones, and a soft shadow falls below it."""
    d = ""
    if diffuse:
        d = (f'<feDiffuseLighting in="a" surfaceScale="{scale}" diffuseConstant="1.18" lighting-color="#ffffff" result="df"><feDistantLight azimuth="225" elevation="{elev + 14}"/></feDiffuseLighting>'
             f'<feComposite in="df" in2="SourceAlpha" operator="in" result="df2"/><feBlend in="SourceGraphic" in2="df2" mode="multiply" result="sh"/>')
    src = "sh" if diffuse else "SourceGraphic"
    return (f'<filter id="{fid}" x="-20%" y="-20%" width="140%" height="145%" color-interpolation-filters="sRGB">'
            f'<feGaussianBlur in="SourceAlpha" stdDeviation="{blur}" result="a"/>'
            f'<feSpecularLighting in="a" surfaceScale="{scale}" specularConstant="1" specularExponent="{exp}" lighting-color="#ffffff" result="sp"><feDistantLight azimuth="225" elevation="{elev}"/></feSpecularLighting>'
            f'<feComposite in="sp" in2="SourceAlpha" operator="in" result="sp2"/>{d}'
            f'<feComposite in="{src}" in2="sp2" operator="arithmetic" k1="0" k2="1" k3="{gloss}" k4="0" result="lit"/>'
            f'<feGaussianBlur in="SourceAlpha" stdDeviation="{sblur}" result="sb"/><feOffset in="sb" dx="0" dy="{dy}" result="so"/>'
            f'<feFlood flood-color="{shadow}" flood-opacity="{sop}"/><feComposite in2="so" operator="in" result="shadow"/>'
            f'<feMerge><feMergeNode in="shadow"/><feMergeNode in="lit"/></feMerge></filter>')


def seal(pal, emblem, carve, date=DATE, k="s", font="'Clavis Cinzel B','Cinzel',Georgia,serif", night=False):
    """pal: rim (light, mid, dark, edge), face (centre, mid, edge), ink (light, mid, dark), gold (light, mid, dark),
    shadow colour. emblem: SVG drawn in a 640 box around (320, 320), within radius 185, using the ids k-gold, k-goldv,
    k-emb, k-bevel, k-bevel-soft, k-bevel-hi (it may define its own too, with the k- prefix)."""
    rim, face, ink, gold = pal["rim"], pal["face"], pal["ink"], pal["gold"]
    emb = pal.get("emb", (ink[0], ink[1], ink[2]))
    n = len(carve)
    fs = min(80.0, 640 / (n * 0.86))
    ls = 7 if n <= 7 else 4 if n <= 10 else 2
    rtop = 238 if fs > 64 else 241
    top = arc(rtop, 192, 348, 1)
    bot = arc(262, 160, 20, 0)
    tf = f'font-family="{font}" font-weight="900" text-anchor="middle"'
    shade = pal.get("shadow", "#0b1a26")
    grain_op = 0.05 if not night else 0.07
    # the name: a soft shadow, a stack of darker layers for its depth, then its lit face
    def carved(text, size, path, depth, spacing):
        out = [f'<text {tf} font-size="{size:.1f}" letter-spacing="{spacing}" fill="{shade}" opacity=".35" filter="url(#{k}-blur3)" transform="translate(0,{depth + 4})"><textPath href="#{path}" startOffset="50%">{text}</textPath></text>']
        for i in range(depth, 0, -1):
            t = i / depth
            out.append(f'<text {tf} font-size="{size:.1f}" letter-spacing="{spacing}" fill="{ink[2] if t > .34 else ink[3] if len(ink) > 3 else ink[1]}" transform="translate(0,{i * 1.15:.2f})"><textPath href="#{path}" startOffset="50%">{text}</textPath></text>')
        out.append(f'<text {tf} font-size="{size:.1f}" letter-spacing="{spacing}" fill="url(#{k}-ink)" stroke="{ink[2]}" stroke-width=".9" filter="url(#{k}-bevel-text)"><textPath href="#{path}" startOffset="50%">{text}</textPath></text>')
        return "".join(out)
    rays = []
    nray = pal.get("rays", 48)
    for i in range(nray):
        a = i * 360 / nray + 360 / nray / 2
        long_ = i % 2 == 0
        r0 = 70
        r1 = pal.get("ray_long", 188) if long_ else pal.get("ray_short", 150)
        w = 3.4 if long_ else 2.0
        ax, ay = math.cos(math.radians(a)), math.sin(math.radians(a))
        px, py = -ay * w, ax * w
        x0, y0 = 320 + ax * r0, 320 + ay * r0
        x1, y1 = 320 + ax * r1, 320 + ay * r1
        rays.append(f'<polygon points="{P(x0 + px, y0 + py)} {P(x0 - px, y0 - py)} {P(x1, y1)}" fill="url(#{k}-gold)" opacity="{1 if long_ else .75}"/>')
    sparks = "".join(star4(*polar(r, a), s, s * .22, f"url(#{k}-gold)") for r, a, s in
                     [(178, -62, 7), (172, 28, 6), (176, 118, 7), (170, 208, 6), (150, -18, 4), (156, 72, 4), (152, 162, 4), (158, 252, 4)])
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="640" height="640" role="img" aria-label="{carve}">
<defs>
<radialGradient id="{k}-rim" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="{rim[0]}"/><stop offset=".5" stop-color="{rim[1]}"/><stop offset="1" stop-color="{rim[2]}"/></radialGradient>
<radialGradient id="{k}-face" cx="44%" cy="36%" r="72%"><stop offset="0" stop-color="{face[0]}"/><stop offset=".62" stop-color="{face[1]}"/><stop offset="1" stop-color="{face[2]}"/></radialGradient>
<linearGradient id="{k}-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{gold[0]}"/><stop offset=".45" stop-color="{gold[1]}"/><stop offset="1" stop-color="{gold[2]}"/></linearGradient>
<linearGradient id="{k}-goldv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{gold[0]}"/><stop offset=".55" stop-color="{gold[1]}"/><stop offset="1" stop-color="{gold[2]}"/></linearGradient>
<linearGradient id="{k}-ink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{ink[0]}"/><stop offset=".45" stop-color="{ink[0]}"/><stop offset="1" stop-color="{ink[1]}"/></linearGradient>
<linearGradient id="{k}-emb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{emb[0]}"/><stop offset=".55" stop-color="{emb[1]}"/><stop offset="1" stop-color="{emb[2]}"/></linearGradient>
<radialGradient id="{k}-inner" cx="50%" cy="50%" r="50%"><stop offset=".86" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="{shade}" stop-opacity="{'.42' if night else '.16'}"/></radialGradient>
<filter id="{k}-lift" x="-12%" y="-12%" width="124%" height="128%"><feDropShadow dx="0" dy="9" stdDeviation="10" flood-color="{shade}" flood-opacity="{'.55' if night else '.30'}"/></filter>
<filter id="{k}-blur3"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="{k}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 {'.1' if not night else '1'}  0 0 0 0 {'.1' if not night else '1'}  0 0 0 0 {'.15' if not night else '1'}  0 0 0 {grain_op * 9:.2f} -{grain_op * 4:.2f}"/><feComposite in2="SourceGraphic" operator="in"/></filter>
{bevel(k + "-bevel-rim", blur=5, scale=7, gloss=.9, exp=20, elev=40, shadow=shade, sop=.0, sblur=1, dy=0)}
{bevel(k + "-bevel", blur=2.4, scale=4.5, gloss=.95, exp=26, elev=46, shadow=shade, sop=.34, sblur=3.2, dy=3.4)}
{bevel(k + "-bevel-soft", blur=1.6, scale=2.6, gloss=.7, exp=30, elev=52, shadow=shade, sop=.22, sblur=2, dy=1.8)}
{bevel(k + "-bevel-hi", blur=3.4, scale=6, gloss=1.15, exp=18, elev=42, shadow=shade, sop=.38, sblur=4.5, dy=5)}
{bevel(k + "-bevel-text", blur=1.3, scale=3.2, gloss=1.1, exp=22, elev=50, shadow=shade, sop=0, sblur=1, dy=0, diffuse=True)}
<clipPath id="{k}-faceclip"><circle cx="320" cy="320" r="281"/></clipPath>
<path id="{k}-top" d="{top}"/><path id="{k}-bot" d="{bot}"/>
{pal.get("defs", "")}
</defs>
<g filter="url(#{k}-lift)">
  <circle cx="320" cy="320" r="309" fill="url(#{k}-rim)"/>
</g>
<path d="M320,11 a309,309 0 1,0 0.01,0 Z M320,37 a283,283 0 1,1 -0.01,0 Z" fill="url(#{k}-rim)" fill-rule="evenodd" filter="url(#{k}-bevel-rim)"/>
<circle cx="320" cy="320" r="294" fill="none" stroke="{gold[1]}" stroke-width="2.2" opacity=".85"/>
<circle cx="320" cy="320" r="291" fill="none" stroke="{rim[2]}" stroke-width="1" opacity=".5"/>
<circle cx="320" cy="320" r="283" fill="{rim[3]}"/>
<circle cx="320" cy="320" r="281" fill="url(#{k}-face)"/>
<g clip-path="url(#{k}-faceclip)"><rect x="30" y="30" width="580" height="580" filter="url(#{k}-grain)" fill="#fff"/></g>
<circle cx="320" cy="320" r="281" fill="url(#{k}-inner)"/>
<g filter="url(#{k}-bevel-soft)">
  <circle cx="320" cy="320" r="201" fill="none" stroke="url(#{k}-gold)" stroke-width="8"/>
  <circle cx="320" cy="320" r="190" fill="none" stroke="url(#{k}-gold)" stroke-width="2.2"/>
</g>
<g filter="url(#{k}-bevel-soft)" opacity=".95">{"".join(rays) if pal.get("rays", 48) else ""}</g>
<g filter="url(#{k}-bevel-soft)">{sparks if pal.get("sparks", True) else ""}</g>
{emblem}
<g filter="url(#{k}-bevel)">{star4(72, 320, 17, 4.6, f"url(#{k}-gold)")}{star4(568, 320, 17, 4.6, f"url(#{k}-gold)")}</g>
{carved(carve, fs, k + "-top", 8, ls)}
{carved(date, 30, k + "-bot", 4, 3)}
</svg>"""
