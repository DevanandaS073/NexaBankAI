from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import joblib
import numpy as np
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models import Ticket, User
from schemas import TicketCreate, TicketRespond, TicketReassign, TicketOut
from auth import decode_token

router = APIRouter(prefix="/tickets", tags=["tickets"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# Load model files
model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "model.joblib")
vectorizer_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vectorizer.joblib")

model = joblib.load(model_path)
vectorizer = joblib.load(vectorizer_path)

# 77 categories mapping to 5 major departments
CATEGORY_TO_DEPARTMENT_MAP = {
    # Billing
    "card_payment_fee_charged": "billing",
    "cash_withdrawal_charge": "billing",
    "exchange_charge": "billing",
    "extra_charge_on_statement": "billing",
    "Refund_not_showing_up": "billing",
    "request_refund": "billing",
    "transaction_charged_twice": "billing",
    "transfer_fee_charged": "billing",
    "top_up_by_bank_transfer_charge": "billing",
    "top_up_by_card_charge": "billing",
    
    # Sales
    "country_support": "sales",
    "fiat_currency_support": "sales",
    "supported_cards_and_currencies": "sales",
    "visa_or_mastercard": "sales",
    "exchange_rate": "sales",
    
    # Account Support
    "age_limit": "account_support",
    "edit_personal_details": "account_support",
    "passcode_forgotten": "account_support",
    "terminate_account": "account_support",
    "unable_to_verify_identity": "account_support",
    "verify_my_identity": "account_support",
    "verify_source_of_funds": "account_support",
    "verify_top_up": "account_support",
    "why_verify_identity": "account_support",
    "balance_not_updated_after_bank_transfer": "account_support",
    "balance_not_updated_after_cheque_or_cash_deposit": "account_support",
    
    # Security
    "compromised_card": "security",
    "lost_or_stolen_card": "security",
    "lost_or_stolen_phone": "security",
    "card_payment_not_recognised": "security",
    "cash_withdrawal_not_recognised": "security",
    "direct_debit_payment_not_recognised": "security",
}

def get_department_for_category(category: str) -> str:
    return CATEGORY_TO_DEPARTMENT_MAP.get(category, "cards")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.id == int(payload.get("sub"))).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("", response_model=list[TicketOut])
def get_all_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only the Super Agent can view all tickets"
        )
    return db.query(Ticket).order_by(Ticket.created_at.desc()).all()

@router.post("", response_model=TicketOut)
def create_ticket(
    data: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can submit support tickets"
        )
    
    # Classify the text
    vec = vectorizer.transform([data.text])
    predicted_category = model.predict(vec)[0]
    confidence = float(np.max(model.predict_proba(vec)))
    
    # Map to department
    assigned_dept = get_department_for_category(predicted_category)
    
    ticket = Ticket(
        customer_id=current_user.id,
        text=data.text,
        predicted_category=predicted_category,
        confidence=round(confidence * 100, 2),
        assigned_department=assigned_dept,
        status="pending"
    )
    
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket

@router.get("/my", response_model=list[TicketOut])
def get_my_tickets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can view their tickets history"
        )
    
    tickets = db.query(Ticket).filter(Ticket.customer_id == current_user.id).order_by(Ticket.created_at.desc()).all()
    return tickets

@router.get("/department", response_model=list[TicketOut])
def get_department_tickets(
    status_filter: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only support agents can view department tickets"
        )
    
    query = db.query(Ticket).filter(Ticket.assigned_department == current_user.department)
    
    if status_filter:
        query = query.filter(Ticket.status == status_filter)
        
    tickets = query.order_by(Ticket.created_at.desc()).all()
    return tickets

@router.post("/{ticket_id}/claim", response_model=TicketOut)
def claim_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only support agents can claim tickets"
        )
    
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    if ticket.assigned_department != current_user.department:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot claim a ticket assigned to a different department"
        )
        
    if ticket.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot claim this ticket. Current status is {ticket.status}."
        )
        
    ticket.status = "claimed"
    ticket.claimed_by_id = current_user.id
    db.commit()
    db.refresh(ticket)
    return ticket

@router.post("/{ticket_id}/respond", response_model=TicketOut)
def respond_ticket(
    ticket_id: int,
    data: TicketRespond,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only support agents can respond to tickets"
        )
    
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    if ticket.claimed_by_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must claim this ticket before responding"
        )
        
    ticket.response = data.response
    ticket.status = "resolved"
    db.commit()
    db.refresh(ticket)
    return ticket

@router.post("/{ticket_id}/reassign", response_model=TicketOut)
def reassign_ticket(
    ticket_id: int,
    data: TicketReassign,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "staff":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only support agents can reassign tickets"
        )
    
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    # Reassigning allows transfer of ticket to another department
    valid_departments = ["billing", "sales", "account_support", "security", "cards"]
    if data.department not in valid_departments:
        raise HTTPException(status_code=400, detail="Invalid department name")
        
    ticket.assigned_department = data.department
    ticket.status = "pending" # Reset to pending for the new department to pick it up
    ticket.claimed_by_id = None # Release claim
    db.commit()
    db.refresh(ticket)
    return ticket
