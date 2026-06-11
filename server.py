import http.server
import socketserver
import sqlite3
import json
import urllib.parse
import os

PORT = 8080
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

os.chdir(os.path.dirname(os.path.abspath(__file__)))

def ensure_indexes():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.execute('CREATE INDEX IF NOT EXISTS idx_stations_type ON stations(type)')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_stations_district ON stations(district)')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_stations_brand ON stations(brand)')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_prices_station ON prices(station_id)')
        conn.execute('CREATE INDEX IF NOT EXISTS idx_ev_station ON ev_chargers(station_id)')
        conn.commit()
        conn.close()
    except sqlite3.OperationalError:
        pass

ensure_indexes()

class ThreadingServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

class APICacheRequestHandler(http.server.SimpleHTTPRequestHandler):
    def _set_headers(self, content_type='text/html', cache_max_age=3600):
        self.send_header('Content-type', content_type)
        self.send_header('Cache-Control', f'public, max-age={cache_max_age}')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')

    def do_OPTIONS(self):
        self.send_response(204)
        self._set_headers()
        self.end_headers()

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)

        if parsed_path.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return

        if parsed_path.path == '/api/stations/fuel':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Cache-Control', 'public, max-age=3600')
            self.end_headers()
            
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT s.*, p.gasolina95, p.gasolina98, p.gasoleo, p.gpl
                FROM stations s
                JOIN prices p ON s.id = p.station_id
                WHERE s.type = 'fuel'
            ''')
            rows = cursor.fetchall()
            
            stations = []
            for r in rows:
                stations.append({
                    "id": r['id'],
                    "name": r['name'],
                    "brand": r['brand'],
                    "address": r['address'],
                    "district": r['district'],
                    "municipality": r['municipality'],
                    "parish": r['parish'],
                    "lat": r['lat'],
                    "lng": r['lng'],
                    "prices": {
                        "gasolina95": r['gasolina95'],
                        "gasolina98": r['gasolina98'],
                        "gasoleo": r['gasoleo'],
                        "gpl": r['gpl']
                    }
                })
            conn.close()
            
            response = {"stations": stations}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return
            
        elif parsed_path.path == '/api/stations/ev':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Cache-Control', 'public, max-age=3600')
            self.end_headers()
            
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT s.*, c.available_posts, c.total_posts, c.power_info,
                       c.socket_types, c.fee, c.access, c.opening_hours,
                       c.phone, c.website, c.network
                FROM stations s
                JOIN ev_chargers c ON s.id = c.station_id
                WHERE s.type = 'ev'
            ''')
            rows = cursor.fetchall()
            
            stations = []
            for r in rows:
                socket_types = None
                if r['socket_types']:
                    try:
                        socket_types = json.loads(r['socket_types'])
                    except:
                        socket_types = None
                stations.append({
                    "id": r['id'],
                    "name": r['name'],
                    "brand": r['brand'],
                    "address": r['address'],
                    "district": r['district'],
                    "municipality": r['municipality'],
                    "parish": r['parish'],
                    "lat": r['lat'],
                    "lng": r['lng'],
                    "chargers": {
                        "available_posts": r['available_posts'],
                        "total_posts": r['total_posts'],
                        "power_info": r['power_info'],
                        "socket_types": socket_types,
                        "fee": r['fee'] or 'yes',
                        "access": r['access'] or 'yes',
                        "opening_hours": r['opening_hours'] or '24/7',
                        "phone": r['phone'] or '',
                        "website": r['website'] or '',
                        "network": r['network'] or 'Mobi.E'
                    }
                })
            conn.close()
            
            response = {"stations": stations}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return
            
        elif parsed_path.path == '/api/stations/ev/live':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            
            # --- INTEGRAÇÃO API ONLINE ---
            # Aqui é onde farias o pedido real à API.
            # Exemplo de código se tivesses a API de um Fornecedor:
            # 
            # req = urllib.request.Request("https://api.fornecedor.pt/postos/estado")
            # req.add_header('Authorization', 'Bearer A_TUA_API_KEY')
            # with urllib.request.urlopen(req) as api_response:
            #     dados_reais = json.loads(api_response.read().decode())
            #     self.wfile.write(json.dumps(dados_reais).encode('utf-8'))
            # return
            
            # Simulador de estado Live com persistencia por hora
            # O estado mantem-se consistente durante a mesma hora,
            # mudando a cada hora para simular ocupacao realista
            import random
            import time
            import hashlib
            
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute('''
                SELECT s.id, c.available_posts, c.total_posts, c.power_info
                FROM stations s
                JOIN ev_chargers c ON s.id = c.station_id
                WHERE s.type = 'ev'
            ''')
            rows = cursor.fetchall()
            
            now = time.localtime()
            hour_seed = now.tm_yday * 24 + now.tm_hour
            
            stations_live = []
            
            for r in rows:
                sid = r['id']
                total = r['total_posts']
                
                seed = int(hashlib.md5((sid + str(hour_seed)).encode()).hexdigest()[:8], 16)
                rng = random.Random(seed)
                
                if total <= 0:
                    available = 0
                elif rng.random() < 0.35:
                    available = total
                elif rng.random() < 0.45:
                    available = total - 1 if total > 1 else total
                elif rng.random() < 0.15:
                    available = 0
                else:
                    available = rng.randint(1, total - 1) if total > 1 else total
                
                stations_live.append({
                    "id": sid,
                    "chargers": {
                        "available_posts": available,
                        "total_posts": total,
                        "power_info": r['power_info']
                    }
                })
            
            conn.close()
            
            response = {"stations": stations_live}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return
            
        # Block access to .db and other sensitive files
        if parsed_path.path.endswith('.db') or '/database.db' in parsed_path.path:
            self.send_response(403)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'403 Forbidden')
            return

        # Fallback to serving static files
        if self.path == '/':
            self.path = '/index.html'

        return super().do_GET()

if __name__ == '__main__':
    with ThreadingServer(("", PORT), APICacheRequestHandler) as httpd:
        print(f"FuelSmart Portugal — http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
        httpd.server_close()
