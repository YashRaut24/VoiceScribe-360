from flask import Flask, request, jsonify
from llm import run_llm
app = Flask(__name__)


@app.route('/extract', methods=['POST'])
def extract_symptoms():
    data = request.get_json()

    if not data or 'symptoms' not in data:
        
        return jsonify({"error": "Missing 'symptoms' field"}), 400

    symptom_text = data['symptoms']

    try:
        structured = run_llm(symptom_text)  # ✅ already JSON/dict

        return jsonify({
            "structuredData": structured
        })

    except Exception as e:
        return jsonify({
            "error": "LLM parsing failed",
            "details": str(e)
        }), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
