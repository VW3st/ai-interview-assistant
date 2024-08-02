import re
import logging

def parse_manifesto(file_path):
    with open(file_path, 'r') as file:
        content = file.read()
    logging.info(f"Manifesto content read: {content[:500]}...")  # Log first 500 chars for brevity

    jobs = re.split(r'\n---\n', content)
    logging.info(f"Found {len(jobs)} job entries in the manifesto.")

    parsed_jobs = []

    for job in jobs:
        logging.info(f"Parsing job block: {job[:200]}...")  # Log first 200 chars of the job block for brevity
        job_dict = {}
        
        title_match = re.search(r'# Job: (.+)', job)
        if title_match:
            job_title = title_match.group(1).strip()
            logging.info(f"Parsing job title: {job_title}")
            job_dict['title'] = job_title
        else:
            logging.warning(f"Job title not found in block: {job[:200]}...")
            continue

        sections = re.split(r'\n##\s', job)
        
        if len(sections) > 1:
            details = sections[0].split('\n', 1)[1] if len(sections[0].split('\n', 1)) > 1 else ''
            for line in details.split('\n'):
                if ':' in line:
                    key, value = line.split(':', 1)
                    job_dict[key.strip().lower()] = value.strip()
            
            for section in sections[1:]:
                section_parts = section.split('\n', 1)
                if len(section_parts) > 1:
                    key, content = section_parts
                    job_dict[key.lower()] = content.strip()
                else:
                    key = section_parts[0]
                    job_dict[key.lower()] = ""
        else:
            logging.warning(f"Sections not found in job block: {job[:200]}...")

        parsed_jobs.append(job_dict)

    logging.info(f"Parsed jobs: {parsed_jobs}")
    return parsed_jobs

def get_job_titles(jobs):
    return [job['title'] for job in jobs if job.get('title')]

def get_job_by_title(jobs, title):
    return next((job for job in jobs if job.get('title', '').lower() == title.lower()), None)
