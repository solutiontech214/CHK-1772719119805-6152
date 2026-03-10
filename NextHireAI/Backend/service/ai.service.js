const pdfParse = require("pdf-parse");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: "ollama",
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
  timeout: 120000,
});

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

/* ---------------- PDF TEXT EXTRACTION ---------------- */

const extractTextFromBuffer = async (buffer) => {
  try {
    // Check if it's a PDF by looking at the magic numbers %PDF
    if (buffer.toString("utf8", 0, 4) !== "%PDF") {
      console.log("[AI Service] File is not a PDF, skipping text extraction.");
      return "IMAGE_FILE_CONTENT (OCR pending)";
    }

    const data = await pdfParse(buffer);
    const text = (data.text || "").replace(/\s+/g, " ").trim();
    return text;
  } catch (err) {
    console.error("[AI Service] Extraction Error:", err.message);
    return "Error extracting text";
  }
};

/* ---------------- UTILS ---------------- */

const extractJson = (text) => {
  if (!text) {
    console.warn("[AI Service] extractJson: Received empty text");
    return null;
  }

  console.log("[AI Service] Extracting JSON from AI response...");

  try {
    const startObj = text.indexOf("{");
    const endObj = text.lastIndexOf("}");
    const startArr = text.indexOf("[");
    const endArr = text.lastIndexOf("]");

    let start = -1;
    let end = -1;

    // Determine the root structure
    if (startObj !== -1 && (startArr === -1 || startObj < startArr)) {
      start = startObj;
      end = endObj;
    } else if (startArr !== -1) {
      start = startArr;
      end = endArr;
    }

    if (start === -1 || end === -1 || end <= start) {
      // Try parsing the whole text after stripping markdown blocks
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      try {
        return JSON.parse(cleaned);
      } catch (e) {
        console.error(
          "[AI Service] JSON parse failed after cleaning. Raw content below.",
        );
        console.error(text);
        return null;
      }
    }

    const potentialJson = text.substring(start, end + 1);
    const parsed = JSON.parse(potentialJson);
    console.log("[AI Service] JSON parsed successfully.");
    return parsed;
  } catch (err) {
    console.error("[AI Service] extractJson Error:", err.message);
    console.error(
      "[AI Service] Failing text snippet:",
      text.substring(0, 200) + "...",
    );
    return null;
  }
};

/* ---------------- RESUME ANALYSIS ---------------- */

const analyseResume = async (resumeText, fileData = null) => {
  console.log(
    `[AI Service] Starting Resume Analysis (Text Length: ${resumeText?.length || 0})`,
  );

  const prompt = `
Task: Analyse the resume text provided below and extract detailed professional information.
Constraint: Respond ONLY with a valid JSON object. Do not include markdown or conversational text.

Required JSON Structure:
{
"name": "Full Name",
"email": "Email Address",
"phone": "Phone Number",
"summary": "Professional Summary",
"skills": ["Skill1", "Skill2", "Skill3"],
"projects": [
  {
    "name": "Project Name", 
    "description": "Specific details of what was achieved", 
    "technologies": ["Tech1", "Tech2"]
  }
],
"experience": [
  {
    "company": "Company Name", 
    "role": "Job Title", 
    "duration": "Start - End Date", 
    "highlights": ["Specific achievement 1", "Specific achievement 2"]
  }
],
"education": [
  {
    "institution": "University Name", 
    "degree": "Degree Name", 
    "year": "Graduation Year"
  }
]
}

Resume Content:
${resumeText}
`;

  try {
    const response = await openai.chat.completions.create({
      model: OLLAMA_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Extract comprehensive professional info from resume. Be detailed about projects and achievements. Output ONLY JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 1500, // Increased for more details
    });

    const result = extractJson(response.choices[0].message.content);
    console.log(
      `[AI Service] Analysis complete for: ${result?.name || "Unknown"}`,
    );
    return result;
  } catch (err) {
    console.error("[AI Service] Resume Analysis Error:", err.message);
    throw err;
  }
};

/* ---------------- DYNAMIC QUESTION GENERATION ---------------- */

const generateInterviewQuestions = async (
  resume,
  jobRole,
  difficulty = "medium",
  count = 5,
) => {
  const questionCount = Math.max(count, 5); // Ensure minimum 5 questions
  console.log(
    `[AI Service] Generating ${questionCount} initial questions for Job: ${jobRole}`,
  );

  // Extract detailed resume info for dynamic questions
  const skillsText = (resume.skills || []).join(", ") || "General skills";

  // Shuffle projects and experience to get different focus each time
  const shuffledProjects = [...(resume.projects || [])].sort(
    () => 0.5 - Math.random(),
  );
  const shuffledExperience = [...(resume.experience || [])].sort(
    () => 0.5 - Math.random(),
  );

  const projectsText =
    shuffledProjects
      .map(
        (p) =>
          `${p.name} using [${(p.technologies || []).join(", ")}]. Details: ${p.description || "N/A"}`,
      )
      .join("; ") || "General projects";

  const experienceText =
    shuffledExperience
      .map(
        (e) =>
          `${e.role} at ${e.company} (${e.duration}). Achievements: ${(e.highlights || []).join(". ")}`,
      )
      .join("; ") || "General experience";

  const educationText =
    (resume.education || [])
      .map((ed) => `${ed.degree} from ${ed.institution} (${ed.year || "N/A"})`)
      .join("; ") || "General education";

  // Pick a random set of skills to focus on
  const skillsToFocus = [...(resume.skills || [])]
    .sort(() => 0.5 - Math.random())
    .slice(0, 5);

  const prompt = `
Task: Generate ${questionCount} HIGHLY SPECIFIC, UNIQUE, and DIVERSE interview questions tailored to this candidate's resume for the role of ${jobRole}.
Job Role: ${jobRole}
Difficulty Level: ${difficulty}

CANDIDATE RESUME PROFILE:
- Skills: ${skillsText}
- Projects: ${projectsText}
- Experience: ${experienceText}
- Education: ${educationText}

REQUIREMENTS:
1. Generate EXACTLY ${questionCount} questions.
2. Questions MUST be deeply tailored to the SPECIFIC projects, roles, and achievements listed in the resume. 
3. AVOID generic questions like "Tell me about yourself" or "What are your strengths".
4. Focus MUST be on how they used their skills (${skillsToFocus.join(", ")}) in their specific projects or roles.
5. Each question should feel like it could ONLY be asked to this specific candidate.
6. Mix technical depth with practical application based on their specific experience.
7. Cover different areas: technical implementation, problem-solving in a specific project, and role-specific challenges at a particular company.

OUTPUT FORMAT - Return ONLY valid JSON array:
[
  {
    "id": 1,
    "question": "Specific question referencing a project/role from the resume",
    "category": "Technical | Behavioural | Situational | HR",
    "difficulty": "easy | medium | hard",
    "expectedKeyPoints": ["specific point 1", "specific point 2", "specific point 3"]
  },
  ... (continue for all ${questionCount} questions)
]

CONSTRAINTS:
1. NO generic filler questions.
2. Every question MUST reference a detail from the resume (e.g., "At [Company], you worked on [Project]...", "Using [Technology] for [Project]...", "In your role as [Role]...").
3. Return ONLY the JSON array, no markdown or extra text.
4. Ensure id field is unique (1, 2, 3, ...)
`;

  try {
    const response = await openai.chat.completions.create({
      model: OLLAMA_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an elite technical interviewer at a Tier-1 tech company. You are known for asking deep, project-specific questions that test a candidate's actual experience rather than their memorization. Use the resume provided to construct unique questions.`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8, // Slightly higher for more variety
      max_tokens: 2500,
    });

    let questions = extractJson(response.choices[0].message.content);

    // Validation: ensure we have at least 5 questions
    if (!Array.isArray(questions) || questions.length < 5) {
      console.warn(
        `[AI Service] AI generated only ${questions?.length || 0} questions, using fallback...`,
      );
      questions = generateFallbackQuestions(
        resume,
        jobRole,
        difficulty,
        questionCount,
      );
    }

    console.log(`[AI Service] Generated ${questions?.length || 0} questions.`);
    return Array.isArray(questions) ? questions : [];
  } catch (err) {
    console.error("[AI Service] Question Generation Error:", err.message);
    // Fallback if AI call fails
    return generateFallbackQuestions(
      resume,
      jobRole,
      difficulty,
      questionCount,
    );
  }
};

// Helper function to generate fallback questions based on resume details
const generateFallbackQuestions = (resume, jobRole, difficulty, count) => {
  const questions = [];
  const skills = resume.skills || [];
  const projects = resume.projects || [];
  const experience = resume.experience || [];

  // Template questions that reference resume details
  const templates = [
    {
      getQuestion: () =>
        `Can you walk us through your experience with ${skills[0] || "relevant technologies"} and how you've applied it in real projects?`,
      category: "Technical",
      difficulty: "medium",
      expectedKeyPoints: ["experience", "application", "problem-solving"],
    },
    {
      getQuestion: () =>
        `Tell us about your project "${projects[0]?.name || "a significant project"}" - what were the technical challenges and how did you overcome them?`,
      category: "Technical",
      difficulty: "hard",
      expectedKeyPoints: ["challenge", "solution", "technology stack"],
    },
    {
      getQuestion: () =>
        `How have you used ${skills[1] || "your core skills"} to make an impact at ${experience[0]?.company || "your organization"}?`,
      category: "Behavioural",
      difficulty: "medium",
      expectedKeyPoints: ["impact", "skills", "results"],
    },
    {
      getQuestion: () =>
        `Describe a situation where you had to learn a new technology quickly. How did you approach it?`,
      category: "Situational",
      difficulty: "medium",
      expectedKeyPoints: ["learning", "approach", "adaptability"],
    },
    {
      getQuestion: () =>
        `What aspects of the ${jobRole} role excite you most, and how do your skills align with this position?`,
      category: "HR",
      difficulty: "easy",
      expectedKeyPoints: ["motivation", "alignment", "skills"],
    },
    {
      getQuestion: () =>
        `Tell us about a time when you collaborated with a team to deliver ${projects[0]?.name || "a project"}. What was your role?`,
      category: "Behavioural",
      difficulty: "medium",
      expectedKeyPoints: ["teamwork", "role", "contribution"],
    },
  ];

  // Generate the required number of questions
  for (let i = 0; i < Math.min(count, templates.length); i++) {
    questions.push({
      id: i + 1,
      question: templates[i].getQuestion(),
      category: templates[i].category,
      difficulty: templates[i].difficulty,
      expectedKeyPoints: templates[i].expectedKeyPoints,
    });
  }

  return questions.slice(0, count); // Ensure we return exactly 'count' questions
};

/* ---------------- ADAPTIVE NEXT QUESTION GENERATION ---------------- */

const generateNextAdaptiveQuestion = async (
  resume,
  jobRole,
  difficulty,
  history, // Array of { question, answer }
  nextId,
) => {
  console.log(
    `[AI Service] Generating next dynamic question (ID: ${nextId})...`,
  );

  // Extract detailed resume info
  const skillsText = (resume?.skills || []).join(", ") || "General skills";

  // Shuffle projects and experience for variety in the adaptive questions too
  const shuffledProjects = [...(resume?.projects || [])].sort(
    () => 0.5 - Math.random(),
  );
  const shuffledExperience = [...(resume?.experience || [])].sort(
    () => 0.5 - Math.random(),
  );

  const projectsText =
    shuffledProjects
      .map(
        (p) =>
          `${p.name} using [${(p.technologies || []).join(", ")}]. Details: ${p.description || "N/A"}`,
      )
      .join("; ") || "General projects";

  const experienceText =
    shuffledExperience
      .map(
        (e) =>
          `${e.role} at ${e.company} (${e.duration}). Achievements: ${(e.highlights || []).join(". ")}`,
      )
      .join("; ") || "General experience";

  const historyText = (history || [])
    .map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.userAnswer}`)
    .join("\n\n");

  const prompt = `
Task: Generate the NEXT HIGHLY SPECIFIC interview question that builds on the conversation history but explores a NEW area of the resume.
Job Role: ${jobRole}
Difficulty: ${difficulty}

CANDIDATE BACKGROUND:
- Skills: ${skillsText}
- Projects: ${projectsText}
- Experience: ${experienceText}

CONVERSATION HISTORY (DO NOT repeat these topics or ask similar questions):
${historyText || "No history yet."}

GOAL:
1. Create a completely NEW, UNIQUE question that hasn't been asked before.
2. If the previous question was technical, consider moving to a situational scenario involving a DIFFERENT project or role mentioned in the resume.
3. Reference a SPECIFIC achievement or technology from the resume that HAS NOT BEEN DISCUSSED YET.
4. Ensure the question is deeply personalized to this candidate's background.

Return ONLY a JSON object:
{
  "id": ${nextId},
  "question": "A completely new, resume-specific interview question exploring an untouched area of their background",
  "category": "Technical | Behavioural | Situational",
  "difficulty": "${difficulty}",
  "expectedKeyPoints": ["key point 1", "key point 2", "key point 3"]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: OLLAMA_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an adaptive interviewer. Your goal is to cover as much of the candidate's resume as possible. Generate unique, diverse questions that build on conversation history without any repetition of topics. Output ONLY JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.9, // Higher for more adaptive variety
      max_tokens: 800,
    });

    const result = extractJson(response.choices[0].message.content);
    if (!result) {
      throw new Error("JSON extraction returned null");
    }
    return result;
  } catch (err) {
    console.error("[AI Service] Dynamic Question Error:", err.message);
    return {
      id: nextId,
      question:
        "Could you tell me more about your recent project challenges and how you handled them?",
      category: "Technical",
      difficulty: difficulty,
      expectedKeyPoints: ["challenge", "solution", "learning"],
    };
  }
};

/* ---------------- ANSWER EVALUATION ---------------- */

const evaluateAnswer = async (question, answer, expectedKeyPoints = []) => {
  console.log("[AI Service] Evaluating candidate answer (fast mode)...");

  const points = (expectedKeyPoints || []).join(", ");

  // Fast evaluation prompt - focused feedback only
  const prompt = `Evaluate this interview answer CONCISELY:
Question: ${question}
Expected Points: ${points}
Answer: ${answer}

Respond with ONLY this JSON (no markdown):
{
  "score": <0-100>,
  "feedback": "1-2 sentence professional feedback",
  "strengths": [<max 2 strings>],
  "improvements": [<max 2 strings>]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: OLLAMA_MODEL,
      messages: [
        {
          role: "system",
          content: "Evaluate answers quickly. Output ONLY valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5, // Increased for faster inference
      max_tokens: 250, // Reduced from implied higher value
    });

    let evaluation = extractJson(response.choices[0].message.content);

    // Safety check if extractJson returned null
    if (!evaluation) {
      throw new Error("Could not extract JSON from AI response.");
    }

    // Ensure score is a number between 0-100
    if (typeof evaluation.score !== "number") {
      evaluation.score = parseInt(evaluation.score) || 50;
    }

    // Ensure all required fields exist to prevent controller crashes
    return {
      score: Math.max(0, Math.min(100, evaluation.score || 50)),
      feedback: evaluation.feedback || "Answer noted.",
      strengths: Array.isArray(evaluation.strengths)
        ? evaluation.strengths.slice(0, 2)
        : ["Good attempt"],
      improvements: Array.isArray(evaluation.improvements)
        ? evaluation.improvements.slice(0, 2)
        : ["Keep practicing"],
      modelAnswer: "Available in next session", // Removed generation step
    };
  } catch (err) {
    console.error("[AI Service] Answer Evaluation Error:", err.message);
    // Fallback evaluation if AI fails explicitly
    return {
      score: 50,
      feedback:
        "The AI encountered an issue evaluation this specific answer. The answer has been saved.",
      strengths: ["Answer submitted successfully"],
      improvements: ["Feedback generation encountered a temporary issue"],
      modelAnswer: "Contact administration if this persists.",
    };
  }
};

/* ---------------- FINAL INTERVIEW REPORT ---------------- */

const generateInterviewReport = async (
  questions,
  answers,
  evaluations,
  jobRole,
) => {
  console.log("[AI Service] Generating final interview report...");
  const prompt = `
Job Role: ${jobRole}
Questions/Answers: ${questions.map((q, i) => `Q: ${q.question} | A: ${answers[i]?.userAnswer || "No answer"}`).join("\n")}

Respond ONLY with this JSON:
{
  "englishEfficiency": "string",
  "confidence": "string", 
  "overallPerformance": "string",
  "summary": "a detailed overall summary of the interview",
  "improvements": ["string"],
  "overallScore": 0-100
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: OLLAMA_MODEL,
      messages: [
        { role: "system", content: "You are a HR manager. Output JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const report = extractJson(response.choices[0].message.content);

    // Defensive normalization to match schema
    return {
      overallScore: report?.overallScore || 0,
      overallPerformance: report?.overallPerformance || "Evaluation complete.",
      englishEfficiency: report?.englishEfficiency || "Not assessed.",
      confidence: report?.confidence || "Not assessed.",
      summary: report?.summary || "Summary generation failed.",
      improvements: Array.isArray(report?.improvements)
        ? report.improvements
        : [],
      categoryScores: Array.isArray(report?.categoryScores)
        ? report.categoryScores
        : [],
    };
  } catch (err) {
    console.error("[AI Service] Report Generation Error:", err.message);
    return {
      overallScore: 0,
      overallPerformance: "Error generating report.",
      englishEfficiency: "N/A",
      confidence: "N/A",
      summary: "The AI encountered an error while finalizing your report.",
      improvements: [],
      categoryScores: [],
    };
  }
};

/* ---------------- ONE SHOT ---------------- */

const analyseAndGenerateQuestions = async (
  resumeText,
  fileData,
  jobRole,
  difficulty,
) => {
  console.log(
    `[AI Service] Starting One-Shot Analysis & Question Generation...`,
  );
  const analysis = await analyseResume(resumeText);
  const questions = await generateInterviewQuestions(
    analysis,
    jobRole,
    difficulty,
    5, // Generate at least 5 dynamic questions
  );

  return {
    analysis,
    questions,
  };
};

/* ---------------- SPEECH TO TEXT (STT) ---------------- */
// Note: Removed whisper-node because it requires 'make' and C++ compilation which is complex on Windows.
// Recommendation: Use Web Speech API (window.webkitSpeechRecognition) on the frontend for real-time transcription.

const transcribeAudio = async (filePath) => {
  console.warn(
    "Backend STT (Whisper) is disabled on Windows due to compilation issues.",
  );
  return "STT handled by frontend";
};

/* ---------------- TEXT TO SPEECH (TTS) ---------------- */
const say = require("say");
const fs = require("fs");
const path = require("path");

const generateSpeech = async (text, outputFile) => {
  return new Promise((resolve, reject) => {
    say.export(text, null, 1, outputFile, (err) => {
      if (err) return reject(err);
      resolve(outputFile);
    });
  });
};

module.exports = {
  extractTextFromBuffer,
  analyseResume,
  generateInterviewQuestions,
  generateNextAdaptiveQuestion,
  evaluateAnswer,
  generateInterviewReport,
  analyseAndGenerateQuestions,
  transcribeAudio,
  generateSpeech,
};
