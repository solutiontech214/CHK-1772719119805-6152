const pdfParse = require("pdf-parse");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: "ollama",
  baseURL: "http://localhost:11434/v1",
});

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

/* ---------------- PDF TEXT EXTRACTION ---------------- */

const extractTextFromBuffer = async (buffer) => {
  try {
    const data = await pdfParse(buffer);

    const text = (data.text || "").replace(/\s+/g, " ").trim();

    return text;
  } catch (err) {
    const raw = buffer.toString("latin1");

    const matches = raw.match(/([^\x00-\x1F\x7F-\xFF]{4,})/g) || [];

    const text = matches
      .filter((s) => /[a-zA-Z]/.test(s))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return text;
  }
};

/* ---------------- RESUME ANALYSIS ---------------- */

const analyseResume = async (resumeText, fileData = null) => {
  const prompt = `
Analyze the following resume text and extract structured information.

Return JSON only:

{
"name":"",
"skills":[],
"projects":[{"name":"","description":""}],
"experience":[{"company":"","role":""}],
"education":[{"institution":"","degree":""}]
}

Resume:
${resumeText}
`;

  const response = await openai.chat.completions.create({
    model: OLLAMA_MODEL,

    messages: [
      { role: "system", content: "You are an expert HR recruiter." },
      { role: "user", content: prompt },
    ],
  });

  const text = response.choices[0].message.content;

  const cleaned = text.replace(/```json/g, "").replace(/```/g, "");

  return JSON.parse(cleaned);
};

/* ---------------- DYNAMIC QUESTION GENERATION ---------------- */

const generateInterviewQuestions = async (
  resume,
  jobRole,
  difficulty = "medium",
  count = 5,
) => {
  const questionCount = Math.max(count, 5); // ensure minimum 5

  const prompt = `
You are a senior technical interviewer.

Generate ${questionCount} interview questions based on the candidate resume.

Job Role: ${jobRole}
Difficulty: ${difficulty}

Candidate Skills:
${(resume.skills || []).join(", ")}

Projects:
${(resume.projects || []).map((p) => p.name).join(", ")}

Rules:
- Ask at least 5 questions
- Mix Technical, Behavioural and HR questions
- Return ONLY valid JSON

Format:

[
{
"id":1,
"question":"question text",
"category":"Technical | Behavioural | HR",
"difficulty":"easy | medium | hard",
"expectedKeyPoints":["point1","point2"]
}
]
`;

  const response = await openai.chat.completions.create({
    model: OLLAMA_MODEL,
    messages: [
      { role: "system", content: "You are an expert technical interviewer." },
      { role: "user", content: prompt },
    ],
  });

  const text = response.choices[0].message.content;

  const cleaned = text.replace(/```json/g, "").replace(/```/g, "");

  let questions = JSON.parse(cleaned);

  /* ----- Ensure minimum 5 questions ----- */

  if (!questions || questions.length < 5) {
    const fallback = [
      {
        id: 1,
        question: "Tell me about yourself.",
        category: "HR",
        difficulty: "easy",
        expectedKeyPoints: ["background", "experience"],
      },
      {
        id: 2,
        question: "Explain a project from your resume.",
        category: "Technical",
        difficulty: "medium",
        expectedKeyPoints: ["problem", "solution"],
      },
      {
        id: 3,
        question: "What are your key strengths?",
        category: "Behavioural",
        difficulty: "easy",
        expectedKeyPoints: ["skills", "examples"],
      },
      {
        id: 4,
        question: "What challenges did you face in your last project?",
        category: "Technical",
        difficulty: "medium",
        expectedKeyPoints: ["problem solving"],
      },
      {
        id: 5,
        question: "Where do you see yourself in 5 years?",
        category: "HR",
        difficulty: "easy",
        expectedKeyPoints: ["career goals"],
      },
    ];

    questions = fallback;
  }

  return questions.slice(0, questionCount);
};

/* ---------------- ANSWER EVALUATION ---------------- */

const evaluateAnswer = async (question, answer, expectedKeyPoints = []) => {
  const prompt = `
Evaluate the candidate answer.

Question:
${question}

Expected Key Points:
${expectedKeyPoints.join(", ")}

Candidate Answer:
${answer}

Return JSON only:

{
"score":7,
"feedback":"",
"strengths":[],
"improvements":[],
"modelAnswer":""
}

Score must be between 0 and 10.
`;

  const response = await openai.chat.completions.create({
    model: OLLAMA_MODEL,

    messages: [
      { role: "system", content: "You are a senior interviewer." },
      { role: "user", content: prompt },
    ],
  });

  const text = response.choices[0].message.content;

  const cleaned = text.replace(/```json/g, "").replace(/```/g, "");

  return JSON.parse(cleaned);
};

/* ---------------- FINAL INTERVIEW REPORT ---------------- */

const generateInterviewReport = async (
  questions,
  answers,
  evaluations,
  jobRole,
) => {
  const prompt = `
Analyze the interview performance.

Job Role: ${jobRole}

Questions:
${questions.map((q, i) => `${i + 1}. ${q.question}`).join("\n")}

Answers:
${answers.map((a, i) => `${i + 1}. ${a.userAnswer}`).join("\n")}

Return JSON only:

{
"englishEfficiency":"",
"confidence":"",
"expectedAnswer":"",
"actualAnswer":"",
"overallPerformance":"",
"improvements":[],
"score":8
}

Score should be between 0 and 10.
`;

  const response = await openai.chat.completions.create({
    model: OLLAMA_MODEL,

    messages: [
      { role: "system", content: "You are an expert interviewer." },
      { role: "user", content: prompt },
    ],
  });

  const text = response.choices[0].message.content;

  const cleaned = text.replace(/```json/g, "").replace(/```/g, "");

  return JSON.parse(cleaned);
};

/* ---------------- ONE SHOT ---------------- */

const analyseAndGenerateQuestions = async (
  resumeText,
  fileData,
  jobRole,
  difficulty,
) => {
  const analysis = await analyseResume(resumeText);

  const questions = await generateInterviewQuestions(
    analysis,
    jobRole,
    difficulty,
    5,
  );

  return {
    analysis,
    questions,
  };
};

/* ---------------- SPEECH TO TEXT (STT) ---------------- */
const whisper = require("whisper-node");

const transcribeAudio = async (filePath) => {
  try {
    const transcript = await whisper(filePath, {
      modelName: "tiny.en", // use tiny for speed
      whisperOptions: {
        gen_file_txt: false,
        gen_file_vtt: false,
        gen_file_srt: false,
      },
    });

    // whisper-node returns an array of segments
    return transcript
      .map((s) => s.speech)
      .join(" ")
      .trim();
  } catch (err) {
    console.error("STT Error:", err);
    throw new Error("Failed to transcribe audio locally.");
  }
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
  evaluateAnswer,
  generateInterviewReport,
  analyseAndGenerateQuestions,
  transcribeAudio,
  generateSpeech,
};
