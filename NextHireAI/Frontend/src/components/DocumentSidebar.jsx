import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Upload, Trash2, X, Plus, ExternalLink, ShieldCheck, Eye } from 'lucide-react';
import gsap from 'gsap';

export default function DocumentSidebar({ isOpen, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');
  const [newDoc, setNewDoc] = useState({ title: '', category: 'Resume', file: null });
  const [preview, setPreview] = useState(null); // { url, type, title }

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
      gsap.fromTo('.sidebar-content', { x: 400 }, { x: 0, duration: 0.5, ease: 'power3.out' });
    }
  }, [isOpen]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(res.data.documents);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewDoc({ ...newDoc, file, title: newDoc.title || file.name.split('.')[0] });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newDoc.file || !newDoc.title) return;

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', newDoc.file);
    formData.append('title', newDoc.title);
    formData.append('category', newDoc.category);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setNewDoc({ title: '', category: 'Resume', file: null });
      fetchDocuments();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Upload failed. Only PDF, JPG, PNG allowed (max 10MB).';
      setError(msg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDocuments();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div 
        className="sidebar-content"
        style={{
          width: '400px',
          background: 'var(--bg-color)',
          borderLeft: '1px solid var(--border-color)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck color="var(--accent-color)" /> Document Locker
          </h2>
          <button onClick={onClose} className="btn-outline" style={{ padding: '8px', border: 'none' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleUpload} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ADD NEW DOCUMENT</h4>
          
          <input 
            type="text" 
            placeholder="Document Title (e.g. My PAN)" 
            className="input-field" 
            style={{ marginBottom: '10px' }}
            value={newDoc.title}
            onChange={e => setNewDoc({...newDoc, title: e.target.value})}
          />
          
          <select 
            className="input-field" 
            style={{ marginBottom: '10px' }}
            value={newDoc.category}
            onChange={e => setNewDoc({...newDoc, category: e.target.value})}
          >
            <option>Resume</option>
            <option>Aadhar Card</option>
            <option>PAN Card</option>
            <option>Certificate</option>
            <option>Other</option>
          </select>

          <input 
            type="file" 
            id="sidebar-file" 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
            accept="application/pdf,image/*"
          />
          <label 
            htmlFor="sidebar-file" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              padding: '10px', 
              background: 'var(--glass-bg)', 
              borderRadius: '8px', 
              cursor: 'pointer',
              marginBottom: '15px',
              border: '1px dashed var(--border-color)',
              fontSize: '0.9rem'
            }}
          >
            {newDoc.file ? <><FileText size={16} /> {newDoc.file.name.slice(0, 15)}...</> : <><Plus size={16} /> Choose File</>}
          </label>

          {error && <p style={{ color: '#ff4d4d', fontSize: '0.8rem', marginBottom: '10px' }}>{error}</p>}

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '10px' }}
            disabled={uploadLoading || !newDoc.file}
          >
            {uploadLoading ? 'Uploading...' : <><Upload size={16} /> Upload Securely</>}
          </button>
        </form>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <h4 style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SAVED DOCUMENTS ({documents.length})</h4>
          
          {loading ? (
            <p>Loading...</p>
          ) : documents.length > 0 ? (
            documents.map(doc => (
              <div key={doc._id} className="glass-panel" style={{ 
                padding: '12px', 
                marginBottom: '10px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                border: '1px solid var(--glass-border)'
              }}>
                <div style={{ overflow: 'hidden' }}>
                  <p style={{ fontWeight: '500', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{doc.category} • {new Date(doc.createdAt).toLocaleDateString()}</p>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button 
                    onClick={() => {
                      // Prefer the stored mimeType; fall back to extension-sniff
                      const type = doc.mimeType
                        || (doc.fileName && doc.fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
                      // Use backend proxy endpoint for preview to avoid CORS issues
                      const url = `http://localhost:3000/api/documents/view/${doc._id}`;
                      setPreview({ url, type, title: doc.title });
                    }}
                    className="btn-outline" 
                    style={{ padding: '6px' }}
                    title="View Document"
                  >
                    <Eye size={14} />
                  </button>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ padding: '6px' }} title="Full View">
                    <ExternalLink size={14} />
                  </a>
                  <button onClick={() => handleDelete(doc._id)} className="btn-outline" style={{ padding: '6px', color: '#ff4d4d' }} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>No documents saved yet.</p>
          )}
        </div>
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
                style={{ padding: '8px', background: 'var(--glass-bg)', borderRadius: '50%' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
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
