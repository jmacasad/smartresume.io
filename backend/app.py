from backend import create_app
import os
import logging
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()

print("SECRET_KEY:", os.getenv("SECRET_KEY"))
print("DATABASE_URL:", os.getenv("DATABASE_URL"))

logging.basicConfig(level=logging.INFO)


app = create_app()
CORS(app)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3000, debug=True)