import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import gsap from 'gsap';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
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
      const result = await register(name, email, password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.message);
        gsap.fromTo(formRef.current, { x: -10 }, { x: 10, duration: 0.1, yoyo: true, repeat: 3, ease: 'sine.inOut' });
        gsap.to(formRef.current, { x: 0, delay: 0.3 });
      }
    } catch (err) {
      setError('An unexpected error occurred');
      gsap.fromTo(formRef.current, { x: -10 }, { x: 10, duration: 0.1, yoyo: true, repeat: 3, ease: 'sine.inOut' });
      gsap.to(formRef.current, { x: 0, delay: 0.3 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', paddingTop: 'clamp(1rem, 2vw, 2rem)', paddingBottom: 'clamp(1rem, 2vw, 2rem)' }}>
      <div 
        ref={formRef} 
        className="glass-panel" 
        style={{ width: '100%', maxWidth: 'clamp(290px, 90vw, 400px)', padding: 'clamp(1.5rem, 4vw, 3rem)' }}
      >
        <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', marginBottom: 'clamp(0.25rem, 1vw, 0.5rem)', textAlign: 'center' }}>Create Account</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 'clamp(1.25rem, 3vw, 2rem)', fontSize: 'clamp(0.9rem, 1.5vw, 1rem)' }}>
          Start your journey with NextHireAI.
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 2vw, 1.5rem)' }}>
          <div>
            <label className="label" style={{ fontSize: 'clamp(0.85rem, 1.5vw, 0.95rem)' }}>Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="input-field" 
              placeholder="Samarth Patil"
              required 
            />
          </div>
          <div>
            <label className="label" style={{ fontSize: 'clamp(0.85rem, 1.5vw, 0.95rem)' }}>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="input-field" 
              placeholder="samarthpatil@example.com.com"
              required 
            />
          </div>
          <div>
            <label className="label" style={{ fontSize: 'clamp(0.85rem, 1.5vw, 0.95rem)' }}>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="input-field" 
              placeholder="••••••••"
              required 
            />
          </div>
          
          {error && <div className="error-text" style={{ fontSize: 'clamp(0.85rem, 1.5vw, 0.95rem)' }}>{error}</div>}
          
          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 'clamp(0.75rem, 1.5vw, 1rem)' }}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 'clamp(1.25rem, 3vw, 2rem)', color: 'var(--text-secondary)', fontSize: 'clamp(0.85rem, 1.5vw, 0.95rem)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--text-primary)', textDecoration: 'underline' }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
