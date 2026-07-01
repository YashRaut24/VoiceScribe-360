from groq import Groq
from dotenv import load_dotenv
import os
import json
import re

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.1
    )

    text = response.choices[0].message.content.strip()

    if text.startswith("```"):
        text = re.sub(r"^```json\s*|```$", "", text, flags=re.MULTILINE).strip()

    parsed = json.loads(text)
    return parsed


def generate_soap_notes(transcript: str):
    prompt = f"""
    You are a clinical documentation assistant.

    Based on the following consultation transcript, generate structured SOAP notes.

    Rules:
    - Be concise and clinical
    - Only use information from the transcript
    - Do NOT invent symptoms or findings
    - Return ONLY valid JSON
    - Do not include explanation text

    JSON format:
    {{
    "subjective": "",
    "objective": "",
    "assessment": "",
    "plan": ""
    }}

    Consultation transcript:
    "{transcript}"
    """

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.1
    )

    text = response.choices[0].message.content.strip()

    if text.startswith("```"):
        text = re.sub(r"^```json\s*|```$", "", text, flags=re.MULTILINE).strip()

    parsed = json.loads(text)
    return parsed


def analyze_symptoms_for_patient(symptoms_list: list):
    symptoms_text = "\n".join([f"- {s}" for s in symptoms_list])
    
    prompt = f"""
You are a helpful health assistant speaking directly to a patient.

Based on the following symptom logs, provide a brief, friendly, plain-language summary.

Rules:
- Do NOT diagnose any disease
- Do NOT prescribe medication
- Speak in simple, reassuring language
- Highlight patterns you notice
- Suggest what to discuss with their doctor
- Keep response under 150 words
- Return only plain text, no JSON, no markdown

Patient symptom logs:
{symptoms_text}
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3
    )

    return response.choices[0].message.content.strip()


