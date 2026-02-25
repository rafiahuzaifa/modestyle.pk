"""AI proxy routes — Chat (Grok/OpenAI) + Imagine On You (Replicate)"""

import os
import re
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


def smart_fallback_reply(user_message: str) -> str:
    """Rule-based smart replies when no AI API key is configured."""
    msg = user_message.lower().strip()

    # Greetings
    if re.search(r"\b(hi|hello|hey|salam|assalam|aoa|ao|helo)\b", msg):
        return "Wa Alaikum Assalam! Welcome to ModestStyle.pk 💛 How can I help you today? Ask me about our hijabs, abayas, or anything else!"

    # Price questions
    if re.search(r"\b(price|cost|kitna|rate|how much|kimat)\b", msg):
        if re.search(r"\b(hijab|dupatta|stole|stoler|scarf)\b", msg):
            return "Our hijabs are priced between PKR 1,200 – 3,500 depending on fabric:\n• Lawn/Chiffon: PKR 1,200–1,800\n• Georgette/Crinkle: PKR 1,800–2,500\n• Silk/Cashmere: PKR 2,500–3,500\n\nFree shipping on orders above PKR 5,000! 🚚"
        if re.search(r"\b(abaya|abayah)\b", msg):
            return "Our abayas range from PKR 5,800 – 8,500:\n• Classic Open Abaya: PKR 5,800\n• Chiffon/Pleated: PKR 6,500–7,500\n• Embroidered/Fancy: PKR 7,500–8,500\n\nAll come with free alterations! ✨"
        return "Here's a quick price guide:\n• Hijabs: PKR 1,200–3,500\n• Abayas: PKR 5,800–8,500\n• Accessories: PKR 500–2,500\n\nFree shipping on orders over PKR 5,000! 🎉"

    # Shipping questions
    if re.search(r"\b(ship|delivery|deliver|courier|track|bhejo|parcel|kab)\b", msg):
        return "We ship all over Pakistan! 🇵🇰\n• Lahore: 1–2 days\n• Karachi/Islamabad: 2–3 days\n• Other cities: 3–5 days\n\nShipping fee: PKR 200 (FREE on orders over PKR 5,000)\n\nYou'll get an SMS with tracking once dispatched!"

    # Return / exchange questions
    if re.search(r"\b(return|exchange|refund|wapas|replace|size)\b", msg):
        return "We have a 7-day hassle-free return policy! 🔄\n• Returns accepted within 7 days of delivery\n• Item must be unused with original tags\n• Exchange for different size/color available\n• Refund via bank transfer or store credit\n\nContact us on WhatsApp: +92 300 1234567"

    # Payment questions
    if re.search(r"\b(pay|payment|jazzcash|easypaisa|card|cod|cash|safepay)\b", msg):
        return "We accept multiple payment methods:\n💵 Cash on Delivery (COD)\n📱 JazzCash wallet\n📱 EasyPaisa wallet\n💳 Card payment via Safepay (Visa/Mastercard)\n\nAll payments are 100% secure! 🔒"

    # Hijab recommendations
    if re.search(r"\b(hijab|dupatta|stole|stoler|scarf|chiffon|georgette|crinkle|lawn)\b", msg):
        return "Our most loved hijabs:\n✨ Crinkle Chiffon – PKR 1,800 (everyday favourite!)\n✨ Premium Georgette – PKR 2,200 (for formal occasions)\n✨ Cashmere Stole – PKR 3,200 (winter essential)\n✨ Lawn Hijab – PKR 1,400 (summer must-have)\n\nAll available in 20+ colours! Which style interests you? 😊"

    # Abaya recommendations
    if re.search(r"\b(abaya|abayah|cloak|open abaya|fancy abaya)\b", msg):
        return "Our bestselling abayas:\n🌟 Classic Open Abaya – PKR 5,800\n🌟 Pleated Chiffon Abaya – PKR 6,800\n🌟 Embroidered Abaya – PKR 7,500\n🌟 Fancy Sequin Abaya – PKR 8,500\n\nAll abayas include free alterations within Lahore! Which style are you looking for? 💛"

    # About / contact
    if re.search(r"\b(contact|whatsapp|phone|number|email|address|location|where)\b", msg):
        return "You can reach us at:\n📱 WhatsApp: +92 300 1234567\n✉️ Email: support@modestyle.pk\n📍 Based in Lahore, Pakistan\n\nAvailable Mon–Sat, 9am–7pm PKT. We usually reply within a few hours! 😊"

    # Order status
    if re.search(r"\b(order|status|track|kahan|where is)\b", msg):
        return "To track your order:\n1. Check your SMS for the tracking number\n2. Visit the courier website (TCS/Leopards)\n3. Or WhatsApp us at +92 300 1234567 with your order number\n\nIf your order hasn't arrived on time, please contact us and we'll sort it out immediately! 🚀"

    # Size questions
    if re.search(r"\b(size|sizing|fit|measurements|small|medium|large|xl)\b", msg):
        return "We offer sizes XS to XXL in all abayas! 📏\n• XS: Chest 82–86cm\n• S: Chest 86–90cm\n• M: Chest 90–96cm\n• L: Chest 96–102cm\n• XL: Chest 102–110cm\n• XXL: Chest 110–118cm\n\nCheck our full size guide at modestyle-pk.vercel.app/size-guide\nNot sure? We're happy to help you pick the right size! 💛"

    # Thank you
    if re.search(r"\b(thanks|thank you|shukriya|jazakallah|shukria)\b", msg):
        return "JazakAllah Khair! 💛 It was our pleasure to help. If you have any more questions, feel free to ask. Happy shopping at ModestStyle.pk! 🛍️"

    # Default friendly response
    return "Thank you for your message! 😊 I can help you with:\n• Product recommendations (hijabs, abayas, accessories)\n• Pricing & sizes\n• Shipping & delivery info\n• Returns & exchanges\n• Payment methods\n\nWhat would you like to know? Or contact us directly on WhatsApp: +92 300 1234567 💛"


@router.post("/chat")
async def chat_proxy(req: ChatRequest):
    """Proxy to Grok/OpenAI, or smart rule-based fallback"""
    grok_key = os.getenv("GROK_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")

    if groq_key:
        api_url = "https://api.groq.com/openai/v1/chat/completions"
        api_key = groq_key
        model = "llama3-8b-8192"
    elif grok_key:
        api_url = "https://api.x.ai/v1/chat/completions"
        api_key = grok_key
        model = "grok-3-mini"
    elif openai_key:
        api_url = "https://api.openai.com/v1/chat/completions"
        api_key = openai_key
        model = "gpt-4o-mini"
    else:
        # Smart rule-based fallback — no API key needed
        last_user_msg = next(
            (m.content for m in reversed(req.messages) if m.role == "user"), ""
        )
        return {"reply": smart_fallback_reply(last_user_msg)}

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        *[{"role": m.role, "content": m.content} for m in req.messages[-10:]],
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
        # Fall back to rule-based on API failure
        last_user_msg = next(
            (m.content for m in reversed(req.messages) if m.role == "user"), ""
        )
        return {"reply": smart_fallback_reply(last_user_msg)}


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
    """Generate virtual try-on image via HuggingFace (free) or Replicate"""
    import asyncio, base64

    client_ip = request.client.host if request.client else "unknown"

    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Daily limit reached (3/day). Try again tomorrow!",
        )

    hf_token = os.getenv("HF_TOKEN")
    replicate_token = os.getenv("REPLICATE_API_TOKEN")

    if not hf_token and not replicate_token:
        raise HTTPException(
            status_code=503,
            detail="coming_soon",
        )

    prompt = (
        f"A modest Muslim woman wearing {req.product_name}, "
        "elegant modest fashion, hijab, flowing fabric, "
        "studio lighting, white background, professional photo, high quality"
    )

    # ── HuggingFace (free tier) ──────────────────────────────────────
    if hf_token:
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
                    headers={
                        "Authorization": f"Bearer {hf_token}",
                        "Content-Type": "application/json",
                    },
                    json={"inputs": prompt},
                )
                if resp.status_code == 200 and resp.headers.get("content-type", "").startswith("image"):
                    b64 = base64.b64encode(resp.content).decode("utf-8")
                    mime = resp.headers.get("content-type", "image/jpeg").split(";")[0]
                    return {"image_url": f"data:{mime};base64,{b64}"}

                # Model loading (503) — retry once after delay
                if resp.status_code == 503:
                    await asyncio.sleep(10)
                    resp2 = await client.post(
                        "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
                        headers={
                            "Authorization": f"Bearer {hf_token}",
                            "Content-Type": "application/json",
                        },
                        json={"inputs": prompt},
                    )
                    if resp2.status_code == 200 and resp2.headers.get("content-type", "").startswith("image"):
                        b64 = base64.b64encode(resp2.content).decode("utf-8")
                        mime = resp2.headers.get("content-type", "image/jpeg").split(";")[0]
                        return {"image_url": f"data:{mime};base64,{b64}"}

                raise HTTPException(500, f"HuggingFace error: {resp.status_code}")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(500, f"Image generation failed: {str(e)[:80]}")

    # ── Replicate (fallback) ─────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            resp = await client.post(
                "https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions",
                headers={
                    "Authorization": f"Bearer {replicate_token}",
                    "Content-Type": "application/json",
                    "Prefer": "wait",
                },
                json={"input": {"prompt": prompt, "num_outputs": 1}},
            )
            resp.raise_for_status()
            data = resp.json()
            output = data.get("output")
            if output:
                image_url = output[0] if isinstance(output, list) else output
                return {"image_url": image_url}

            # Poll if not ready
            get_url = data.get("urls", {}).get("get", "")
            if get_url:
                for _ in range(20):
                    await asyncio.sleep(3)
                    poll = await client.get(get_url, headers={"Authorization": f"Bearer {replicate_token}"})
                    result = poll.json()
                    if result.get("status") == "succeeded":
                        out = result.get("output")
                        return {"image_url": out[0] if isinstance(out, list) else out}
                    if result.get("status") == "failed":
                        raise HTTPException(500, "Image generation failed")

            raise HTTPException(500, "Timeout waiting for image")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to generate image: {str(e)[:100]}")
