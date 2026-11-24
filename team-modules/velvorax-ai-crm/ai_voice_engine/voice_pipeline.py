import os
import time
import wave
import json
import numpy as np
import requests
import sounddevice as sd

from stt_engine import LocalSTTEngine
from llm_agent import VelvoraxCallAgent, OLLAMA_BASE_URL, DEFAULT_MODEL
from tts_engine import LocalTTSEngine


class VelvoraxVoicePipeline:
    """
    End-to-end local AI Voice Calling Pipeline connecting:
    Microphone (with auto-silence detection) -> faster-whisper STT -> Ollama LLM -> Kokoro TTS -> Speakers.
    """

    def __init__(self, lead_name: str = "Arun Kumar", company_name: str = "Velvorax"):
        print("\n=== Initializing Velvorax AI Voice Pipeline ===")
        self.stt = LocalSTTEngine(model_size="small.en", prefer_gpu=True)
        self.tts = LocalTTSEngine(voice="af_heart")
        self._warmup_ollama()
        self.agent = VelvoraxCallAgent(lead_name=lead_name, company_name=company_name)
        self.sample_rate = 16000
        self.master_audio_buffer = []

    @staticmethod
    def _warmup_ollama(model: str = DEFAULT_MODEL) -> None:
        """Pre-loads the Ollama model into memory so live voice turns respond immediately."""
        print(f"Warming up Ollama model '{model}'...")
        try:
            requests.post(
                f"{OLLAMA_BASE_URL}/api/chat",
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": "hi"}],
                    "stream": False,
                    "keep_alive": "15m",
                    "options": {"num_predict": 1},
                },
                timeout=90,
            )
            print("Ollama LLM ready!")
        except Exception as exc:
            print(f"Ollama warmup note: {exc}")

    def speak_and_record(self, text: str) -> None:
        """
        Synthesizes the real Kokoro-82M neural voice, plays it through the speakers,
        resamples it to 16kHz to match the microphone, and appends the real AI voice
        into the master call recording buffer.
        """
        print(f"AI Speaking: \"{text}\"")
        try:
            # 1. Get the real neural voice array and its sample rate (24000 Hz) from LocalTTSEngine
            samples, tts_sr = self.tts.synthesize_to_array(text)

            # 2. Play the real AI voice out loud on speakers
            sd.play(samples, samplerate=tts_sr)
            sd.wait()

            # 3. Convert stereo to mono if needed
            samples_flat = np.asarray(samples, dtype=np.float32)
            if samples_flat.ndim > 1:
                samples_flat = samples_flat.mean(axis=1)

            # 4. Resample from Kokoro's 24000 Hz to our WAV recording's 16000 Hz
            if tts_sr != self.sample_rate and len(samples_flat) > 0:
                duration = len(samples_flat) / float(tts_sr)
                target_len = int(duration * self.sample_rate)
                old_indices = np.linspace(0, len(samples_flat) - 1, num=len(samples_flat))
                new_indices = np.linspace(0, len(samples_flat) - 1, num=target_len)
                resampled_ai_audio = np.interp(new_indices, old_indices, samples_flat).astype(np.float32)
            else:
                resampled_ai_audio = samples_flat

            # 5. Append the real AI voice + 0.3s natural pause into the master recording
            self.master_audio_buffer.append(resampled_ai_audio)
            pause = np.zeros(int(self.sample_rate * 0.3), dtype=np.float32)
            self.master_audio_buffer.append(pause)

        except Exception as exc:
            print(f"TTS recording error: {exc}")
            self.tts.speak(text)

    def listen_until_silence(
        self,
        max_seconds: int = 12,
        silence_threshold: float = 0.015,
        silence_duration: float = 1.2,
    ) -> np.ndarray:
        """
        Records from the microphone automatically when the customer speaks.
        """
        chunk_duration = 0.1  # 100ms chunks
        chunk_samples = int(self.sample_rate * chunk_duration)
        max_chunks = int(max_seconds / chunk_duration)
        silence_chunks_needed = int(silence_duration / chunk_duration)

        recorded_chunks = []
        speech_started = False
        silent_chunks = 0

        print("\n[Microphone Active] Listening... (Speak now)")
        with sd.InputStream(samplerate=self.sample_rate, channels=1, dtype="float32") as stream:
            for _ in range(max_chunks):
                chunk, _ = stream.read(chunk_samples)
                flat_chunk = chunk.flatten()
                recorded_chunks.append(flat_chunk)

                rms = float(np.sqrt(np.mean(flat_chunk**2)))

                if rms > silence_threshold:
                    if not speech_started:
                        print("  -> Speech detected...")
                        speech_started = True
                    silent_chunks = 0
                else:
                    if speech_started:
                        silent_chunks += 1
                        if silent_chunks >= silence_chunks_needed:
                            print("  -> End of speech detected.")
                            break

        if speech_started and len(recorded_chunks) > 0:
            user_audio = np.concatenate(recorded_chunks)
            self.master_audio_buffer.append(user_audio)
            return user_audio

        return np.array([], dtype="float32")

    def run_live_call(self, max_turns: int = 8) -> dict:
        """
        Runs a full multi-turn voice call and returns the final CRM qualification dict.
        """
        call_start = time.time()
        print("\n--- Call Connected ---")
        transcript_lines = []

        # 1. AI speaks opening line
        opening = self.agent.get_opening_line()
        transcript_lines.append(f"ASSISTANT: {opening}")
        self.speak_and_record(opening)

        turns = 0
        while not self.agent.call_ended and turns < max_turns:
            audio = self.listen_until_silence()
            if len(audio) == 0:
                print("[No speech detected. Asking if customer is still there...]")
                prompt_again = "Hello, are you still on the line?"
                transcript_lines.append(f"ASSISTANT: {prompt_again}")
                self.speak_and_record(prompt_again)
                turns += 1
                continue

            customer_text = self.stt.transcribe_audio(audio)
            if not customer_text or len(customer_text.strip()) < 2:
                continue

            print(f"Customer: \"{customer_text}\"")
            transcript_lines.append(f"USER: {customer_text}")

            if customer_text.strip().lower().rstrip(".!?") in {"exit", "quit", "hang up"}:
                print("--- Customer hung up ---")
                break

            # 2. Generate AI reply via Ollama
            ai_reply = self.agent.generate_reply(customer_text)
            transcript_lines.append(f"ASSISTANT: {ai_reply}")

            # 3. Speak AI reply & record it
            self.speak_and_record(ai_reply)
            turns += 1

        duration_seconds = int(time.time() - call_start)
        print(f"\n--- Call Ended (Duration: {duration_seconds}s) ---")

        # Save complete chronological two-way conversation recording as a valid WAV file
        recording_path = None
        os.makedirs("call_recordings", exist_ok=True)
        recording_filename = f"call_{int(time.time())}.wav"
        recording_path = os.path.join("call_recordings", recording_filename)

        if len(self.master_audio_buffer) > 0:
            full_audio = np.concatenate(self.master_audio_buffer)
        else:
            full_audio = np.zeros(self.sample_rate * 1, dtype=np.float32)

        audio_int16 = np.clip(full_audio * 32767, -32768, 32767).astype(np.int16)
        with wave.open(recording_path, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(self.sample_rate)
            wf.writeframes(audio_int16.tobytes())
        print(f"Complete two-way call recording saved successfully to: {recording_path}")

        print("Analyzing call transcript for CRM storage...")
        outcome = self.agent.analyze_call_outcome()
        outcome["duration_seconds"] = duration_seconds
        outcome["transcript"] = "\n".join(transcript_lines)
        outcome["recording_path"] = recording_path
        return outcome


if __name__ == "__main__":
    pipeline = VelvoraxVoicePipeline(lead_name="Nanthakumar", company_name="Velvorax")
    result = pipeline.run_live_call()
    print("\n=== Final CRM CallLog Payload ===")
    print(json.dumps(result, indent=2))