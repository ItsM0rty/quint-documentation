from fastapi import FastAPI
from .routers import documents

app = FastAPI()

# TODO: Include routers here

app.include_router(documents.router, prefix="/documents")

@app.get("/")
def read_root():
    return {"message": "Quint backend is running!"}

# NOTE: If you see linter errors about 'fastapi', ensure your IDE is using the backend/venv Python interpreter and that FastAPI is installed.
# These errors are safe to ignore if your environment is set up correctly. 