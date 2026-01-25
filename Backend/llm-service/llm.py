from google import genai
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def run_llm(symptom_text: str):
    prompt = f"""
You are a medical information extraction system.

Rules:
- Do NOT diagnose disease
- Extract ONLY what is mentioned
- Do NOT add new information
- Use simple medical terms
- Return ONLY valid JSON
- Do not include explanation text

JSON format:
{{
"symptoms": [],
"duration": "",
"severity": "",
"frequency": "",
"progression": "",
"notes": ""
}}

Patient input:
"{symptom_text}"
"""

    print("LLM Prompt:", prompt)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    text = response.text.strip()
    print("LLM Raw Response:", text)

    if text.startswith("```"):
        text = re.sub(r"^```json\s*|```$", "", text, flags=re.MULTILINE).strip()

    parsed = json.loads(text)

    print("LLM Parsed Response:", parsed)
    return parsed
