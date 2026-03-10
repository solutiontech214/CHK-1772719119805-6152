import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import gsap from 'gsap';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const formRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      formRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
    );
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:3000/api/auth/register', { name, email, password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
      gsap.fromTo(formRef.current, { x: -10 }, { x: 10, duration: 0.1, yoyo: true, repeat: 3, ease: 'sine.inOut' });
      gsap.to(formRef.current, { x: 0, delay: 0.3 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div 
        ref={formRef} 
        className="glass-panel" 
        style={{ width: '100%', maxWidth: '400px', padding: '3rem' }}
      >
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
          Start your journey with NextHireAI.
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label className="label">Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="input-field" 
              placeholder="John Doe"
              required 
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="input-field" 
              placeholder="you@example.com"
              required 
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="input-field" 
              placeholder="••••••••"
              required 
            />
          </div>
          
          {error && <div className="error-text">{error}</div>}
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
