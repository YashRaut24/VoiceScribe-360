from groq import Groq
from dotenv import load_dotenv
import os
import json
import re
import tempfile

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
        model="openai/gpt-oss-20b",
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
        text = re.sub(
            r"^```json\s*|```$",
            "",
            text,
            flags=re.MULTILINE
        ).strip()

    parsed = json.loads(text)
    return parsed


def generate_soap_notes(transcript: str):
    prompt = f"""
You are a clinical documentation assistant.

Convert the consultation transcript into structured SOAP notes.

STRICT RULES:
- Use ONLY information explicitly stated in the transcript.
- Do NOT diagnose any disease or condition.
- Do NOT infer a diagnosis.
- Do NOT use phrases such as "likely", "probably", "suggestive of", or "consistent with" to infer a condition.
- Do NOT recommend, prescribe, or suggest medications.
- Do NOT invent symptoms, examination findings, vital signs, test results, or treatments.
- If information is not present in the transcript, write "No information available."
- The Assessment section must only summarize the symptoms or concerns explicitly reported.
- The Plan section must only contain actions explicitly discussed in the transcript.
- If no plan was discussed, write "No plan documented in the transcript."
- Be concise and clinical.
- Return ONLY valid JSON.
- Do not include markdown or explanation text.

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
        model="openai/gpt-oss-20b",
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
        text = re.sub(
            r"^```json\s*|```$",
            "",
            text,
            flags=re.MULTILINE
        ).strip()

    parsed = json.loads(text)

    return parsed

def analyze_symptoms_for_patient(symptoms_list: list):
    symptoms_text = "\n".join(
        [f"- {s}" for s in symptoms_list]
    )

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
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3
    )

    return response.choices[0].message.content.strip()


def transcribe_audio(audio_file):
    transcription = client.audio.transcriptions.create(
        file=(
            audio_file.filename,
            audio_file.read(),
            audio_file.mimetype
        ),
        model="whisper-large-v3-turbo",
        response_format="text"
    )

    return transcription