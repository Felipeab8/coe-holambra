"""API real com SQLite temporário; nenhuma alteração na publicação de trabalho."""
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
try:
    from servidor import create_app
except ModuleNotFoundError as exc:
    if exc.name != "servidor":
        raise
    create_app = None

HEADERS = {"X-COE-Editor": "1", "Origin": "http://localhost"}


class EditorServerTests(unittest.TestCase):
    def setUp(self):
        self.assertTrue(callable(create_app), "Falta implementar create_app em servidor.py")
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.env = patch.dict("os.environ", {"COE_PUBLIC_ORIGIN": ""})
        self.env.start()
        self.addCleanup(self.env.stop)
        self.app = create_app(data_dir=self.tmp.name)
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def payload(self, revision=0, **changes):
        return {"revision": revision, "content": {}, "room": {}, "cameras": {}, **changes}

    def put(self, payload, client=None, headers=None):
        return (client or self.client).put("/api/editor/state", json=payload,
                                         headers=HEADERS if headers is None else headers)

    def upload(self, image=None, filename="foto.png"):
        if image is None:
            image = BytesIO()
            Image.new("RGB", (12, 8), "red").save(image, "PNG")
            image.seek(0)
        response = self.client.post("/api/editor/uploads", data={"file": (image, filename)}, headers=HEADERS)
        self.addCleanup(response.close)
        self.addCleanup(response.request.environ["wsgi.input"].close)
        return response

    def test_initial_state_has_no_overrides(self):
        response = self.client.get("/api/editor/state")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {"schema": 1, "revision": 0, "updatedAt": None,
                                        "content": {}, "room": {}, "cameras": {}})
        self.assertIn("no-store", response.headers["Cache-Control"])

    def test_server_marks_html_and_does_not_cache_storage_detection(self):
        for path in ["/", "/sala-coe-3d/index.html", "/holambra-avare-3d/index.html"]:
            response = self.client.get(path)
            self.addCleanup(response.close)
            self.assertTrue(b'<meta name="coe-editor-storage" content="server">' in response.data,
                            "O HTML servido precisa identificar o armazenamento online")
            self.assertIn("no-store", response.headers["Cache-Control"])

    def test_seed_snapshot_is_imported_only_on_first_boot(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "site"
            (source / "dados").mkdir(parents=True)
            seed = source / "dados" / "edicoes.json"
            seed.write_text(json.dumps({"schema": 1, "revision": 7, "updatedAt": None,
                                        "content": {"a": "importado"}, "room": {}, "cameras": {}}), encoding="utf-8")
            with patch("servidor.ROOT", source):
                app = create_app(data_dir=Path(tmp) / "storage")
                state = app.test_client().get("/api/editor/state").json
                self.assertEqual(state["revision"], 0)
                self.assertEqual(state["content"], {"a": "importado"})
                self.assertEqual(self.put(self.payload(content={"a": "publicado"}), app.test_client()).status_code, 200)
                seed.write_text("{invalid", encoding="utf-8")
                reopened = create_app(data_dir=Path(tmp) / "storage")
                self.assertEqual(reopened.test_client().get("/api/editor/state").json["content"], {"a": "publicado"})

    def test_invalid_seed_cannot_silently_replace_original_state(self):
        with tempfile.TemporaryDirectory() as tmp:
            source = Path(tmp) / "site"
            (source / "dados").mkdir(parents=True)
            (source / "dados" / "edicoes.json").write_text('{"content": {"a": 8}}', encoding="utf-8")
            with patch("servidor.ROOT", source), self.assertRaisesRegex(ValueError, "edicoes.json"):
                create_app(data_dir=Path(tmp) / "storage")

    def test_anonymous_publication_persists_across_clients_and_restart(self):
        data = self.payload(content={"text:home:123:0": "Olá <script>texto</script>"},
                            room={"objects": {"mesa-1": {"x": 2, "scale": 1.5}},
                                  "appearance": {"wallColor": "#FFEEDD"}})
        result = self.put(data)
        self.assertEqual(result.status_code, 200, result.json)
        self.assertEqual(result.json["revision"], 1)
        self.assertTrue(result.json["updatedAt"].endswith("Z"))
        reopened = create_app(data_dir=self.tmp.name).test_client().get("/api/editor/state")
        self.assertEqual(reopened.json, result.json)
        self.assertEqual(reopened.json["content"], data["content"])

    def test_stale_revision_never_overwrites_other_editor(self):
        self.assertEqual(self.put(self.payload(content={"a": "primeiro"})).status_code, 200)
        stale = self.put(self.payload(content={"a": "atrasado"}))
        self.assertEqual(stale.status_code, 409)
        self.assertEqual(self.client.get("/api/editor/state").json["content"], {"a": "primeiro"})

    def test_parallel_publications_have_exactly_one_winner(self):
        def publish(value):
            with self.app.test_client() as client:
                return self.put(self.payload(content={"a": value}), client).status_code
        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(publish, ["A", "B"]))
        self.assertEqual(sorted(results), [200, 409])
        self.assertEqual(self.client.get("/api/editor/state").json["revision"], 1)

    def test_history_restoration_creates_new_revision(self):
        self.put(self.payload(content={"a": "primeiro"}))
        self.put(self.payload(1, content={"a": "segundo"}))
        past = self.client.get("/api/editor/history/1").json
        self.assertEqual(past["content"], {"a": "primeiro"})
        restored = self.put(self.payload(2, content=past["content"], room=past["room"], cameras=past["cameras"]))
        self.assertEqual(restored.json["revision"], 3)
        self.assertEqual(self.client.get("/api/editor/history/2").json["content"], {"a": "segundo"})

    def test_history_is_bounded_to_latest_100_snapshots(self):
        for revision in range(105):
            self.assertEqual(self.put(self.payload(revision, content={"a": str(revision)})).status_code, 200)
        history = self.client.get("/api/editor/history").json["revisions"]
        self.assertEqual(len(history), 100)
        self.assertEqual(history[0]["revision"], 105)
        self.assertEqual(history[-1]["revision"], 6)
        self.assertEqual(self.client.get("/api/editor/history/5").status_code, 404)

    def test_write_requires_editor_header_same_origin_and_json(self):
        for headers in [{}, {"Origin": "http://localhost"}, {"X-COE-Editor": "1"},
                        {**HEADERS, "Origin": "https://malicioso.example"},
                        {**HEADERS, "Origin": "null"},
                        {**HEADERS, "Sec-Fetch-Site": "cross-site"},
                        {**HEADERS, "Sec-Fetch-Site": "same-site"}]:
            with self.subTest(headers=headers):
                self.assertEqual(self.put(self.payload(), headers=headers).status_code, 403)
        response = self.client.put("/api/editor/state", data=json.dumps(self.payload()),
                                   content_type="text/plain", headers=HEADERS)
        self.assertEqual(response.status_code, 415)
        self.assertNotIn("Access-Control-Allow-Origin", response.headers)

    def test_untrusted_host_is_rejected(self):
        self.assertEqual(self.client.get("/api/editor/state", headers={"Host": "evil.example"}).status_code, 400)

    def test_configured_public_origin_works_behind_tls_proxy_without_trusting_forwarded_headers(self):
        with patch.dict("os.environ", {"COE_PUBLIC_ORIGIN": "https://coe.example"}):
            client = create_app(data_dir=self.tmp.name).test_client()
        result = self.put(self.payload(), client, {"Host": "coe.example", "Origin": "https://coe.example", "X-COE-Editor": "1"})
        self.assertEqual(result.status_code, 200)
        spoof = self.put(self.payload(1), client, {"Host": "coe.example", "Origin": "https://evil.example", "X-Forwarded-Host": "evil.example", "X-COE-Editor": "1"})
        self.assertEqual(spoof.status_code, 403)

    def test_malformed_and_oversized_payloads_do_not_mutate_state(self):
        invalid = [[], None, self.payload(revision=True), self.payload(revision=-1),
                   self.payload(content={"a": 1}), self.payload(content={"a": "x" * 20001}),
                   self.payload(content={"__proto__": "unsafe"}), self.payload(room=[]),
                   self.payload(content={str(i): "" for i in range(15001)})]
        for data in invalid:
            with self.subTest(data=str(data)[:100]):
                response = self.client.put("/api/editor/state", data=json.dumps(data), content_type="application/json", headers=HEADERS)
                self.assertEqual(response.status_code, 400, response.json)
        large = self.payload(content={str(i): "x" * 20000 for i in range(160)})
        self.assertEqual(self.put(large).status_code, 413)
        self.assertEqual(self.client.get("/api/editor/state").json["revision"], 0)

    def test_room_accepts_full_editor_shape(self):
        room = {"objects": {"mesa-1": {"x": -10, "y": 0, "z": 5, "rotation": 90, "scale": 1.2,
                                        "visible": False, "name": "Mesa", "description": "Supervisão", "items": ["Notebook"]}},
                "added": [{"id": "added-1", "kind": "screen", "x": 0, "y": 1, "z": 0}],
                "appearance": {"wallColor": "#123ABC", "floorColor": "#444444", "accentColor": "#008833"}}
        result = self.put(self.payload(room=room))
        self.assertEqual(result.status_code, 200, result.json)
        self.assertEqual(result.json["room"], room)

    def test_invalid_room_geometry_types_and_object_limits_are_rejected(self):
        rooms = [{"objects": {"a": {"x": float("nan")}}}, {"objects": {"a": {"x": 51}}},
                 {"objects": {"a": {"y": True}}}, {"objects": {"a": {"scale": 0}}},
                 {"objects": {"a": {"visible": "false"}}}, {"objects": {"a": {"rotation": 361}}},
                 {"appearance": {"wallColor": "url(javascript:alert(1))"}},
                 {"added": [{"id": "x", "kind": "script"}]},
                 {"added": [{"id": "x", "kind": {}}]},
                 {"objects": {"a": {"x": 10 ** 500}}},
                 {"added": [{"id": "x", "kind": "desk"}, {"id": "x", "kind": "chair"}]},
                 {"objects": {str(i): {} for i in range(301)}}]
        for room in rooms:
            with self.subTest(room=str(room)[:100]):
                self.assertEqual(self.put(self.payload(room=room)).status_code, 400)

    def test_legacy_camera_snapshot_round_trips(self):
        cameras = {"cam-1": {"a": "rec", "d": "Portaria", "p": [10, 20, 7], "t": [50, 20, 2],
                             "pole": True, "status": "ok", "obs": "Verificada", "isNew": False,
                             "deleted": False, "by": None, "byName": "", "at": 1794000000000}}
        result = self.put(self.payload(cameras=cameras))
        self.assertEqual(result.status_code, 200, result.json)
        self.assertEqual(result.json["cameras"], cameras)
        cameras["cam-1"]["p"] = [1, 2, float("inf")]
        self.assertEqual(self.put(self.payload(1, cameras=cameras)).status_code, 400)

    def test_upload_reencodes_image_strips_metadata_and_deduplicates(self):
        result = self.upload()
        self.assertEqual(result.status_code, 201, result.json)
        self.assertRegex(result.json["url"], r"^uploads/[a-f0-9]{64}\.webp$")
        again = self.upload()
        self.assertEqual(again.json, result.json)
        response = self.client.get("/" + result.json["url"])
        self.assertEqual(response.mimetype, "image/webp")
        self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
        with Image.open(BytesIO(response.data)) as decoded:
            self.assertEqual(decoded.format, "WEBP")
            self.assertEqual(decoded.size, (12, 8))
            self.assertNotIn("exif", decoded.info)
        response.close()
        self.assertEqual(len(list((Path(self.tmp.name) / "uploads").glob("*.webp"))), 1)

    def test_upload_rejects_svg_corruption_and_large_or_huge_image(self):
        for content, name in [(b'<svg><script>alert(1)</script></svg>', "x.svg"),
                              (b"not an image", "x.png"), (b"x" * (5 * 1024 * 1024 + 1), "x.png")]:
            with self.subTest(name=name, size=len(content)):
                self.assertIn(self.upload(BytesIO(content), name).status_code, (400, 413, 415))
        huge = BytesIO()
        Image.new("1", (5000, 5000)).save(huge, "PNG")
        huge.seek(0)
        self.assertEqual(self.upload(huge).status_code, 413)
        self.assertEqual(list((Path(self.tmp.name) / "uploads").iterdir()), [])

    def test_upload_quota_enforced_and_duplicate_still_works(self):
        first = self.upload()
        self.app.config["COE_UPLOAD_QUOTA_BYTES"] = 1
        self.assertEqual(self.upload().json, first.json)
        different = BytesIO()
        Image.new("RGB", (12, 8), "blue").save(different, "JPEG")
        different.seek(0)
        self.assertEqual(self.upload(different, "b.jpg").status_code, 507)

    def test_upload_requires_same_origin_and_editor_header(self):
        result = self.client.post("/api/editor/uploads", data={"file": (BytesIO(b"x"), "x.png")})
        self.assertEqual(result.status_code, 403)

    def test_only_explicit_public_resources_are_served(self):
        for path in ["/", "/index.html", "/css/painel.css", "/js/painel.js", "/sala-coe-3d/", "/sala-coe-3d/modelo.js", "/holambra-avare-3d/index.html", "/img/marca/holambra.svg", "/dados/f14.jpg", "/Viabilidade/COE_Holambra_Estudo_Viabilidade.xlsx"]:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
                response.close()
        for path in ["/servidor.py", "/.env", "/.git/config", "/README.md", "/requirements.txt", "/fonte/painel.html", "/tests/test_editor_server.py", "/editor.sqlite3", "/uploads/../editor.sqlite3", "/img/../../servidor.py", "/img/%2e%2e/%2e%2e/servidor.py", "/img/%5c..%5cservidor.py", "/dados/secret.sqlite3", "/Viabilidade/privado.docx"]:
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 404)

    def test_separate_data_directories_have_independent_states(self):
        self.put(self.payload(content={"a": "publicado"}))
        with tempfile.TemporaryDirectory() as other:
            separate = create_app(data_dir=other).test_client()
            self.assertEqual(separate.get("/api/editor/state").json["revision"], 0)


if __name__ == "__main__":
    unittest.main()
