from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    account_number: Optional[str] = None
    role: Optional[str] = "customer"
    department: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    account_number: Optional[str]
    role: str
    department: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class TicketRequest(BaseModel):
    text: str

class TicketCreate(BaseModel):
    text: str

from pydantic import field_validator

class TicketRespond(BaseModel):
    response: str

    @field_validator('response')
    @classmethod
    def response_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Response cannot be empty or whitespace')
        if len(v.strip()) < 10:
            raise ValueError('Response must be at least 10 characters')
        return v.strip()

class TicketReassign(BaseModel):
    department: str

class TicketOut(BaseModel):
    id: int
    customer_id: int
    text: str
    predicted_category: str
    confidence: float
    assigned_department: str
    status: str
    claimed_by_id: Optional[int]
    response: Optional[str]
    reassigned_from: Optional[str] = None
    is_read_by_customer: bool = False
    routing_reason: Optional[str] = None
    account_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    customer: Optional[UserOut]
    claimed_by: Optional[UserOut]

    class Config:
        from_attributes = True