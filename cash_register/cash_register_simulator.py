import json
import random
import time
import os
from datetime import datetime
import socket

LOG_DIR = "./transactions"
os.makedirs(LOG_DIR, exist_ok=True)

SHOP_ID = "S0001"
PRODUCT_IDS = ["P101", "P102", "P103", "P104", "P105", "P106"]

# Generate a transaction record.
def generate_transaction(register_id: str):
    transaction = {
        "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "shop_id": SHOP_ID,
        "register_id": register_id,
        "order_id": f"O{random.randint(10000, 99999)}",
        "product_id": random.choice(PRODUCT_IDS),
        "quantity": random.randint(1, 5),
        "price": round(random.uniform(1.0, 20.0), 2)
    }
    return transaction

def main():
    # Fetch current shop's cash register identifier.
    # This is done to allow start multiple cash register
    # containers by running:
    # $ docker compose up --scale register=<number_of_cash_registers> 
    register_id = socket.gethostname()
    print(f"Starting cash register: {register_id}", flush=True)
    while True:
        transaction = generate_transaction(register_id)
        log_file = os.path.join(LOG_DIR, f"{register_id}.log")

        # Append JSON line to that shop’s log file
        with open(log_file, "a") as f:
            f.write(json.dumps(transaction) + "\n")

        print(f"[{register_id}] Wrote order {transaction['order_id']} for {transaction['product_id']}")
        # Wait 1–3 seconds between batches
        time.sleep(random.uniform(1.0, 3.0))


if __name__ == "__main__":
    main()
