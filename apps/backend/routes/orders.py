"""Orders + Stripe Checkout routes"""

import os
import stripe
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models import Order, OrderItem

stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

router = APIRouter()


class CheckoutItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    size: Optional[str] = None
    color: Optional[str] = None


class CheckoutRequest(BaseModel):
    items: list[CheckoutItem]
    subtotal: float
    shipping: float
    discount: float
    total: float
    promo_code: Optional[str] = None
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None


@router.post("/checkout")
async def create_checkout(req: CheckoutRequest, db: AsyncSession = Depends(get_db)):
    """Create order + Stripe Checkout session"""

    # Create order in DB
    order = Order(
        customer_name=req.customer_name or "Guest",
        customer_email=req.customer_email or "",
        subtotal=req.subtotal,
        shipping=req.shipping,
        discount=req.discount,
        total=req.total,
        promo_code=req.promo_code,
    )
    db.add(order)
    await db.flush()

    # Create order items
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

    # Create Stripe Checkout session
    try:
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        line_items = [
            {
                "price_data": {
                    "currency": "pkr",
                    "product_data": {"name": item.name},
                    "unit_amount": int(item.price * 100),  # Stripe uses smallest currency unit
                },
                "quantity": item.quantity,
            }
            for item in req.items
        ]

        # Add shipping as line item if not free
        if req.shipping > 0:
            line_items.append({
                "price_data": {
                    "currency": "pkr",
                    "product_data": {"name": "Shipping"},
                    "unit_amount": int(req.shipping * 100),
                },
                "quantity": 1,
            })

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=f"{frontend_url}/checkout/success?order_id={order.id}",
            cancel_url=f"{frontend_url}/checkout",
            metadata={"order_id": order.id},
        )

        order.stripe_session_id = session.id
        await db.commit()

        return {"checkout_url": session.url, "order_id": order.id}

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mine")
async def get_my_orders(db: AsyncSession = Depends(get_db)):
    """Get orders for current user (simplified — no auth check for MVP)"""
    result = await db.execute(
        select(Order).order_by(Order.created_at.desc()).limit(20)
    )
    orders = result.scalars().all()
    return {
        "orders": [
            {
                "id": o.id,
                "customer_name": o.customer_name,
                "customer_email": o.customer_email,
                "total": o.total,
                "status": o.status,
                "created_at": o.created_at.isoformat(),
                "items_count": len(o.items) if o.items else 0,
            }
            for o in orders
        ]
    }
