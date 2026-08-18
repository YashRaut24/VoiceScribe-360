from flask import Flask, request, jsonify
from llm import run_llm, generate_soap_notes, analyze_symptoms_for_patient,transcribe_audio

app = Flask(__name__)


@app.route('/extract', methods=['POST'])
def extract_symptoms():
    data = request.get_json()

    if not data or 'symptoms' not in data:
        return jsonify({"error": "Missing 'symptoms' field"}), 400

    symptom_text = data['symptoms']

    try:
        structured = run_llm(symptom_text)
        return jsonify({
            "structuredData": structured
        })

    except Exception as e:
        return jsonify({
            "error": "LLM parsing failed",
            "details": str(e)
        }), 500


@app.route('/generate-soap', methods=['POST'])
def generate_soap():
    data = request.get_json()

    if not data or 'transcript' not in data:
        return jsonify({"error": "Missing 'transcript' field"}), 400

    transcript = data['transcript']

    if not transcript.strip():
        return jsonify({"error": "Transcript cannot be empty"}), 400

    try:
        soap = generate_soap_notes(transcript)
        return jsonify({
            "soapNotes": soap
        })

    except Exception as e:
        print("SOAP ERROR:", repr(e))
        import traceback
        traceback.print_exc()

        return jsonify({
            "error": "SOAP generation failed",
            "details": str(e)
        }), 500

@app.route('/analyze-symptoms', methods=['POST'])
def analyze_symptoms():
    data = request.get_json()

    if not data or 'symptoms' not in data:
        return jsonify({"error": "Missing 'symptoms' field"}), 400

    symptoms_list = data['symptoms']

    if not isinstance(symptoms_list, list) or len(symptoms_list) == 0:
        return jsonify({"error": "symptoms must be a non-empty array"}), 400

    try:
        analysis = analyze_symptoms_for_patient(symptoms_list)
        return jsonify({
            "analysis": analysis
        })

    except Exception as e:
        return jsonify({
            "error": "Analysis failed",
            "details": str(e)
        }), 500


@app.route('/transcribe', methods=['POST'])
def transcribe():
    if 'audio' not in request.files:
        return jsonify({
            "error": "Audio file is required"
        }), 400

    audio_file = request.files['audio']

    if not audio_file.filename:
        return jsonify({
            "error": "Audio filename is missing"
        }), 400

    try:
        transcript = transcribe_audio(audio_file)

        return jsonify({
            "transcript": transcript
        })

    except Exception as e:
        return jsonify({
            "error": "Transcription failed",
            "details": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)