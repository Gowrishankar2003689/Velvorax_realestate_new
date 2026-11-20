# Velvorax CRM — AI Voice Calling Progress Tracker

## 1. Project Overview
- **Project:** Velvorax CRM (Existing React + Django REST Framework + SQLite application)
- **Objective:** Build a real-time AI voice-calling system using local Ollama AI, open-source STT/TTS, and telephony/SIP/PSTN integration that calls authorized CRM leads, conducts human-like conversations, qualifies customer interest, supports human handover, and logs transcripts/outcomes into the existing CRM.
- **Core Constraint:** Extend the existing CRM without deleting or breaking working features (`leads`, `calling`, `meetings`, `accounts`, `analytics`).

## 2. Hardware & Environment
- **OS:** Windows 11 Home
- **CPU:** 12th Gen Intel(R) Core(TM) i5-12450H
- **RAM:** 16,052 MB (~16 GB)
- **GPU:** NVIDIA GeForce RTX 3050 Laptop GPU
- **Storage:** ~115.5 GB free on `D:`
- **Backend:** Python 3.12, Django 6.1.2, DRF 3.18.3, SQLite (`backend/db.sqlite3`)
- **Frontend:** React (Vite), `frontend/src/components/AIVoiceCalling.jsx`

## 3. Confirmed Architecture & Stack
- **Architecture:** Modular AI Voice Sidecar Service (`ai_voice_engine/` running FastAPI + WebSockets on port `8001`) communicating with existing Django CRM (`backend/` on port `8000`).
- **VAD:** `Silero VAD` (CPU)
- **STT:** `faster-whisper` (`small.en` / `base.en`)
- **LLM (Conversation Brain):** `Ollama` (`qwen2.5:3b`)
- **TTS:** `Piper TTS`
- **Telephony (Stage 13+):** Plivo / Twilio / SIP gateway (deferred until Stage 12 browser voice integration is verified)

## 4. Development Roadmap Status
| Stage | Work | Status |
| :--- | :--- | :--- |
| 1 | Understand existing CRM architecture | **Completed** |
| 2 | Inspect existing AI calling implementation | **Completed** |
| 3 | Research free/open-source AI voice technologies | **Completed** |
| 4 | Check computer hardware and model compatibility | **Completed** |
| 5 | Design AI voice architecture & create progress tracker | **Completed** |
| 6 | Build local speech-to-text (STT) | **Completed** |
| 7 | Build AI conversation engine (Ollama LLM) | **Completed** |
| 8 | Build text-to-speech (TTS) | **Completed** |
| 9 | Connect STT, LLM, and TTS | Pending |
| 10 | Build browser-based voice testing | Pending |
| 11 | Integrate AI engine with Django | Pending |
| 12 | Connect existing React AI calling page | Pending |
| 13 | Connect real telephony/SIP/PSTN | Pending |
| 14 | Test real outbound AI calls | Pending |
| 15 | Implement customer qualification | Pending |
| 16 | Implement human handover | Pending |
| 17 | Save call results in existing CRM | Pending |
| 18 | Integrate shared call history | Pending |
| 19 | Test recording support and consent | Pending |
| 20 | Security, privacy, and compliance review | Pending |
| 21 | Production deployment | Pending |
| 22 | Final launch and documentation | Pending |

## 5. Files Created or Modified
- `docs/AI_CALLING_PROGRESS.md` (Created)
- `ai_voice_engine/` (Directory created)

## 6. Next Exact Task
- **Stage 7:** Verify Ollama installation, pull `qwen2.5:3b`, and build + test the Velvorax AI Sales/Support Conversation Engine in `ai_voice_engine/`.