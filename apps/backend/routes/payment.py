"""
Pakistan Payment Gateway Routes
Supports: Safepay (cards), JazzCash (wallet), EasyPaisa (wallet), COD

Safepay API docs: https://docs.getsafepay.com
JazzCash API docs: https://sandbox.jazzcash.com.pk/
EasyPaisa API docs: https://easypay.easypaisa.com.pk/
"""

import os
import hashlib
import hmac
import json
import time
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from database import get_db
from models import Order, OrderItem

router = APIRouter()

# ─── Config ──────────────────────────────────────────────────────
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Safepay
SAFEPAY_API_KEY = os.getenv("SAFEPAY_API_KEY", "")
SAFEPAY_SECRET = os.getenv("SAFEPAY_SECRET_KEY", "")
SAFEPAY_WEBHOOK_SECRET = os.getenv("SAFEPAY_WEBHOOK_SECRET", "")
SAFEPAY_BASE = os.getenv("SAFEPAY_BASE_URL", "https://sandbox.api.getsafepay.com")  # sandbox for dev
SAFEPAY_ENV = os.getenv("SAFEPAY_ENV", "sandbox")  # sandbox | production

# JazzCash
JAZZCASH_MERCHANT_ID = os.getenv("JAZZCASH_MERCHANT_ID", "")
JAZZCASH_PASSWORD = os.getenv("JAZZCASH_PASSWORD", "")
JAZZCASH_SALT = os.getenv("JAZZCASH_INTEGRITY_SALT", "")
JAZZCASH_BASE = os.getenv("JAZZCASH_BASE_URL", "https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction")

# EasyPaisa
EASYPAISA_STORE_ID = os.getenv("EASYPAISA_STORE_ID", "")
EASYPAISA_HASH_KEY = os.getenv("EASYPAISA_HASH_KEY", "")
EASYPAISA_BASE = os.getenv("EASYPAISA_BASE_URL", "https://easypay.easypaisa.com.pk/easypay/Index.jsf")


# ─── Shared Models ──────────────────────────────────────────────
class CheckoutItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    size: Optional[str] = None
    color: Optional[str] = None


class ShippingAddress(BaseModel):
    address: str
    city: str
    province: Optional[str] = None
    postal_code: Optional[str] = None


class PaymentRequest(BaseModel):
    items: list[CheckoutItem]
    subtotal: float
    shipping: float
    discount: float
    total: float
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    shipping_address: Optional[ShippingAddress] = None
    promo_code: Optional[str] = None
    payment_method: str
    mobile_number: Optional[str] = None  # for wallet payments


async def create_order_in_db(req: PaymentRequest, payment_method: str, db: AsyncSession) -> Order:
    """Create order + items in DB, returns the Order object (not yet committed)."""
    order = Order(
        customer_name=req.customer_name or "Guest",
        customer_email=req.customer_email or "",
        customer_phone=req.customer_phone or "",
        subtotal=req.subtotal,
        shipping=req.shipping,
        discount=req.discount,
        total=req.total,
        promo_code=req.promo_code,
        payment_method=payment_method,
        payment_status="unpaid",
        shipping_address=req.shipping_address.model_dump() if req.shipping_address else None,
    )
    db.add(order)
    await db.flush()  # get order.id

    for item in req.items:
        db.add(OrderItem(
            order_id=order.id,
            product_id=item.product_id,
            name=item.name,
            price=item.price,
            quantity=item.quantity,
            size=item.size,
            color=item.color,
        ))
    return order


# ─── Safepay (Card Payments) ────────────────────────────────────
@router.post("/safepay/create")
async def create_safepay_payment(req: PaymentRequest, db: AsyncSession = Depends(get_db)):
    """
    Create a Safepay checkout session for card payments.
    Redirects customer to Safepay's hosted checkout page.
    """
    if not SAFEPAY_API_KEY or not SAFEPAY_SECRET:
        raise HTTPException(400, "Safepay not configured. Use Cash on Delivery instead.")

    order = await create_order_in_db(req, "safepay", db)

    try:
        async with httpx.AsyncClient() as client:
            # Step 1: Create a Safepay tracker (payment intent)
            tracker_res = await client.post(
                f"{SAFEPAY_BASE}/order/payments/v3/",
                json={
                    "client": SAFEPAY_API_KEY,
                    "amount": int(req.total),  # Safepay takes integer PKR
                    "currency": "PKR",
                    "environment": SAFEPAY_ENV,
                },
                headers={
                    "Content-Type": "application/json",
                },
                timeout=30.0,
            )
            tracker_data = tracker_res.json()

            if tracker_res.status_code != 201 and tracker_res.status_code != 200:
                raise HTTPException(
                    502,
                    f"Safepay error: {tracker_data.get('message', 'Unknown error')}",
                )

            tracker_token = tracker_data.get("data", {}).get("token", "")
            if not tracker_token:
                raise HTTPException(502, "Safepay did not return a tracker token")

            order.gateway_session_id = tracker_token
            order.payment_status = "pending"
            await db.commit()

            # Step 2: Build the hosted checkout URL
            checkout_url = (
                f"https://{'sandbox' if SAFEPAY_ENV == 'sandbox' else 'www'}.getsafepay.com"
                f"/components?beacon={tracker_token}"
                f"&entry_mode=hosted"
                f"&env={'sandbox' if SAFEPAY_ENV == 'sandbox' else 'production'}"
                f"&source=custom"
                f"&redirect_url={FRONTEND_URL}/checkout/success?order_id={order.id}"
                f"&cancel_url={FRONTEND_URL}/checkout"
            )

            return {
                "checkout_url": checkout_url,
                "order_id": order.id,
                "tracker_token": tracker_token,
            }

    except httpx.HTTPError as e:
        await db.rollback()
        raise HTTPException(502, f"Safepay connection error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(500, f"Payment error: {str(e)}")


# ─── JazzCash (Mobile Wallet) ───────────────────────────────────
@router.post("/jazzcash/create")
async def create_jazzcash_payment(req: PaymentRequest, db: AsyncSession = Depends(get_db)):
    """
    Create a JazzCash MWALLET payment.
    Sends OTP to customer's JazzCash mobile number.
    """
    if not JAZZCASH_MERCHANT_ID or not JAZZCASH_PASSWORD:
        raise HTTPException(400, "JazzCash not configured. Use Cash on Delivery instead.")

    if not req.mobile_number or len(req.mobile_number) < 11:
        raise HTTPException(400, "Valid JazzCash mobile number required (11 digits)")

    order = await create_order_in_db(req, "jazzcash", db)

    try:
        txn_ref = f"MS-{order.id[:8]}-{int(time.time())}"
        amount = str(int(req.total))
        txn_datetime = datetime.now().strftime("%Y%m%d%H%M%S")
        expiry = datetime.now().strftime("%Y%m%d%H%M%S")  # same for immediate

        # Build hash for integrity
        hash_string = (
            f"{JAZZCASH_SALT}&{amount}&{JAZZCASH_MERCHANT_ID}"
            f"&{req.mobile_number}&{JAZZCASH_PASSWORD}"
            f"&{txn_datetime}&{expiry}&{txn_ref}&PKR"
        )
        secure_hash = hmac.new(
            JAZZCASH_SALT.encode(),
            hash_string.encode(),
            hashlib.sha256,
        ).hexdigest()

        payload = {
            "pp_Language": "EN",
            "pp_MerchantID": JAZZCASH_MERCHANT_ID,
            "pp_Password": JAZZCASH_PASSWORD,
            "pp_TxnRefNo": txn_ref,
            "pp_Amount": amount,
            "pp_TxnCurrency": "PKR",
            "pp_TxnDateTime": txn_datetime,
            "pp_TxnExpiryDateTime": expiry,
            "pp_BillReference": f"order-{order.id[:8]}",
            "pp_Description": f"ModestStyle.pk Order #{order.id[:8]}",
            "pp_MobileNumber": req.mobile_number,
            "pp_CNIC": "",
            "pp_SecureHash": secure_hash,
        }

        async with httpx.AsyncClient() as client:
            res = await client.post(JAZZCASH_BASE, data=payload, timeout=30.0)
            data = res.json() if res.status_code == 200 else {}

        response_code = data.get("pp_ResponseCode", "")
        if response_code == "124":
            # Success: OTP sent to mobile
            order.transaction_id = data.get("pp_TxnRefNo", txn_ref)
            order.gateway_session_id = txn_ref
            order.payment_status = "pending"
            await db.commit()
            return {
                "order_id": order.id,
                "status": "otp_sent",
                "message": "Payment request sent to your JazzCash app. Please approve.",
            }
        else:
            order.payment_status = "failed"
            await db.commit()
            msg = data.get("pp_ResponseMessage", "JazzCash payment failed")
            raise HTTPException(400, msg)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(500, f"JazzCash error: {str(e)}")


# ─── EasyPaisa (Mobile Wallet) ──────────────────────────────────
@router.post("/easypaisa/create")
async def create_easypaisa_payment(req: PaymentRequest, db: AsyncSession = Depends(get_db)):
    """
    Create an EasyPaisa mobile account payment.
    """
    if not EASYPAISA_STORE_ID or not EASYPAISA_HASH_KEY:
        raise HTTPException(400, "EasyPaisa not configured. Use Cash on Delivery instead.")

    if not req.mobile_number or len(req.mobile_number) < 11:
        raise HTTPException(400, "Valid EasyPaisa mobile number required (11 digits)")

    order = await create_order_in_db(req, "easypaisa", db)

    try:
        order_id = f"MS-{order.id[:8]}"
        amount = f"{req.total:.2f}"
        post_back_url = f"{FRONTEND_URL}/api/payment/webhook?gateway=easypaisa"

        # EasyPaisa HMAC hash
        hash_data = f"{amount}{order_id}{EASYPAISA_STORE_ID}"
        secure_hash = hmac.new(
            EASYPAISA_HASH_KEY.encode(),
            hash_data.encode(),
            hashlib.sha256,
        ).hexdigest()

        # For MA (mobile account) transactions
        payload = {
            "storeId": EASYPAISA_STORE_ID,
            "amount": amount,
            "orderId": order_id,
            "mobileAccountNo": req.mobile_number,
            "emailAddress": req.customer_email or "",
            "postBackURL": post_back_url,
            "merchantHashedReq": secure_hash,
        }

        async with httpx.AsyncClient() as client:
            res = await client.post(
                f"{EASYPAISA_BASE}",
                data=payload,
                timeout=30.0,
            )

        order.gateway_session_id = order_id
        order.payment_status = "pending"
        await db.commit()

        # EasyPaisa may return redirect URL or direct response
        if res.status_code == 200:
            return {
                "order_id": order.id,
                "status": "pending",
                "message": "Payment request sent to your EasyPaisa account. Please approve.",
            }
        else:
            raise HTTPException(502, "EasyPaisa payment initiation failed")

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(500, f"EasyPaisa error: {str(e)}")


# ─── Cash on Delivery ───────────────────────────────────────────
@router.post("/cod/create")
async def create_cod_order(req: PaymentRequest, db: AsyncSession = Depends(get_db)):
    """Create a Cash on Delivery order. No payment gateway needed."""
    order = await create_order_in_db(req, "cod", db)
    order.payment_status = "unpaid"  # will be marked paid on delivery
    order.status = "processing"
    await db.commit()

    return {
        "order_id": order.id,
        "status": "confirmed",
        "message": "Order placed! Pay on delivery.",
    }


# ─── Webhooks ────────────────────────────────────────────────────
@router.post("/webhook/safepay")
async def safepay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Safepay payment status webhooks."""
    body = await request.body()
    data = json.loads(body)

    # Verify signature if webhook secret is configured
    if SAFEPAY_WEBHOOK_SECRET:
        signature = request.headers.get("x-sfpy-signature", "")
        expected = hmac.new(
            SAFEPAY_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256,
        ).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise HTTPException(401, "Invalid webhook signature")

    event_type = data.get("type", "")
    tracker = data.get("data", {}).get("token", "")

    if not tracker:
        return {"received": True}

    result = await db.execute(
        select(Order).where(Order.gateway_session_id == tracker)
    )
    order = result.scalar_one_or_none()
    if not order:
        return {"received": True}

    if event_type == "payment:created" or event_type == "payment:completed":
        order.payment_status = "paid"
        order.status = "processing"
        order.transaction_id = data.get("data", {}).get("tracker", {}).get("id", "")
    elif event_type == "payment:failed":
        order.payment_status = "failed"

    await db.commit()
    return {"received": True}


@router.post("/webhook/jazzcash")
async def jazzcash_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle JazzCash payment callback."""
    data = await request.form()
    txn_ref = data.get("pp_TxnRefNo", "")
    response_code = data.get("pp_ResponseCode", "")

    if not txn_ref:
        return {"received": True}

    result = await db.execute(
        select(Order).where(Order.gateway_session_id == txn_ref)
    )
    order = result.scalar_one_or_none()
    if not order:
        return {"received": True}

    if response_code == "000":
        order.payment_status = "paid"
        order.status = "processing"
        order.transaction_id = data.get("pp_RetreivalReferenceNo", txn_ref)
    else:
        order.payment_status = "failed"

    await db.commit()
    return {"received": True}


@router.post("/webhook/easypaisa")
async def easypaisa_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle EasyPaisa payment callback."""
    data = await request.form()
    order_id = data.get("orderId", "")
    status = data.get("status", "")

    if not order_id:
        return {"received": True}

    # order_id is "MS-{order.id[:8]}" format
    short_id = order_id.replace("MS-", "")
    result = await db.execute(
        select(Order).where(Order.id.like(f"{short_id}%"))
    )
    order = result.scalar_one_or_none()
    if not order:
        return {"received": True}

    if status in ("0000", "0001"):  # success codes
        order.payment_status = "paid"
        order.status = "processing"
        order.transaction_id = data.get("transactionId", "")
    else:
        order.payment_status = "failed"

    await db.commit()
    return {"received": True}
