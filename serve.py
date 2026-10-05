from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent / "public"
os.chdir(ROOT)

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        super().end_headers()

if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", int(os.environ.get("PORT", "3000"))), Handler)
    print(f"Murshid static preview listening on 0.0.0.0:{server.server_port}", flush=True)
    server.serve_forever()
