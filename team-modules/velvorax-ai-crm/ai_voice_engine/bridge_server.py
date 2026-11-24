import os
import requests
from fastapi import FastAPI, HTTPException, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from twilio.rest import Client
from twilio.twiml.voice_response import Connect, VoiceResponse

from voice_pipeline import VelvoraxVoicePipeline

app = FastAPI(title="Velvorax AI Voice & Telephony Bridge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DJANGO_BACKEND_URL = os.environ.get(
    "DJANGO_BACKEND_URL", "http://127.0.0.1:8000"
)

# Load Twilio credentials and tunnel configuration from .env
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
TUNNEL_HOST = os.getenv("TUNNEL_HOST")


class CallRequest(BaseModel):
  lead_id: int
  lead_name: str
  lead_phone: str


class TwilioCallRequest(BaseModel):
  phone: str = "+919363646169"


@app.get("/")
def health_check():
  return {"status": "running", "service": "Velvorax AI Voice Bridge"}


@app.post("/api/ai-call/start/")
def start_ai_voice_call(payload: CallRequest):
  print(
      f"\n[AI Voice Bridge] Starting live voice call with lead:"
      f" {payload.lead_name} ({payload.lead_phone})"
  )

  try:
    pipeline = VelvoraxVoicePipeline(
        lead_name=payload.lead_name, company_name="Velvorax"
    )
    result = pipeline.run_live_call(max_turns=6)

    interest = result.get("interest_level", "unknown")
    if interest not in ["unknown", "interested", "not_interested", "undecided"]:
      interest = "unknown"

    handover = bool(result.get("handover_requested", False))
    transcript_text = result.get("transcript", "Customer: ...\nAI: ...")
    recording_path = result.get("recording_path", None)

    data_payload = {
        "lead": str(payload.lead_id),
        "call_status": "completed",
        "is_ai_call": "true",
        "call_type": "ai",
        "transfer_status": "pending" if handover else "not_required",
        "handover_resolved": "false" if handover else "true",
        "interest_level": interest,
        "requirement": result.get("requirement")
        or result.get("summary")
        or "AI voice conversation completed.",
        "next_action": "human_handover"
        if handover
        else ("meeting" if interest == "interested" else "none"),
        "qualification_status": interest
        if interest in ["interested", "not_interested"]
        else "not_assessed",
        "summary": result.get("summary")
        or "Live voice session completed via local AI engine.",
        "transcript": transcript_text,
        "outcome": "Live voice session completed via local AI engine.",
        "duration_seconds": str(int(result.get("duration_seconds") or 60)),
    }

    files_payload = {}
    if recording_path and os.path.exists(recording_path):
      files_payload["recording"] = open(recording_path, "rb")

    print(
        "[AI Voice Bridge] Posting call logs & recording to Django history"
        " endpoint..."
    )
    django_response = requests.post(
        f"{DJANGO_BACKEND_URL}/api/calling/history/",
        data=data_payload,
        files=files_payload if files_payload else None,
    )

    if files_payload.get("recording"):
      files_payload["recording"].close()

    if django_response.status_code not in {200, 201}:
      print(
          f"[Warning] Failed to save call log in Django"
          f" ({django_response.status_code}): {django_response.text}"
      )
    else:
      print(
          "[AI Voice Bridge] Call log and recording successfully saved to SQLite"
          " database!"
      )

    return {
        "message": "AI Voice Call completed successfully and saved to CRM.",
        "interest_level": interest,
        "summary": data_payload["summary"],
        "transcript": transcript_text,
        "duration_seconds": data_payload["duration_seconds"],
        "handover_requested": handover,
    }

  except Exception as exc:
    print(f"[AI Voice Bridge Error] {exc}")
    raise HTTPException(status_code=500, detail=str(exc))


# --- TWILIO REAL PHONE CALL ENDPOINTS ---


@app.post("/api/twilio/trigger-call")
async def trigger_twilio_call(payload: TwilioCallRequest):
  """Triggers an outbound phone call from Twilio to your mobile phone."""
  client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

  call = client.calls.create(
      to=payload.phone,
      from_=TWILIO_PHONE_NUMBER,
      url=f"https://swift-experts-talk.loca.lt/twilio/incoming-call",
  )

  return {"message": "Call triggered successfully!", "call_sid": call.sid}


@app.post("/twilio/incoming-call")
async def incoming_call(request: Request):
  """TwiML response telling Twilio to connect the phone call to our WebSocket media stream."""
  response = VoiceResponse()
  connect = Connect()
  connect.stream(url=f"wss://2600:3c15::2000:28ff:feb3:8d52/twilio/media-stream")
  response.append(connect)

  return Response(content=str(response), media_type="application/xml")


@app.websocket("/twilio/media-stream")
async def media_stream(websocket: WebSocket):
  """Handles live two-way audio streaming between the mobile phone and your AI pipeline."""
  await websocket.accept()
  print("Twilio Media Stream connected successfully!")

  try:
    while True:
      message = await websocket.receive_text()
      # Raw audio frames from Twilio will be processed here
  except Exception as exc:
    print(f"Media stream disconnected: {exc}")


if __name__ == "__main__":
  import uvicorn

  uvicorn.run(app, host="127.0.0.1", port=8001)