"""
ModestStyle.pk — FastAPI Backend
Auth, Cart, Orders, Payments, AI proxy
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes.orders import router as orders_router
from routes.ai import router as ai_router
from routes.admin import router as admin_router
from routes.payment import router as payment_router
from database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="ModestStyle.pk API",
    version="1.0.0",
    lifespan=lifespan,
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

allowed_origins = [
    "http://localhost:3000",
    "https://modeststyle.pk",
    "https://modestyle-pk.vercel.app",
    FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(orders_router, prefix="/api/orders", tags=["orders"])
app.include_router(ai_router, prefix="/api/ai", tags=["ai"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
app.include_router(payment_router, prefix="/api/payment", tags=["payment"])


@app.get("/")
def root():
    return {"message": "ModestStyle.pk API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
