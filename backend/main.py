from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models

# Create tables
Base.metadata.create_all(bind=engine)

from routes import auth, predict, tickets

app = FastAPI(title="NexaBank Support API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(tickets.router)

@app.get("/")
def root():
    return {"status": "NexaBank API running"}