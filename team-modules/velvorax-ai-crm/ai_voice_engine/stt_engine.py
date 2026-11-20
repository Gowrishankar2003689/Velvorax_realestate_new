import os
import site
import time

# Silence HuggingFace symlink warning on Windows
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"


def _register_nvidia_dlls() -> None:
    """Automatically adds pip-installed NVIDIA CUDA DLL folders to Windows PATH."""
    for site_dir in site.getsitepackages():
        nvidia_dir = os.path.join(site_dir, "nvidia")
        if os.path.isdir(nvidia_dir):
            for root, dirs, _ in os.walk(nvidia_dir):
                if "bin" in dirs:
                    bin_path = os.path.join(root, "bin")
                    os.environ["PATH"] = bin_path + os.pathsep + os.environ.get("PATH", "")
                    if hasattr(os, "add_dll_directory"):
                        try:
                            os.add_dll_directory(bin_path)
                        except OSError:
                            pass


_register_nvidia_dlls()

import numpy as np
import sounddevice as sd
from faster_whisper import WhisperModel


class LocalSTTEngine:
    """
    High-accuracy Speech-to-Text engine using faster-whisper ('small.en')
    with custom vocabulary priming for Velvorax CRM and Indian English accents.
    """

    # Context prompt & hotwords so Whisper recognizes custom brand/CRM words accurately
    CRM_CONTEXT_PROMPT = (
        "This is a business phone call for Velvorax CRM AI voice calling. "
        "Common terms: Velvorax, Velvorax CRM, AI calling, demo meeting, callback, "
        "follow-up, telecaller, human agent, interested, not interested, pricing."
    )
    CRM_HOTWORDS = "Velvorax, CRM, AI calling, demo, callback, telecaller"

    def __init__(self, model_size: str = "small.en", prefer_gpu: bool = True):
        self.model_size = model_size
        self.sample_rate = 16000

        if prefer_gpu:
            try:
                print(f"Loading Whisper '{model_size}' on CUDA (int8_float16)...")
                self.model = WhisperModel(model_size, device="cuda", compute_type="int8_float16")
                self.device = "cuda"
            except Exception:
                print(f"CUDA unavailable; loading Whisper '{model_size}' on CPU (int8)...")
                self.model = WhisperModel(model_size, device="cpu", compute_type="int8")
                self.device = "cpu"
        else:
            print(f"Loading Whisper '{model_size}' on CPU (int8)...")
            self.model = WhisperModel(model_size, device="cpu", compute_type="int8")
            self.device = "cpu"

        print(f"STT Engine ready on {self.device.upper()}!")

    def transcribe_audio(self, audio_float32: np.ndarray) -> str:
        """
        Normalizes microphone volume and transcribes 16kHz float32 audio into English text.
        """
        # Normalize audio volume so quiet microphones don't cause misheard words
        max_val = np.max(np.abs(audio_float32))
        if max_val > 0.01:
            audio_float32 = audio_float32 / max_val * 0.9

        start = time.time()
        try:
            segments, _ = self.model.transcribe(
                audio_float32,
                beam_size=5,
                language="en",
                initial_prompt=self.CRM_CONTEXT_PROMPT,
                hotwords=self.CRM_HOTWORDS,
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": 400},
                condition_on_previous_text=False,
            )
            text = " ".join(segment.text.strip() for segment in segments).strip()
        except RuntimeError as exc:
            if "cublas" in str(exc).lower() or "cudnn" in str(exc).lower():
                print("CUDA DLL missing during inference; switching to CPU (int8)...")
                self.device = "cpu"
                self.model = WhisperModel(self.model_size, device="cpu", compute_type="int8")
                segments, _ = self.model.transcribe(
                    audio_float32,
                    beam_size=5,
                    language="en",
                    initial_prompt=self.CRM_CONTEXT_PROMPT,
                    hotwords=self.CRM_HOTWORDS,
                    vad_filter=True,
                    vad_parameters={"min_silence_duration_ms": 400},
                    condition_on_previous_text=False,
                )
                text = " ".join(segment.text.strip() for segment in segments).strip()
            else:
                raise

        elapsed = time.time() - start
        print(f"[STT {elapsed:.2f}s | {self.device.upper()}] Transcribed: '{text}'")
        return text

    def record_from_mic(self, seconds: int = 5) -> np.ndarray:
        print(f"\nListening for {seconds} seconds... Speak now!")
        recording = sd.rec(
            int(seconds * self.sample_rate),
            samplerate=self.sample_rate,
            channels=1,
            dtype="float32",
        )
        sd.wait()
        print("Recording stopped.")
        return recording.flatten()


if __name__ == "__main__":
    print("=== Velvorax High-Accuracy Speech-to-Text Test ===")
    stt = LocalSTTEngine(model_size="small.en", prefer_gpu=True)
    input("Press Enter when you are ready to speak for 5 seconds...")
    audio = stt.record_from_mic(seconds=5)
    transcript = stt.transcribe_audio(audio)
    print(f"\nFinal Result: {transcript}")