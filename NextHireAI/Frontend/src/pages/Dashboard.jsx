import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import gsap from 'gsap';
import { UploadCloud, FileText, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [interviews, setInterviews] = useState([]);
  
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
    const fetchSessions = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/interview/sessions', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.sessions) {
          setInterviews(res.data.sessions);
        }
      } catch (err) {
        console.error('Failed to fetch sessions', err);
      }
    };
    fetchSessions();
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
        timeout: 60000 // 60s timeout to prevent infinite hangs
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

  return (
    <div ref={containerRef} style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '2rem' }}>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Dashboard</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
        Upload your latest resume to generate a personalized AI interview session.
      </p>

      <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', marginBottom: '3rem' }}>
        {success ? (
          <div>
            <CheckCircle size={64} style={{ color: '#4caf50', margin: '0 auto 1.5rem auto' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Upload Successful!</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Preparing your tailored interview session...</p>
          </div>
        ) : (
          <>
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '12px',
                padding: '3rem 2rem',
                cursor: 'pointer',
                transition: 'border-color 0.3s ease, background 0.3s ease',
                backgroundColor: 'rgba(255,255,255,0.02)',
                marginBottom: '2rem'
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
              <UploadCloud size={48} style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Select Resume (PDF/Image)</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
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
            
            {error && <div className="error-text" style={{ marginBottom: '1rem' }}>{error}</div>}
            
            <button 
              className="btn-primary" 
              onClick={handleUpload}
              disabled={loading || !file}
              style={{ padding: '0.75rem 2rem', fontSize: '1.1rem', minWidth: '300px' }}
            >
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                  <div className="loading-dots">
                    {statusMessage} <span>●</span><span>●</span><span>●</span>
                  </div>
                </div>
              ) : 'Generate Interview'}
            </button>
          </>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={24} /> Recent Interviews
        </h3>
        
        {interviews.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {interviews.map((session, i) => (
              <div key={session._id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '1.125rem' }}>Session #{session._id.slice(-6)} ({session.jobRole})</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {new Date(session.createdAt || Date.now()).toLocaleDateString()} - <span style={{ textTransform: 'capitalize' }}>{session.status}</span>
                  </p>
                </div>
                <button 
                  className="btn-outline" 
                  onClick={() => navigate(`/interview/${session._id}`)}
                >
                  {session.status === 'completed' ? 'View Report' : 'Continue'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>No past interviews found. Upload a resume to start!</p>
        )}
      </div>
    </div>
  );
}
