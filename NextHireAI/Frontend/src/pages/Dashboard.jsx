import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import gsap from 'gsap';
import { UploadCloud, FileText, CheckCircle, Eye, X } from 'lucide-react';

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [interviews, setInterviews] = useState([]);
  const [resume, setResume] = useState(null);
  const [preview, setPreview] = useState(null); // { url, type, title }
  
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    gsap.fromTo(
      containerRef.current.children,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }
    );

    // Fetch previously created interview sessions
    const fetchDashboardData = async () => {
      try {
        const [sessionsRes, resumeRes] = await Promise.all([
          axios.get('http://localhost:3000/api/interview/sessions', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3000/api/resume/me', {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: { resume: null } }))
        ]);

        if (sessionsRes.data?.sessions) setInterviews(sessionsRes.data.sessions);
        if (resumeRes.data?.resume) setResume(resumeRes.data.resume);

      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      }
    };
    fetchDashboardData();
  }, [navigate]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a resume file first.');
      return;
    }

    setLoading(true);
    setError('');
    setStatusMessage('Uploading and analyzing resume...');
    
    const formData = new FormData();
    formData.append('resume', file);

    let interval;
    try {
      const token = localStorage.getItem('token');
      
      // Update message after a few seconds to show progress
      interval = setInterval(() => {
        setStatusMessage(prev => {
          if (prev.includes('Uploading')) return 'AI is parsing your skills...';
          if (prev.includes('parsing')) return 'Generating tailored interview...';
          return prev;
        });
      }, 5000);

      const res = await axios.post('http://localhost:3000/api/resume/upload-and-start', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        timeout: 120000 // Increased to 120s for local AI processing
      });
      
      clearInterval(interval);
      setStatusMessage('Finalizing session...');
      setSuccess(true);
      
      if(res.data && res.data.sessionId) {
        setTimeout(() => {
          navigate(`/interview/${res.data.sessionId}`);
        }, 1500);
      }
      
    } catch (err) {
      clearInterval(interval);
      setError(err.response?.data?.message || 'Failed to upload resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExisting = async () => {
    setLoading(true);
    setStatusMessage('Preparing fast-start interview...');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:3000/api/resume/start-existing', 
        { jobRole: 'Software Engineer', difficulty: 'medium' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if(res.data?.sessionId) {
        navigate(`/interview/${res.data.sessionId}`);
      }
    } catch (err) {
      setError('Failed to start session. Please try uploading again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} style={{ 
      width: '100%',
      maxWidth: 'clamp(100%, 800px, 100%)',
      minHeight: '100vh',
      margin: '0 auto', 
      paddingTop: 'clamp(1rem, 3vw, 2rem)',
      paddingLeft: 'clamp(1rem, 3vw, 2rem)',
      paddingRight: 'clamp(1rem, 3vw, 2rem)',
      paddingBottom: 'clamp(2rem, 4vw, 3rem)'
    }}>
      <h2 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', marginBottom: 'clamp(0.5rem, 2vw, 1rem)' }}>Dashboard</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(1.5rem, 4vw, 3rem)', fontSize: 'clamp(0.95rem, 1.5vw, 1rem)' }}>
        Upload your latest resume to generate a personalized AI interview session.
      </p>

      <div className="glass-panel" style={{ 
        textAlign: 'center', 
        padding: 'clamp(2rem, 4vw, 4rem) clamp(1rem, 2vw, 2rem)', 
        marginBottom: 'clamp(2rem, 4vw, 3rem)'
      }}>
        {success ? (
          <div>
            <CheckCircle size={64} style={{ color: '#4caf50', margin: '0 auto clamp(1rem, 2vw, 1.5rem) auto' }} />
            <h3 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: 'clamp(0.5rem, 1vw, 1rem)' }}>Upload Successful!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.9rem, 1.5vw, 1rem)' }}>Preparing your tailored interview session...</p>
          </div>
        ) : (
          <>
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '12px',
                padding: 'clamp(1.5rem, 4vw, 3rem) clamp(1rem, 2vw, 2rem)',
                cursor: 'pointer',
                transition: 'border-color 0.3s ease, background 0.3s ease',
                backgroundColor: 'rgba(255,255,255,0.02)',
                marginBottom: 'clamp(1.5rem, 3vw, 2rem)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--text-primary)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
              }}
            >
              <UploadCloud size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto clamp(0.75rem, 2vw, 1rem) auto' }} />
              <h4 style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)', marginBottom: 'clamp(0.25rem, 1vw, 0.5rem)' }}>Select Resume (PDF/Image)</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)' }}>
                {file ? file.name : 'Click to browse. Max size 5MB.'}
              </p>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
              accept="application/pdf,image/*"
            />
            
            {error && <div className="error-text" style={{ marginBottom: 'clamp(0.75rem, 2vw, 1rem)', fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}>{error}</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 2vw, 1.5rem)', alignItems: 'center' }}>
              <button 
                className="btn-primary" 
                onClick={handleUpload}
                disabled={loading || !file}
                style={{ width: '100%', maxWidth: '400px' }}
              >
                {loading && statusMessage.includes('Uploading') ? (
                  <div className="loading-dots">{statusMessage}</div>
                ) : resume ? 'Update Resume & Start' : 'Upload & Generate Interview'}
              </button>

              {resume && !file && (
                <button 
                  className="btn-outline" 
                  onClick={handleStartExisting}
                  disabled={loading}
                  style={{ width: '100%', maxWidth: '400px', borderColor: '#4caf50', color: '#4caf50' }}
                >
                  {loading && statusMessage.includes('Preparing') ? (
                    <div className="loading-dots">{statusMessage}</div>
                  ) : '🚀 Start Practice (Fast)'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {resume && (
        <div className="glass-panel" style={{ 
          marginBottom: 'clamp(2rem, 4vw, 3rem)', 
          padding: 'clamp(1.5rem, 3vw, 2rem)',
          display: 'flex', 
          flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
          gap: 'clamp(1.5rem, 3vw, 2rem)', 
          alignItems: 'center', 
          textAlign: 'left',
          flex: 1
        }}>
          <div style={{ 
            width: 'clamp(80px, 15vw, 120px)', 
            height: 'clamp(80px, 15vw, 120px)', 
            borderRadius: '50%', 
            border: '4px solid #4caf50', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
            fontWeight: '700',
            flexShrink: 0
          }}>
            {resume.overallScore || 0}%
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: 'clamp(0.3rem, 1vw, 0.5rem)', fontSize: 'clamp(1.1rem, 2.5vw, 1.25rem)' }}>AI Resume Score</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.8rem, 1.5vw, 0.9rem)', marginBottom: 'clamp(0.75rem, 2vw, 1rem)' }}>
              Your profile is {resume.overallScore > 70 ? 'strong' : 'improving'}. Keep practicing to level up!
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(0.5rem, 1.5vw, 0.8rem)' }}>
              {(resume.skills || []).slice(0, 5).map(skill => (
                <span key={skill} style={{ 
                  padding: 'clamp(0.3rem, 1vw, 0.4rem) clamp(0.75rem, 2vw, 1rem)', 
                  background: 'var(--glass-bg)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '15px', 
                  fontSize: 'clamp(0.7rem, 1.2vw, 0.8rem)',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap'
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <button 
            onClick={() => setPreview({ url: 'http://localhost:3000/api/resume/view', type: 'application/pdf', title: 'My Resume' })}
            className="btn-outline"
            style={{ padding: 'clamp(0.75rem, 1.5vw, 1rem)', flexShrink: 0 }}
          >
            <Eye size={20} />
          </button>
        </div>
      )}

      <div style={{ marginTop: 'clamp(2rem, 4vw, 3rem)' }}>
        <h3 style={{ 
          fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', 
          marginBottom: 'clamp(1rem, 2vw, 1.5rem)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem' 
        }}>
          <FileText size={24} /> Recent Interviews
        </h3>
        
        {interviews.length > 0 ? (
          <div style={{ display: 'grid', gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
            {interviews.map((session, i) => (
              <div key={session._id} className="glass-panel" style={{ 
                display: 'flex', 
                flexDirection: window.innerWidth <= 640 ? 'column' : 'row',
                justifyContent: 'space-between', 
                alignItems: window.innerWidth <= 640 ? 'flex-start' : 'center', 
                padding: 'clamp(1rem, 2vw, 1.5rem)',
                gap: 'clamp(1rem, 2vw, 1.5rem)'
              }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 'clamp(1rem, 1.8vw, 1.125rem)' }}>Session #{session._id.slice(-6)} ({session.jobRole})</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.8rem, 1.3vw, 0.875rem)', marginTop: '0.25rem' }}>
                    {new Date(session.createdAt || Date.now()).toLocaleDateString()} - <span style={{ textTransform: 'capitalize' }}>{session.status}</span>
                  </p>
                </div>
                <button 
                  className="btn-outline" 
                  onClick={() => navigate(`/interview/${session._id}`)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {session.status === 'completed' ? 'View Report' : 'Continue'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.9rem, 1.5vw, 1rem)' }}>No past interviews found. Upload a resume to start!</p>
        )}
      </div>

      {preview && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 2000,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '2rem'
        }} onClick={() => setPreview(null)}>
          <div style={{
            width: '90%',
            height: '90%',
            background: 'var(--bg-color)',
            borderRadius: '16px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem' }}>{preview.title}</h3>
              <button 
                onClick={() => setPreview(null)}
                style={{ padding: '8px', background: 'var(--glass-bg)', borderRadius: '50%', color: 'var(--text-primary)' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
              {preview.type.includes('pdf') ? (
                <iframe 
                  src={preview.url} 
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="PDF Preview"
                />
              ) : (
                <img 
                  src={preview.url} 
                  alt="Preview" 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
