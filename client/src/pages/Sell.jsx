import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';

const CATS = ['books', 'electronics', 'furniture', 'clothing', 'cycles', 'other'];
const CONDS = ['new', 'like-new', 'good', 'fair'];

export default function Sell() {
  const nav = useNavigate();
  const fileInputRef = useRef(null);
  const [f, setF] = useState({ title: '', description: '', category: 'books', condition: 'good', price: '' });
  const [fileData, setFileData] = useState(null); // { name, size, previewUrl, serverUrl }
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const msg = (k) => error?.fields?.find((x) => x.field === k || (k === 'image' && x.field.startsWith('images')))?.message;

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError({ message: 'Please select an image file (PNG, JPG, WebP, etc.).' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError({ message: 'File is too large. Please select an image under 10MB.' });
      return;
    }

    setError(null);
    setUploading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target.result;
      setFileData({
        name: file.name || 'uploaded_image.png',
        size: file.size,
        previewUrl: base64Data,
        serverUrl: null,
      });

      try {
        const res = await api('/upload', {
          method: 'POST',
          body: { data: base64Data, name: file.name || 'uploaded_image.png' },
        });
        setFileData((prev) => (prev ? { ...prev, serverUrl: res.url } : null));
      } catch (err) {
        console.warn('Image upload endpoint error, fallback to data url:', err);
        setFileData((prev) => (prev ? { ...prev, serverUrl: base64Data } : null));
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => {
      setError({ message: 'Failed to read image file.' });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragover' || e.type === 'dragenter') {
      setDragging(true);
    } else if (e.type === 'dragleave') {
      setDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Support pasting image from clipboard
  useEffect(() => {
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) handleFile(file);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const removePhoto = () => {
    setFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  async function submit(e) {
    e.preventDefault();
    setError(null);

    const finalImage = fileData?.serverUrl || fileData?.previewUrl;

    if (!finalImage) {
      setError({ message: 'Photo is required. Please upload a photo of the item you want to sell.' });
      return;
    }

    if (uploading) {
      setError({ message: 'Please wait for the image upload to complete.' });
      return;
    }

    setBusy(true);
    try {
      const { item } = await api('/items', {
        method: 'POST',
        body: {
          ...f,
          price: Number(f.price),
          images: [finalImage],
        },
      });
      nav(`/items/${item._id}`);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card narrow wide" onSubmit={submit}>
      <h1>Sell something</h1>

      <label>
        Title
        <input value={f.title} onChange={set('title')} placeholder="e.g. Hero Sprint cycle, CLRS book..." required />
        {msg('title') && <small className="err">{msg('title')}</small>}
      </label>

      <label>
        Description (optional)
        <textarea rows="3" value={f.description} onChange={set('description')} placeholder="State the item's condition, age, reasons for selling..." />
      </label>

      <div className="two">
        <label>
          Category
          <select value={f.category} onChange={set('category')}>
            {CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>
          Condition
          <select value={f.condition} onChange={set('condition')}>
            {CONDS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <label>
        Price in ₹
        <input type="number" min="1" value={f.price} onChange={set('price')} placeholder="e.g. 500" required />
        {msg('price') && <small className="err">{msg('price')}</small>}
      </label>

      {/* Image Upload Section - Upload Only */}
      <div className="upload-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            Item Photo <span style={{ color: 'var(--bad)' }}>*</span>
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Upload required</span>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {!fileData ? (
          <div
            className={`upload-dropzone ${dragging ? 'dragging' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDrag}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
          >
            <div className="upload-icon">📸</div>
            <strong>Click or drag &amp; drop item photo here</strong>
            <span className="upload-hint">PNG, JPG, WebP up to 10MB (or paste with Ctrl+V)</span>
          </div>
        ) : (
          <div className="upload-preview-box">
            <img src={fileData.previewUrl} alt="Item preview" className="upload-thumb" />
            <div className="upload-info">
              <span className="upload-filename">{fileData.name}</span>
              <span className="upload-hint">{formatSize(fileData.size)}</span>
              <span className="upload-status">
                {uploading ? 'Uploading photo…' : '✓ Photo uploaded and ready'}
              </span>
              <div className="upload-actions">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  Change photo
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={removePhoto}
                  disabled={uploading}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {msg('image') && <small className="err">{msg('image')}</small>}
      </div>

      {error && !error.fields && <p className="err" role="alert">{error.message}</p>}

      <button className="btn" disabled={busy || uploading} style={{ marginTop: '0.6rem' }}>
        {busy ? 'Listing item…' : uploading ? 'Uploading photo…' : 'List item'}
      </button>
    </form>
  );
}
