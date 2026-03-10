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

  /* ---------------- Speech Recognition (Browser Native) ---------------- */
  
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + " ";
        }
        setAnswer(fullTranscript.trim());
      };


      recognition.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const startRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsRecording(true);
    } else {
      alert("Speech Recognition is not supported in this browser.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
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
  stopRecording(); 
  await submitAnswer(true);
  // We don't call handleNextQuestion automatically anymore.
  // This allows the user to see the feedback/suggestion before moving on.
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
        handleFinishEarly(true);
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
      
      // Update local session state (answers and possibly next dynamic question)
      setSession(prev => {
        const updatedQuestions = res.data.nextQuestion 
          ? [...prev.questions, res.data.nextQuestion] 
          : prev.questions;
          
        return {
          ...prev,
          questions: updatedQuestions,
          answers: [...(prev.answers || []), { questionId: currentQuestion.id }]
        };
      });


    } catch (err) {

      console.error(err);
      setError("Failed to submit answer");

    } finally {

      setLoading(false);

    }

  };

  const handleFinishEarly = async (auto = false) => {
    if (!auto && !window.confirm("Are you sure you want to finish the interview early?")) return;

    try {
      setLoading(true);
      clearInterval(timerRef.current);
      stopRecording();

      const token = localStorage.getItem("token");

      // Submit current answer if not already evaluated
      if (answer.trim() && !feedback) {
        try {
          await axios.post(
            `http://localhost:3000/api/interview/${id}/answer`,
            {
              questionId: currentQuestion.id,
              answer: answer,
              timeTaken: 60 - timeLeft
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (submitErr) {
          console.error("Failed to submit final answer:", submitErr);
          // Continue to complete session anyway
        }
      }

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
      setError("Failed to complete session early");
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {

    clearInterval(timerRef.current);
    fetchSession(); // Re-fetch to sync state or just manually set next question

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
    return <div style={{ textAlign: "center", paddingTop: 'clamp(2rem, 10vw, 5rem)', fontSize: 'clamp(1rem, 2vw, 1.125rem)', color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  /* ---------------- Report Screen ---------------- */

  if (session.status === "completed") {

    const report = session.report || {};

    return (
      <div ref={containerRef} style={{ maxWidth: 'clamp(100%, 800px, 100%)', margin: "0 auto", paddingTop: 'clamp(1.5rem, 4vw, 2.5rem)', paddingLeft: 'clamp(1rem, 3vw, 2rem)', paddingRight: 'clamp(1rem, 3vw, 2rem)', paddingBottom: 'clamp(2rem, 4vw, 3rem)' }}>

        <h2 style={{ display: "flex", alignItems: "center", gap: 'clamp(0.5rem, 2vw, 0.75rem)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: 'clamp(1.5rem, 3vw, 2rem)' }}>
          <CheckCircle color="#4caf50" size={32} /> Interview Completed
        </h2>

        <div className="glass-panel" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', borderRadius: "12px" }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: 'clamp(0.75rem, 2vw, 1rem)', color: "#4caf50" }}>{report.overallScore || 0}/100</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: window.innerWidth <= 640 ? '1fr' : '1fr 1fr', gap: 'clamp(1rem, 2vw, 1.5rem)', marginBottom: 'clamp(1.25rem, 2vw, 1.5rem)' }}>
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: 'clamp(0.75rem, 1.2vw, 0.85rem)', marginBottom: '0.25rem' }}>OVERALL PERFORMANCE</p>
              <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>{report.overallPerformance || "N/A"}</p>
            </div>
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: 'clamp(0.75rem, 1.2vw, 0.85rem)', marginBottom: '0.25rem' }}>ENGLISH EFFICIENCY</p>
              <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>{report.englishEfficiency || "N/A"}</p>
            </div>
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: 'clamp(0.75rem, 1.2vw, 0.85rem)', marginBottom: '0.25rem' }}>CONFIDENCE LEVEL</p>
              <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>{report.confidence || "N/A"}</p>
            </div>
          </div>

          <div style={{ marginBottom: 'clamp(1.25rem, 2vw, 1.5rem)' }}>
            <p style={{ color: "var(--text-secondary)", fontSize: 'clamp(0.75rem, 1.2vw, 0.85rem)', marginBottom: '0.5rem' }}>SUMMARY</p>
            <p style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', lineHeight: "1.6" }}>{report.summary}</p>
          </div>

          {report.improvements && report.improvements.length > 0 && (
            <div style={{ marginBottom: 'clamp(1.25rem, 2vw, 1.5rem)' }}>
              <p style={{ color: "var(--text-secondary)", fontSize: 'clamp(0.75rem, 1.2vw, 0.85rem)', marginBottom: '0.5rem' }}>AREAS FOR IMPROVEMENT</p>
              <ul style={{ paddingLeft: 'clamp(1rem, 2vw, 1.5rem)', margin: 0 }}>
                {report.improvements.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem', fontSize: 'clamp(0.9rem, 1.5vw, 1rem)' }}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <button className="btn-primary" style={{ width: "100%", marginTop: 'clamp(1rem, 2vw, 1.5rem)' }} onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>

      </div>
    );

  }

  /* ---------------- Interview Screen ---------------- */

  return (

    <div ref={containerRef} style={{ maxWidth: 'clamp(100%, 800px, 100%)', margin: "0 auto", paddingTop: 'clamp(1.5rem, 4vw, 2.5rem)', paddingLeft: 'clamp(1rem, 3vw, 2rem)', paddingRight: 'clamp(1rem, 3vw, 2rem)', paddingBottom: 'clamp(2rem, 4vw, 3rem)' }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center', flexDirection: window.innerWidth <= 640 ? 'column' : 'row', gap: 'clamp(1rem, 2vw, 1.5rem)', marginBottom: 'clamp(1rem, 3vw, 1.5rem)' }}>
        <h2 style={{ display: "flex", alignItems: "center", gap: 'clamp(0.5rem, 2vw, 0.75rem)', fontSize: 'clamp(1.3rem, 4vw, 1.75rem)' }}>
          <Activity size={28} /> AI Interview
        </h2>

        <div style={{ fontSize: 'clamp(0.85rem, 1.5vw, 1rem)', color: 'var(--text-secondary)' }}>
           {session.status === 'in-progress' && `Dynamic Session`}
        </div>
      </div>

      <div style={{ marginBottom: 'clamp(1rem, 2vw, 1.5rem)', color: timeLeft < 10 ? "red" : "var(--text-secondary)", fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', fontWeight: '500' }}>
        ⏱ Time Left: {timeLeft}s
      </div>

      <div className="glass-panel" style={{ marginBottom: 'clamp(1.25rem, 3vw, 2rem)', padding: 'clamp(1.25rem, 2vw, 1.5rem)' }}>

        <p ref={questionRef} style={{ fontSize: 'clamp(1.2rem, 3vw, 1.5rem)', lineHeight: '1.6' }}>
          {currentQuestion?.question}
        </p>

      </div>

      {feedback ? (

        <div className="glass-panel" style={{ padding: 'clamp(1.25rem, 2vw, 1.5rem)' }}>

          <h3 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)', marginBottom: 'clamp(0.75rem, 2vw, 1rem)' }}>AI Feedback</h3>

          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#4caf50', margin: 'clamp(0.75rem, 2vw, 1rem) 0' }}>{feedback.score}/100</h2>

          <p style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1rem)', lineHeight: '1.6', marginBottom: 'clamp(1rem, 2vw, 1.5rem)', color: 'var(--text-secondary)' }}>{feedback.feedback}</p>

          <div style={{ display: "flex", flexDirection: window.innerWidth <= 640 ? 'column' : 'row', gap: 'clamp(0.75rem, 1.5vw, 1rem)' }}>
            <button className="btn-primary" onClick={handleNextQuestion} style={{ flex: 1 }}>
              Next Question <ArrowRight size={18} />
            </button>
            
            <button className="btn-outline" onClick={handleFinishEarly} style={{ flex: 1 }}>
               Finish Interview
            </button>
          </div>

        </div>

      ) : (

        <div className="glass-panel" style={{ padding: 'clamp(1.25rem, 2vw, 1.5rem)' }}>

          <VoiceWave active={isRecording} />

          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type or speak your answer..."
            style={{
              width: "100%",
              minHeight: 'clamp(150px, 30vh, 300px)',
              marginBottom: 'clamp(1rem, 2vw, 1.5rem)',
              padding: 'clamp(0.75rem, 1.5vw, 1rem)',
              fontSize: 'clamp(0.9rem, 1.5vw, 1rem)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />

          <div style={{ display: "flex", flexDirection: window.innerWidth <= 640 ? 'column' : 'row', justifyContent: "space-between", gap: 'clamp(0.75rem, 1.5vw, 1rem)' }}>
            <div style={{ display: "flex", flexDirection: window.innerWidth <= 640 ? 'column' : 'row', gap: 'clamp(0.75rem, 1.5vw, 1rem)', flex: 1 }}>
              <button onClick={toggleRecording} className="btn-outline" style={{ flex: window.innerWidth <= 640 ? 1 : 'auto', whiteSpace: 'nowrap' }}>
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />} {isRecording ? "Stop Mic" : "Start Mic"}
              </button>
              <button
                className="btn-outline"
                style={{ borderColor: "#ff4d4d", color: "#ff4d4d", flex: window.innerWidth <= 640 ? 1 : 'auto', whiteSpace: 'nowrap' }}
                onClick={handleFinishEarly}
              >
                Finish Early
              </button>
            </div>
            
            <button
              className="btn-primary"
              onClick={() => submitAnswer(false)}
              disabled={loading || !answer.trim()}
              style={{ flex: window.innerWidth <= 640 ? 1 : 'auto', whiteSpace: 'nowrap' }}
            >
              {loading ? "Evaluating..." : "Submit Answer"}
            </button>
          </div>

        </div>

      )}

    </div>

  );


}