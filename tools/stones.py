"""Clavis's cut stones: the family's table-cut key (Ingenium's hx-stone, Carpe Diem's dock key), drawn for Clavis's
larger keys. A flat table, facets only at its edges, a lit bevel along the top, a gilt hairline round the table and a
glint of gold at two corners. The facets are drawn thinner than the family's 26px keys have them (6 of 64 rather than 8),
so that on a 40px key they are the same few pixels of lit edge and never a stripe.

    python3 -I tools/stones.py      rewrites the two stones inside src/clavis.css (onyx by day, gold by night)
"""
import base64, os, re

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, B, S = 240, 64, 6, 10            # width, height, facet band, side facet

STONES = {   # table, top facets (left, middle, right), bottom facets, left side, right side, hairline
    "onyx": ("#26262e", ("#8a8a96", "#6c6c78", "#a4a4b0"), ("#0b0b0e", "#0e0e12", "#0a0a0c"), "#55555f", "#0c0c0f", "#fff6d8"),
    "gold": ("#d6ae5c", ("#fbebb8", "#f2dc9a", "#fff3cc"), ("#7a5518", "#8a6020", "#704c12"), "#e8c785", "#6a4810", "#fff6d8"),
}


def stone(k):
    table, top, bot, left, right, hair = STONES[k]
    a, b = W * .3513, W * .6487
    p = lambda pts, fill, op=None: '<polygon points="%s" fill="%s"%s/>' % (" ".join("%g,%g" % xy for xy in pts), fill, ' opacity="%s"' % op if op else "")
    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" preserveAspectRatio="none" shape-rendering="crispEdges">' % (W, H),
           '<rect x="%d" y="%d" width="%d" height="%d" fill="%s"/>' % (S, B, W - 2 * S, H - 2 * B, table),
           p([(0, 0), (a, 0), (a, B), (S, B)], top[0]), p([(0, H), (a, H), (a, H - B), (S, H - B)], bot[0]),
           p([(a, 0), (b, 0), (b, B), (a, B)], top[1]), p([(a, H), (b, H), (b, H - B), (a, H - B)], bot[1]),
           p([(b, 0), (W, 0), (W - S, B), (b, B)], top[2]), p([(b, H), (W, H), (W - S, H - B), (b, H - B)], bot[2]),
           p([(0, 0), (S, B), (S, H - B), (0, H)], left), p([(W, 0), (W - S, B), (W - S, H - B), (W, H)], right),
           '<rect x="%d" y="%d" width="%d" height="%d" fill="none" stroke="%s" stroke-width="1" opacity=".38"/>' % (S, B, W - 2 * S, H - 2 * B, hair),
           p([(0, 0), (40, 0), (37, B), (S, B)], "#e8c785", ".30"), p([(200, H), (W, H), (W - S, H - B), (203, H - B)], "#c9a15a", ".26"),
           p([(0, 0), (26, 0), (23, B), (S, B)], "#fff6d8", ".55"),
           '<rect width="%d" height="%d" fill="#c98a3a" opacity=".055"/></svg>' % (W, H)]
    return "data:image/svg+xml;base64," + base64.b64encode("".join(out).encode()).decode()


def main():
    p = os.path.join(HERE, "src", "clavis.css")
    s = open(p, encoding="utf-8").read()
    n = 0
    for k, base in (("onyx", "#26262e"), ("gold", "#d6ae5c")):
        s, c = re.subn(r'(background:%s url\(")data:image/svg\+xml;base64,[A-Za-z0-9+/=]+("\))' % re.escape(base), lambda m: m.group(1) + stone(k) + m.group(2), s)
        n += c
    open(p, "w", encoding="utf-8").write(s)
    print("stones rewritten:", n)


if __name__ == "__main__":
    main()
