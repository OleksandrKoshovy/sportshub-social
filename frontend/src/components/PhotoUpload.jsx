import React, { useRef, useState } from 'react';
import { uploadService } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function PhotoUpload({ eventId, onUploaded }) {
  const inputRef = useRef(null);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [dragOver, setDragOver]   = useState(false);

  const handleFile = async (file) => {
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Só são aceites ficheiros JPG, PNG e WEBP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('O ficheiro não pode ultrapassar 10MB.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Simular progresso enquanto o upload decorre
      const progressInterval = setInterval(() => {
        setProgress(p => Math.min(p + 10, 90));
      }, 150);

      const { data } = await uploadService.eventPhoto(eventId, file);

      clearInterval(progressInterval);
      setProgress(100);

      toast.success('Foto carregada para o Azure Blob Storage!');
      onUploaded?.(data.url);

      setTimeout(() => { setProgress(0); setUploading(false); }, 800);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao carregar a foto.');
      setUploading(false);
      setProgress(0);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        className={`upload-zone ${dragOver ? 'dov' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div style={{ fontSize: 34, marginBottom: 8 }}>📷</div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 3 }}>
          {uploading ? 'A carregar...' : 'Clica ou arrasta a foto aqui'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--t3)' }}>JPG, PNG, WEBP · máx 10MB</div>
      </div>

      {/* Barra de progresso */}
      {uploading && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 5 }}>
            A enviar para Azure Blob Storage... {progress}%
          </div>
          <div style={{ height: 5, background: 'var(--s3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: 'var(--g)', borderRadius: 3,
              width: `${progress}%`, transition: 'width 0.15s',
            }} />
          </div>
        </div>
      )}

      {/* Input escondido */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}
