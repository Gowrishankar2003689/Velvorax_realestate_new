import json
import requests

OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "qwen2.5:3b"


class VelvoraxCallAgent:
    """
    Local Ollama-powered conversational AI agent for Velvorax CRM.
    Handles natural voice dialogue, opt-out detection, human handover detection,
    and post-call lead qualification matching Django's CallLog fields.
    """

    def __init__(self, lead_name: str, company_name: str = "Velvorax", model: str = DEFAULT_MODEL):
        self.lead_name = lead_name
        self.company_name = company_name
        self.model = model
        self.opt_out_triggered = False
        self.handover_requested = False
        self.call_ended = False

        self.system_prompt = f"""
You are a polite, professional AI voice assistant calling on behalf of {self.company_name}.
You are speaking on a live phone call with {self.lead_name}.

STRICT RULES:
1. Transparency & Ethics: You have already disclosed that you are an AI assistant. Never lie, use fake human names, make false promises, or pressure the customer.
2. Voice-First Brevity: Keep EVERY reply short (1 to 2 natural spoken sentences, under 35 words). Do NOT use bullet points, markdown, emojis, or special symbols because your text will be read aloud by a Text-to-Speech engine.
3. Conversation Flow:
   - First confirm if it is a convenient time to talk.
   - Briefly explain that {self.company_name} helps businesses automate customer follow-ups, lead tracking, and AI voice outreach.
   - Ask 1 simple question to understand their current process or interest.
   - Do not repeat questions already answered.
4. Opt-Out / Do Not Call: If the customer says "stop calling", "do not call me", "remove my number", or sounds upset about being called, apologize politely, confirm their number will be removed immediately, and append [OPT_OUT] at the very end of your reply.
5. Human Handover: If the customer asks to speak to a human, manager, or live agent, say you will connect them to a specialist right away and append [HANDOVER] at the very end of your reply.
6. Ending Call: If the customer says "not interested", "bye", or "no thanks", thank them politely for their time and append [END_CALL] at the very end of your reply.
""".strip()

        self.messages = [
            {"role": "system", "content": self.system_prompt}
        ]

    def get_opening_line(self) -> str:
        opening = (
            f"Hello {self.lead_name}, I am the automated AI assistant calling on behalf of "
            f"{self.company_name}. Is this a convenient time to speak for a moment?"
        )
        self.messages.append({"role": "assistant", "content": opening})
        return opening

    def generate_reply(self, customer_text: str) -> str:
        self.messages.append({"role": "user", "content": customer_text})

        payload = {
            "model": self.model,
            "messages": self.messages,
            "stream": False,
            "options": {
                "temperature": 0.4,
                "num_predict": 100,
            },
        }

        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        raw_reply = response.json()["message"]["content"].strip()

        # Check control tags
        if "[OPT_OUT]" in raw_reply:
            self.opt_out_triggered = True
            self.call_ended = True
            raw_reply = raw_reply.replace("[OPT_OUT]", "").strip()

        if "[HANDOVER]" in raw_reply:
            self.handover_requested = True
            self.call_ended = True
            raw_reply = raw_reply.replace("[HANDOVER]", "").strip()

        if "[END_CALL]" in raw_reply:
            self.call_ended = True
            raw_reply = raw_reply.replace("[END_CALL]", "").strip()

        self.messages.append({"role": "assistant", "content": raw_reply})
        return raw_reply

    def analyze_call_outcome(self) -> dict:
        """
        Extracts structured CRM qualification data matching Django CallLog fields.
        """
        if self.opt_out_triggered:
            return {
                "interest_level": "not_interested",
                "qualification_status": "not_interested",
                "next_action": "none",
                "requirement": "Customer requested Do Not Call / Opt-Out.",
                "summary": "Customer opted out of future calls. DNC flag must be enabled.",
                "opted_out": True,
                "handover_requested": False,
            }

        transcript_lines = [
            f"{m['role'].upper()}: {m['content']}"
            for m in self.messages
            if m["role"] != "system"
        ]
        transcript_text = "\n".join(transcript_lines)

        analysis_prompt = f"""
Analyze this phone call transcript and return ONLY valid JSON with these exact keys:
- "interest_level": one of ["unknown", "interested", "not_interested", "undecided"]
- "qualification_status": one of ["not_assessed", "interested", "not_interested", "callback_requested", "meeting_requested"]
- "next_action": one of ["none", "callback", "meeting", "human_handover"]
- "requirement": short 1-sentence summary of what the customer wants or their objection
- "summary": concise 2-sentence CRM call summary

Transcript:
{transcript_text}
""".strip()

        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": analysis_prompt}],
            "format": "json",
            "stream": False,
            "options": {"temperature": 0.1},
        }

        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        result = json.loads(response.json()["message"]["content"])

        if self.handover_requested:
            result["next_action"] = "human_handover"

        result["opted_out"] = self.opt_out_triggered
        result["handover_requested"] = self.handover_requested
        result["transcript"] = transcript_text
        return result


if __name__ == "__main__":
    print("=== Velvorax Ollama Conversation Engine Test ===")
    agent = VelvoraxCallAgent(lead_name="Arun Kumar")
    print(f"\nAI: {agent.get_opening_line()}")

    while not agent.call_ended:
        user_input = input("\nCustomer (you): ").strip()
        if not user_input:
            continue
        if user_input.lower() in {"exit", "quit"}:
            break
        reply = agent.generate_reply(user_input)
        print(f"AI: {reply}")

    print("\n--- Generating CRM Qualification Summary ---")
    outcome = agent.analyze_call_outcome()
    print(json.dumps(outcome, indent=2))