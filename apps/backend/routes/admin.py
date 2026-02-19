"""Admin routes — order management, user management"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models import Order, OrderItem, User

router = APIRouter()


class UpdateOrderStatus(BaseModel):
    status: str


@router.get("/orders")
async def list_orders(db: AsyncSession = Depends(get_db)):
    """List all orders for admin"""
    result = await db.execute(
        select(Order).order_by(Order.created_at.desc()).limit(50)
    )
    orders = result.scalars().all()
    return {
        "orders": [
            {
                "id": o.id,
                "customer_name": o.customer_name,
                "customer_email": o.customer_email,
                "customer_phone": o.customer_phone,
                "total": o.total,
                "status": o.status,
                "payment_method": o.payment_method,
                "payment_status": o.payment_status,
                "transaction_id": o.transaction_id,
                "created_at": o.created_at.isoformat(),
                "items_count": len(o.items) if o.items else 0,
            }
            for o in orders
        ]
    }


@router.patch("/orders/{order_id}")
async def update_order(
    order_id: str,
    body: UpdateOrderStatus,
    db: AsyncSession = Depends(get_db),
):
    """Update order status"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")
    order.status = body.status
    await db.commit()
    return {"success": True, "status": order.status}


@router.get("/orders/{order_id}")
async def get_order(order_id: str, db: AsyncSession = Depends(get_db)):
    """Get order details"""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(404, "Order not found")

    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order_id)
    )
    items = items_result.scalars().all()

    return {
        "id": order.id,
        "customer_name": order.customer_name,
        "customer_email": order.customer_email,
        "customer_phone": order.customer_phone,
        "total": order.total,
        "subtotal": order.subtotal,
        "shipping": order.shipping,
        "discount": order.discount,
        "status": order.status,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "transaction_id": order.transaction_id,
        "promo_code": order.promo_code,
        "shipping_address": order.shipping_address,
        "created_at": order.created_at.isoformat(),
        "items": [
            {
                "id": i.id,
                "product_id": i.product_id,
                "name": i.name,
                "price": i.price,
                "quantity": i.quantity,
                "size": i.size,
                "color": i.color,
            }
            for i in items
        ],
    }


@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """Dashboard stats"""
    total_orders = await db.scalar(select(func.count(Order.id)))
    total_revenue = await db.scalar(select(func.sum(Order.total))) or 0
    pending_orders = await db.scalar(
        select(func.count(Order.id)).where(Order.status == "pending")
    )
    total_users = await db.scalar(select(func.count(User.id)))

    return {
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "pending_orders": pending_orders,
        "total_users": total_users or 0,
    }


@router.get("/users")
async def list_users(db: AsyncSession = Depends(get_db)):
    """List all users"""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    return {
        "users": [
            {
                "id": u.id,
                "clerk_id": u.clerk_id,
                "email": u.email,
                "name": u.name,
                "role": u.role,
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ]
    }
