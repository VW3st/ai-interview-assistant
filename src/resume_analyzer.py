import openai
import json
import os
from dotenv import load_dotenv
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Load environment variables from .env file
load_dotenv()

# Initialize the OpenAI client with the key from .env
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analyze_resume(resume_text):
    logging.info("Starting resume analysis")
    few_shot_examples = [
        {
            "resume": "John Doe\nSoftware Engineer\n\nExperience:\n2018-2021: Senior Developer at Tech Co\n2015-2018: Junior Developer at Start-Up Inc\n2013-2015: Intern at Big Corp\n\nEducation:\n2009-2013: BS in Computer Science, University of Technology",
            "analysis": {
                "key_info": {
                    "name": "John Doe",
                    "current_role": "Software Engineer",
                    "years_of_experience": 8,
                    "education": "BS in Computer Science"
                },
                "employment_gaps": ["No significant gaps identified"],
                "career_progression": "Clear progression from intern to senior developer",
                "anomalies": ["None detected"]
            }
        },
        {
            "resume": "Jane Smith\nMarketing Specialist\n\nExperience:\n2020-Present: Marketing Manager at Global Brand\n2017-2019: Marketing Coordinator at Local Business\n2015-2016: Sales Associate at Retail Store\n\nEducation:\n2011-2015: BA in Marketing, State University\n2019-2020: Digital Marketing Certificate, Online Academy",
            "analysis": {
                "key_info": {
                    "name": "Jane Smith",
                    "current_role": "Marketing Manager",
                    "years_of_experience": 6,
                    "education": "BA in Marketing, Digital Marketing Certificate"
                },
                "employment_gaps": ["1 year gap between 2016 and 2017"],
                "career_progression": "Progressed from sales to marketing, with additional education to support career change",
                "anomalies": ["Career change from sales to marketing"]
            }
        }
    ]

    messages = [
        {"role": "system", "content": "You are an expert resume analyzer. Your task is to extract key information, identify gaps, and spot anomalies in resumes."},
        {"role": "user", "content": f"Analyze the following resume and provide a structured analysis similar to the examples below.\n\nFew-shot examples:\n{json.dumps(few_shot_examples, indent=2)}\n\nResume to analyze:\n{resume_text}\n\nProvide your analysis in the same JSON format as the examples."}
    ]

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.2,
            max_tokens=1000
        )
        analysis = json.loads(response.choices[0].message.content)
        logging.info(f"Resume analysis completed. Result: {json.dumps(analysis, indent=2)}")
        return analysis
    except json.JSONDecodeError as e:
        logging.error(f"Failed to parse the analysis: {str(e)}")
        return {"error": f"Failed to parse the analysis: {str(e)}"}
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return {"error": f"Unexpected error: {str(e)}"}
    
import logging

def generate_system_prompt(analysis):
    """
    Generate a system prompt for the AI interviewer based on the resume analysis.
    
    Args:
    analysis (dict): A dictionary containing the resume analysis results.
    
    Returns:
    str: A system prompt for the AI interviewer.
    """
    logging.info("Generating system prompt")
    try:
        # Extract relevant information from the analysis
        key_info = analysis.get('key_info', {})
        name = key_info.get('name', 'the candidate')
        current_role = key_info.get('current_role', 'professional')
        years_of_experience = key_info.get('years_of_experience', 'some')
        education = key_info.get('education', 'relevant')
        career_progression = analysis.get('career_progression', 'steady')
        
        # Generate the system prompt
        prompt = f"""You are an AI recruiter named John, conducting an interview with {name} for a {current_role} position. 
        The candidate has {years_of_experience} years of experience and {education} education. 
        Their career progression can be described as {career_progression}.

        Your task is to:
        1. Conduct a professional and friendly interview.
        2. Ask relevant questions based on the candidate's background and the job requirements.
        3. Assess the candidate's technical skills and experience related to the {current_role} position.
        4. Evaluate the candidate's soft skills, including communication and problem-solving abilities.
        5. Inquire about the candidate's career goals and how they align with this position.
        6. Provide opportunities for the candidate to ask questions about the role and the company.

        Remember to:
        - Be respectful and inclusive in your language and approach.
        - Adapt your questions based on the candidate's responses.
        - Avoid asking personal questions unrelated to the job.
        - Provide clear and concise information about the next steps in the interview process.

        Begin the interview by introducing yourself and asking the candidate if they're ready to start."""

        logging.info("System prompt generated successfully")
        return prompt
    except Exception as e:
        logging.error(f"Error generating system prompt: {str(e)}")
        return f"Error generating system prompt: {str(e)}"

def generate_structured_data_schema(analysis):
    """
    Generate a structured data schema based on the resume analysis.
    
    Args:
    analysis (dict): A dictionary containing the resume analysis results.
    
    Returns:
    dict: A structured data schema for the interview.
    """
    logging.info("Generating structured data schema")
    try:
        key_info = analysis.get('key_info', {})
        domain = key_info.get('current_role', 'General')
        
        schema = {
            "type": "object",
            "properties": {
                "domainExpertise": {
                    "type": "object",
                    "description": f"Evaluate the candidate's expertise in {domain}",
                    "properties": {
                        "yearsInDomain": {"type": "number"},
                        "keyProjects": {"type": "array", "items": {"type": "string"}},
                        "domainKnowledge": {"type": "string"}
                    }
                },
                "technicalSkills": {
                    "type": "array",
                    "description": f"Assess the candidate's technical skills relevant to {domain}",
                    "items": {"type": "string"}
                },
                "softSkills": {
                    "type": "array",
                    "description": f"Evaluate soft skills crucial for success in {domain}",
                    "items": {"type": "string"}
                },
                "careerProgression": {
                    "type": "object",
                    "description": "Analyze the candidate's career growth and transitions",
                    "properties": {
                        "keyMilestones": {"type": "array", "items": {"type": "string"}},
                        "growthAreas": {"type": "array", "items": {"type": "string"}}
                    }
                },
                "uniqueExperiences": {
                    "type": "array",
                    "description": "Highlight any unique experiences or skills that set the candidate apart",
                    "items": {"type": "string"}
                },
                "problemSolving": {
                    "type": "string",
                    "description": f"Assess the candidate's approach to problem-solving in {domain}"
                },
                "culturalFit": {
                    "type": "object",
                    "description": "Evaluate how well the candidate might fit into the company culture",
                    "properties": {
                        "workStylePreference": {"type": "string"},
                        "valueAlignment": {"type": "string"}
                    }
                },
                "futureGoals": {
                    "type": "object",
                    "description": f"Understand the candidate's aspirations in {domain}",
                    "properties": {
                        "shortTermGoals": {"type": "string"},
                        "longTermGoals": {"type": "string"},
                        "alignmentWithPosition": {"type": "string"}
                    }
                }
            }
        }

        logging.info("Structured data schema generated successfully")
        return schema
    except Exception as e:
        logging.error(f"Error generating structured data schema: {str(e)}")
        return {"error": f"Error generating structured data schema: {str(e)}"}

def process_resume(resume_text, job_details=None):
    logging.info("Processing resume")
    try:
        # Analyze the resume
        analysis = analyze_resume(resume_text)
        
        # Check for errors in the analysis
        if isinstance(analysis, dict) and "error" in analysis:
            return {"error": analysis["error"]}

        # Generate the system prompt based on the analysis
        system_prompt = generate_system_prompt(analysis)
        
        # Check for errors in the system prompt generation
        if system_prompt.startswith("Error"):
            return {"error": system_prompt}

        # Generate the structured data schema based on the analysis
        structured_data_schema = generate_structured_data_schema(analysis)
        
        # Check for errors in the structured data schema generation
        if isinstance(structured_data_schema, dict) and "error" in structured_data_schema:
            return {"error": structured_data_schema["error"]}
        
        if job_details:
            result["job_details"] = job_details
                
            return result

        # Combine results into a final output
        result = {
            "analysis": analysis,
            "system_prompt": system_prompt,
            "structured_data_schema": structured_data_schema
        }
        logging.info("Resume processing completed successfully")
        return result
    except Exception as e:
        logging.error(f"Error in process_resume: {str(e)}")
        return {"error": str(e)}