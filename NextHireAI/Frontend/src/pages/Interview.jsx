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

  /* ---------------- Complete Interview ---------------- */

  const completeSession = async () => {

    try {
      setLoading(true);
      clearInterval(timerRef.current);
      stopRecording();
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
           {session.status === 'in-progress' && `Dynamic Session`}
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

          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-primary" onClick={handleNextQuestion}>
              Next Question <ArrowRight size={18} />
            </button>
            
            <button className="btn-outline" onClick={completeSession}>
               Finish Interview Early
            </button>
          </div>

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

          <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={toggleRecording} className="btn-outline">
                {isRecording ? <MicOff /> : <Mic />} {isRecording ? "Stop Mic" : "Start Mic"}
              </button>
              <button
                className="btn-outline"
                style={{ borderColor: "#ff4d4d", color: "#ff4d4d" }}
                onClick={() => {
                   if(window.confirm("Are you sure you want to finish the interview early?")) {
                      completeSession();
                   }
                }}
              >
                Finish Early
              </button>
            </div>
            
            <button
              className="btn-primary"
              onClick={() => submitAnswer(false)}
              disabled={loading || !answer.trim()}
            >
              {loading ? "Evaluating..." : "Submit Answer"}
            </button>
          </div>

        </div>

      )}

    </div>

  );


}