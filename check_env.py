from dotenv import load_dotenv
import os

load_dotenv(override=True)

print("Loaded DATABASE_URL:", os.getenv("DATABASE_URL"))
