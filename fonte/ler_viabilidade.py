"""Lê a planilha do estudo de viabilidade sem depender de biblioteca externa.

As linhas são localizadas pelo rótulo da coluna A, não pelo número da linha:
assim, inserir uma linha na planilha não muda o resultado. Se um rótulo sumir,
a leitura para com erro em vez de publicar um número errado.
"""
import re
import math
import posixpath
import zipfile
import xml.etree.ElementTree as ET

N = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
RID = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
PONTOS = {"Baixa": 1, "Baixo": 1, "Média": 2, "Médio": 2, "Alta": 3, "Alto": 3}


def abrir(caminho):
    try:
        with zipfile.ZipFile(caminho) as z:
            comuns = []
            if "xl/sharedStrings.xml" in z.namelist():
                comuns = ["".join(t.text or "" for t in si.iter(N + "t"))
                          for si in ET.fromstring(z.read("xl/sharedStrings.xml"))]
            wb = ET.fromstring(z.read("xl/workbook.xml"))
            rels = {r.get("Id"): r.get("Target") for r in ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))}
            abas = {}
            for s in wb.find(N + "sheets"):
                alvo = rels[s.get(RID + "id")]
                alvo = alvo.lstrip("/") if alvo.startswith("/") else posixpath.normpath("xl/" + alvo)
                if not alvo.startswith("xl/"):
                    raise Erro("referência de aba fora do workbook")
                linhas = {}
                for c in ET.fromstring(z.read(alvo)).iter(N + "c"):
                    if c.get("t") == "e":
                        raise Erro(f"erro de cálculo em {s.get('name')}!{c.get('r')}")
                    if c.get("t") == "inlineStr":
                        valor = "".join(t.text or "" for t in c.iter(N + "t"))
                    else:
                        v = c.find(N + "v")
                        if v is None or v.text in (None, ""):
                            if c.find(N + "f") is not None and c.get("t") != "str":
                                raise Erro(f"fórmula sem valor calculado em {s.get('name')}!{c.get('r')}; recalcule e salve a planilha antes de gerar")
                            continue
                        valor = comuns[int(v.text)] if c.get("t") == "s" else v.text
                    m = re.fullmatch(r"([A-Z]+)(\d+)", c.get("r", ""))
                    if not m:
                        raise Erro("célula sem referência válida")
                    linhas.setdefault(int(m.group(2)), {})[m.group(1)] = valor
                abas[s.get("name")] = linhas
            return abas
    except (zipfile.BadZipFile, KeyError, IndexError, ET.ParseError, ValueError) as exc:
        raise Erro(f"estrutura XLSX inválida: {exc}") from exc


class Erro(Exception):
    pass


def linha(aba, rotulo, depois=0):
    """Primeira linha, após `depois`, cuja coluna A começa com `rotulo`."""
    for n in sorted(aba):
        if n > depois and aba[n].get("A", "").strip().startswith(rotulo):
            return n
    raise Erro(f'rótulo não encontrado na planilha: "{rotulo}"')


def num(x):
    if x is None or x == "":
        return 0.0
    try:
        valor = float(x)
    except (TypeError, ValueError) as exc:
        raise Erro(f"valor numérico inválido na planilha: {x!r}") from exc
    if not math.isfinite(valor):
        raise Erro(f"valor numérico não finito na planilha: {x!r}")
    return valor


def faixa(aba, regex, cols):
    """Todas as linhas cujo ID (coluna A) casa com `regex`."""
    saida = []
    for n in sorted(aba):
        if re.fullmatch(regex, aba[n].get("A", "").strip()):
            saida.append({k: aba[n].get(c, "") for k, c in cols.items()})
    return saida


def tabela(aba, cabecalho, cols, depois=0):
    """Linhas logo abaixo de um cabeçalho, até a primeira linha vazia."""
    n = linha(aba, cabecalho, depois) + 1
    saida = []
    while n in aba and aba[n].get("A", "").strip():
        saida.append({k: aba[n].get(c, "") for k, c in cols.items()})
        n += 1
    return saida


def criticidade(p):
    return "Crítico" if p >= 9 else "Alto" if p >= 6 else "Médio" if p >= 3 else "Baixo"


def ondas(abas):
    """ID do indicador -> onda, pela lista da aba 02."""
    saida = {}
    aba = abas["02_Tecnologia_Integracoes"]
    cab = next(n for n in sorted(aba) if "Onda COE" in aba[n].values())
    col = next(c for c, v in aba[cab].items() if v == "Onda COE")
    for n in sorted(aba):
        i = aba[n].get("A", "")
        if n > cab and i.startswith("AVR-"):
            saida[i] = aba[n].get(col, "").replace("Onda ", "")
    return saida


def catalogo(a4, v):
    """Catálogo de custos da aba 04, conferido contra o total do catálogo, os cenários e os pacotes."""
    ini = linha(a4, "CATÁLOGO DE CUSTOS")
    cab = linha(a4, "ID", ini)
    nomes = {"pilar": "Pilar", "sub": "Subpilar", "item": "Item / pacote", "espec": "Especificação-base", "grupo": "Grupo de custo",
             "tipo": "Tipo", "un": "Unid.", "qtd": "Qtd. base", "unit_b": "Unit. baixo", "unit": "Unit. base", "unit_a": "Unit. alto",
             "baixo": "Total baixo", "total": "Total base", "alto": "Total alto", "opex": "OPEX anual em regime", "ini": "Início",
             "fim": "Fim", "c0": "Mínimo", "c1": "Recomendado", "c2": "Completo", "plano": "ID iniciativa", "valor": "Tipo de valor",
             "obs": "Observação crítica", "pacote": "Pacote de contratação"}
    col = {}
    for k, rot in nomes.items():
        achou = [c for c, t in a4[cab].items() if t.strip() == rot] or [c for c, t in a4[cab].items() if t.strip().startswith(rot)]
        if len(achou) != 1:
            raise Erro(f'coluna "{rot}" ausente ou repetida no catálogo de custos')
        col[k] = achou[0]
    itens, fim = [], None
    for n in sorted(a4):
        if n <= cab:
            continue
        lin = a4[n]
        if any(str(t).strip().startswith("TOTAL DO CATÁLOGO") for t in lin.values()):
            fim = lin
            break
        if not re.fullmatch(r"C\d{3}", lin.get("A", "").strip()):
            continue
        x = {"id": lin["A"].strip()}
        for k, c in col.items():
            x[k] = lin.get(c, "").strip() if isinstance(lin.get(c, ""), str) else lin.get(c, "")
        for k in ("qtd", "unit_b", "unit", "unit_a", "baixo", "total", "alto", "opex"):
            x[k] = num(x[k])
        x["cen"] = [x.pop(k) == "S" for k in ("c0", "c1", "c2")]
        x["plano"] = str(int(num(x["plano"]))) if x["plano"] not in ("", None) else ""
        if not (re.fullmatch(r"A[1-3] Q[1-4]", x["ini"]) and re.fullmatch(r"A[1-3] Q[1-4]", x["fim"])):
            raise Erro(f'{x["id"]}: trimestre fora do padrão ({x["ini"]} a {x["fim"]})')
        if abs(x["qtd"] * x["unit"] - x["total"]) > 1:
            raise Erro(f'{x["id"]}: quantidade × preço unitário não bate com o total base')
        itens.append(x)
    if fim is None:
        raise Erro('rótulo não encontrado na planilha: "TOTAL DO CATÁLOGO"')
    if len({x["id"] for x in itens}) != len(itens):
        raise Erro("ID de custo repetido no catálogo")
    for k in ("baixo", "total"):
        if abs(sum(x[k] for x in itens) - num(fim.get(col[k]))) > 1:
            raise Erro(f"a soma dos itens ({k}) não bate com o TOTAL DO CATÁLOGO")
    # cada grupo, em cada cenário, precisa fechar com a tabela de cenários que o material mostra
    for g in v["grupos"]:
        for i in range(3):
            soma = sum(x["total"] for x in itens if x["grupo"] == g["nome"] and x["cen"][i])
            if abs(soma - g["v"][i]) > 1:
                raise Erro(f'"{g["nome"]}", cenário {v["cenarios"]["nomes"][i]}: itens somam {soma:.0f}, a tabela de cenários diz {g["v"][i]:.0f}')
    pacotes = {p["nome"]: int(num(p["itens"])) for p in v["pacotes"]}
    for nome, q in pacotes.items():
        if sum(x["pacote"] == nome for x in itens) != q:
            raise Erro(f'pacote "{nome}": a quantidade de itens não bate com o catálogo')
    sem = [x["id"] for x in itens if x["pacote"] not in pacotes]
    if sem:
        raise Erro(f"itens sem pacote de contratação conhecido: {', '.join(sem)}")
    return itens


def ler(caminho):
    abas = abrir(caminho)
    a0 = abas["00_Visao_Executiva"]
    a1 = abas["01_Plano_Mestre"]
    a2 = abas["02_Tecnologia_Integracoes"]
    a3 = abas["03_Governanca_Validacao"]
    a4 = abas["04_Business_Case"]
    a5 = abas["05_Implantacao_Imperio"]
    a6 = abas["06_Roadmap_Imperio"]
    v = {"fonte": caminho.name}

    v["parecer_texto"] = a0[linha(a0, "PARECER CONSOLIDADO") + 1]["A"]
    v["parecer"] = tabela(a0, "Dimensão", {"dim": "A", "evid": "B", "cond": "C", "par": "D", "gate": "E", "dono": "F"})
    v["recomendacao"] = a0[linha(a0, "Recomendação:")]["A"].replace("Recomendação: ", "")
    v["validacao"] = a0[linha(a0, "Status da validação")]["B"]
    v["catalogo"] = {
        k: {"itens": num(a0[n].get("B")), "total": num(a0[n].get("C")), "pct": num(a0[n].get("D"))}
        for k, n in (("QQP", linha(a0, "QQP")), ("Estimado", linha(a0, "Estimado")))
    }

    ini = linha(a4, "CENÁRIOS DE INVESTIMENTO")
    trio = lambda r: [num(a4[linha(a4, r, ini)].get(c)) for c in "DEF"]
    v["grupos"] = [{"nome": n, "v": trio(n)} for n in (
        "Camada de dados, BI e integrações", "SCADA, historiador e licenças",
        "Mapa de memória, módulos e gateways", "Rede OT, servidores e nobreak",
        "Instrumentação complementar", "Sala do COE e videowall",
        "Serviços (projeto, integração, treinamento)", "Equipe do COE (OPEX)")]
    v["cenarios"] = {
        "nomes": ["Mínimo", "Recomendado", "Completo"], "ondas": ["Onda 1", "Ondas 1 e 2", "Ondas 1, 2 e 3"],
        "direto": trio("Custo direto 3 anos"), "baixa": trio("Faixa baixa do custo direto"),
        "alta": trio("Faixa alta do custo direto"), "invest": trio("Investimento (CAPEX + serviços)"),
        "opex_impl": trio("OPEX durante a implantação"), "conting": trio("Contingência sobre investimento"),
        "total": trio("TOTAL REFERENCIAL 3 ANOS"), "opex": trio("OPEX anual em regime"),
        "info": trio("Informações automáticas no painel"),
        "payback3": trio("Benefício anual mínimo p/ payback"),
    }
    n = linha(a4, "DESEMBOLSO TRIMESTRAL")
    cab = linha(a4, "Cenário", n)
    cols = list("DEFGHIJKLMNO")
    v["desembolso"] = {
        "tri": [a4[cab][c] for c in cols],
        "serie": {nome: [num(a4[linha(a4, nome, cab)].get(c)) for c in cols] for nome in v["cenarios"]["nomes"]},
    }
    v["beneficios"] = tabela(a4, "Benefício", {"nome": "A", "var": "B", "evid": "C", "formula": "I", "resp": "J"}, linha(a4, "MODELO DE BENEFÍCIOS"))
    v["beneficios"] = [b for b in v["beneficios"] if not b["nome"].startswith("TOTAL")]

    n = linha(a4, "VIABILIDADE ECONÔMICA")
    r = linha(a4, "% do benefício pleno", n)
    fluxo = {"rampa": [num(a4[r].get(c)) for c in "JKLMN"], "taxa": num(a4[linha(a4, "Taxa de desconto", n)].get("J")),
             "custos": {}, "equilibrio": {}}
    for nome in v["cenarios"]["nomes"]:
        b = linha(a4, "Cenário " + nome, n)
        fluxo["custos"][nome] = [-num(a4[linha(a4, "(−) Custos", b)].get(c)) for c in "JKLMN"]
        fluxo["equilibrio"][nome] = num(a4[linha(a4, "Benefício anual pleno necessário", b)].get("J"))
    v["fluxo"] = fluxo

    v["pacotes"] = tabela(a4, "Pacote", {"nome": "A", "modo": "D", "itens": "G", "min": "J", "rec": "K", "comp": "L", "gate": "N"}, linha(a4, "PACOTES DE CONTRATAÇÃO"))
    v["pacotes"] = [p for p in v["pacotes"] if p["nome"][0].isdigit()]

    v["prioridade"] = faixa(a5, r"I\d\d", {"id": "A", "nome": "B", "tipo": "C", "dep": "D", "imp": "E", "esf": "F", "cpx": "G", "usa": "H", "score": "I", "ordem": "J", "fase": "K", "leitura": "L"})
    v["roadmap"] = faixa(a6, r"I\d\d", {"id": "A", "nome": "B", "fase": "C", "tipo": "D", "ini": "E", "fim": "F", "marco": "S"})
    v["dependencias"] = faixa(a6, r"D\d", {"id": "A", "dep": "B", "porque": "C"})
    v["gates"] = faixa(a3, r"G\d", {"id": "A", "etapa": "B", "cond": "C", "evid": "D", "tri": "E", "aprov": "F"})
    v["pendencias"] = sorted(faixa(a3, r"P\d\d", {"id": "A", "tema": "B", "item": "C", "resp": "D", "prazo": "E", "impacto": "F"}), key=lambda p: p["id"])

    riscos = faixa(a3, r"R\d\d", {"id": "A", "risco": "B", "prob": "C", "imp": "D", "mitig": "H", "dono": "I"})
    riscos += faixa(a5, r"R\d\d", {"id": "A", "risco": "C", "prob": "E", "imp": "F", "mitig": "H", "dono": "K"})
    for x in riscos:
        x["pont"] = PONTOS[x["prob"]] * PONTOS[x["imp"]]
        x["crit"] = criticidade(x["pont"])
    v["riscos"] = riscos
    v["oportunidades"] = faixa(a5, r"O\d\d", {"id": "A", "item": "C", "acao": "H", "dono": "K"})

    v["plano"] = faixa(a1, r"\d+", {"id": "A", "pilar": "B", "sub": "C", "nome": "D", "entrega": "E", "prio": "F", "onda": "G", "ini": "H", "fim": "I", "resp": "J", "dep": "K", "custo": "L", "kpi": "M", "aceite": "N", "status": "O"})
    for x in v["plano"]:
        x["custo"] = num(x["custo"])
        if not (re.fullmatch(r"A[1-3] Q[1-4]", x["ini"]) and re.fullmatch(r"A[1-3] Q[1-4]", x["fim"])):
            raise Erro(f'iniciativa {x["id"]}: trimestre fora do padrão ({x["ini"]} a {x["fim"]})')
    total_plano = next(num(l.get("L")) for l in a1.values() if l.get("D", "").startswith("TOTAL VINCULADO"))
    if abs(sum(x["custo"] for x in v["plano"]) - total_plano) > 1:
        raise Erro("a soma das iniciativas não bate com o total vinculado ao plano")

    sec = lambda titulo: linha(a2, titulo)
    so_custo = lambda t: [x for x in t if re.fullmatch(r"C\d{3}", x["id"])]
    cat = {"id": "A", "item": "B", "qtd": "C", "un": "D", "unit": "E", "total": "F", "ini": "G", "obs": "H"}
    v["sala"] = {
        "opcoes": [o for o in tabela(a2, "Opção", {"nome": "A", "grade": "C", "mon": "D", "larg": "E", "alt": "F", "inv": "G", "ind": "H"}, sec("OPÇÕES DE VIDEOWALL")) if re.fullmatch(r"\d+ x \d+", o["grade"])],
        "telas": so_custo(tabela(a2, "ID custo", {**cat, "tipo": "I", "cont": "J", "cen": "K"}, sec("INVENTÁRIO DE TELAS"))),
        "zonas": [z for z in tabela(a2, "Zona", {"nome": "A", "area": "C", "cont": "D", "req": "H"}, sec("ZONEAMENTO")) if not z["nome"].startswith("Área total")],
        "tv": tabela(a2, "Critério", {"crit": "A", "tv": "B", "mon": "E", "rec": "H"}, sec("TV COMERCIAL")),
        "tv_conclusao": a2[sec("TV COMERCIAL") + 1]["A"].replace("Conclusão: ", ""),
        # o título da seção também começa com "Elemento": só entram linhas com ID de custo
        "benchmark": [b for b in tabela(a2, "Elemento", {"el": "A", "ref": "B", "app": "D", "cls": "H", "id": "I"}, sec("BENCHMARK"))
                      if re.fullmatch(r"C\d{3}", b["id"].strip())],
    }
    v["catalogo_itens"] = {
        "infra": so_custo(tabela(a2, "ID custo", cat, sec("INFRAESTRUTURA FÍSICA"))),
        "instrumentos": so_custo(tabela(a2, "ID custo", cat, sec("SENSORIAMENTO E INSTRUMENTAÇÃO"))),
        "sistemas": so_custo(tabela(a2, "ID custo", cat, sec("SISTEMAS, AUTOMAÇÃO E REDE OT"))),
    }
    v["normas"] = tabela(a2, "Requisito", {"req": "A", "onde": "B", "gate": "G"}, sec("SEGURANÇA E NORMAS"))

    v["custos"] = catalogo(a4, v)
    v["camadas"] = [{"n": int(c["nome"].split(".")[0]), "nome": re.sub(r"^\d+\.\s*", "", c["nome"]), "comp": c["comp"], "hoje": c["hoje"],
                     "entrega": c["entrega"], "resp": c["resp"], "onda": c["onda"]}
                    for c in tabela(a2, "Camada", {"nome": "A", "comp": "B", "hoje": "C", "entrega": "D", "resp": "E", "onda": "F"}, sec("CADEIA DO DADO"))
                    if re.match(r"\d+\.\s", c["nome"])]
    v["fornecedores"] = tabela(a2, "Fornecedor", {"nome": "A", "tipo": "B", "etapa": "C", "ctrl": "D", "prio": "G", "acao": "H", "hw": "J", "onda": "K"},
                               sec("PLANO DE INTEGRAÇÃO POR FORNECEDOR"))

    # O mesmo item aparece nas abas 02 e 04: os dois lugares precisam dizer a mesma coisa.
    por_id = {c["id"]: c for c in v["custos"]}
    for grupo in v["catalogo_itens"].values():
        for x in grupo:
            c = por_id.get(x["id"])
            if c is None:
                raise Erro(f'{x["id"]} está na aba 02 e não está no catálogo da aba 04')
            if abs(num(x["total"]) - c["total"]) > 1 or abs(num(x["qtd"]) - c["qtd"]) > .01:
                raise Erro(f'{x["id"]}: quantidade ou total diferente entre as abas 02 e 04')

    obrig = {"prioridade": 16, "gates": 8, "dependencias": 5, "riscos": 20, "beneficios": 7, "pacotes": 7, "parecer": 9, "plano": 60, "normas": 6,
             "custos": 60, "camadas": 8, "fornecedores": 12}
    for k, q in obrig.items():
        if len(v[k]) < q:
            raise Erro(f"esperava ao menos {q} linhas em {k}, achei {len(v[k])}")
    for nome, t, q in (("opções de videowall", v["sala"]["opcoes"], 3), ("zonas da sala", v["sala"]["zonas"], 4),
                       ("inventário de telas", v["sala"]["telas"], 5), ("infraestrutura", v["catalogo_itens"]["infra"], 20),
                       ("instrumentação", v["catalogo_itens"]["instrumentos"], 8), ("sistemas", v["catalogo_itens"]["sistemas"], 15)):
        if len(t) < q:
            raise Erro(f"esperava ao menos {q} linhas em {nome}, achei {len(t)}")
    return v, ondas(abas)
