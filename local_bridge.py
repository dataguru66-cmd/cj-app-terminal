from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
from datetime import datetime

# ---------------------------------------------------------
# CONFIGURATION
# Set this to your MT5 Terminal's MQL5/Files folder path. 
# You can find this inside MT5 by clicking File -> Open Data Folder -> MQL5 -> Files
# Use double backslashes for Windows paths.
MT5_FILES_DIR = "C:\\MT5_Terminal_Data_Folder\\MQL5\\Files" 
# ---------------------------------------------------------

PORT = 5000

class SignalHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        # Handle CORS preflight requests
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        if self.path == '/signal':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                # Parse JSON payload from the Web App
                data = json.loads(post_data.decode('utf-8'))
                asset = data.get('asset', 'UNKNOWN')
                trade_type = data.get('type', 'UNKNOWN')
                variation = data.get('variation', 'UNKNOWN')
                
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Received MT5 Signal: {trade_type} {asset} ({variation})")
                
                # Write the payload to a JSON file in the MT5 Files directory
                if not os.path.exists(MT5_FILES_DIR):
                    print(f"⚠️ WARNING: The MT5 Files directory does not exist: {MT5_FILES_DIR}")
                    print(f"⚠️ Please update the MT5_FILES_DIR variable at the top of this script.")
                    # Still write locally for testing
                    target_file = 'mt5_signal.json'
                else:
                    target_file = os.path.join(MT5_FILES_DIR, 'mt5_signal.json')
                
                with open(target_file, 'w') as f:
                    json.dump(data, f)
                    
                # We also create a "trigger" file. MQL5 File checking is faster and safer
                # if it just looks for the existence of a file, rather than dealing with file locks
                # while we are still writing the JSON content.
                trigger_file = target_file.replace('.json', '.trg')
                with open(trigger_file, 'w') as f:
                    f.write("trigger")
                
                # Send Success Response to the Browser
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success', 'message': 'Signal forwarded to MT5 folder'}).encode())
                
            except Exception as e:
                print(f"Error processing signal: {e}")
                self.send_response(500)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

def run(server_class=HTTPServer, handler_class=SignalHandler):
    server_address = ('', PORT)
    httpd = server_class(server_address, handler_class)
    print(f"===========================================================")
    print(f" CJ App -> MT5 Bridge Active 🚀")
    print(f" Listening for signals from the web app on port {PORT}...")
    print(f" Outputting files to: {MT5_FILES_DIR}")
    print(f"===========================================================\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    print("Server stopped.")

if __name__ == '__main__':
    run()
