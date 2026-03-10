import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ChevronRight, Cpu, Target, Zap, ChevronDown, Users, Clock, BookOpen, Award, Lightbulb, TrendingUp } from 'lucide-react';

export default function Home() {
  const introRef = useRef(null);
  const heroTextRef = useRef(null);
  const cardsRef = useRef([]);
  const [expandedFAQ, setExpandedFAQ] = useState(null);

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

  const whyChooseUs = [
    {
      icon: <Users size={24} />,
      title: 'Real Interview Simulation',
      desc: 'Practice with AI that thinks like real interviewers'
    },
    {
      icon: <Clock size={24} />,
      title: 'Practice Anytime',
      desc: 'Interview prep available 24/7 at your own pace'
    },
    {
      icon: <BookOpen size={24} />,
      title: 'Personalized Content',
      desc: 'Questions based on YOUR resume and skills'
    },
    {
      icon: <Award size={24} />,
      title: 'Performance Tracking',
      desc: 'Track your progress with detailed analytics'
    },
    {
      icon: <Lightbulb size={24} />,
      title: 'Smart Feedback',
      desc: 'AI-powered insights to identify improvement areas'
    },
    {
      icon: <TrendingUp size={24} />,
      title: 'Confidence Building',
      desc: 'Reduce interview anxiety through repetitive practice'
    }
  ];

  const faqs = [
    {
      question: 'How does NextHireAI generate interview questions?',
      answer: 'Our AI analyzes your resume to extract your skills, projects, and experience. It then generates 5+ dynamic interview questions tailored specifically to your background and the target job role. This ensures every question is relevant and tests your actual capabilities.'
    },
    {
      question: 'How is my answer evaluated?',
      answer: 'Your responses are evaluated by advanced AI that considers accuracy, professionalism, clarity, and coverage of expected key points. You receive a score (0-100), actionable feedback, identified strengths, and areas for improvement within seconds.'
    },
    {
      question: 'Can I practice multiple times?',
      answer: 'Yes! You can upload multiple resumes, practice for different job roles, adjust difficulty levels, and retake interviews as many times as you want. Each session is tracked so you can monitor your progress over time.'
    },
    {
      question: 'What job roles are supported?',
      answer: 'NextHireAI supports any job role - from Software Engineer, Data Scientist, and Product Manager to UX Designer, Sales, and General Management positions. You can specify the role when starting an interview.'
    },
    {
      question: 'How long does an interview session take?',
      answer: 'A typical interview session with 5 questions takes 15-30 minutes, depending on the depth of your answers. You can end early or extend the session as needed. Questions are asked one at a time with AI feedback after each response.'
    },
    {
      question: 'Is my data secure and private?',
      answer: 'Yes. We use industry-standard encryption, secure authentication, and we never share your resume or interview data with third parties. Your data is stored confidentially and only used to improve your personalized experience.'
    },
    {
      question: 'What if I make a mistake during an interview?',
      answer: 'There are no mistakes - this is practice! You can retake the interview as many times as you want. Each session provides learning opportunities, and our AI explains the correct approaches and best practices for answering similar questions.'
    },
    {
      question: 'Can I see example answers?',
      answer: 'Yes! After answering a question, you receive AI-generated feedback with insights. You can also review previous interview sessions to see patterns in your performance and areas where you consistently need improvement.'
    }
  ];

  return (
    <div ref={introRef} style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <div 
        ref={heroTextRef}
        style={{ 
          textAlign: 'center', 
          marginTop: 'clamp(3rem, 8vw, 6rem)', 
          marginBottom: 'clamp(3rem, 8vw, 6rem)',
          paddingLeft: 'clamp(1rem, 2vw, 2rem)',
          paddingRight: 'clamp(1rem, 2vw, 2rem)',
        }}
      >
        <div style={{
          display: 'inline-block',
          padding: 'clamp(0.4rem, 1vw, 0.5rem) clamp(0.8rem, 2vw, 1rem)',
          borderRadius: '20px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: 'clamp(1rem, 3vw, 2rem)',
          fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
          fontWeight: '500',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          Next-Gen AI Interview Prep
        </div>
        <h1 className="text-hero" style={{ 
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #5c4b4b 0%, #e0e7ff 25%, #c7d2fe 50%, #a5b4fc 75%, #818cf8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: '800',
          letterSpacing: '-0.02em',
          textShadow: '0 0 40px rgba(129, 140, 248, 0.3), 0 0 80px rgba(129, 140, 248, 0.1)',
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
          lineHeight: '1.1'
        }}>
          Master Your Next Tech Interview
        </h1>
        <p style={{ 
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', 
          color: 'var(--text-secondary)',
          marginBottom: 'clamp(1.5rem, 3vw, 3rem)',
          maxWidth: '600px',
          margin: '0 auto clamp(1.5rem, 3vw, 3rem) auto'
        }}>
          Upload your resume and practice with our intelligent AI interviewer. Get personalized questions and real-time feedback to land your dream job.
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: 'clamp(0.75rem, 2vw, 1rem)', 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link to="/register" className="btn-primary" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.125rem)' }}>
            Start Practicing <ChevronRight size={20} />
          </Link>
          <Link to="/login" className="btn-outline" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.125rem)' }}>
            View Dashboard
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="responsive-grid-3" style={{
        marginTop: 'clamp(4rem, 8vw, 8rem)'
      }}>
        {features.map((item, i) => (
          <div 
            key={i} 
            className="glass-panel" 
            ref={el => cardsRef.current[i] = el}
            style={{ 
              padding: 'clamp(1.5rem, 3vw, 2rem)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
          >
            {item.icon}
            <h3 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)', marginBottom: '1rem' }}>{item.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.9rem, 1.5vw, 1rem)' }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Purpose Section */}
      <section style={{ 
        marginTop: 'clamp(4rem, 8vw, 8rem)', 
        marginBottom: 'clamp(3rem, 6vw, 6rem)',
        paddingLeft: 'clamp(1rem, 2vw, 2rem)',
        paddingRight: 'clamp(1rem, 2vw, 2rem)',
        maxWidth: '900px', 
        margin: 'clamp(4rem, 8vw, 8rem) auto clamp(3rem, 6vw, 6rem) auto'
      }}>
        <h2 style={{ 
          fontSize: 'clamp(2rem, 5vw, 3rem)', 
          marginBottom: '2rem', 
          textAlign: 'center' 
        }}>Purpose of NextHireAI</h2>
        <div className="glass-panel" style={{ padding: 'clamp(1.5rem, 3vw, 2.5rem)' }}>
          <p style={{ 
            fontSize: 'clamp(1rem, 1.5vw, 1.1rem)', 
            lineHeight: '1.8', 
            color: 'var(--text-secondary)',
            marginBottom: '1.5rem'
          }}>
            NextHireAI is designed to democratize interview preparation by providing <strong>intelligent, personalized, and accessible coaching</strong> to candidates at all career levels. Our mission is to bridge the gap between resume screening and actual interview success by simulating real-world interview scenarios powered by cutting-edge AI technology.
          </p>
          <p style={{ 
            fontSize: 'clamp(1rem, 1.5vw, 1.1rem)', 
            lineHeight: '1.8', 
            color: 'var(--text-secondary)'
          }}>
            We believe that <strong>great candidates shouldn't fail due to lack of preparation</strong>. By analyzing your unique background and generating tailored questions, we ensure every practice session is relevant and valuable, maximizing your chances of success.
          </p>
        </div>
      </section>

      {/* Why It's Needed Section */}
      <section style={{ 
        marginTop: 'clamp(4rem, 8vw, 6rem)', 
        marginBottom: 'clamp(3rem, 6vw, 6rem)',
        paddingLeft: 'clamp(1rem, 2vw, 2rem)',
        paddingRight: 'clamp(1rem, 2vw, 2rem)',
        maxWidth: '1200px', 
        margin: 'clamp(4rem, 8vw, 6rem) auto'
      }}>
        <h2 style={{ 
          fontSize: 'clamp(2rem, 5vw, 3rem)', 
          marginBottom: 'clamp(2rem, 4vw, 3rem)', 
          textAlign: 'center' 
        }}>Why You Need Interview Practice</h2>
        <div className="responsive-grid-3">
          {whyChooseUs.map((item, i) => (
            <div key={i} className="glass-panel" style={{ 
              padding: 'clamp(1.5rem, 2.5vw, 2rem)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ 
                color: 'var(--accent-color)', 
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 'clamp(2rem, 3vw, 2.5rem)'
              }}>
                {item.icon}
              </div>
              <h3 style={{ 
                fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', 
                marginBottom: 0 
              }}>
                {item.title}
              </h3>
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: 'clamp(0.9rem, 1.5vw, 0.95rem)' 
              }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ 
        marginTop: 'clamp(4rem, 8vw, 8rem)', 
        marginBottom: 'clamp(3rem, 6vw, 6rem)',
        paddingLeft: 'clamp(1rem, 2vw, 2rem)',
        paddingRight: 'clamp(1rem, 2vw, 2rem)',
        maxWidth: '800px', 
        margin: 'clamp(4rem, 8vw, 8rem) auto clamp(3rem, 6vw, 6rem) auto'
      }}>
        <h2 style={{ 
          fontSize: 'clamp(2rem, 5vw, 3rem)', 
          marginBottom: 'clamp(2rem, 4vw, 3rem)', 
          textAlign: 'center' 
        }}>Frequently Asked Questions</h2>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 'clamp(1rem, 2vw, 1.5rem)' 
        }}>
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className="glass-panel" 
              style={{ 
                padding: 'clamp(1.2rem, 2.5vw, 1.5rem)', 
                cursor: 'pointer'
              }}
              onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                gap: '1rem'
              }}>
                <h3 style={{ 
                  fontSize: 'clamp(1rem, 1.8vw, 1.1rem)', 
                  marginBottom: 0,
                  flex: 1
                }}>
                  {faq.question}
                </h3>
                <ChevronDown 
                  size={24} 
                  style={{ 
                    transform: expandedFAQ === i ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                    color: 'var(--accent-color)',
                    flexShrink: 0
                  }} 
                />
              </div>
              {expandedFAQ === i && (
                <p style={{ 
                  color: 'var(--text-secondary)', 
                  marginTop: '1rem',
                  lineHeight: '1.6',
                  fontSize: 'clamp(0.875rem, 1.5vw, 0.95rem)'
                }}>
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ 
        marginTop: 'clamp(4rem, 8vw, 8rem)', 
        marginBottom: 'clamp(2rem, 4vw, 4rem)', 
        textAlign: 'center',
        paddingLeft: 'clamp(1rem, 2vw, 2rem)',
        paddingRight: 'clamp(1rem, 2vw, 2rem)',
        maxWidth: '800px', 
        margin: 'clamp(4rem, 8vw, 8rem) auto clamp(2rem, 4vw, 4rem) auto'
      }}>
        <h2 style={{ 
          fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', 
          marginBottom: 'clamp(1rem, 2vw, 1.5rem)' 
        }}>
          Ready to Ace Your Interview?
        </h2>
        <p style={{ 
          fontSize: 'clamp(1rem, 1.5vw, 1.1rem)', 
          color: 'var(--text-secondary)', 
          marginBottom: 'clamp(1.5rem, 2vw, 2rem)'
        }}>
          Join thousands of candidates who've already improved their interview skills with NextHireAI.
        </p>
        <Link to="/register" className="btn-primary" style={{ fontSize: 'clamp(1rem, 1.5vw, 1.125rem)' }}>
          Get Started Today <ChevronRight size={20} />
        </Link>
      </section>
    </div>
  );
}
