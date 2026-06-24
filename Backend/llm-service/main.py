from flask import Flask, request, jsonify
from llm import run_llm, generate_soap_notes

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
        return jsonify({
            "error": "SOAP generation failed",
            "details": str(e)
        }), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)