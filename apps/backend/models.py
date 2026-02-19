"""SQLAlchemy models for orders, users, addresses"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    clerk_id = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, nullable=False)
    name = Column(String, default="")
    role = Column(String, default="user")  # "user" | "admin"
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="user")
    addresses = relationship("Address", back_populates="user")


class Address(Base):
    __tablename__ = "addresses"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String)
    address_line = Column(String)
    city = Column(String)
    province = Column(String)
    postal_code = Column(String)
    phone = Column(String)
    is_default = Column(Integer, default=0)

    user = relationship("User", back_populates="addresses")


class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    customer_name = Column(String, default="Guest")
    customer_email = Column(String, default="")
    status = Column(String, default="pending")  # pending, processing, shipped, delivered, cancelled
    subtotal = Column(Float, default=0)
    shipping = Column(Float, default=0)
    discount = Column(Float, default=0)
    total = Column(Float, default=0)
    promo_code = Column(String, nullable=True)
    payment_method = Column(String, default="cod")  # safepay, jazzcash, easypaisa, cod
    payment_status = Column(String, default="unpaid")  # unpaid, pending, paid, failed, refunded
    transaction_id = Column(String, nullable=True)  # gateway transaction/tracker ID
    gateway_session_id = Column(String, nullable=True)  # gateway checkout session ID
    customer_phone = Column(String, nullable=True)
    shipping_address = Column(JSON, nullable=True)
    stripe_session_id = Column(String, nullable=True)
    stripe_payment_intent = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True, default=gen_uuid)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    product_id = Column(String, nullable=False)  # Sanity product ID
    name = Column(String)
    price = Column(Float)
    quantity = Column(Integer, default=1)
    size = Column(String, nullable=True)
    color = Column(String, nullable=True)

    order = relationship("Order", back_populates="items")


class AIUsage(Base):
    """Track AI usage for rate limiting (3/day per user for imagine)"""
    __tablename__ = "ai_usage"

    id = Column(String, primary_key=True, default=gen_uuid)
    user_id = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    feature = Column(String, nullable=False)  # "chat" | "imagine"
    created_at = Column(DateTime, default=datetime.utcnow)
