import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ChevronRight, Cpu, Target, Zap } from 'lucide-react';

export default function Home() {
  const introRef = useRef(null);
  const heroTextRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroTextRef.current.children,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.2, ease: 'power3.out', delay: 0.2 }
      );
      
      gsap.fromTo(
        cardsRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out', delay: 0.8 }
      );
    }, introRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: <Cpu size={32} style={{ marginBottom: '1rem', color: 'var(--text-primary)' }} />,
      title: 'AI Resume Analysis',
      desc: 'Smart parsing of your experience and skills to generate personalized interview questions.'
    },
    {
      icon: <Target size={32} style={{ marginBottom: '1rem', color: 'var(--text-primary)' }} />,
      title: 'Targeted Questions',
      desc: 'Industry-specific scenarios and technical questions tailored exactly to your profile.'
    },
    {
      icon: <Zap size={32} style={{ marginBottom: '1rem', color: 'var(--text-primary)' }} />,
      title: 'Instant Feedback',
      desc: 'Receive immediate, actionable feedback on your responses to improve quickly.'
    }
  ];

  return (
    <div ref={introRef} style={{ paddingBottom: '4rem' }}>
      <div 
        ref={heroTextRef}
        style={{ 
          textAlign: 'center', 
          marginTop: '6rem', 
          marginBottom: '6rem',
          maxWidth: '800px',
          margin: '6rem auto'
        }}
      >
        <div style={{
          display: 'inline-block',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '2rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          Next-Gen AI Interview Prep
        </div>
        <h1 style={{ 
          fontSize: '4.5rem', 
          lineHeight: '1.1', 
          marginBottom: '1.5rem',
          background: 'linear-gradient(to right, #fff, #888)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Master Your Next <br /> Tech Interview
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          color: 'var(--text-secondary)',
          marginBottom: '3rem',
          maxWidth: '600px',
          margin: '0 auto 3rem auto'
        }}>
          Upload your resume and practice with our intelligent AI interviewer. Get personalized questions and real-time feedback to land your dream job.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to="/register" className="btn-primary" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
            Start Practicing <ChevronRight size={20} />
          </Link>
          <Link to="/login" className="btn-outline" style={{ fontSize: '1.125rem', padding: '1rem 2rem' }}>
            View Dashboard
          </Link>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem',
        marginTop: '8rem'
      }}>
        {features.map((item, i) => (
          <div 
            key={i} 
            className="glass-panel" 
            ref={el => cardsRef.current[i] = el}
            style={{ 
              transition: 'transform 0.3s ease, background 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
          >
            {item.icon}
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{item.title}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
