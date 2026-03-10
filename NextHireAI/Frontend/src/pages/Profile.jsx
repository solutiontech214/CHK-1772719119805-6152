import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import gsap from 'gsap';
import { User, Phone, Mail, Award, Clock, Star, TrendingUp, Camera, Edit3, Save, X } from 'lucide-react';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [uploading, setUploading] = useState(false);
  
  const profileRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data.user);
      setEditData(res.data.user);
      
      gsap.fromTo('.profile-card', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
      gsap.fromTo('.stats-card', { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'back.out(1.7)', delay: 0.3 });
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:3000/api/profile', editData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(editData);
      setIsEditing(false);
    } catch (err) {
      console.error('Update failed', err);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:3000/api/profile/avatar', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        }
      });
      setProfile({ ...profile, avatar: res.data.avatar });
    } catch (err) {
      console.error('Avatar upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', paddingTop: 'clamp(4rem, 10vw, 10rem)' }}><div className="loading-dots"><span>●</span><span>●</span><span>●</span></div></div>;

  return (
    <div ref={profileRef} style={{ maxWidth: 'clamp(100%, 1000px, 100%)', margin: '0 auto', paddingTop: 'clamp(1rem, 3vw, 2rem)', paddingLeft: 'clamp(1rem, 3vw, 2rem)', paddingRight: 'clamp(1rem, 3vw, 2rem)', paddingBottom: 'clamp(2rem, 4vw, 3rem)' }}>
      <div className="profile-card glass-panel" style={{ display: 'flex', flexDirection: window.innerWidth <= 768 ? 'column' : 'row', gap: 'clamp(1.5rem, 3vw, 3rem)', padding: 'clamp(1.5rem, 3vw, 3rem)', marginBottom: 'clamp(2rem, 4vw, 3rem)', alignItems: window.innerWidth <= 768 ? 'center' : 'center', position: 'relative' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ 
            width: 'clamp(100px, 20vw, 180px)', 
            height: 'clamp(100px, 20vw, 180px)', 
            borderRadius: '50%', 
            overflow: 'hidden', 
            border: '4px solid var(--accent-color)',
            boxShadow: '0 0 20px var(--shadow-color)',
            background: 'var(--glass-bg)'
          }}>
            {profile.avatar ? (
              <img src={profile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={Math.min(50, Math.max(40, window.innerWidth * 0.1))} color="var(--text-secondary)" />
              </div>
            )}
          </div>
          <label style={{ 
            position: 'absolute', 
            bottom: '5px', 
            right: '5px', 
            background: 'var(--accent-color)', 
            color: 'var(--bg-color)', 
            padding: 'clamp(6px, 1.5vw, 8px)', 
            borderRadius: '50%', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
          }}>
            <Camera size={20} />
            <input type="file" style={{ display: 'none' }} onChange={handleAvatarChange} accept="image/*" />
          </label>
          {uploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 'clamp(0.7rem, 1.2vw, 0.8rem)' }}>Uploading...</div>}
        </div>

        <div style={{ flex: 1, textAlign: window.innerWidth <= 768 ? 'center' : 'left' }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.75rem, 1.5vw, 1rem)' }}>
              <input 
                className="input-field" 
                value={editData.name} 
                onChange={e => setEditData({...editData, name: e.target.value})}
                style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: '700' }}
              />
              <input 
                className="input-field" 
                value={editData.targetRole} 
                placeholder="Target Role (e.g. Senior Frontend Engineer)"
                onChange={e => setEditData({...editData, targetRole: e.target.value})}
                style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1rem)' }}
              />
              <textarea 
                className="input-field" 
                value={editData.bio} 
                placeholder="Write a short bio..."
                onChange={e => setEditData({...editData, bio: e.target.value})}
                style={{ minHeight: 'clamp(60px, 15vh, 80px)', resize: 'none' }}
              />
              <div style={{ display: 'flex', flexDirection: window.innerWidth <= 640 ? 'column' : 'row', gap: 'clamp(0.75rem, 1.5vw, 1rem)' }}>
                <button className="btn-primary" onClick={handleUpdate}><Save size={18} /> Save</button>
                <button className="btn-outline" onClick={() => setIsEditing(false)}><X size={18} /> Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: window.innerWidth <= 768 ? 'center' : 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', marginBottom: 'clamp(0.3rem, 1vw, 0.5rem)' }}>{profile.name}</h1>
                <button onClick={() => setIsEditing(true)} className="btn-outline" style={{ border: 'none', padding: '5px', minWidth: 'auto' }}>
                  <Edit3 size={20} color="var(--text-secondary)" />
                </button>
              </div>
              <p style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)', color: 'var(--accent-color)', marginBottom: 'clamp(0.75rem, 1.5vw, 1rem)', fontWeight: '500' }}>{profile.targetRole || 'Add your target role'}</p>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(1rem, 2vw, 1.5rem)', lineHeight: '1.4', fontSize: 'clamp(0.9rem, 1.5vw, 1rem)' }}>{profile.bio || 'Your professional bio will appear here.'}</p>
              
              <div style={{ display: 'flex', flexDirection: window.innerWidth <= 640 ? 'column' : 'row', gap: 'clamp(1rem, 2vw, 2rem)', alignItems: window.innerWidth <= 768 ? 'center' : 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: 'clamp(0.85rem, 1.3vw, 0.95rem)' }}>
                  <Mail size={18} /> {profile.email}
                </div>
                {profile.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: 'clamp(0.85rem, 1.3vw, 0.95rem)' }}>
                    <Phone size={18} /> {profile.phone}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth <= 480 ? '1fr' : window.innerWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 'clamp(1rem, 2vw, 1.5rem)', marginBottom: 'clamp(2rem, 4vw, 3rem)' }}>
        <div className="stats-card glass-panel" style={{ textAlign: 'center', padding: 'clamp(1rem, 2vw, 1.5rem)' }}>
          <Award size={window.innerWidth <= 640 ? 28 : 32} style={{ margin: '0 auto clamp(0.75rem, 1.5vw, 1rem) auto', color: '#ffcc00' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>{profile.stats?.totalInterviews || 0}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.75rem, 1.2vw, 0.8rem)', marginTop: '0.3rem' }}>interviews conducted</p>
        </div>
        <div className="stats-card glass-panel" style={{ textAlign: 'center', padding: 'clamp(1rem, 2vw, 1.5rem)' }}>
          <TrendingUp size={window.innerWidth <= 640 ? 28 : 32} style={{ margin: '0 auto clamp(0.75rem, 1.5vw, 1rem) auto', color: '#00f2ff' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>{profile.stats?.averageScore?.toFixed(1) || 0}%</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.75rem, 1.2vw, 0.8rem)', marginTop: '0.3rem' }}>average performance</p>
        </div>
        <div className="stats-card glass-panel" style={{ textAlign: 'center', padding: 'clamp(1rem, 2vw, 1.5rem)' }}>
          <Star size={window.innerWidth <= 640 ? 28 : 32} style={{ margin: '0 auto clamp(0.75rem, 1.5vw, 1rem) auto', color: '#ff4d4d' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>{profile.stats?.bestScore?.toFixed(0) || 0}%</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.75rem, 1.2vw, 0.8rem)', marginTop: '0.3rem' }}>personal record</p>
        </div>
        <div className="stats-card glass-panel" style={{ textAlign: 'center', padding: 'clamp(1rem, 2vw, 1.5rem)' }}>
          <Clock size={window.innerWidth <= 640 ? 28 : 32} style={{ margin: '0 auto clamp(0.75rem, 1.5vw, 1rem) auto', color: '#4caf50' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>{Math.round((profile.stats?.totalTimeSpent || 0) / 60)}m</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.75rem, 1.2vw, 0.8rem)', marginTop: '0.3rem' }}>total practice time</p>
        </div>
      </div>
    </div>
  );
}
