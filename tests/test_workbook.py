import sys
from pathlib import Path
import tempfile
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "fonte"))
import ler_viabilidade as workbook


class WorkbookTests(unittest.TestCase):
    def test_inline_strings_work_without_shared_string_table(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "inline.xlsx"
            with zipfile.ZipFile(path, "w") as archive:
                archive.writestr("xl/workbook.xml", '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Dados" r:id="rId1"/></sheets></workbook>')
                archive.writestr("xl/_rels/workbook.xml.rels", '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')
                archive.writestr("xl/worksheets/sheet1.xml", '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Rótulo</t></is></c><c r="B1"><v>125.5</v></c></row></sheetData></worksheet>')
            self.assertEqual(workbook.abrir(path), {"Dados": {1: {"A": "Rótulo", "B": "125.5"}}})

    def test_formula_without_calculated_cache_is_rejected(self):
        import xml.etree.ElementTree as ET
        source = Path(__file__).resolve().parents[1] / "Viabilidade/COE_Holambra_Estudo_Viabilidade.xlsx"
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "no-cache.xlsx"
            with zipfile.ZipFile(source) as original, zipfile.ZipFile(path, "w") as modified:
                for name in original.namelist():
                    data = original.read(name)
                    if name == "xl/worksheets/sheet5.xml":
                        document = ET.fromstring(data)
                        cell = next(cell for cell in document.iter(workbook.N + "c") if cell.get("r") == "D127")
                        self.assertIsNotNone(cell.find(workbook.N + "f"))
                        cell.remove(cell.find(workbook.N + "v"))
                        data = ET.tostring(document)
                    modified.writestr(name, data)
            with self.assertRaisesRegex(workbook.Erro, "fórmula sem valor calculado"):
                workbook.ler(path)

    def test_invalid_numeric_value_is_not_silently_zero(self):
        with self.assertRaises(workbook.Erro):
            workbook.num("#VALUE!")
        with self.assertRaises(workbook.Erro):
            workbook.num("NaN")
        self.assertEqual(workbook.num(""), 0)
        self.assertEqual(workbook.num(None), 0)
        self.assertEqual(workbook.num("0"), 0)
        self.assertEqual(workbook.num("123.45"), 123.45)


if __name__ == "__main__":
    unittest.main()
