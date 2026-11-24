import io
import os
import time
import numpy as np
import sounddevice as sd
import soundfile as sf


class LocalTTSEngine:
    """
    100% Local, Open-Source Neural Text-to-Speech Engine (Kokoro-82M ONNX)
    with automatic Windows SAPI (pyttsx3) fallback.
    Can play audio directly to speakers AND return raw WAV bytes for WebSocket/Telephony.
    """

    def __init__(self, voice: str = "af_heart"):
        self.voice = voice
        self.kokoro = None
        model_path = os.path.join(os.path.dirname(__file__), "models", "kokoro-v1.0.onnx")
        voices_path = os.path.join(os.path.dirname(__file__), "models", "voices-v1.0.bin")

        if os.path.exists(model_path) and os.path.exists(voices_path):
            try:
                from kokoro_onnx import Kokoro
                print("Loading Local Kokoro-82M Neural TTS on CPU...")
                self.kokoro = Kokoro(model_path, voices_path)
                print(f"TTS Engine ready (Kokoro-82M, voice='{self.voice}')!")
            except Exception as exc:
                print(f"Kokoro init warning ({exc}); falling back to pyttsx3.")
        else:
            print("Kokoro model files not found in models/; using pyttsx3 offline fallback.")

    def synthesize_to_array(self, text: str) -> tuple[np.ndarray, int]:
        """
        Converts text into (audio_float32_array, sample_rate).
        """
        start = time.time()
        if self.kokoro is not None:
            samples, sample_rate = self.kokoro.create(
                text,
                voice=self.voice,
                speed=1.0,
                lang="en-us",
            )
            elapsed = time.time() - start
            print(f"[TTS {elapsed:.2f}s | Kokoro-82M] Generated {len(samples)/sample_rate:.1f}s of speech.")
            return samples, sample_rate

        # Fallback: pyttsx3 -> temporary wav -> numpy array
        import tempfile
        import pyttsx3

        engine = pyttsx3.init()
        engine.setProperty("rate", 175)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            temp_path = tmp.name
        engine.save_to_file(text, temp_path)
        engine.runAndWait()
        samples, sample_rate = sf.read(temp_path, dtype="float32")
        os.remove(temp_path)
        elapsed = time.time() - start
        print(f"[TTS {elapsed:.2f}s | pyttsx3] Generated speech.")
        return samples, sample_rate

    def synthesize_to_wav_bytes(self, text: str) -> bytes:
        """
        Returns standard WAV file bytes (ideal for sending over WebSockets to React browser).
        """
        samples, sample_rate = self.synthesize_to_array(text)
        buffer = io.BytesIO()
        sf.write(buffer, samples, sample_rate, format="WAV")
        return buffer.getvalue()

    def speak(self, text: str) -> None:
        """
        Synthesizes text and plays it immediately through the computer speakers.
        """
        print(f"AI Speaking: \"{text}\"")
        samples, sample_rate = self.synthesize_to_array(text)
        sd.play(samples, samplerate=sample_rate)
        sd.wait()


if __name__ == "__main__":
    print("=== Velvorax Local Text-to-Speech Test ===")
    tts = LocalTTSEngine(voice="af_heart")
    test_line = (
        "Hello Nantha Kumar, I am the automated AI assistant calling on behalf of Velvorax. "
        "Is this a convenient time to speak for a moment?"
    )
    tts.speak(test_line)
    print("TTS playback finished successfully!")