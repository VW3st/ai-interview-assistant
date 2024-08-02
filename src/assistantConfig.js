export const getAssistantConfig = (userInfo, resumeAnalysis) => {
  const systemPrompt = `
    You are an AI recruiter. Your name is John, and you are conducting an interview with ${userInfo.fullName || 'the candidate'} for a ${userInfo.selectedJob || 'job'} position. 
    
    Job Description:
    ${userInfo.selectedJob || 'No specific job description available.'}

    Candidate Information:
    ${resumeAnalysis.analysis ? JSON.stringify(resumeAnalysis.analysis) : 'No resume analysis available.'}

    Your task is to conduct a structured interview, asking one question at a time and waiting for the candidate's response before moving to the next question. Focus on assessing the candidate's suitability for the specific job role.
  `;

  return {
    name: "Recruiter",
    voice: {
      voiceId: "s3://peregrine-voices/russell2_parrot_saad/manifest.json",
      provider: "playht",
      temperature: 0.2,
      textGuidance: 1.1,
      styleGuidance: 2.5,
      voiceGuidance: 1.1,
      inputPunctuationBoundaries: ["。", "，", ".", "!", "?", ")", ",", ":"]
    },
    model: {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        }
      ],
      provider: "openai",
      temperature: 0.2,
      emotionRecognitionEnabled: true
    },
    metadata: {
      candidateName: userInfo.fullName || '',
      candidateEmail: userInfo.email || '',
      candidatePhone: userInfo.phone || '',
      resumeAnalysis: JSON.stringify(resumeAnalysis.analysis || {})
    },
    endCallMessage: "Thank you for your time. We will be in touch soon.",
    recordingEnabled: true,
    firstMessage: `Hello ${userInfo.fullName || 'Candidate'}, this is John. Are you ready to begin the interview?`,
    transcriber: {
      model: "nova-2-general",
      language: "en",
      provider: "deepgram"
    },
    clientMessages: [
      "transcript",
      "hang",
      "function-call",
      "speech-update",
      "metadata",
      "conversation-update",
    ],
    serverMessages: [
      "end-of-call-report",
      "status-update",
      "hang",
      "function-call",
    ],
    responseDelaySeconds: 0.2,
    serverUrl: process.env.REACT_APP_ASSISTANT_WEBHOOK_URL,
    endCallPhrases: ["Thank you for your time", "That concludes our interview"],
    llmRequestDelaySeconds: 0.2,
    analysisPlan: {
      summaryPrompt: "Provide a concise summary of the interview, highlighting the candidate's key qualifications, experiences, and overall impression.",
      structuredDataPrompt: "Based on the interview, extract and evaluate the following information about the candidate:",
      structuredDataSchema: resumeAnalysis.structured_data_schema || {
        type: "object",
        properties: {
          professionalExperience: {
            type: "object",
            description: "Evaluate the candidate's relevant work experience",
            properties: {
              yearsOfExperience: { type: "number" },
              relevantRoles: { type: "array", items: { type: "string" } },
              keyAchievements: { type: "array", items: { type: "string" } }
            }
          },
          skills: {
            type: "object",
            description: "Assess the candidate's skills relevant to the position",
            properties: {
              technicalSkills: { type: "array", items: { type: "string" } },
              softSkills: { type: "array", items: { type: "string" } }
            }
          },
          education: {
            type: "object",
            description: "Summarize the candidate's educational background",
            properties: {
              highestDegree: { type: "string" },
              relevantCertifications: { type: "array", items: { type: "string" } }
            }
          },
          culturalFit: {
            type: "object",
            description: "Evaluate how well the candidate might fit into the company culture",
            properties: {
              workStylePreference: { type: "string" },
              valueAlignment: { type: "string" },
              teamworkApproach: { type: "string" }
            }
          },
          motivationAndGoals: {
            type: "object",
            description: "Assess the candidate's career aspirations and motivation for the role",
            properties: {
              shortTermGoals: { type: "string" },
              longTermGoals: { type: "string" },
              motivationForPosition: { type: "string" }
            }
          },
          communicationSkills: {
            type: "string",
            description: "Evaluate the candidate's communication skills during the interview"
          },
          problemSolvingAbility: {
            type: "string",
            description: "Assess the candidate's approach to problem-solving based on their responses"
          }
        }
      },
      successEvaluationPrompt: "Based on the interview summary and structured data, evaluate the candidate's overall suitability for the position. Consider their experience, skills, cultural fit, motivation, and communication abilities. Provide a balanced assessment of their strengths and areas for development, and recommend whether to proceed with their application or not.",
      successEvaluationRubric: "AutomaticRubric"
    },
    backgroundDenoisingEnabled: true,
    artifactPlan: {
      videoRecordingEnabled: true
    },
    messagePlan: {
      idleMessages: ["Feel free to ask any questions about the position or company."],
      idleMessageMaxSpokenCount: 1
    },
    maxDurationSeconds: 1800 // 30 minutes
  };
};
