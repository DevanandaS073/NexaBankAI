import requests
import time

BASE_URL = "http://127.0.0.1:8000"

def test_flow():
    print("--- Starting Secure Provisioning API Verification ---")
    
    # 1. Login as Super Agent (Admin)
    print("Logging in as default Super Agent...")
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@nexabank.com",
        "password": "adminpassword"
    })
    assert res.status_code == 200, f"Super Agent login failed: {res.text}"
    admin_token = res.json()["access_token"]
    print("Super Agent logged in successfully.")
    
    # 2. Provision Support Agent via Admin
    agent_email = f"agent_{int(time.time())}@nexabank.com"
    agent_payload = {
        "full_name": "Billing Agent Joe",
        "email": agent_email,
        "password": "secureagentpass",
        "role": "staff",
        "department": "billing"
    }
    print(f"Super Agent provisioning Billing Support Agent: {agent_email}")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    res = requests.post(f"{BASE_URL}/auth/agents", json=agent_payload, headers=admin_headers)
    assert res.status_code == 200, f"Agent provisioning failed: {res.text}"
    print("Billing Support Agent provisioned successfully.")
    
    # 3. Register Customer publicly
    customer_email = f"customer_{int(time.time())}@gmail.com"
    customer_payload = {
        "full_name": "Nexa Customer",
        "email": customer_email,
        "password": "customerpass",
        "account_number": "ACCT-8812",
        "role": "customer"
    }
    print(f"Registering customer: {customer_email}")
    res = requests.post(f"{BASE_URL}/auth/register", json=customer_payload)
    assert res.status_code == 200, f"Customer registration failed: {res.text}"
    print("Customer registered successfully.")
    
    # 4. Login Customer
    print("Logging in Customer...")
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": customer_email,
        "password": "customerpass"
    })
    assert res.status_code == 200, f"Customer login failed: {res.text}"
    customer_token = res.json()["access_token"]
    print("Customer logged in successfully.")
    
    # 5. Submit Support Ticket
    ticket_payload = {
        "text": "I was charged double on my subscription billing card yesterday."
    }
    print("Customer submitting support ticket...")
    cust_headers = {"Authorization": f"Bearer {customer_token}"}
    res = requests.post(f"{BASE_URL}/tickets", json=ticket_payload, headers=cust_headers)
    assert res.status_code == 200, f"Ticket submission failed: {res.text}"
    ticket = res.json()
    ticket_id = ticket["id"]
    print(f"Ticket submitted. ID: {ticket_id}")
    print(f"AI intent prediction: {ticket['predicted_category']}")
    print(f"Routed Department: {ticket['assigned_department']}")
    assert ticket["assigned_department"] == "billing"
    
    # 6. Login Provisioned Support Agent
    print("Logging in provisioned Billing Agent...")
    res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": agent_email,
        "password": "secureagentpass"
    })
    assert res.status_code == 200, f"Agent login failed: {res.text}"
    agent_token = res.json()["access_token"]
    print("Agent logged in successfully.")
    
    # 7. Agent fetches department queue
    print("Agent fetching billing queue...")
    agent_headers = {"Authorization": f"Bearer {agent_token}"}
    res = requests.get(f"{BASE_URL}/tickets/department", headers=agent_headers)
    assert res.status_code == 200, f"Fetch queue failed: {res.text}"
    queue = res.json()
    matching_ticket = next((t for t in queue if t["id"] == ticket_id), None)
    assert matching_ticket is not None, "Ticket not found in Billing queue!"
    print("Ticket found in Billing department queue.")
    
    # 8. Agent starts and resolves ticket
    print("Agent starting ticket...")
    res = requests.post(f"{BASE_URL}/tickets/{ticket_id}/start", headers=agent_headers)
    assert res.status_code == 200, f"Start failed: {res.text}"
    
    resolution = "We have refunded the second charge. The credit will reflect in 2-3 business days."
    print("Agent responding/resolving ticket...")
    res = requests.post(
        f"{BASE_URL}/tickets/{ticket_id}/respond",
        json={"response": resolution},
        headers=agent_headers
    )
    assert res.status_code == 200, f"Response failed: {res.text}"
    print("Ticket resolved.")
    
    # 9. Super Agent fetches all tickets
    print("Super Agent checking global tickets monitor...")
    res = requests.get(f"{BASE_URL}/tickets", headers=admin_headers)
    assert res.status_code == 200, f"Global fetch failed: {res.text}"
    global_tickets = res.json()
    my_global_ticket = next((t for t in global_tickets if t["id"] == ticket_id), None)
    assert my_global_ticket is not None
    assert my_global_ticket["status"] == "resolved"
    print("Verified: Super Agent successfully audited resolved ticket globally.")
    
    print("\n--- ALL SECURE PROVISIONING AND ROUTING API TESTS PASSED! ---")

if __name__ == "__main__":
    time.sleep(1)
    test_flow()
