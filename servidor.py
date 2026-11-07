"""Publicação anônima compartilhada, no mesmo endereço do painel COE.

Executar: python servidor.py. Configure COE_PUBLIC_ORIGIN para um domínio público
e mantenha COE_DATA_DIR em volume persistente fora da pasta do código.
Não há autenticação: qualquer pessoa com acesso ao site pode publicar.
"""
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
from io import BytesIO
import json
import math
import os
from pathlib import Path, PurePosixPath
import re
import sqlite3
import tempfile
from urllib.parse import urlsplit
import warnings

from flask import Flask, abort, jsonify, make_response, request, send_file
from PIL import Image, ImageOps, UnidentifiedImageError
from werkzeug.exceptions import HTTPException

ROOT = Path(__file__).resolve().parent
MAX_STATE_BYTES = 3 * 1024 * 1024
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
MAX_REQUEST_BYTES = MAX_UPLOAD_BYTES + 128 * 1024
MAX_IMAGE_PIXELS = 20_000_000
HISTORY_LIMIT = 100
ID = re.compile(r"[A-Za-z0-9_-]{1,100}\Z")
CONTENT_KEY = re.compile(r"[A-Za-z0-9:_./-]{1,200}\Z")
HASH_IMAGE = re.compile(r"[a-f0-9]{64}\.webp\Z")
UNSAFE_KEYS = {"__proto__", "prototype", "constructor"}
ROOM_KINDS = {"desk", "chair", "screen", "rack", "table", "plant"}
CAMERA_AREAS = {"rec", "cla", "moe", "for", "sil", "exp"}
PUBLIC_DIRS = {
    "css": {".css"}, "js": {".js"},
    "img": {".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"},
    "dados": {".png", ".jpg", ".jpeg", ".webp", ".csv"},
    "arq3d": {".html", ".js", ".css"},
    "sala-coe-3d": {".html", ".js", ".css", ".webp", ".png", ".jpg"},
    "holambra-avare-3d": {".html", ".js", ".css", ".webp", ".png", ".jpg"},
}
PUBLIC_FILES = {"index.html", "dados/edicoes.json", "Viabilidade/COE_Holambra_Estudo_Viabilidade.xlsx"}


def invalid(message):
    abort(400, description=message)


def mapping(value, label, limit):
    if not isinstance(value, dict) or len(value) > limit or any(key in UNSAFE_KEYS for key in value):
        invalid(f"{label}: objeto inválido ou limite excedido.")


def text_value(value, limit, label):
    if not isinstance(value, str) or len(value) > limit:
        invalid(f"{label}: texto inválido ou longo demais.")
    try:
        value.encode("utf-8")
    except UnicodeEncodeError:
        invalid(f"{label}: caracteres inválidos.")


def identifier(value):
    if not isinstance(value, str) or not ID.fullmatch(value) or value in UNSAFE_KEYS:
        invalid("Identificador inválido.")


def number(value, low, high, label):
    if type(value) not in (int, float) or not low <= value <= high or not math.isfinite(value):
        invalid(f"{label}: número fora dos limites.")


def room_object(value, added=False):
    mapping(value, "Objeto da sala", 15)
    allowed = {"x", "y", "z", "rotation", "scale", "visible", "name", "description", "items"}
    if added:
        allowed |= {"id", "kind", "sourceId"}
        identifier(value.get("id"))
        if not isinstance(value.get("kind"), str) or value["kind"] not in ROOM_KINDS:
            invalid("Tipo de equipamento inválido.")
        if "sourceId" in value:
            identifier(value["sourceId"])
    if set(value) - allowed:
        invalid("Campo desconhecido no objeto da sala.")
    for key, low, high in [("x", -50, 50), ("y", -20, 20), ("z", -50, 50),
                           ("rotation", -360, 360), ("scale", 0.2, 3)]:
        if key in value:
            number(value[key], low, high, key)
    if "visible" in value and type(value["visible"]) is not bool:
        invalid("Visibilidade inválida.")
    for key, limit in [("name", 200), ("description", 5000)]:
        if key in value:
            text_value(value[key], limit, key)
    if "items" in value:
        if not isinstance(value["items"], list) or len(value["items"]) > 50:
            invalid("Lista de itens inválida.")
        for item in value["items"]:
            text_value(item, 1000, "Item")


def validate_room(room):
    mapping(room, "Sala", 3)
    if set(room) - {"objects", "added", "appearance"}:
        invalid("Campo desconhecido na sala.")
    objects, added = room.get("objects", {}), room.get("added", [])
    mapping(objects, "Objetos", 300)
    if not isinstance(added, list) or len(objects) + len(added) > 300:
        invalid("A sala permite até 300 objetos.")
    for key, value in objects.items():
        identifier(key)
        room_object(value)
    ids = set(objects)
    for value in added:
        room_object(value, added=True)
        if value["id"] in ids:
            invalid("Identificador duplicado na sala.")
        ids.add(value["id"])
    appearance = room.get("appearance", {})
    mapping(appearance, "Aparência", 3)
    for key, value in appearance.items():
        if key not in {"wallColor", "floorColor", "accentColor"} or not isinstance(value, str) or not re.fullmatch(r"#[a-fA-F0-9]{6}", value):
            invalid("Cor inválida. Use #RRGGBB.")


def validate_cameras(cameras):
    mapping(cameras, "Câmeras", 300)
    for key, value in cameras.items():
        identifier(key)
        mapping(value, "Câmera", 13)
        allowed = {"a", "d", "p", "t", "pole", "status", "obs", "isNew", "deleted", "by", "byName", "at"}
        if set(value) - allowed or not {"a", "d", "p", "t"} <= set(value):
            invalid("Campos da câmera inválidos.")
        if not isinstance(value["a"], str) or value["a"] not in CAMERA_AREAS:
            invalid("Área da câmera inválida.")
        text_value(value["d"], 120, "Descrição da câmera")
        for field in ("p", "t"):
            vector = value[field]
            if not isinstance(vector, list) or len(vector) != 3:
                invalid("Vetor da câmera inválido.")
            for coordinate in vector:
                number(coordinate, -10000, 10000, "Coordenada da câmera")
        for field in ("pole", "isNew", "deleted"):
            if field in value and type(value[field]) is not bool:
                invalid("Marcador da câmera inválido.")
        if "status" in value and (not isinstance(value["status"], str) or value["status"] not in {"validar", "ok", "ajustar"}):
            invalid("Situação da câmera inválida.")
        for field, limit in [("obs", 500), ("byName", 200)]:
            if field in value:
                text_value(value[field], limit, field)
        if value.get("by") is not None:
            text_value(value["by"], 200, "Autor")
        if value.get("at") is not None:
            number(value["at"], 0, 100_000_000_000_000, "Data")


def validate_payload(data):
    mapping(data, "Publicação", 4)
    if set(data) != {"revision", "content", "room", "cameras"}:
        invalid("Informe revision, content, room e cameras.")
    if type(data["revision"]) is not int or not 0 <= data["revision"] < 2 ** 53:
        invalid("Revisão inválida.")
    mapping(data["content"], "Conteúdo", 15000)
    for key, value in data["content"].items():
        if not CONTENT_KEY.fullmatch(key):
            invalid("Chave de conteúdo inválida.")
        text_value(value, 20000, "Conteúdo")
    validate_room(data["room"])
    validate_cameras(data["cameras"])


def canonical_origin(value):
    """Não confia em Forwarded/X-Forwarded-* para autorizar gravação."""
    try:
        parsed = urlsplit(value)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password or parsed.path not in {"", "/"} or parsed.query or parsed.fragment:
            raise ValueError("Origem inválida")
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        return parsed.scheme, parsed.hostname.lower(), port
    except (ValueError, TypeError):
        return None


def create_app(data_dir=None):
    app = Flask(__name__, static_folder=None)
    app.url_map.redirect_defaults = False
    public_origin = os.environ.get("COE_PUBLIC_ORIGIN", "").strip()
    origin = canonical_origin(public_origin) if public_origin else None
    if public_origin and origin is None:
        raise ValueError("COE_PUBLIC_ORIGIN deve ser a origem completa, por exemplo https://coe.exemplo.com")
    storage = Path(data_dir or os.environ.get("COE_DATA_DIR") or ROOT.parent / "coe-holambra-data").expanduser().resolve()
    # Um volume dentro de um diretório público nunca pode servir de banco.
    for dirname in PUBLIC_DIRS:
        if storage.is_relative_to((ROOT / dirname).resolve()):
            raise ValueError("COE_DATA_DIR deve ficar fora dos diretórios públicos.")
    storage.mkdir(parents=True, exist_ok=True)
    uploads = storage / "uploads"
    uploads.mkdir(exist_ok=True)
    database = storage / "editor.sqlite3"
    app.config.update(
        MAX_CONTENT_LENGTH=MAX_REQUEST_BYTES, MAX_FORM_MEMORY_SIZE=64 * 1024, MAX_FORM_PARTS=2,
        TRUSTED_HOSTS=[origin[1]] if origin else ["localhost", "127.0.0.1", "[::1]"],
        COE_DATA_DIR=str(storage), COE_PUBLIC_ORIGIN=public_origin,
        COE_UPLOAD_QUOTA_BYTES=100 * 1024 * 1024, COE_UPLOAD_MAX_FILES=500,
    )

    @contextmanager
    def connection():
        db = sqlite3.connect(database, timeout=10)
        # DELETE evita arquivo WAL crescendo entre checkpoints/backups. O SQLite
        # recicla páginas das revisões podadas; o teto é cerca de 430 MiB.
        db.execute("PRAGMA max_page_count = 110000")
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    initial = {"schema": 1, "revision": 0, "updatedAt": None, "content": {}, "room": {}, "cameras": {}}
    with connection() as db:
        db.execute("CREATE TABLE IF NOT EXISTS snapshots (revision INTEGER PRIMARY KEY, updated_at TEXT, payload TEXT NOT NULL)")
        db.execute("BEGIN IMMEDIATE")
        if db.execute("SELECT 1 FROM snapshots LIMIT 1").fetchone() is None:
            seed_path = ROOT / "dados" / "edicoes.json"
            if seed_path.is_file():
                try:
                    if seed_path.stat().st_size > MAX_STATE_BYTES:
                        raise ValueError("Limite de tamanho excedido")
                    seed = json.loads(seed_path.read_text(encoding="utf-8"))
                    if not isinstance(seed, dict) or seed.get("schema") != 1:
                        raise ValueError("Schema inválido")
                    candidate = {"revision": 0, **{key: seed[key] for key in ("content", "room", "cameras")}}
                    validate_payload(candidate)
                    initial.update(candidate)
                except (ValueError, KeyError, RecursionError, HTTPException) as error:
                    raise ValueError("dados/edicoes.json inválido; corrija a publicação antes de iniciar um banco novo.") from error
            db.execute("INSERT OR IGNORE INTO snapshots VALUES (0, NULL, ?)", (json.dumps(initial),))

    @app.before_request
    def request_limits_and_origin():
        if request.path == "/api/editor/state":
            request.max_content_length = MAX_STATE_BYTES
        if request.path.startswith("/api/editor/") and request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            expected = origin or canonical_origin(request.host_url)
            supplied = canonical_origin(request.headers.get("Origin", ""))
            if request.headers.get("X-COE-Editor") != "1" or not supplied or supplied != expected or request.headers.get("Sec-Fetch-Site", "same-origin") not in {"same-origin", "none"}:
                abort(403, description="Publique pelo editor aberto no mesmo endereço do painel.")
            # No domínio público, preserve Host no proxy; não aceite portas/origens alternativas.
            if origin and canonical_origin(origin[0] + "://" + request.host) != origin:
                abort(403, description="Endereço de publicação diferente da origem configurada.")

    @app.after_request
    def response_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["Cross-Origin-Resource-Policy"] = "same-origin"
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    @app.errorhandler(HTTPException)
    def http_error(error):
        descriptions = {404: "Recurso não encontrado.", 413: "Arquivo ou publicação excede o limite permitido.",
                        415: "Formato não aceito.", 400: "Solicitação inválida."}
        message = error.description if error.description != type(error).description else descriptions.get(error.code, "Não foi possível concluir a solicitação.")
        return jsonify(error=message), error.code

    @app.errorhandler(sqlite3.OperationalError)
    def database_error(error):
        app.logger.warning("Falha de armazenamento do editor: %s", error)
        return jsonify(error="Armazenamento indisponível ou ocupado. Tente novamente; se persistir, contate a hospedagem."), 503

    @app.get("/api/editor/state")
    def state():
        with connection() as db:
            row = db.execute("SELECT payload FROM snapshots ORDER BY revision DESC LIMIT 1").fetchone()
        return jsonify(json.loads(row[0]))

    @app.put("/api/editor/state")
    def publish():
        if request.mimetype != "application/json":
            abort(415, description="Envie a publicação como application/json.")
        def reject_constant(value):
            raise ValueError(value)
        try:
            payload = json.loads(request.get_data(), parse_constant=reject_constant)
        except (ValueError, UnicodeDecodeError, RecursionError):
            invalid("JSON inválido.")
        validate_payload(payload)
        with connection() as db:
            db.execute("BEGIN IMMEDIATE")
            revision = db.execute("SELECT MAX(revision) FROM snapshots").fetchone()[0]
            if payload["revision"] != revision:
                return jsonify(error="Outra pessoa publicou alterações. Recarregue a revisão atual antes de publicar.", revision=revision), 409
            updated = datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
            snapshot = {"schema": 1, **payload, "revision": revision + 1, "updatedAt": updated}
            encoded = json.dumps(snapshot, ensure_ascii=False, separators=(",", ":"), allow_nan=False)
            if len(encoded.encode("utf-8")) > MAX_STATE_BYTES:
                abort(413)
            db.execute("INSERT INTO snapshots VALUES (?, ?, ?)", (revision + 1, updated, encoded))
            db.execute("DELETE FROM snapshots WHERE revision <= ?", (revision + 1 - HISTORY_LIMIT,))
        return jsonify(snapshot)

    @app.get("/api/editor/history")
    def history():
        with connection() as db:
            rows = db.execute("SELECT revision, updated_at FROM snapshots ORDER BY revision DESC").fetchall()
        return jsonify(revisions=[{"revision": revision, "updatedAt": updated} for revision, updated in rows])

    @app.get("/api/editor/history/<int:revision>")
    def historical_state(revision):
        if revision >= 2 ** 53:
            abort(404)
        with connection() as db:
            row = db.execute("SELECT payload FROM snapshots WHERE revision = ?", (revision,)).fetchone()
        if row is None:
            abort(404)
        return jsonify(json.loads(row[0]))

    @app.post("/api/editor/uploads")
    def upload():
        if request.mimetype != "multipart/form-data":
            abort(415, description="Envie uma imagem pelo campo file.")
        if set(request.files) != {"file"} or len(request.files.getlist("file")) != 1 or request.form:
            invalid("Envie somente uma imagem no campo file.")
        raw = request.files["file"].read(MAX_UPLOAD_BYTES + 1)
        if len(raw) > MAX_UPLOAD_BYTES:
            abort(413, description="A imagem deve ter no máximo 5 MiB.")
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("error", Image.DecompressionBombWarning)
                with Image.open(BytesIO(raw)) as probe:
                    if probe.format not in {"PNG", "JPEG", "WEBP"}:
                        abort(415, description="Use uma imagem PNG, JPEG ou WebP.")
                    if probe.width * probe.height > MAX_IMAGE_PIXELS or max(probe.size) > 8192:
                        abort(413, description="A imagem excede 20 milhões de pixels ou 8192 pixels por lado.")
                    probe.verify()
                with Image.open(BytesIO(raw)) as source:
                    source.seek(0)
                    source.load()
                    oriented = ImageOps.exif_transpose(source)
                    oriented.thumbnail((4096, 4096))
                    mode = "RGBA" if "A" in oriented.getbands() or "transparency" in oriented.info else "RGB"
                    # Uma imagem nova copia somente pixels; EXIF, ICC e texto não são publicados.
                    clean = Image.new(mode, oriented.size)
                    clean.paste(oriented.convert(mode))
                    out = BytesIO()
                    clean.save(out, "WEBP", quality=88, method=4)
                    encoded = out.getvalue()
        except (Image.DecompressionBombError, Image.DecompressionBombWarning):
            abort(413, description="A imagem tem dimensões excessivas.")
        except (UnidentifiedImageError, OSError, ValueError, SyntaxError):
            invalid("Imagem inválida ou corrompida.")
        if len(encoded) > MAX_UPLOAD_BYTES:
            abort(413, description="A imagem convertida excede 5 MiB.")
        name = hashlib.sha256(encoded).hexdigest() + ".webp"
        target = uploads / name
        # O mesmo bloqueio SQLite serializa cota/gravação também entre processos.
        with connection() as db:
            db.execute("BEGIN IMMEDIATE")
            if not target.exists():
                files = list(uploads.glob("*.webp"))
                if len(files) >= app.config["COE_UPLOAD_MAX_FILES"] or sum(path.stat().st_size for path in files) + len(encoded) > app.config["COE_UPLOAD_QUOTA_BYTES"]:
                    return jsonify(error="A cota de imagens está cheia. A hospedagem precisa liberar ou ampliar o armazenamento."), 507
                temporary = None
                try:
                    with tempfile.NamedTemporaryFile(dir=uploads, prefix=".upload-", delete=False) as stream:
                        temporary = Path(stream.name)
                        stream.write(encoded)
                        stream.flush()
                        os.fsync(stream.fileno())
                    os.replace(temporary, target)
                finally:
                    if temporary is not None:
                        temporary.unlink(missing_ok=True)
        return jsonify(url="uploads/" + name), 201

    @app.get("/uploads/<name>")
    def uploaded_image(name):
        if not HASH_IMAGE.fullmatch(name):
            abort(404)
        path = (uploads / name).resolve()
        if not path.is_relative_to(uploads.resolve()) or not path.is_file():
            abort(404)
        return send_file(path, mimetype="image/webp", conditional=True, max_age=31536000)

    @app.get("/", defaults={"filename": "index.html"})
    @app.get("/<path:filename>")
    def public_file(filename):
        if "\\" in filename or any(part in {".", ".."} or part.startswith(".") for part in filename.split("/")):
            abort(404)
        if filename.endswith("/"):
            filename += "index.html"
        parts = PurePosixPath(filename).parts
        suffix = PurePosixPath(filename).suffix.lower()
        allowed = filename in PUBLIC_FILES or (len(parts) > 1 and suffix in PUBLIC_DIRS.get(parts[0], set()))
        if suffix == ".html" and parts[-1] != "index.html":
            allowed = False
        path = (ROOT / filename).resolve()
        if not allowed or not path.is_relative_to(ROOT) or path.is_relative_to(storage) or not path.is_file():
            abort(404)
        if suffix == ".html":
            html = path.read_text(encoding="utf-8")
            marker = '<meta name="coe-editor-storage" content="server">'
            html = html.replace("</head>", marker + "\n</head>", 1)
            response = make_response(html)
            response.headers["Content-Type"] = "text/html; charset=utf-8"
            response.headers["Cache-Control"] = "no-store"
            return response
        return send_file(path, conditional=True, as_attachment=suffix in {".csv", ".xlsx"}, max_age=0)

    return app


if __name__ == "__main__":
    from waitress import serve

    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8080"))
    if host not in {"127.0.0.1", "localhost", "::1"} and not os.environ.get("COE_PUBLIC_ORIGIN"):
        raise SystemExit("Para escutar na rede, configure COE_PUBLIC_ORIGIN com o endereço público do painel.")
    serve(create_app(), host=host, port=port, threads=4, max_request_body_size=MAX_REQUEST_BYTES,
          max_request_header_size=16384, connection_limit=100, channel_timeout=30,
          clear_untrusted_proxy_headers=True, expose_tracebacks=False)
