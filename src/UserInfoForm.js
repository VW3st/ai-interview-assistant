import React, { useState, useEffect } from 'react';
import { setItem } from './storage';
import { sendToWebhook, sendToApp } from './webhook';
import './UserInfoForm.css';
import PropTypes from 'prop-types';

UserInfoForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  setIsLoading: PropTypes.func.isRequired
};
function UserInfoForm({ onSubmit, setIsLoading }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    resume: null,
    selectedJob: ''
  });
  const [jobTitles, setJobTitles] = useState([]);
  const [jobFetchError, setJobFetchError] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetch('http://localhost:5000/get_job_titles')
      .then(response => response.json())
      .then(data => {
        const validJobTitles = data.filter(title => title.trim() !== '');
        if (validJobTitles.length > 0) {
          setJobTitles(validJobTitles);
        } else {
          setJobFetchError('No valid job titles received from the server.');
        }
      })
      .catch(error => {
        console.error('Error fetching job titles:', error);
        setJobFetchError('Failed to fetch job titles. Please try again later.');
      });
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone)) newErrors.phone = 'Invalid phone number format';
    if (!formData.resume) newErrors.resume = 'Please upload your resume';
    if (!formData.selectedJob) newErrors.job = 'Please select a job position';
    return newErrors;
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleResumeUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFormData(prevData => ({ ...prevData, resume: file }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsLoading(true);

      const reader = new FileReader();
      reader.onloadend = async () => {
        const resumeContent = reader.result.split(',')[1];
        const userInfo = { 
          ...formData,
          resume: { name: formData.resume.name, content: resumeContent }
        };
        
        const response = await sendToApp(userInfo);
        
        if (response && response.resumeAnalysis) {
          setItem('userInfo', userInfo);
          setItem('resumeAnalysis', response.resumeAnalysis);
          await sendToWebhook({...userInfo, resumeAnalysis: response.resumeAnalysis});
          
          onSubmit({...userInfo, resumeAnalysis: response.resumeAnalysis});
        } else {
          throw new Error('Resume analysis not received from the server');
        }
      };
      
      reader.readAsDataURL(formData.resume);
    } catch (error) {
      console.error('Failed to process user data:', error);
      setErrors({ submit: 'Failed to submit form. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <form className="UserInfoForm" onSubmit={handleSubmit}>
      <h2>Candidate Information</h2>
      <div className="form-group">
        <label htmlFor="fullName">Full Name:</label>
        <input 
          type="text" 
          id="fullName"
          name="fullName"
          value={formData.fullName} 
          onChange={handleInputChange} 
          required 
        />
        {errors.fullName && <div className="error">{errors.fullName}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input 
          type="email" 
          id="email"
          name="email"
          value={formData.email} 
          onChange={handleInputChange} 
          required 
        />
        {errors.email && <div className="error">{errors.email}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="phone">Phone Number:</label>
        <input 
          type="tel" 
          id="phone"
          name="phone"
          value={formData.phone} 
          onChange={handleInputChange} 
          required 
        />
        {errors.phone && <div className="error">{errors.phone}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="resume">Resume:</label>
        <input 
          type="file" 
          id="resume"
          name="resume"
          accept=".txt,.pdf,.doc,.docx" 
          onChange={handleResumeUpload} 
          required 
        />
        {errors.resume && <div className="error">{errors.resume}</div>}
      </div>
      <div className="form-group">
        <label htmlFor="selectedJob">Select Job:</label>
        {jobFetchError ? (
          <div className="error">{jobFetchError}</div>
        ) : (
          <select 
            id="selectedJob"
            name="selectedJob"
            value={formData.selectedJob} 
            onChange={handleInputChange}
            required
          >
            <option value="">Select a job</option>
            {jobTitles.map((jobTitle, index) => (
              <option key={`job-${index}-${jobTitle}`} value={jobTitle}>
                {jobTitle}
              </option>
            ))}
          </select>
        )}
        {errors.job && <div className="error">{errors.job}</div>}
      </div>
      {errors.submit && <div className="error">{errors.submit}</div>}
      <button type="submit" className="submit-button">Submit</button>
    </form>
  );
}

UserInfoForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  setIsLoading: PropTypes.func.isRequired
};

export default UserInfoForm;