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
Task: Analyse the resume text provided below and extract essential professional details.
Constraint: Respond ONLY with a valid JSON object. Do not include markdown or conversational text.

Required JSON Structure:
{
"name": "Full Name",
"skills": ["Skill1", "Skill2"],
"projects": [{"name": "P1", "description": "D1"}],
"experience": [{"company": "C1", "role": "R1"}],
"education": [{"institution": "I1", "degree": "Deg1"}]
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
            "You are a professional HR data extraction bot. You output only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0,
      max_tokens: 1500,
    });

    const result = extractJson(response.choices[0].message.content);
    console.log(
      `[AI Service] Analysis complete for: ${result.name || "Unknown"}`,
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
  count = 2,
) => {
  const questionCount = count;
  console.log(
    `[AI Service] Generating ${questionCount} initial questions for Job: ${jobRole}`,
  );

  const prompt = `
Task: Generate ${questionCount} initial warming-up interview questions for a candidate.
Job Role: ${jobRole}
Difficulty: ${difficulty}

Skills from Resume: ${(resume.skills || []).join(", ")}
Projects from Resume: ${(resume.projects || []).map((p) => p.name).join(", ")}

Required JSON Format (Array of objects):
[
  {
    "id": 1,
    "question": "The question text",
    "category": "Technical | Behavioural | HR",
    "difficulty": "easy | medium | hard",
    "expectedKeyPoints": ["point1", "point2"]
  }
]

Constraints:
1. Return ONLY the JSON array.
2. Mix technical and behavioral questions properly.
`;

  try {
    const response = await openai.chat.completions.create({
      model: OLLAMA_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a senior technical interviewer. You respond only with a JSON array.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const questions = extractJson(response.choices[0].message.content);
    console.log(`[AI Service] Generated ${questions?.length || 0} questions.`);
    return questions;
  } catch (err) {
    console.error("[AI Service] Question Generation Error:", err.message);
    return [];
  }
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

  // Safety check for resume
  const skillsText = resume?.skills?.join(", ") || "General skills";
  const projectsText =
    resume?.projects?.map((p) => p.name).join(", ") || "General projects";

  const historyText = (history || [])
    .map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.userAnswer}`)
    .join("\n\n");

  const prompt = `
Task: Generate the NEXT interview question based on the conversation history. 
Candidate Background: ${skillsText}
Job Role: ${jobRole}
Difficulty: ${difficulty}

Conversation History so far:
${historyText || "No history yet."}

Return ONLY a JSON object:
{
  "id": ${nextId},
  "question": "The specific interview question",
  "category": "Technical | Behavioural | Situational",
  "difficulty": "${difficulty}",
  "expectedKeyPoints": ["key point 1", "key point 2"]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: OLLAMA_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an adaptive senior interviewer. Output ONLY JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
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
  console.log("[AI Service] Evaluating candidate answer...");

  const points = (expectedKeyPoints || []).join(", ");

  const prompt = `
Task: Evaluate the candidate's response to an interview question.
Important: The answer may be transcribed from speech, so please ignore minor grammatical glitches or filler words (like "um", "ah", "you know"). Focus on the core technical/professional value and communication clarity.

Question: ${question}
Key Technical Points Expected: ${points}
Candidate Answer: ${answer}

Judge the marks (score) out of 100 based on:
1. Accuracy: Does it cover the expected points?
2. Professionalism: Is the tone appropriate?
3. Clarity: Is the explanation logical?

Response Format (Respond ONLY with this JSON):
{
  "score": 0-100,
  "feedback": "constructive professional feedback",
  "strengths": ["list specific strengths"],
  "improvements": ["list actionable improvements"],
  "modelAnswer": "a comprehensive high-quality response example"
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: OLLAMA_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an expert technical interviewer. You output only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
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
      score: evaluation.score || 50,
      feedback: evaluation.feedback || "Answer captured.",
      strengths: Array.isArray(evaluation.strengths)
        ? evaluation.strengths
        : ["Answer provided"],
      improvements: Array.isArray(evaluation.improvements)
        ? evaluation.improvements
        : ["No specific improvements suggested"],
      modelAnswer: evaluation.modelAnswer || "Model answer not generated.",
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

    return extractJson(response.choices[0].message.content);
  } catch (err) {
    console.error("[AI Service] Report Generation Error:", err.message);
    throw err;
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
    2, // Reduced to 2 for faster initial start
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
