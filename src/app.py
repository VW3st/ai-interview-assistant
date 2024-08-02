from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import base64
import logging
from resume_analyzer import process_resume
from manifesto_tools import parse_manifesto, get_job_titles, get_job_by_title
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

MANIFESTO_PATH = '.store/manifesto.md'
jobs = parse_manifesto(MANIFESTO_PATH)

@app.route('/get_job_titles', methods=['GET'])
def get_available_jobs():
    job_titles = get_job_titles(jobs)
    logging.info(f"Sending job titles: {job_titles}")
    return jsonify(job_titles)

@app.route('/tr73q56wgb1ejh1vvuqdy6kpoxtrcq9f', methods=['POST'])
def handle_webhook():
    try:
        logging.info("Received webhook request")
        data = request.json
        logging.info(f"Received data: {data}")

        fullName = data.get('fullName')
        email = data.get('email')
        phone = data.get('phone')
        resume = data.get('resume')
        selected_job_title = data.get('selectedJob')

        logging.info(f"Full Name: {fullName}")
        logging.info(f"Email: {email}")
        logging.info(f"Phone: {phone}")
        logging.info(f"Resume: {resume}")
        logging.info(f"Selected Job: {selected_job_title}")

        job_details = get_job_by_title(jobs, selected_job_title)
        if not job_details:
            return jsonify({'status': 'error', 'message': 'Invalid job selection'}), 400

        resume_analysis = None
        if resume and resume.get('content'):
            try:
                resume_text = base64.b64decode(resume['content']).decode('utf-8')
                logging.info("Resume content decoded")

                resume_analysis = process_resume(resume_text)
                logging.info("Resume analysis completed")

                resume_path = os.path.join(UPLOAD_FOLDER, resume['name'])
                with open(resume_path, 'w') as f:
                    f.write(resume_text)
                logging.info(f"Resume saved to {resume_path}")

            except Exception as e:
                logging.error(f"Error processing resume: {str(e)}")
                resume_analysis = {"error": str(e)}

        response_data = {
            'status': 'success',
            'message': 'Data processed successfully',
            'fullName': fullName,
            'email': email,
            'phone': phone,
            'selectedJob': job_details,
            'resumeAnalysis': resume_analysis
        }

        logging.info(f"Sending response: {response_data}")
        return jsonify(response_data), 200
    except Exception as e:
        logging.error(f"Error processing webhook: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)