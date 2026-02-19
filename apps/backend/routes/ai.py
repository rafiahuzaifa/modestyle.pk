"""AI proxy routes — Chat (Grok/OpenAI) + Imagine On You (Replicate)"""

import os
import httpx
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

router = APIRouter()

# ─── Chat Proxy ───────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]

SYSTEM_PROMPT = """You are ModestStyle.pk's friendly shopping assistant. You help customers find the perfect hijab, abaya, or modest fashion items. You know:
- Hijabs range PKR 1,200-3,500 (Georgette, Chiffon, Crinkle, Silk, Lawn, Cashmere)
- Abayas range PKR 5,800-8,500 (Textured, Pleated, Chiffon, Open, Embroidered)
- Accessories (Pins, Brooches, Bags, Jewelry) range PKR 500-2,500
- Free shipping over PKR 5,000
- Pakistan-based, ships nationwide in 3-5 days
Be warm, helpful, and suggest products. Use PKR for prices. Keep responses concise."""


@router.post("/chat")
async def chat_proxy(req: ChatRequest):
    """Proxy to Grok or OpenAI for product recommendations"""
    grok_key = os.getenv("GROK_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    if grok_key:
        api_url = "https://api.x.ai/v1/chat/completions"
        api_key = grok_key
        model = "grok-3-mini"
    elif openai_key:
        api_url = "https://api.openai.com/v1/chat/completions"
        api_key = openai_key
        model = "gpt-4o-mini"
    else:
        # Fallback — no API key configured
        return {"reply": "I'm currently in demo mode. Please configure GROK_API_KEY or OPENAI_API_KEY to enable AI chat."}

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *[{"role": m.role, "content": m.content} for m in req.messages[-10:]],  # Last 10 messages
    ]

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                api_url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "max_tokens": 500,
                    "temperature": 0.7,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            reply = data["choices"][0]["message"]["content"]
            return {"reply": reply}
    except Exception as e:
        return {"reply": f"Sorry, I'm having trouble connecting. Please try again. ({str(e)[:50]})"}


# ─── Imagine On You (Virtual Try-On) ─────────────────────────────────

class ImagineRequest(BaseModel):
    product_image_url: str
    product_name: str

# Simple in-memory rate limiter (use Redis in production)
_imagine_usage: dict[str, list[datetime]] = {}

def check_rate_limit(ip: str, limit: int = 3) -> bool:
    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    if ip not in _imagine_usage:
        _imagine_usage[ip] = []
    _imagine_usage[ip] = [t for t in _imagine_usage[ip] if t > day_ago]
    if len(_imagine_usage[ip]) >= limit:
        return False
    _imagine_usage[ip].append(now)
    return True


@router.post("/imagine")
async def imagine_on_you(req: ImagineRequest, request: Request):
    """Generate virtual try-on image via Replicate"""
    client_ip = request.client.host if request.client else "unknown"

    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Daily limit reached (3/day). Try again tomorrow!",
        )

    replicate_token = os.getenv("REPLICATE_API_TOKEN")
    if not replicate_token:
        raise HTTPException(
            status_code=503,
            detail="Virtual try-on is in demo mode. Configure REPLICATE_API_TOKEN to enable.",
        )

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://api.replicate.com/v1/predictions",
                headers={
                    "Authorization": f"Bearer {replicate_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "version": "latest",  # Replace with actual model version
                    "input": {
                        "image": req.product_image_url,
                        "prompt": f"A woman wearing {req.product_name}, modest fashion, elegant, studio lighting, full body shot",
                    },
                },
            )
            resp.raise_for_status()
            data = resp.json()

            # Poll for result (simplified)
            prediction_url = data.get("urls", {}).get("get")
            if prediction_url:
                import asyncio
                for _ in range(30):  # Wait up to 60s
                    await asyncio.sleep(2)
                    poll = await client.get(
                        prediction_url,
                        headers={"Authorization": f"Bearer {replicate_token}"},
                    )
                    result = poll.json()
                    if result["status"] == "succeeded":
                        output = result.get("output")
                        image_url = output[0] if isinstance(output, list) else output
                        return {"image_url": image_url}
                    if result["status"] == "failed":
                        raise HTTPException(500, "Image generation failed")

            raise HTTPException(500, "Timeout waiting for image generation")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to generate image: {str(e)[:100]}")
