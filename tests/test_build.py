"""Contratos de geração; usa cópias temporárias e fixtures, nunca altera a fonte real."""
import csv
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import atualizar


class BuildTests(unittest.TestCase):
    def test_csv_version_1_10_wins_over_1_9(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp)
            (source / "mapeamento").mkdir()
            for version in ("1.9", "1.10", "1.5"):
                (source / "mapeamento" / f"indicadores_{version}v.csv").touch()
            with patch.object(atualizar, "FONTE", source):
                self.assertEqual(atualizar.csv_mais_recente()[0].name, "indicadores_1.10v.csv")

    def fixture_csv(self, path, rows):
        with path.open("w", encoding="utf-8", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=list(atualizar.COLUNAS.values()))
            writer.writeheader()
            writer.writerows(rows)

    def test_blank_indicator_id_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "bad.csv"
            self.fixture_csv(path, [{"ID": "", "Indicador": "Sem ID"}])
            with self.assertRaisesRegex(SystemExit, "ID vazio"):
                atualizar.ler_indicadores(path)

    def test_duplicate_indicator_ids_are_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "bad.csv"
            self.fixture_csv(path, [{"ID": "X"}, {"ID": "X"}])
            with self.assertRaisesRegex(SystemExit, "IDs repetidos"):
                atualizar.ler_indicadores(path)

    def test_ragged_csv_has_a_clear_error(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "bad.csv"
            path.write_text(",".join(atualizar.COLUNAS.values()) + "\nX,curta\n", encoding="utf-8")
            with self.assertRaisesRegex(SystemExit, "linha 2"):
                atualizar.ler_indicadores(path)

    def test_current_workbook_and_csv_counts_are_preserved(self):
        rows = atualizar.ler_indicadores(atualizar.csv_mais_recente()[0])
        data, waves = atualizar.ler_viabilidade.ler(next((ROOT / "Viabilidade").glob("*.xlsx")))
        self.assertEqual(len(rows), 416)
        self.assertEqual([sum(waves.get(row["id"]) == wave for row in rows) for wave in "123"], [300, 79, 37])
        self.assertEqual(len(data["cenarios"]["total"]), 3)
        self.assertTrue(all(value > 0 for value in data["cenarios"]["total"]))

    def test_cost_catalog_matches_the_workbook_and_every_item_is_linked(self):
        data, _ = atualizar.ler_viabilidade.ler(next((ROOT / "Viabilidade").glob("*.xlsx")))
        self.assertEqual(len(data["custos"]), 83)
        self.assertAlmostEqual(sum(c["total"] for c in data["custos"]), 12473406, delta=1)
        # a soma dos itens de cada cenário é o custo direto que o capítulo de viabilidade mostra
        for i in range(3):
            self.assertAlmostEqual(sum(c["total"] for c in data["custos"] if c["cen"][i]), data["cenarios"]["direto"][i], delta=1)
        etapas = __import__("json").loads((ROOT / "fonte/etapas.json").read_text(encoding="utf-8"))
        links = atualizar.vincular_custos(data, etapas)
        ids = [i for b in links["blocos"] for i in b["ids"]]
        self.assertEqual(sorted(ids), sorted(c["id"] for c in data["custos"]))
        self.assertEqual(len(ids), len(set(ids)))
        self.assertTrue(all(c["bloco"] and 1 <= c["camada"] <= 9 for c in data["custos"]))
        self.assertEqual({c["n"] for c in links["camadas"]}, set(range(1, 10)))
        self.assertEqual(len(links["fornecedores"]), 12)
        # o videowall da sala traz os mesmos valores da planilha
        sala = next(b for b in links["blocos"] if b["id"] == "sala-videowall")
        self.assertIn("C005", sala["ids"])
        monitor = next(c for c in data["custos"] if c["id"] == "C005")
        self.assertEqual((monitor["qtd"], monitor["unit"], monitor["total"]), (6, 6100, 36600))

    def test_every_indicator_has_its_own_light_and_dark_thumbnail(self):
        js = (ROOT / "js/indicadores.js").read_text(encoding="utf-8")
        data = __import__("json").loads(js[js.index("=") + 1:js.rindex(";")])
        ids = [l[0] for l in data["linhas"]]
        recortes = __import__("json").loads((ROOT / "fonte/miniaturas-kpi.json").read_text(encoding="utf-8"))["indicadores"]
        self.assertEqual(sorted(recortes), sorted(ids))
        self.assertEqual(sorted(data["mini"]), sorted(ids))
        for ind, (w, h) in data["mini"].items():
            self.assertTrue(0 < w <= 720 and 0 < h <= 720, ind)
            for tema in ("claro", "escuro"):
                self.assertEqual((ROOT / "img/kpi" / f"{ind}-{tema}.webp").read_bytes()[8:12], b"WEBP", f"{ind}-{tema}")
        # o recorte usado na miniatura também vai para o destaque dentro da tela
        self.assertEqual(data["recorte"]["AVR-REC-A01"], {"alvo": ".kpi-tag-bloco", "tem": "Com tag"})
        self.assertIn("balão", data["miniNota"]["AVR-REC-G05"])

    def test_cost_links_reject_unknown_duplicate_or_missing_items(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "site"
            shutil.copytree(ROOT, target, ignore=shutil.ignore_patterns("__pycache__", "node_modules", ".git", "test-results"))
            path = target / "fonte/custos-vinculos.json"
            original = path.read_text(encoding="utf-8")
            for old, new, message in (('"ids": ["C052"]', '"ids": ["C052", "C999"]', "C999"),
                                      ('"ids": ["C052"]', '"ids": ["C052", "C053"]', "dois blocos"),
                                      ('"ids": ["C052"]', '"ids": []', "C052"),
                                      ('"rota": "dados/diagnostico-de-campo/recepcao-e-moegas"', '"rota": "dados/diagnostico-de-campo/inexistente"', "inexistente")):
                path.write_text(original.replace(old, new, 1), encoding="utf-8")
                result = subprocess.run([sys.executable, "atualizar.py"], cwd=target, capture_output=True)
                self.assertNotEqual(result.returncode, 0, old)
                self.assertIn(message, result.stdout.decode("utf-8") + result.stderr.decode("utf-8"))

    def test_generation_is_deterministic_and_keeps_home(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "site"
            shutil.copytree(ROOT, target, ignore=shutil.ignore_patterns("__pycache__", "node_modules", ".git", "test-results"))
            def build():
                result = subprocess.run([sys.executable, "atualizar.py"], cwd=target, capture_output=True)
                self.assertEqual(result.returncode, 0, result.stderr.decode("utf-8", errors="replace"))
                return [(target / name).read_bytes() for name in ("index.html", "js/indicadores.js", "js/viabilidade-dados.js")]
            first = build()
            self.assertEqual(first, build())
            html = first[0].decode("utf-8")
            self.assertTrue('class="hm-hero full"' in html, 'home do redesign ausente')
            self.assertIn('id="p-inicio-objetivo-do-coe"', html)
            self.assertEqual(html.count('<article class="page'), 18)
            # A new valid CSV record must flow to the KPI content, not just its data JS.
            csv_path = next((target / "fonte/mapeamento").glob("*.csv"))
            with csv_path.open(encoding="utf-8-sig", newline="") as stream:
                reader = csv.DictReader(stream)
                fieldnames = reader.fieldnames
                rows = list(reader)
            extra = dict(rows[0]); extra["ID"] = "TEST-NEW-RECORD"; rows.append(extra)
            with csv_path.open("w", encoding="utf-8", newline="") as stream:
                writer = csv.DictWriter(stream, fieldnames=fieldnames)
                writer.writeheader(); writer.writerows(rows)
            html = build()[0].decode("utf-8")
            self.assertNotIn('hm-stats', html.split('<article class="page hm-root"')[1].split('</article>')[0])
            self.assertIn('Os 417 indicadores do mapeamento', html)

    def test_resource_versions_are_stable_across_platform_newlines(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "site"
            shutil.copytree(ROOT, target, ignore=shutil.ignore_patterns("__pycache__", "node_modules", ".git", "test-results"))
            stylesheet = target / "css/home.css"
            content = stylesheet.read_text(encoding="utf-8")
            generated = []
            for newline in ("\n", "\r\n"):
                stylesheet.write_bytes(content.replace("\n", newline).encode("utf-8"))
                result = subprocess.run([sys.executable, "atualizar.py"], cwd=target, capture_output=True)
                self.assertEqual(result.returncode, 0)
                generated.append((target / "index.html").read_bytes())
            self.assertTrue(generated[0] == generated[1], "resource versions must not depend on checkout line endings")

    def test_invalid_page_does_not_overwrite_generated_data(self):
        with tempfile.TemporaryDirectory() as tmp:
            target = Path(tmp) / "site"
            shutil.copytree(ROOT, target, ignore=shutil.ignore_patterns("__pycache__", "node_modules", ".git", "test-results"))
            files = ("index.html", "js/indicadores.js", "js/viabilidade-dados.js")
            before = [(target / name).read_bytes() for name in files]
            # Trigger changed data before the missing-template validation.
            csv_path = next((target / "fonte/mapeamento").glob("*.csv"))
            csv_path.write_text(csv_path.read_text(encoding="utf-8-sig").replace("Avaré", "Unidade de teste"), encoding="utf-8")
            (target / "fonte/paginas/00-01-objetivo-do-coe.html").unlink()
            result = subprocess.run([sys.executable, "atualizar.py"], cwd=target, capture_output=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(before, [(target / name).read_bytes() for name in files])


if __name__ == "__main__":
    unittest.main()
