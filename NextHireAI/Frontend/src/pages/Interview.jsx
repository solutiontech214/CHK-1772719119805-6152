import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import gsap from "gsap";
import { Mic, MicOff, ArrowRight, Activity, CheckCircle } from "lucide-react";
import VoiceWave from "../components/VoiceWave";

export default function Interview() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);

  const containerRef = useRef(null);
  const questionRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  /* ---------------- Speech Recognition Setup ---------------- */

  useEffect(() => {

    gsap.fromTo(
      containerRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.6 }
    );

    fetchSession();

  }, []);

  /* ---------------- Text To Speech (Local AI) ---------------- */
  const speakQuestion = async (text) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:3000/api/ai/tts",
        { text },
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob' 
        }
      );
      
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err) {
      console.error("Local TTS Error:", err);
      // Fallback to browser synth if backend fails
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  /* ---------------- Speech Recognition (Local AI) ---------------- */
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendAudioToBackend(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToBackend = async (blob) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("audio", blob, "answer.wav");
      
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:3000/api/ai/stt",
        formData,
        { headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data" 
        } }
      );

      if (res.data.text) {
        setAnswer(prev => prev + " " + res.data.text);
      }
    } catch (err) {
      console.error("Local STT Error:", err);
    } finally {
      setLoading(false);
    }
  };


  /* ---------------- Timer ---------------- */

  const startTimer = () => {

  setTimeLeft(60);

  if (timerRef.current) clearInterval(timerRef.current);

  timerRef.current = setInterval(() => {

    setTimeLeft(prev => {

      if (prev <= 1) {

        clearInterval(timerRef.current);

        handleTimeUp();

        return 0;
      }

      return prev - 1;

    });

  }, 1000);

};
const handleTimeUp = async () => {

  await submitAnswer(true);

  const answered = (session.answers?.length || 0) + 1;

  if (answered < session.questions.length) {

    handleNextQuestion();

  } else {

    completeSession();

  }

};

  /* ---------------- Fetch Session ---------------- */

  const fetchSession = async () => {

    try {

      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await axios.get(
        `http://localhost:3000/api/interview/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = res.data.session;

      setSession(data);

      if (!data || !data.questions) return;

      const answeredIds = data.answers?.map((a) => a.questionId) || [];

      const nextQ = data.questions.find((q) => !answeredIds.includes(q.id));

      if (!nextQ) {
        completeSession();
        return;
      }

      setCurrentQuestion(nextQ);
      setAnswer("");
      setFeedback(null);

      speakQuestion(nextQ.question);
      startTimer();

      setTimeout(() => {
        if (questionRef.current) {
          gsap.fromTo(
            questionRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5 }
          );
        }
      }, 100);

    } catch (err) {

      console.error(err);
      setError("Failed to load interview.");

    } finally {

      setLoading(false);

    }

  };

  /* ---------------- Submit Answer ---------------- */

  const submitAnswer = async (auto = false) => {

    if (!currentQuestion) return;

    try {

      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await axios.post(
        `http://localhost:3000/api/interview/${id}/answer`,
        {
          questionId: currentQuestion.id,
          answer: answer || "No answer provided",
          timeTaken: 60 - timeLeft
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFeedback(res.data.evaluation);

    } catch (err) {

      console.error(err);
      setError("Failed to submit answer");

    } finally {

      setLoading(false);

    }

  };

  /* ---------------- Complete Interview ---------------- */

  const completeSession = async () => {

    try {

      const token = localStorage.getItem("token");

      const res = await axios.post(
        `http://localhost:3000/api/interview/${id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSession((prev) => ({
        ...prev,
        status: "completed",
        report: res.data.report
      }));

    } catch (err) {

      console.error(err);
      setError("Failed to complete session");

    }

  };

  const handleNextQuestion = () => {

    clearInterval(timerRef.current);
    fetchSession();

  };

  /* ---------------- Mic Toggle ---------------- */

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (!session) {
    return <div style={{ textAlign: "center", marginTop: "5rem" }}>Loading...</div>;
  }

  /* ---------------- Report Screen ---------------- */

  if (session.status === "completed") {

    const report = session.report || {};

    return (
      <div ref={containerRef} style={{ maxWidth: 800, margin: "auto", paddingTop: 40 }}>

        <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CheckCircle color="#4caf50" /> Interview Completed
        </h2>

        <h3>Score: {report.overallScore || 0}/100</h3>

        <p>{report.summary}</p>

        <button onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>

      </div>
    );

  }

  /* ---------------- Interview Screen ---------------- */

  return (

    <div ref={containerRef} style={{ maxWidth: 800, margin: "auto", paddingTop: 40 }}>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Activity /> AI Interview
        </h2>

        <div>
          Question {(session.answers?.length || 0) + 1} / {session.questions.length}
        </div>
      </div>

      <div style={{ marginBottom: 10, color: timeLeft < 10 ? "red" : "#aaa" }}>
        ⏱ Time Left: {timeLeft}s
      </div>

      <div className="glass-panel" style={{ marginBottom: 20 }}>

        <p ref={questionRef} style={{ fontSize: "1.5rem" }}>
          {currentQuestion?.question}
        </p>

      </div>

      {feedback ? (

        <div className="glass-panel">

          <h3>AI Feedback</h3>

          <h2>{feedback.score}/100</h2>

          <p>{feedback.feedback}</p>

          <button onClick={handleNextQuestion}>
            Next Question <ArrowRight size={18} />
          </button>

        </div>

      ) : (

        <div className="glass-panel">

          <VoiceWave active={isRecording} />

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type or speak your answer..."
            style={{
              width: "100%",
              minHeight: 200,
              marginBottom: 20
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between" }}>

            <button onClick={toggleRecording}>
              {isRecording ? <MicOff /> : <Mic />} {isRecording ? "Stop Mic" : "Start Mic"}
            </button>
<button
  className="btn-primary"
  onClick={() => submitAnswer(false)}
  disabled={loading || !answer.trim()}
>
  {loading
    ? "Evaluating..."
    : session.answers.length + 1 === session.questions.length
    ? "Submit Interview"
    : "Submit & Next"}
</button>
          </div>

        </div>

      )}

    </div>

  );

}