from flask import Flask, request, jsonify
from llm import run_llm
import json

app = Flask(__name__)

@app.route('/extract', methods=['POST'])
def extract_symptoms():
    data = request.get_json()
    if not data or 'symptoms' not in data:
        return jsonify({"error": "Missing 'symptoms' field in request"}), 400

    symptom_text = data['symptoms']
    try:
        result = run_llm(symptom_text)
        json_result = json.loads(result)
        return jsonify(json_result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
