import { Link } from 'react-router-dom';
import { Layers, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const handleLogout = () => {
    // clear tokens/auth state
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const isAuth = !!localStorage.getItem('token'); // Basic check

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1.5rem 0',
      marginBottom: '3rem'
    }}>
      <Link to="/" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem', 
        fontSize: '1.5rem', 
        fontWeight: '700',
        letterSpacing: '-0.05em'
      }}>
        <Layers size={28} />
        NextHireAI
      </Link>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {isAuth ? (
          <>
            <Link to="/dashboard" className="btn-outline">
              <User size={18} /> Dashboard
            </Link>
            <button onClick={handleLogout} className="btn-outline" style={{ border: 'none' }}>
              <LogOut size={18} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn-outline">Sign In</Link>
            <Link to="/register" className="btn-primary">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
