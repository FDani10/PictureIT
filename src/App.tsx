import { useState, useRef, type ChangeEvent, type DragEvent, useEffect } from 'react';
import './App.css';
import logo from './assets/logo.png';

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

export default function PictureIT() {
  const [activeTool, setActiveTool] = useState('adjust');
  
  // --- KÉPSZERKESZTŐ ÁLLAPOTOK ---
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [hueRotate, setHueRotate] = useState(0);
  const [invert, setInvert] = useState(0);
  
  const [texts, setTexts] = useState<TextOverlay[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Figyelmeztetés oldalfrissítés/bezárás esetén, ha van feltöltött kép
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (image) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [image]);

  const Icons = {
    adjust: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
    text: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>,
    filter: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
  };

  // Közös CSS szűrő string az összes létező értékkel
  const imageFilterStyle = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px) grayscale(${grayscale}%) sepia(${sepia}%) hue-rotate(${hueRotate}deg) invert(${invert}%)`;

  // --- KÉP FELTÖLTÉS LOGIKA ---
  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const imgUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          let {width,height} = img;
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;

          // Ha a kép nagyobb, mint a megengedett maximum...
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const ctx = tempCanvas.getContext('2d');
            
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const resizedDataUrl = tempCanvas.toDataURL(file.type);
              setImage(resizedDataUrl);
            }
          } else {
            setImage(imgUrl);
          }
          setTexts([]);
          applyPreset(100, 100, 100, 0, 0, 0, 0, 0); 
        };
        
        img.src = imgUrl;
      };
      
      reader.readAsDataURL(file);
    } else {
      alert("Kérlek, csak képformátumot tölts fel!");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
    e.target.value = ''; 
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  // --- SZÖVEG KEZELÉS ---
  const handleAddText = () => {
    setTexts([...texts, { id: Date.now().toString(), text: 'Új Szöveg', x: 50, y: 50, size: 40, color: '#ffffff' }]);
  };
  const updateText = (id: string, field: keyof TextOverlay, value: string | number) => {
    setTexts(texts.map(t => t.id === id ? { ...t, [field]: value } : t));
  };
  const deleteText = (id: string) => setTexts(texts.filter(t => t.id !== id));

  // --- EXPORTÁLÁS LOGIKA ---
  const handleExport = () => {
    if (!image) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imgObj = new Image();
    
    imgObj.onload = () => {
      canvas.width = imgObj.width; canvas.height = imgObj.height;
      if (ctx) {
        ctx.filter = imageFilterStyle;
        ctx.drawImage(imgObj, 0, 0);
        ctx.filter = 'none'; 
        texts.forEach(t => {
          const actualX = (t.x / 100) * canvas.width;
          const actualY = (t.y / 100) * canvas.height;
          ctx.font = `bold ${t.size}px Arial`; ctx.fillStyle = t.color;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 6;
          ctx.fillText(t.text, actualX, actualY);
        });
      }
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'PictureIT-szerkesztett.png';
        link.href = url;
        
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000); 
      }, 'image/png', 1.0);
    };
    
    imgObj.src = image;
  };

  // --- GYORS FILTEREK BEÁLLÍTÁSA ---
  const applyPreset = (b: number, c: number, s: number, bl: number, g: number, sp: number, h: number, i: number) => {
    setBrightness(b); setContrast(c); setSaturation(s); setBlur(bl);
    setGrayscale(g); setSepia(sp); setHueRotate(h); setInvert(i);
  };

  const presetBtnStyle = {
    backgroundColor: 'var(--bg-hover)', color: 'var(--text-main)', border: '1px solid var(--border)',
    padding: '12px', borderRadius: '6px', cursor: 'pointer', textAlign: 'center' as const,
    fontWeight: 'bold', fontSize: '0.85rem', transition: 'background 0.2s'
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand"><img src={logo} alt="PictureIT"/></div>
        <div className="header-actions">
          {image && (
            <button onClick={() => { setImage(null); applyPreset(100, 100, 100, 0, 0, 0, 0, 0); }} style={{ marginRight: '10px', backgroundColor: '#333', color: 'white' }}>
              Bezárás
            </button>
          )}
          <button onClick={handleExport}>Exportálás</button>
        </div>
      </header>

      <main className="app-workspace">
        <aside className="toolbar-left">
          <button className={`tool-btn ${activeTool === 'adjust' ? 'active' : ''}`} onClick={() => setActiveTool('adjust')} title="Beállítások">{Icons.adjust}</button>
          <button className={`tool-btn ${activeTool === 'filter' ? 'active' : ''}`} onClick={() => setActiveTool('filter')} title="Filterek">{Icons.filter}</button>
          <button className={`tool-btn ${activeTool === 'text' ? 'active' : ''}`} onClick={() => setActiveTool('text')} title="Szöveg">{Icons.text}</button>
        </aside>

        <section className="canvas-area">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />

          {!image ? (
            <div className={`placeholder-image ${isDragOver ? 'drag-over' : ''}`} onClick={() => fileInputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ marginBottom: '16px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              <p>Húzz ide egy képet, vagy kattints a feltöltéshez</p>
            </div>
          ) : (
            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '90%', maxHeight: '90%' }}>
              <img src={image} alt="Szerkesztés alatt" style={{ filter: imageFilterStyle, display: 'block', maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
              {texts.map(t => (
                <div key={t.id} style={{ position: 'absolute', top: `${t.y}%`, left: `${t.x}%`, transform: 'translate(-50%, -50%)', color: t.color, fontSize: `${t.size}px`, fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                  {t.text}
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="properties-panel">
          
          {/* --- RÉSZLETES BEÁLLÍTÁSOK FÜL --- */}
          {activeTool === 'adjust' && (
            <>
              <div className="panel-section">
                <h3>Megvilágítás</h3>
                <div className="slider-group"><div className="slider-header"><span>Fényerő</span><span>{brightness}%</span></div><input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} /></div>
                <div className="slider-group"><div className="slider-header"><span>Kontraszt</span><span>{contrast}%</span></div><input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} /></div>
              </div>
              <div className="panel-section">
                <h3>Színek</h3>
                <div className="slider-group"><div className="slider-header"><span>Telítettség</span><span>{saturation}%</span></div><input type="range" min="0" max="200" value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} /></div>
                <div className="slider-group"><div className="slider-header"><span>Fekete-Fehér</span><span>{grayscale}%</span></div><input type="range" min="0" max="100" value={grayscale} onChange={(e) => setGrayscale(Number(e.target.value))} /></div>
                <div className="slider-group"><div className="slider-header"><span>Szépia</span><span>{sepia}%</span></div><input type="range" min="0" max="100" value={sepia} onChange={(e) => setSepia(Number(e.target.value))} /></div>
                <div className="slider-group"><div className="slider-header"><span>Színeltolás</span><span>{hueRotate}°</span></div><input type="range" min="0" max="360" value={hueRotate} onChange={(e) => setHueRotate(Number(e.target.value))} /></div>
              </div>
              <div className="panel-section">
                <h3>Effektek</h3>
                <div className="slider-group"><div className="slider-header"><span>Életlenítés</span><span>{blur}px</span></div><input type="range" min="0" max="20" value={blur} onChange={(e) => setBlur(Number(e.target.value))} /></div>
                <div className="slider-group"><div className="slider-header"><span>Invertálás</span><span>{invert}%</span></div><input type="range" min="0" max="100" value={invert} onChange={(e) => setInvert(Number(e.target.value))} /></div>
              </div>
            </>
          )}

          {/* --- GYORS FILTEREK FÜL --- */}
          {activeTool === 'filter' && (
            <div className="panel-section">
              <h3>Gyors Filterek</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '16px' }}>Válassz egyet a 10 előre beállított stílus közül!</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button onClick={() => applyPreset(100, 100, 100, 0, 0, 0, 0, 0)} style={presetBtnStyle}>Eredeti</button>
                <button onClick={() => applyPreset(110, 110, 130, 0, 0, 0, 0, 0)} style={presetBtnStyle}>Nyár</button>
                <button onClick={() => applyPreset(90, 150, 80, 0, 0, 0, 0, 0)} style={presetBtnStyle}>Drámai</button>
                <button onClick={() => applyPreset(110, 85, 70, 0, 0, 40, 0, 0)} style={presetBtnStyle}>Vintage</button>
                <button onClick={() => applyPreset(100, 120, 100, 0, 100, 0, 0, 0)} style={presetBtnStyle}>Fekete-Fehér</button>
                <button onClick={() => applyPreset(100, 100, 100, 0, 0, 100, 0, 0)} style={presetBtnStyle}>Szépia</button>
                <button onClick={() => applyPreset(100, 120, 150, 0, 0, 0, 280, 0)} style={presetBtnStyle}>Cyberpunk</button>
                <button onClick={() => applyPreset(120, 90, 110, 2, 0, 10, 0, 0)} style={presetBtnStyle}>Álomszerű</button>
                <button onClick={() => applyPreset(100, 110, 120, 0, 0, 0, 180, 0)} style={presetBtnStyle}>Hűvös (Tél)</button>
                <button onClick={() => applyPreset(70, 120, 90, 0, 0, 0, 0, 0)} style={presetBtnStyle}>Éjszaka</button>
              </div>
            </div>
          )}

          {/* --- SZÖVEG FÜL --- */}
          {activeTool === 'text' && (
            <div className="panel-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Szövegek ({texts.length})</h3>
                <button onClick={handleAddText} style={{ backgroundColor: 'var(--accent)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+ Új</button>
              </div>
              {texts.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>Kattints az "+ Új" gombra szöveg hozzáadásához.</p>}
              {texts.map((t) => (
                <div key={t.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ marginBottom: '12px' }}><label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Szöveg tartalma:</label><input type="text" value={t.text} onChange={(e) => updateText(t.id, 'text', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-app)', color: 'white', boxSizing: 'border-box' }} /></div>
                  <div className="slider-group"><div className="slider-header"><span>Méret</span><span>{t.size}px</span></div><input type="range" min="10" max="150" value={t.size} onChange={(e) => updateText(t.id, 'size', Number(e.target.value))} /></div>
                  <div className="slider-group"><div className="slider-header"><span>Vízszintes (X)</span><span>{t.x}%</span></div><input type="range" min="0" max="100" value={t.x} onChange={(e) => updateText(t.id, 'x', Number(e.target.value))} /></div>
                  <div className="slider-group"><div className="slider-header"><span>Függőleges (Y)</span><span>{t.y}%</span></div><input type="range" min="0" max="100" value={t.y} onChange={(e) => updateText(t.id, 'y', Number(e.target.value))} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Szín:</span><input type="color" value={t.color} onChange={(e) => updateText(t.id, 'color', e.target.value)} style={{ cursor: 'pointer', border: 'none', padding: 0, width: '24px', height: '24px', borderRadius: '4px', backgroundColor: 'transparent' }} /></div>
                    <button onClick={() => deleteText(t.id)} style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Törlés</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}