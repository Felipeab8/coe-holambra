"""Redesenha a ilustração da tela inicial. Uso: python fonte/gerar_paisagem.py fonte/paginas/00-01-objetivo-do-coe.html"""
import math, random, re, pathlib, sys
W, H, HZ = 1920, 820, 470


def n(v):
    return f"{v:.1f}".rstrip('0').rstrip('.')


def ruido(seed, amps):
    r = random.Random(seed)
    ps = [(a, f, r.uniform(0, 6.3)) for a, f in amps]
    return lambda x: sum(a * math.sin(x / f + p) for a, f, p in ps)


def crista(base, fn, passo=14):
    pts = [f"{x} {n(base + fn(x))}" for x in range(-14, W + 28, passo)]
    return "M" + "L".join(pts) + f"L{W+14} {H}L-14 {H}Z"


def mata(x0, x1, base, rmin, rmax, seed, alt=1.1):
    r = random.Random(seed)
    x = x0
    d = f"M{x0} {base+60}L{x0} {base}"
    while x < x1:
        a = r.uniform(rmin, rmax)
        x2 = x + a * 1.5
        y = base + r.uniform(-a * .3, a * .3)
        d += f"A{n(a)} {n(a*alt)} 0 0 1 {n(x2)} {n(y)}"
        x = x2
    return d + f"L{n(x)} {base+60}Z"


def silo(x, w, topo, base, ladder=False):
    cx, r, e = x + w / 2, w / 2, w * .1
    s = [f'<path fill="url(#ps-aco)" d="M{n(x)} {n(topo)}V{n(base)}Q{n(cx)} {n(base+e*2)} {n(x+w)} {n(base)}V{n(topo)}Z"/>']
    d = ""
    for g in (-70, -50, -30, -10, 10, 30, 50, 70):
        px = cx + r * math.sin(math.radians(g))
        d += f"M{n(px)} {n(topo)}V{n(base)}"
    s.append(f'<path d="{d}" stroke="var(--ps-anel)" stroke-width=".7" opacity=".32" fill="none"/>')
    d = ""
    an = 9
    for i in range(1, an):
        y = topo + (base - topo) * i / an
        d += f"M{n(x)} {n(y)}Q{n(cx)} {n(y+e*2)} {n(x+w)} {n(y)}"
    s.append(f'<path d="{d}" stroke="var(--ps-anel)" stroke-width="1" opacity=".5" fill="none"/>')
    ap = topo - w * .36
    s.append(f'<path fill="url(#ps-teto)" d="M{n(x-3)} {n(topo+1)}Q{n(cx)} {n(topo+e*2+1)} {n(x+w+3)} {n(topo+1)}L{n(cx+7)} {n(ap)}H{n(cx-7)}Z"/>')
    d = ""
    for f in (-.75, -.45, -.15, .15, .45, .75):
        d += f"M{n(cx+f*7)} {n(ap)}L{n(cx+f*(r+3))} {n(topo+e*2*(1-f*f)+1)}"
    s.append(f'<path d="{d}" stroke="var(--ps-anel)" stroke-width=".8" opacity=".55" fill="none"/>')
    s.append(f'<rect x="{n(cx-8)}" y="{n(ap-7)}" width="16" height="8" rx="2" fill="var(--ps-metal)"/>')
    if ladder:
        lx = x + w * .8
        s.append(f'<path d="M{n(lx)} {n(topo+6)}V{n(base)}M{n(lx+6)} {n(topo+6)}V{n(base)}" stroke="var(--ps-metal)" stroke-width="1.1" opacity=".7"/>')
    return "".join(s)


def trelica(x0, y0, x1, y1, alt, passos):
    """Galeria de transporte: dois banzos e diagonais."""
    d = f"M{n(x0)} {n(y0)}L{n(x1)} {n(y1)}M{n(x0)} {n(y0+alt)}L{n(x1)} {n(y1+alt)}"
    for i in range(passos):
        a, b = i / passos, (i + 1) / passos
        xa, ya = x0 + (x1 - x0) * a, y0 + (y1 - y0) * a
        xb, yb = x0 + (x1 - x0) * b, y0 + (y1 - y0) * b
        d += f"M{n(xa)} {n(ya+alt)}L{n(xb)} {n(yb)}L{n(xb)} {n(yb+alt)}"
    return d


o = []
A = o.append
A(f'<svg class="lh-paisagem" viewBox="0 40 {W} {H-40}" preserveAspectRatio="xMaxYMin slice" aria-hidden="true">')
A('<defs>')
paradas = ''.join(f'<stop offset="{p}" stop-color="var(--ps-c{i})"/>' for i, p in ((1, 0), (2, .34), (3, .62), (4, .84), (5, 1)))
A(f'<linearGradient id="ps-ceu" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="{HZ+30}">{paradas}</linearGradient>')
A('<radialGradient id="ps-halo"><stop offset="0" stop-color="var(--ps-halo)" stop-opacity=".95"/><stop offset=".3" stop-color="var(--ps-halo)" stop-opacity=".42"/><stop offset="1" stop-color="var(--ps-halo)" stop-opacity="0"/></radialGradient>')
A('<linearGradient id="ps-aco" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="var(--ps-a1)"/><stop offset=".16" stop-color="var(--ps-a2)"/><stop offset=".58" stop-color="var(--ps-a3)"/><stop offset="1" stop-color="var(--ps-a4)"/></linearGradient>')
A('<linearGradient id="ps-teto" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="var(--ps-t1)"/><stop offset="1" stop-color="var(--ps-t2)"/></linearGradient>')
A(f'<linearGradient id="ps-campo" gradientUnits="userSpaceOnUse" x1="0" y1="{HZ}" x2="0" y2="{H}"><stop offset="0" stop-color="var(--ps-f1)"/><stop offset=".3" stop-color="var(--ps-f2)"/><stop offset="1" stop-color="var(--ps-f3)"/></linearGradient>')
A(f'<linearGradient id="ps-sulco" gradientUnits="userSpaceOnUse" x1="0" y1="{HZ+14}" x2="0" y2="{H-60}"><stop offset="0" stop-color="var(--ps-s)" stop-opacity="0"/><stop offset="1" stop-color="var(--ps-s)" stop-opacity=".3"/></linearGradient>')
A(f'<linearGradient id="ps-mn" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="{HZ}"><stop offset="0" stop-color="#fff" stop-opacity=".25"/><stop offset=".6" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient>')
A(f'<linearGradient id="ps-mb" gradientUnits="userSpaceOnUse" x1="0" y1="150" x2="0" y2="{HZ}"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff"/></linearGradient>')
A(f'<mask id="ps-mba" maskUnits="userSpaceOnUse" x="0" y="150" width="{W}" height="{HZ-150}"><rect y="150" width="{W}" height="{HZ-150}" fill="url(#ps-mb)"/></mask>')
A(f'<mask id="ps-mnu" maskUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{HZ}"><rect width="{W}" height="{HZ}" fill="url(#ps-mn)"/></mask>')


def nuvem(i, freq, seed, g, k, cor):
    A(f'<filter id="ps-nv{i}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">'
      f'<feTurbulence type="fractalNoise" baseFrequency="{freq}" numOctaves="5" seed="{seed}"/>'
      f'<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 {g} 0 0 0 {k}" result="a"/>'
      f'<feFlood flood-color="var({cor})"/><feComposite in2="a" operator="in"/></filter>')


nuvem(1, ".0022 .017", 11, 3.4, -1.62, "--ps-n1")
nuvem(2, ".0034 .036", 4, 3.8, -1.92, "--ps-n2")
A('<filter id="ps-gr" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 .9 0 0 0 -.32"/></filter>')
A('<filter id="ps-bl" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter>')
A('</defs>')

# céu, estrelas, sol e nuvens
A(f'<rect width="{W}" height="{H}" fill="url(#ps-ceu)"/>')
r = random.Random(5)
d = "".join(f"M{r.randrange(W)} {n(r.uniform(0, 300))}h.01" for _ in range(120))
A(f'<path d="{d}" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity="var(--ps-estrela)"/>')
SX, SY = 880, 432
A(f'<ellipse cx="{SX}" cy="{SY}" rx="900" ry="300" fill="url(#ps-halo)"/>')
A(f'<circle cx="{SX}" cy="{SY}" r="38" fill="var(--ps-sol)"/>')
A(f'<g mask="url(#ps-mnu)"><rect width="{W}" height="{HZ}" filter="url(#ps-nv1)"/><g mask="url(#ps-mba)"><rect y="150" width="{W}" height="{HZ-150}" filter="url(#ps-nv2)"/></g></g>')

# serras e matas ao fundo
A(f'<path fill="var(--ps-r1)" d="{crista(424, ruido(2, [(16,240),(8,97),(3,41)]))}"/>')
A(f'<path fill="var(--ps-r2)" d="{crista(446, ruido(8, [(13,300),(6,120),(2.4,47)]))}"/>')
A(f'<path fill="var(--ps-m1)" d="{mata(-20, 800, 462, 9, 22, 31)}{mata(1040, 1950, 464, 8, 18, 32)}"/>')

# fila de silos de trás
B = 494

# armazém graneleiro
ax0, ax1, ay, at = 1010, 1236, 432, 392
A(f'<path fill="var(--ps-g2)" d="M{ax0-6} {ay}Q{(ax0+ax1)/2} {at-26} {ax1+6} {ay}Z"/>')
d = "".join(f"M{x} {n(ay - (1-((x-(ax0+ax1)/2)/((ax1-ax0)/2+6))**2) * (ay-at+1) * .94)}V{ay}" for x in range(ax0 + 6, ax1, 15))
A(f'<path d="{d}" stroke="var(--ps-anel)" stroke-width=".8" opacity=".42" fill="none"/>')
A(f'<rect x="{ax0}" y="{ay}" width="{ax1-ax0}" height="{B-ay+4}" fill="var(--ps-g1)"/>')
d = "".join(f"M{x} {ay}V{B}" for x in range(ax0 + 6, ax1, 6))
A(f'<path d="{d}" stroke="var(--ps-anel)" stroke-width=".7" opacity=".3" fill="none"/>')
for x in (1050, 1112, 1174):
    A(f'<rect x="{x}" y="456" width="34" height="42" fill="var(--ps-metal)" opacity=".7"/>')

# secador com vapor
A(f'<rect x="1250" y="262" width="56" height="{B-262+4}" fill="url(#ps-aco)"/>')
d = "".join(f"M1250 {y}h56" for y in range(274, B, 9))
A(f'<path d="{d}" stroke="var(--ps-anel)" stroke-width="1" opacity=".55"/>')
A('<path d="M1262 262v-26h32v26ZM1270 236v-16h16v16Z" fill="var(--ps-metal)"/>')
A('<ellipse cx="1296" cy="176" rx="46" ry="30" fill="var(--ps-n1)" opacity=".34" filter="url(#ps-bl)"/><ellipse cx="1338" cy="134" rx="66" ry="30" fill="var(--ps-n1)" opacity=".2" filter="url(#ps-bl)"/>')

# elevador
ex = 1328
d = f"M{ex} 206V{B}M{ex+26} 206V{B}"
y, lado = 206, 0
while y < B:
    d += f"M{ex if lado else ex+26} {y}L{ex+26 if lado else ex} {y+16}M{ex} {y}h26"
    y += 16
    lado ^= 1
A(f'<path d="{d}" stroke="var(--ps-metal)" stroke-width="2" fill="none"/>')
A(f'<rect x="{ex-13}" y="178" width="52" height="28" fill="var(--ps-g1)"/><path d="M{ex-16} 178h58l-7-10h-44Z" fill="var(--ps-t2)"/>')

# galeria do armazém ao elevador, silos da frente e passarela sobre eles
A(f'<path d="{trelica(1124, 382, ex-4, 216, 11, 16)}" stroke="var(--ps-metal)" stroke-width="1.5" fill="none"/>')
for i in range(5):
    A(silo(1362 + i*104, 98, 276, B + 4, ladder=i in (0, 3)))
A(f'<path d="{trelica(ex+26, 216, 1852, 216, 9, 34)}" stroke="var(--ps-metal)" stroke-width="1.4" fill="none"/>')

# luzes (só no escuro)
luzes = [(ex+13, 192), (1034, 446), (1096, 446), (1158, 446), (1220, 446), (1278, 300), (1278, 380)] + [(1411 + i*104, 222) for i in range(5)]
d = "".join(f'<circle cx="{x}" cy="{y}" r="22" fill="var(--ps-luz-c)" opacity=".2" filter="url(#ps-bl)"/>' for x, y in luzes[:6])
pontos = "".join(f"M{x} {y}h.01" for x, y in luzes)
A(f'<g opacity="var(--ps-luz)">{d}<path d="{pontos}" stroke="var(--ps-luz-c)" stroke-width="3.6" stroke-linecap="round"/></g>')

# vegetação junto da base
A(f'<path fill="var(--ps-m2)" d="{mata(-20, 1010, 484, 7, 16, 41)}{mata(1000, 1950, 496, 5, 11, 42)}"/>')

# campo com linhas de plantio em perspectiva
ft = ruido(14, [(9, 330), (4, 120)])
campo = crista(HZ + 32, ft, 24)
A(f'<clipPath id="ps-cp"><path d="{campo}"/></clipPath>')
A(f'<path fill="url(#ps-campo)" d="{campo}"/>')
VX, VY = 1360, HZ - 10
d = ""
for i in range(-26, 34):
    a = VX + (i * abs(i) * 16 + i * 46)
    j = i + .46
    b = VX + (j * abs(j) * 16 + j * 46)
    d += f"M{VX} {VY}L{n(a)} {H}L{n(b)} {H}Z"
A(f'<path clip-path="url(#ps-cp)" fill="url(#ps-sulco)" d="{d}"/>')
A(f'<rect width="{W}" height="{H}" filter="url(#ps-gr)" opacity=".07"/>')
A('</svg>')

svg = "\n    ".join(o)
p = pathlib.Path(sys.argv[1])
s = p.read_text(encoding='utf-8')
s, c = re.subn(r'<svg class="lh-paisagem".*?</svg>', lambda m: svg, s, count=1, flags=re.S)
assert c == 1
p.write_text(s, encoding='utf-8')
print(len(svg), 'bytes')
