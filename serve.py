"""Run the site locally:  python3 serve.py   (optional: python3 serve.py 8080)
No installs needed - uses only Python's standard library."""
import http.server
import os
import socketserver
import sys
import threading
import webbrowser

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))  # serve files next to this script


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")  # always show your latest edit
        super().end_headers()

    def send_error(self, code, message=None, explain=None):
        """Show the site's own 404.html (like GitHub Pages / Netlify do) instead of the plain Python error page."""
        if code == 404 and os.path.exists("404.html"):
            with open("404.html", "rb") as f:
                body = f.read()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if self.command != "HEAD":
                self.wfile.write(body)
        else:
            super().send_error(code, message, explain)


socketserver.ThreadingTCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(("127.0.0.1", PORT), Handler) as httpd:   # this machine only: the folder holds .git and the original artwork
    url = f"http://localhost:{PORT}"
    print(f"Serving circles at {url}  (Ctrl+C to stop)")
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
