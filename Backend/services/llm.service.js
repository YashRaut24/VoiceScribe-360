const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const GROQ_API_URL = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1';
const CHAT_MODEL = 'openai/gpt-oss-20b';
const TRANSCRIPTION_MODEL = 'whisper-large-v3-turbo';
const REQUEST_TIMEOUT_MS = 120000;

const assertProviderApproved = () => {
    if (process.env.LLM_PROVIDER_APPROVED !== 'true' || process.env.LLM_PHI_PROCESSING_CONSENT !== 'true') {
        const error = new Error('LLM provider is not approved for clinical data processing');
        error.status = 503;
        error.publicMessage = 'Clinical AI processing is temporarily unavailable';
        throw error;
    }
};

const getHeaders = () => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not configured');
    }

    return {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
    };
};

const parseJsonResponse = (content) => {
    const text = String(content || '').trim();
    const withoutMarkdown = text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();

    return JSON.parse(withoutMarkdown);
};

const completeChat = async (prompt, temperature) => {
    assertProviderApproved();
    const response = await axios.post(
        `${GROQ_API_URL}/chat/completions`,
        {
            model: CHAT_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature
        },
        {
            headers: getHeaders(),
            timeout: REQUEST_TIMEOUT_MS
        }
    );

    return response.data.choices[0].message.content.trim();
};

const extractSymptoms = async (symptomText) => {
    const prompt = `
You are a medical information extraction system.

Rules:
- Do NOT diagnose disease
- Extract ONLY what is mentioned
- Do NOT add new information
- Use simple medical terms
- Return ONLY valid JSON
- Do not include explanation text

JSON format:
{
"symptoms": [],
"duration": "",
"severity": "",
"frequency": "",
"progression": "",
"notes": ""
}

Patient input:
"${symptomText}"
`;

    return parseJsonResponse(await completeChat(prompt, 0.1));
};

const generateSoapNotes = async (transcript) => {
    const prompt = `
You are a clinical documentation assistant.

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
{
    "subjective": "",
    "objective": "",
    "assessment": "",
    "plan": ""
}

Consultation transcript:
"${transcript}"
`;

    return parseJsonResponse(await completeChat(prompt, 0.1));
};

const analyzeSymptoms = async (symptomsList) => {
    const symptomsText = symptomsList.map((symptom) => `- ${symptom}`).join('\n');
    const prompt = `
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
${symptomsText}
`;

    return completeChat(prompt, 0.3);
};

const transcribeAudio = async (file) => {
    assertProviderApproved();
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not configured');
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(file.path), {
        filename: file.originalname,
        contentType: file.mimetype
    });
    formData.append('model', TRANSCRIPTION_MODEL);
    formData.append('response_format', 'text');

    const response = await axios.post(
        `${GROQ_API_URL}/audio/transcriptions`,
        formData,
        {
            headers: {
                ...formData.getHeaders(),
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`
            },
            timeout: REQUEST_TIMEOUT_MS,
            maxBodyLength: Infinity
        }
    );

    return typeof response.data === 'string'
        ? response.data.trim()
        : String(response.data.text || '').trim();
};

module.exports = {
    analyzeSymptoms,
    extractSymptoms,
    generateSoapNotes,
    transcribeAudio
};
