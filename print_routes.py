
from backend.app import app

print('--- Registered Routes ---')
for rule in app.url_map.iter_rules():
    print(rule)

