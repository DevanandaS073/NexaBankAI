from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models

# Create tables
Base.metadata.create_all(bind=engine)

from routes import auth, tickets

app = FastAPI(title="NexaBank Support API")

origins = [
    "http://localhost:5173",            # Local React/Vite development
    "https://nexa-bank-ai.vercel.app",  # Production Vercel URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(tickets.router)

@app.get("/")
def root():
    return {"status": "NexaBank API running"}

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)