import os
from datetime import datetime

CACHE_DIR = "./cache"

def list_cache_files():
    if not os.path.exists(CACHE_DIR):
        print("📂 No cache directory found.")
        return

    print (f"📁 Contents of {CACHE_DIR}/\n")
    for filename in os.listdir(CACHE_DIR):
        filepath = os.path.join(CACHE_DIR, filename)
        if os.path.isfile(filepath):
            size = os.path.getsize(filepath)
            modified_time = datetime.fromtimestamp(os.path.getmtime(filepath)).strftime('%Y-%m-%d %H:%M:%S')
            print(f"{filename} - {size} bytes - Last modified: {modified_time}")

if __name__ == "__main__":
    list_cache_files()