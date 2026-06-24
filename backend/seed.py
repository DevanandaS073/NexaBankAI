import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from auth import hash_password
from dotenv import load_dotenv
import os

load_dotenv()

engine = create_engine(os.getenv("DATABASE_URL"))

# ── Realistic banking ticket data ──
TICKETS_DATA = [
    # Lost/Stolen Card
    ("I lost my debit card yesterday and need it blocked immediately", "lost_or_stolen_card", "Security & Fraud"),
    ("Someone stole my wallet along with my NexaBank card please block it", "lost_or_stolen_card", "Security & Fraud"),
    ("My card has gone missing I think I left it at a restaurant", "lost_or_stolen_card", "Security & Fraud"),
    ("I need to report my credit card as stolen and get a replacement", "lost_or_stolen_card", "Security & Fraud"),
    ("My card was stolen at the metro station please block it now", "lost_or_stolen_card", "Security & Fraud"),

    # Card Payment
    ("My card was declined at the supermarket but I have sufficient balance", "card_payment", "Cards & ATMs"),
    ("I am unable to make online payments with my NexaBank card", "card_payment", "Cards & ATMs"),
    ("Card payment failed three times today at different merchants", "card_payment", "Cards & ATMs"),
    ("My contactless payment is not working at any store", "card_payment", "Cards & ATMs"),
    ("Transaction declined even though my account has enough funds", "card_payment", "Cards & ATMs"),

    # Balance
    ("My account balance is not reflecting the deposit I made this morning", "balance_not_updated", "Account Support"),
    ("I transferred money two hours ago but balance still shows old amount", "balance_not_updated", "Account Support"),
    ("My salary was credited but the balance has not updated in the app", "balance_not_updated", "Account Support"),
    ("Balance shown in app is different from what the ATM shows", "balance_not_updated", "Account Support"),

    # Transfer
    ("I sent money to the wrong account number please help me reverse it", "transfer", "Billing"),
    ("My transfer of 25000 rupees is stuck in pending for 3 hours", "transfer", "Billing"),
    ("International wire transfer not received by beneficiary after 2 days", "transfer", "Billing"),
    ("NEFT transfer failed but money was deducted from my account", "transfer", "Billing"),
    ("I need to cancel a transfer that I initiated by mistake", "transfer", "Billing"),

    # Account Access
    ("I forgot my internet banking password and cannot log in", "account_access", "Account Support"),
    ("My account has been locked after multiple wrong PIN attempts", "account_access", "Account Support"),
    ("Unable to login to the NexaBank mobile app since yesterday", "account_access", "Account Support"),
    ("Two factor authentication is not sending OTP to my phone", "account_access", "Account Support"),
    ("My account shows suspended when I try to login please help", "account_access", "Account Support"),

    # Refund
    ("I was charged twice for the same transaction please refund", "refund", "Billing"),
    ("Merchant refunded my purchase but money not credited to account", "refund", "Billing"),
    ("I cancelled my hotel booking but refund not received after 7 days", "refund", "Billing"),
    ("Double deduction happened during UPI payment need refund", "refund", "Billing"),
    ("Online shopping refund initiated by merchant but not in my account", "refund", "Billing"),

    # Loan
    ("I want to know the remaining EMI amount for my personal loan", "loan", "Loans & Credit"),
    ("Can I get a top up loan on my existing home loan", "loan", "Loans & Credit"),
    ("My loan EMI was deducted twice this month please check", "loan", "Loans & Credit"),
    ("I want to foreclose my car loan what is the procedure", "loan", "Loans & Credit"),
    ("Need details about education loan eligibility and interest rates", "loan", "Loans & Credit"),

    # Direct Debit
    ("An unknown company is taking direct debit from my account monthly", "direct_debit", "Account Support"),
    ("I want to cancel the direct debit mandate for my insurance premium", "direct_debit", "Account Support"),
    ("Direct debit failed but I have sufficient balance in my account", "direct_debit", "Account Support"),

    # Top Up
    ("I am unable to top up my NexaBank wallet from my saved card", "top_up", "Cards & ATMs"),
    ("Top up transaction shows successful but wallet balance not updated", "top_up", "Cards & ATMs"),

    # Exchange Rate
    ("What is the current exchange rate for USD to INR for wire transfer", "exchange_rate", "Sales"),
    ("I want to exchange foreign currency what documents do I need", "exchange_rate", "Sales"),
    ("The forex rate applied to my international transaction seems wrong", "exchange_rate", "Sales"),

    # Beneficiary
    ("I added a new beneficiary but it is not showing in my transfer list", "beneficiary", "Account Support"),
    ("I want to delete an old beneficiary from my account", "beneficiary", "Account Support"),
    ("Beneficiary account number is showing invalid when I try to add", "beneficiary", "Account Support"),

    # General/Transaction
    ("There is an unrecognized transaction of 3500 rupees on my statement", "transaction", "Security & Fraud"),
    ("I need my last 6 months account statement for visa application", "transaction", "Account Support"),
    ("A transaction from last week is still showing as pending", "transaction", "Account Support"),
    ("I need to dispute a transaction that I did not authorize", "transaction", "Security & Fraud"),
    ("Can I get a mini statement for my savings account", "transaction", "Account Support"),
]

STAFF_DATA = [
    ("Arjun Menon",     "arjun@nexabank.com",    "Cards & ATMs",     "cards"),
    ("Priya Sharma",    "priya@nexabank.com",     "Billing",          "billing"),
    ("Rahul Nair",      "rahul@nexabank.com",     "Account Support",  "account"),
    ("Sneha Pillai",    "sneha@nexabank.com",     "Security & Fraud", "security"),
    ("Vikram Das",      "vikram@nexabank.com",    "Loans & Credit",   "loans"),
    ("Anjali Thomas",   "anjali@nexabank.com",    "Sales",            "sales"),
]

CUSTOMER_DATA = [
    ("Aditya Kumar",    "aditya@gmail.com",     "NXB-001-2024"),
    ("Meera Iyer",      "meera@gmail.com",      "NXB-002-2024"),
    ("Rohan Verma",     "rohan@gmail.com",      "NXB-003-2024"),
    ("Kavya Reddy",     "kavya@gmail.com",      "NXB-004-2024"),
    ("Nikhil Joshi",    "nikhil@gmail.com",     "NXB-005-2024"),
    ("Divya Nambiar",   "divya@gmail.com",      "NXB-006-2024"),
    ("Sanjay Patel",    "sanjay@gmail.com",     "NXB-007-2024"),
    ("Lakshmi Mohan",   "lakshmi@gmail.com",    "NXB-008-2024"),
]

AGENT_RESPONSES = {
    "lost_or_stolen_card": [
        "Your card has been blocked immediately. A replacement card will be dispatched to your registered address within 3-5 business days.",
        "We have blocked your card as requested. Please visit the nearest NexaBank branch with your ID proof to get an instant replacement.",
    ],
    "card_payment": [
        "We have investigated the issue. Your card payment limit was temporarily reduced for security reasons. It has now been restored.",
        "The payment failure was due to a network timeout at the merchant's end. Your account was not debited. Please try again.",
    ],
    "balance_not_updated": [
        "The balance update is delayed due to high transaction volume. Your account will reflect the correct balance within 2 hours.",
        "We have verified the transaction. The balance will be updated once the interbank settlement is complete, usually by end of day.",
    ],
    "transfer": [
        "We have initiated a recall request for the transfer. Please allow 3-5 business days for the reversal to complete.",
        "The transfer is under processing. If not credited within 24 hours, the amount will be automatically reversed to your account.",
    ],
    "account_access": [
        "Your account has been unlocked. Please reset your password using the forgot password option and enable 2FA for security.",
        "We have verified your identity. Your account access has been restored. Please login and change your password immediately.",
    ],
    "refund": [
        "We have raised a dispute for the double deduction. The refund will be credited to your account within 5-7 business days.",
        "The merchant refund has been received. It will reflect in your account within 2-3 business days as per banking regulations.",
    ],
    "loan": [
        "Your loan details have been updated. Please check the loan section in your NexaBank app for the latest EMI schedule.",
        "We have processed your request. Our loans team will contact you within 24 hours with the complete details.",
    ],
    "direct_debit": [
        "The direct debit mandate has been cancelled successfully. No further deductions will be made from your account.",
        "We have investigated the unauthorized debit. A reversal has been initiated and will reflect within 48 hours.",
    ],
    "top_up": [
        "The top up issue has been resolved. Please try again and your wallet balance will be updated instantly.",
        "We found a temporary glitch in the top up service. It has been fixed. Your pending top up amount will be credited shortly.",
    ],
    "exchange_rate": [
        "The current exchange rates have been shared with you via registered email. Please check for the latest rates before transacting.",
        "Our forex team will contact you within 2 hours with the best available rates for your transaction amount.",
    ],
    "beneficiary": [
        "The beneficiary has been verified and added successfully. You can now initiate transfers to this account.",
        "We have removed the beneficiary from your account as requested. The change will take effect immediately.",
    ],
    "transaction": [
        "We have raised a dispute for the unrecognized transaction. Our fraud team will investigate and revert within 7 business days.",
        "Your account statement has been generated and sent to your registered email address.",
    ],
}

STATUSES = ["pending", "in_progress", "resolved"]
STATUS_WEIGHTS = [0.3, 0.3, 0.4]


def seed():
    with engine.connect() as conn:
        print("🌱 Starting seed...")

        # ── Insert staff ──
        staff_ids = {}
        for full_name, email, department, dept_key in STAFF_DATA:
            existing = conn.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": email}
            ).fetchone()

            if existing:
                staff_ids[department] = existing[0]
                print(f"  Staff exists: {full_name}")
            else:
                result = conn.execute(
                    text("""
                        INSERT INTO users (full_name, email, hashed_password, account_number, role, department, is_active, created_at)
                        VALUES (:full_name, :email, :password, :account_number, 'staff', :department, true, NOW())
                        RETURNING id
                    """),
                    {
                        "full_name": full_name,
                        "email": email,
                        "password": hash_password("Staff@123"),
                        "account_number": None,
                        "department": department,
                    }
                )
                staff_ids[department] = result.fetchone()[0]
                print(f"  ✅ Staff created: {full_name}")

        # ── Insert customers ──
        customer_ids = []
        for full_name, email, account_number in CUSTOMER_DATA:
            existing = conn.execute(
                text("SELECT id FROM users WHERE email = :email"),
                {"email": email}
            ).fetchone()

            if existing:
                customer_ids.append(existing[0])
                print(f"  Customer exists: {full_name}")
            else:
                result = conn.execute(
                    text("""
                        INSERT INTO users (full_name, email, hashed_password, account_number, role, department, is_active, created_at)
                        VALUES (:full_name, :email, :password, :account_number, 'customer', NULL, true, NOW())
                        RETURNING id
                    """),
                    {
                        "full_name": full_name,
                        "email": email,
                        "password": hash_password("Customer@123"),
                        "account_number": account_number,
                    }
                )
                customer_ids.append(result.fetchone()[0])
                print(f"  ✅ Customer created: {full_name}")

        # ── Insert tickets ──
        print("\n🎫 Inserting tickets...")
        ticket_count = 0

        for i, (ticket_text, category, department) in enumerate(TICKETS_DATA):
            # Random customer
            customer_id = random.choice(customer_ids)

            # Random status weighted
            status = random.choices(STATUSES, weights=STATUS_WEIGHTS)[0]

            # Confidence between 55 and 95
            confidence = round(random.uniform(55, 95), 2)

            # Random created_at within last 30 days
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            created_at = datetime.now() - timedelta(days=days_ago, hours=hours_ago)
            updated_at = created_at + timedelta(hours=random.randint(1, 48))

            # Staff who claimed it
            claimed_by_id = None
            response = None

            if status in ["in_progress", "resolved"]:
                claimed_by_id = staff_ids.get(department)
                if status == "resolved":
                    responses = AGENT_RESPONSES.get(category, ["Your issue has been resolved successfully."])
                    response = random.choice(responses)

            conn.execute(
                text("""
                    INSERT INTO tickets 
                    (customer_id, text, predicted_category, confidence, assigned_department, status, claimed_by_id, response, created_at, updated_at)
                    VALUES 
                    (:customer_id, :text, :predicted_category, :confidence, :assigned_department, :status, :claimed_by_id, :response, :created_at, :updated_at)
                """),
                {
                    "customer_id": customer_id,
                    "text": ticket_text,
                    "predicted_category": category,
                    "confidence": confidence,
                    "assigned_department": department,
                    "status": status,
                    "claimed_by_id": claimed_by_id,
                    "response": response,
                    "created_at": created_at,
                    "updated_at": updated_at,
                }
            )
            ticket_count += 1

        conn.commit()
        print(f"\n✅ Seed complete!")
        print(f"   👥 {len(STAFF_DATA)} staff accounts")
        print(f"   👤 {len(CUSTOMER_DATA)} customer accounts")
        print(f"   🎫 {ticket_count} tickets inserted")
        print(f"\n📋 Login credentials:")
        print(f"   Staff password:    Staff@123")
        print(f"   Customer password: Customer@123")
        print(f"\n   Staff emails:")
        for _, email, dept, _ in STAFF_DATA:
            print(f"   {email} → {dept}")
        print(f"\n   Customer emails:")
        for _, email, acc in CUSTOMER_DATA:
            print(f"   {email} → {acc}")


if __name__ == "__main__":
    seed()