#!/usr/bin/env python3
"""Remonta o painel a partir da pasta fonte/.

Uso:  python atualizar.py

Lê o CSV de versão mais alta em fonte/mapeamento/ e a planilha em Viabilidade/,
recalcula as contagens e gera js/indicadores.js, js/viabilidade-dados.js e
index.html. Nada aqui depende de biblioteca externa.
"""
import csv
from collections import Counter
import os
from html.parser import HTMLParser
import hashlib
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
FONTE = RAIZ / "fonte"
sys.path.insert(0, str(FONTE))
import ler_viabilidade  # noqa: E402

COLUNAS = {
    "id": "ID", "vw": "ID no videowall", "unidade": "Unidade", "tela": "Tela",
    "menu": "Menu lateral", "card": "Card / Componente", "ind": "Indicador",
    "desc": "Descrição", "um": "U.M.", "rep": "Representação visual",
    "freq": "Frequência de atualização", "forn": "Fornecedor de Dados",
    "fonte": "Fonte de Dados", "rel": "Relatório (Fonte de extração)",
    "det": "Detalhamento (camada tática)", "alerta": "Alerta?",
    "regra": "Regra de alerta", "crit": "Critério de Alerta",
    "calc": "Cálculo", "obs": "Observação",
}


def falha(msg):
    sys.exit("ERRO: " + msg)


def csv_mais_recente():
    def versao(p):
        match = re.search(r"(\d+(?:\.\d+)*)v", p.stem)
        return tuple(map(int, match.group(1).split("."))) if match else (-1,)
    arquivos = sorted((FONTE / "mapeamento").glob("*.csv"), key=lambda p: (versao(p), p.name))
    if not arquivos:
        falha("nenhum CSV em fonte/mapeamento/.")
    caminho = arquivos[-1]
    if versao(caminho) == (-1,):
        falha("nome do CSV sem versão; use, por exemplo, indicadores_1.10v.csv.")
    return caminho, re.search(r"(\d+(?:\.\d+)*)v", caminho.stem).group(1)


def ler_indicadores(caminho):
    with open(caminho, encoding="utf-8-sig", newline="") as f:
        leitor = csv.DictReader(f)
        faltando = [c for c in COLUNAS.values() if c not in (leitor.fieldnames or [])]
        if faltando:
            falha(f"colunas ausentes no CSV: {', '.join(faltando)}")
        linhas = []
        for numero, registro in enumerate(leitor, 2):
            if None in registro or any(registro[c] is None for c in COLUNAS.values()):
                falha(f"linha {numero} do CSV tem quantidade de colunas incorreta.")
            linha = {k: registro[c].strip() for k, c in COLUNAS.items()}
            if not linha["id"]:
                falha(f"ID vazio na linha {numero} do CSV.")
            linhas.append(linha)
    if not linhas:
        falha("CSV sem indicadores.")
    repetidos = sorted(i for i, quantidade in Counter(l["id"] for l in linhas).items() if quantidade > 1)
    if repetidos:
        falha(f"IDs repetidos no CSV: {', '.join(repetidos)}")
    for l in linhas:
        m = re.match(r"(Novo|Alterado|Pendente)", l["obs"])
        l["sit"] = m.group(1) if m else ""
        l["cod"] = l["tela"].split(" - ")[0].strip()
    return linhas


def ultima_atualizacao(linhas):
    datas = set()
    for l in linhas:
        datas |= {(int(m), int(d)) for d, m in re.findall(r"\b(\d{2})/(\d{2})\b", l["obs"])}
    if not datas:
        return ""
    m, d = max(datas)
    return f"{d:02d}/{m:02d}"


def montar_telas(linhas, vw):
    telas, ordem = {}, list(vw["telas"])
    for cod in ordem:
        telas[cod] = {"cod": cod, "id": vw["telas"][cod], "titulo": "", "n": 0, "alertas": 0}
    for l in linhas:
        t = telas.get(l["cod"])
        if t is None:
            falha(f'a tela "{l["tela"]}" não existe em fonte/videowall.json. Inclua o código {l["cod"]} lá.')
        t["n"] += 1
        t["alertas"] += l["alerta"].lower().startswith("sim")
        t["titulo"] = t["titulo"] or l["menu"].split("›")[-1].strip()
    return telas


def montar_mural(grupos, telas):
    saida = []
    for g in grupos:
        lista = [telas[c] for c in g["telas"]]
        saida.append({
            "n": g.get("n", ""), "nome": g["nome"], "telas": lista,
            "ind": sum(t["n"] for t in lista),
            "alertas": sum(t["alertas"] for t in lista),
        })
    return saida


def milhoes(valor):
    return "R$ " + f"{valor / 1e6:.1f}".replace(".", ",") + " mi"


def vincular_custos(viab, etapas):
    """Liga cada item do catálogo de custos ao ponto do material que o trata (fonte/custos-vinculos.json)."""
    mapa = json.loads((FONTE / "custos-vinculos.json").read_text(encoding="utf-8"))
    paginas = {f'{e["id"]}/{p["id"]}': (FONTE / "paginas" / p["arquivo"]).read_text(encoding="utf-8")
               for e in etapas for p in e["paginas"]}

    def conferir_rota(rota, contexto):
        partes = rota.split("/")
        base = "/".join(partes[:2])
        if base not in paginas:
            falha(f"{contexto}: rota inexistente {rota}")
        if len(partes) > 2 and not re.search(r'data-(?:secao|aba)="' + re.escape(partes[2]) + '"', paginas[base]):
            falha(f"{contexto}: a página {base} não tem a seção ou aba {partes[2]}")

    por_id = {c["id"]: c for c in viab["custos"]}
    blocos, vistos = [], set()
    for b in mapa["blocos"]:
        if not re.fullmatch(r"[a-z0-9-]+", b["id"]) or b["id"] in vistos:
            falha(f"bloco de custo inválido ou repetido: {b['id']}")
        vistos.add(b["id"])
        if b["camada"] not in range(1, 10):
            falha(f"bloco {b['id']}: camada fora de 1 a 9")
        conferir_rota(b["rota"], f"bloco {b['id']}")
        pagina = "/".join(b["rota"].split("/")[:2])
        if pagina.startswith("dados/") and f'data-custo-pagina="{pagina}"' not in paginas[pagina]:
            falha(f"bloco {b['id']}: a página {pagina} não tem o resumo data-custo-pagina que mostra os blocos")
        if pagina.startswith("dados/") and b["rota"].split("/")[2:3] not in ([], ["custos"]) and f'data-custo="{b["id"]}"' not in paginas[pagina]:
            falha(f"bloco {b['id']}: a seção {b['rota']} não tem o espaço data-custo para mostrá-lo")
        for i in b["ids"]:
            if i not in por_id:
                falha(f"bloco {b['id']}: {i} não existe no catálogo da planilha")
            if "bloco" in por_id[i]:
                falha(f"{i} está em dois blocos: {por_id[i]['bloco']} e {b['id']}")
            por_id[i]["bloco"], por_id[i]["camada"] = b["id"], b["camada"]
        blocos.append({k: b[k] for k in ("id", "titulo", "camada", "rota", "ids")})
    sem_bloco = [i for i, c in por_id.items() if "bloco" not in c]
    if sem_bloco:
        falha(f"itens do catálogo sem vínculo no material: {', '.join(sem_bloco)} (inclua em fonte/custos-vinculos.json)")

    camadas = {c["n"]: c for c in viab["camadas"]}
    rotas_camada = []
    for c in mapa["camadas"]:
        conferir_rota(c["rota"], f"camada {c['n']}")
        if c["n"] not in camadas and "nome" not in c:
            falha(f"camada {c['n']} sem nome na planilha nem no mapa de vínculos")
        rotas_camada.append({"n": c["n"], "nome": c.get("nome") or camadas[c["n"]]["nome"], "rota": c["rota"]})

    fornecedores = []
    for nome, ids in mapa["fornecedores"].items():
        linha = next((f for f in viab["fornecedores"] if f["nome"].startswith(nome)), None)
        if linha is None:
            falha(f"fornecedor {nome} não está no plano de integração da planilha")
        for i in ids:
            if i not in por_id:
                falha(f"fornecedor {nome}: {i} não existe no catálogo")
        fornecedores.append({**linha, "ids": ids})
    return {"blocos": blocos, "camadas": rotas_camada, "fornecedores": fornecedores}


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    vw = json.loads((FONTE / "videowall.json").read_text(encoding="utf-8"))
    etapas = json.loads((FONTE / "etapas.json").read_text(encoding="utf-8"))
    caminho, versao = csv_mais_recente()
    linhas = ler_indicadores(caminho)
    planilhas = sorted((RAIZ / "Viabilidade").glob("*.xlsx"))
    if not planilhas:
        falha("nenhuma planilha em Viabilidade/.")
    try:
        viab, onda_por_id = ler_viabilidade.ler(planilhas[-1])
    except (ler_viabilidade.Erro, KeyError, StopIteration, ValueError) as e:
        falha(f"{planilhas[-1].name}: {e}")
    viab["vinculos"] = vincular_custos(viab, etapas)
    so_no_csv = sorted(set(l["id"] for l in linhas) - set(onda_por_id))
    if so_no_csv:
        print(f"  Atenção: {len(so_no_csv)} indicadores do CSV sem onda na planilha: {', '.join(so_no_csv[:5])}")
    for l in linhas:
        l["onda"] = onda_por_id.get(l["id"], "")
    telas = montar_telas(linhas, vw)
    tatica = montar_mural(vw["tatica"], telas)
    estrategica = montar_mural(vw["estrategica"], telas)

    versao_txt = versao
    atualizacao = ultima_atualizacao(linhas)
    nas_tvs = sum(t["ind"] for t in tatica)
    por_onda = {o: sum(l["onda"] == o for l in linhas) for o in "123"}
    estrategicos = sum(t["ind"] for t in estrategica)
    valores = {
        "total": len(linhas),
        "tvs": len(tatica),
        "nas_tvs": nas_tvs,
        "no_mural": len(linhas) - nas_tvs - estrategicos,
        "estrategicos": estrategicos,
        "alertas_taticos": sum(t["alertas"] for t in tatica),
        "alertas_total": sum(t["alertas"] for t in telas.values()),
        "total_min": "R$ " + f"{viab['cenarios']['total'][0] / 1e6:.1f}".replace(".", ",") + " mi",
        "total_max": "R$ " + f"{viab['cenarios']['total'][2] / 1e6:.1f}".replace(".", ",") + " mi",
        "onda1": por_onda["1"], "onda2": por_onda["2"], "onda3": por_onda["3"],
        "versao": versao_txt,
        "atualizacao": f"atualizações até {atualizacao}" if atualizacao else "",
        "csv": "dados/indicadores.csv",
        "planilha": planilhas[-1].name,
        "custos_itens": len(viab["custos"]),
        "custos_total": milhoes(sum(c["total"] for c in viab["custos"])),
        "custos_infra": milhoes(sum(c["total"] for c in viab["custos"] if c["camada"] <= 8)),
    }

    dados = {
        "url": vw["url"], "versao": versao_txt, "campos": list(COLUNAS) + ["sit", "cod", "onda"],
        "linhas": [[l[c] for c in list(COLUNAS) + ["sit", "cod", "onda"]] for l in linhas],
        "telas": telas, "tatica": tatica, "estrategica": estrategica,
    }
    js = "/* Gerado por atualizar.py a partir de " + caminho.name + ". Não edite à mão. */\n"
    js += "window.COE=" + json.dumps(dados, ensure_ascii=False, separators=(",", ":")) + ";\n"
    saidas = {"js/indicadores.js": js, "dados/indicadores.csv": caminho.read_text(encoding="utf-8-sig")}
    js = "/* Gerado por atualizar.py a partir de " + planilhas[-1].name + ". Não edite à mão. */\n"
    js += "window.VIAB=" + json.dumps(viab, ensure_ascii=False, separators=(",", ":")) + ";\n"
    saidas["js/viabilidade-dados.js"] = js

    blocos, estrutura = [], []
    rotas = set()
    etapas_ids = set()
    for e in etapas:
        if not re.fullmatch(r"[a-z0-9-]+", e["id"]) or e["id"] in etapas_ids:
            falha(f"etapa inválida ou repetida: {e['id']}")
        etapas_ids.add(e["id"])
        estrutura.append({"id": e["id"], "nome": e["nome"], "palavra": e.get("palavra", ""),
                          "paginas": [{"id": p["id"], "titulo": p["titulo"], "grupo": p.get("grupo", "")} for p in e["paginas"]]})
        for p in e["paginas"]:
            arq = FONTE / "paginas" / p["arquivo"]
            if not arq.exists():
                falha(f"página não encontrada: {arq.name}")
            rota = f'{e["id"]}/{p["id"]}'
            if not re.fullmatch(r"[a-z0-9-]+", p["id"]) or rota in rotas:
                falha(f"rota inválida ou repetida: {rota}")
            rotas.add(rota)
            classe = "page " + p.get("classe", "")
            if not re.fullmatch(r"[a-zA-Z0-9 _-]+", classe):
                falha(f"classe inválida na rota: {rota}")
            blocos.append(f'<article class="{classe.strip()}" id="p-{e["id"]}-{p["id"]}" hidden>\n'
                          f'{arq.read_text(encoding="utf-8")}</article>')

    html = (FONTE / "modelo.html").read_text(encoding="utf-8")
    html = html.replace("{{ESTRUTURA}}", json.dumps(estrutura, ensure_ascii=False).replace("<", "\\u003c"))
    html = html.replace("{{PAGINAS}}", "\n".join(blocos))
    for chave, valor in valores.items():
        html = html.replace("{{" + chave + "}}", str(valor))
    sobras = sorted(set(re.findall(r"\{\{(\w+)\}\}", html)))
    if sobras:
        falha(f"marcadores sem valor: {', '.join(sobras)}")

    # Valida toda a saída antes de substituir qualquer artefato publicado.
    class ValidarHTML(HTMLParser):
        def __init__(self):
            super().__init__()
            self.ids = set()

        def handle_starttag(self, tag, attrs):
            attrs = dict(attrs)
            ident = attrs.get("id")
            if ident:
                if ident in self.ids:
                    falha(f"ID HTML repetido: {ident}")
                self.ids.add(ident)
            for atributo in ("src", "href", "data-src", "data-base", "data-zoom"):
                recurso = attrs.get(atributo, "")
                if not recurso or recurso.startswith(("#", "https://", "http://", "data:", "mailto:")):
                    continue
                caminho = (RAIZ / recurso.split("?")[0].split("#")[0]).resolve()
                if not caminho.is_relative_to(RAIZ) or (not caminho.is_file() and recurso not in saidas):
                    falha(f"recurso local ausente ou fora do projeto: {recurso}")

    ValidarHTML().feed(html)

    def versionar(match):
        nome = match.group(1)
        conteudo = (saidas[nome] if nome in saidas else (RAIZ / nome).read_text(encoding="utf-8")).encode("utf-8")
        marca = hashlib.sha256(conteudo).hexdigest()[:12]
        return f'"{nome}?v={marca}"'

    # CSS viaja com o HTML: uma publicação não combina marca nova com estilos em cache.
    def incorporar_css(match):
        nome = match.group(1)
        conteudo = (RAIZ / nome).read_text(encoding="utf-8")
        if "</style" in conteudo.lower():
            falha(f"fechamento de style inesperado em {nome}")
        return '<style data-source="' + nome + '">\n' + conteudo + '\n</style>'
    html = re.sub(r'<link rel="stylesheet" href="(css/[a-zA-Z0-9_-]+\.css)">', incorporar_css, html)

    html = re.sub(r'"((?:css|js)/[a-zA-Z0-9_-]+\.(?:css|js))"', versionar, html)
    saidas["index.html"] = html
    for nome, conteudo in saidas.items():
        destino = RAIZ / nome
        temporario = destino.with_suffix(destino.suffix + ".tmp")
        temporario.write_text(conteudo, encoding="utf-8", newline="\n")
        os.replace(temporario, destino)

    print(f"Painel atualizado com {caminho.name}")
    print(f"  {len(linhas)} indicadores: {nas_tvs} nas TVs, {valores['no_mural']} no mural, {estrategicos} estratégicos")
    print(f"  {valores['alertas_total']} com alerta ({valores['alertas_taticos']} na camada tática)")
    print(f"  {len(blocos)} páginas em {len(etapas)} seções")
    print(f"  Viabilidade: {planilhas[-1].name} ({por_onda['1']}/{por_onda['2']}/{por_onda['3']} por onda)")


if __name__ == "__main__":
    main()
