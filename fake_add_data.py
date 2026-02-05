import requests
import random
import threading
from faker import Faker
from datetime import date, timedelta
from concurrent.futures import ThreadPoolExecutor

fake = Faker("en_IN")

API_URL = "http://localhost:8000/patients/add/"
THREADS = 20  # 🔥 increase to 30–50 if backend can handle it

counter = 0
lock = threading.Lock()


def random_dob(min_age=1, max_age=90):
    today = date.today()
    start_date = today - timedelta(days=max_age * 365)
    end_date = today - timedelta(days=min_age * 365)
    return fake.date_between(start_date=start_date, end_date=end_date)


def generate_patient():
    return {
        "patient_name": fake.name(),
        "dob": random_dob().strftime("%Y-%m-%d"),
        "email": fake.unique.email(),
        "mobile": str(random.randint(6000000000, 9999999999)),
        "gender": random.choice(["M", "F"]),
        "blood_group": random.choice(
            ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", ""]
        ),
        "address": fake.address(),
        "created_by": 1,
    }


def send_request():
    global counter
    data = generate_patient()

    try:
        r = requests.post(API_URL, json=data, timeout=5)

        with lock:
            counter += 1
            if r.status_code in (200, 201):
                print(f"✅ [{counter}] {data['patient_name']}")
            else:
                print(f"❌ [{counter}] {r.status_code}")
    except Exception as e:
        with lock:
            counter += 1
            print(f"⚠️ [{counter}] Error: {e}")


def main():
    print("🚀 FAST MODE ENABLED")
    print("⛔ Press CTRL + C to stop\n")

    try:
        with ThreadPoolExecutor(max_workers=THREADS) as executor:
            while True:
                executor.submit(send_request)
    except KeyboardInterrupt:
        print("\n🛑 Stopped by user")
        print(f"📊 Total requests sent: {counter}")


if __name__ == "__main__":
    main()
