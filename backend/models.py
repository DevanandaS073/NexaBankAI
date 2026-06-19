from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id             = Column(Integer, primary_key=True, index=True)
    full_name      = Column(String, nullable=False)
    email          = Column(String, unique=True, index=True, nullable=False)
    hashed_password= Column(String, nullable=False)
    account_number = Column(String, unique=True, nullable=True)
    role           = Column(String, default="customer")  # customer or staff
    department     = Column(String, nullable=True)        # for staff: billing, sales, account_support, security, cards
    is_active      = Column(Boolean, default=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    tickets_submitted = relationship("Ticket", back_populates="customer", foreign_keys="[Ticket.customer_id]")
    tickets_claimed   = relationship("Ticket", back_populates="claimed_by", foreign_keys="[Ticket.claimed_by_id]")

class Ticket(Base):
    __tablename__ = "tickets"

    id                  = Column(Integer, primary_key=True, index=True)
    customer_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    text                = Column(String, nullable=False)
    predicted_category  = Column(String, nullable=False)
    confidence          = Column(Float, nullable=False)
    assigned_department = Column(String, nullable=False)
    status              = Column(String, default="pending")  # pending, claimed, resolved
    claimed_by_id       = Column(Integer, ForeignKey("users.id"), nullable=True)
    response            = Column(String, nullable=True)
    reassigned_from     = Column(String, nullable=True)
    is_read_by_customer = Column(Boolean, default=False)
    routing_reason      = Column(String, nullable=True)
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    customer   = relationship("User", back_populates="tickets_submitted", foreign_keys=[customer_id])
    claimed_by = relationship("User", back_populates="tickets_claimed", foreign_keys=[claimed_by_id])

    @property
    def account_number(self):
        return self.customer.account_number if self.customer else None