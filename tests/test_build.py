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
            self.assertEqual(html.count('<article class="page'), 19)
            # A new valid CSV record must flow to the home, not just its data JS.
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
            self.assertIn('<b>417</b>', html)
            self.assertIn('Os 417 indicadores mapeados', html)

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
