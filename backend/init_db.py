import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base, SessionLocal
from models import User
from auth import hash_password

def init():
    print("Dropping tables...")
    Base.metadata.drop_all(bind=engine)
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    # Seeding Super Agent and Employee accounts
    db = SessionLocal()
    try:
        admin_email = "admin@nexabank.com"
        print(f"Seeding Super Agent Admin account: {admin_email}")
        
        admin = User(
            full_name="Super Agent",
            email=admin_email,
            hashed_password=hash_password("adminpassword"),
            role="admin",
            department=None
        )
        db.add(admin)

        # Seeding 4 employee accounts
        employees = [
            {
                #billing
                "full_name": "Billing Specialist",
                "email": "Niharika_billingagent@nexabank.com",
                "password": "billing123",
                "role": "staff",
                "department": "billing"
            },
            {
                #sales
                "full_name": "Sales Specialist",
                "email": "Mathew_salesagent@nexabank.com",
                "password": "sales123",
                "role": "staff",
                "department": "sales"
            },
            {
                #account support
                "full_name": "Tech Support Specialist",
                "email": "Jenny_techagent@nexabank.com",
                "password": "tech123",
                "role": "staff",
                "department": "account_support"
            },
            {
                #security specialist
                "full_name": "Security Specialist",
                "email": "smith_securityagent@nexabank.com",
                "password": "smith123",
                "role": "staff",
                "department": "security"
            },
            {
                #ATM'S AND CARDS
                "full_name": "ATM'S AND CARDS Specialist",
                "email": "stephan_cardsagent@nexabank.com",
                "password": "stephan123",
                "role": "staff",
                "department": "cards"
            },
            {
                #general support
                "full_name": "General Support Specialist",
                "email": "sam_generalagent@nexabank.com",
                "password": "general123",
                "role": "staff",
                "department": "general_support"
            }

        ]

        for emp in employees:
            print(f"Seeding employee account: {emp['email']}")
            agent = User(
                full_name=emp["full_name"],
                email=emp["email"],
                hashed_password=hash_password(emp["password"]),
                role=emp["role"],
                department=emp["department"]
            )
            db.add(agent)

        db.commit()
        print("Admin and Employee accounts seeded successfully!")
    except Exception as e:
        print(f"Error seeding database accounts: {e}")
        db.rollback()
    finally:
        db.close()
        
    print("Database tables initialized successfully!")

if __name__ == "__main__":
    init()
