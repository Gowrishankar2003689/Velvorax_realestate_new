import time
from datetime import datetime
import requests

# Endpoints
DJANGO_MEETINGS_URL = "http://127.0.0.1:8000/api/meetings/"
FASTAPI_TRIGGER_URL = "http://127.0.0.1:8001/api/twilio/trigger-call"


def check_and_trigger_scheduled_calls():
  print(
      f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Background Worker:"
      " Checking scheduled AI call queue..."
  )

  try:
    # 1. Fetch all meetings from Django
    response = requests.get(DJANGO_MEETINGS_URL)
    if response.status_code != 200:
      print("[Worker Error] Could not fetch meetings from Django backend.")
      return

    meetings = response.json()
    now = datetime.now()

    for meeting in meetings:
      # Check if meeting is pending
      if meeting.get("status") == "pending":
        scheduled_time_str = meeting.get("scheduled_at")
        if not scheduled_time_str:
          continue

        # Parse scheduled time (handles ISO format from Django)
        # Convert to local naive or aware datetime for comparison
        scheduled_time = datetime.fromisoformat(
            scheduled_time_str.replace("Z", "+00:00")
        )
        scheduled_time_local = scheduled_time.replace(tzinfo=None)

        # If current time has reached or passed the scheduled time
        if now >= scheduled_time_local:
          meeting_id = meeting.get("id")
          lead_phone = meeting.get(
              "lead_phone", "+919363646169"
          )  # fallback to your number
          lead_name = meeting.get("lead_name", "Valued Customer")

          print(
              f"\n[TRIGGER] Scheduled time reached for meeting #{meeting_id}"
              f" with {lead_name} ({lead_phone}). Initiating call..."
          )

          # 2. Trigger the FastAPI Twilio call endpoint
          call_response = requests.post(
              FASTAPI_TRIGGER_URL, json={"phone": lead_phone}
          )

          if call_response.status_code == 200:
            print("[SUCCESS] Automated AI call triggered successfully!")

            # 3. Update meeting status in Django to 'completed' so it won't re-trigger
            patch_url = f"{DJANGO_MEETINGS_URL}{meeting_id}/"
            requests.patch(patch_url, json={"status": "completed"})
          else:
            print(
                "[ERROR] Failed to trigger phone call:"
                f" {call_response.text}"
            )

  except Exception as exc:
    print(f"[Worker Exception] {exc}")


if __name__ == "__main__":
  print(
      "============================================================"
      "\n Velvorax Automated AI Call Scheduler Worker is RUNNING..."
      "\n Checking every 30 seconds for pending calls."
      "\n ============================================================"
  )

  while True:
    check_and_trigger_scheduled_calls()
    time.sleep(30)  # Check every 30 seconds