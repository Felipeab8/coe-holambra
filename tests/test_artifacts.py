from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import unittest
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids = []
        self.references = []
        self.feed(text)

    def handle_starttag(self, tag, attributes):
        attributes = dict(attributes)
        if attributes.get("id"):
            self.ids.append(attributes["id"])
        for name in ("src", "href", "data-src", "data-base", "data-zoom"):
            if attributes.get(name):
                self.references.append(attributes[name])


class ArtifactTests(unittest.TestCase):
    def test_each_published_document_has_unique_ids_and_existing_local_resources(self):
        for filename in ("index.html", "arq3d/index.html", "holambra-avare-3d/index.html"):
            with self.subTest(document=filename):
                path = ROOT / filename
                document = Document(path.read_text(encoding="utf-8"))
                self.assertEqual([name for name, count in Counter(document.ids).items() if count > 1], [])
                for reference in document.references:
                    url = urlsplit(reference)
                    if url.scheme or url.netloc or not url.path:
                        continue
                    target = (path.parent / unquote(url.path)).resolve()
                    self.assertTrue(target.is_relative_to(ROOT) and target.is_file(), f"{filename}: {reference}")

    def test_generated_html_has_no_unresolved_markers(self):
        import re
        self.assertEqual(re.findall(r"\{\{\w+\}\}", (ROOT / "index.html").read_text(encoding="utf-8")), [])


if __name__ == "__main__":
    unittest.main()
