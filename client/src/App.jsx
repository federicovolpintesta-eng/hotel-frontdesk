const API_URL = import.meta.env.VITE_API_URL || 'https://caosfrontdesk-backend.onrender.com';
import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import HRDashboard from './components/HRDashboard';

const socket = io(API_URL);

function App() {
  const [roomCode, setRoomCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [joined, setJoined] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const [activeSituation, setActiveSituation] = useState(null);
  const [textAnswer, setTextAnswer] = useState('');
  
  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  
  const [charName, setCharName] = useState('');
  const [charRole, setCharRole] = useState('Recepcionista');
  const [charAvatar, setCharAvatar] = useState('/images/avatar_1_1780765140900.png');
  const [gameMode, setGameMode] = useState('Individual');
  const [difficulty, setDifficulty] = useState('normal');
  const [capsules, setCapsules] = useState([]);
  
  const [currentView, setCurrentView] = useState('assessment'); // 'assessment' | 'b2b_login' | 'dashboard'
  const [b2bPremium, setB2bPremium] = useState(() => localStorage.getItem('b2b_premium') === 'true');
  
  // HR State
  const [hrEmail, setHrEmail] = useState('');
  const [hrPassword, setHrPassword] = useState('');
  const [hrToken, setHrToken] = useState(() => localStorage.getItem('hr_token') || null);
  const [hrEvaluations, setHrEvaluations] = useState([]);
  const [hrLoginError, setHrLoginError] = useState('');
  const [brandConfig, setBrandConfig] = useState(null);

  useEffect(() => {
    socket.on('room_state_update', (state) => {
      setGameState(state);
      const me = state.players.find(p => p.id === socket.id);
      if (me) setMyPlayer(me);
    });
    return () => socket.off('room_state_update');
  }, []);

  const [hasValidInvite, setHasValidInvite] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const validateInvite = (uuidStr) => {
    let uuid = uuidStr;
    try {
      if (uuidStr.includes('http')) {
        const url = new URL(uuidStr);
        uuid = url.searchParams.get('invite') || uuidStr;
      }
    } catch(e) {}

    fetch(`${API_URL}/api/hr/invite/${uuid}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setHasValidInvite(true);
          setCharName(data.nombre);
          setCharRole(data.rol);
          if (data.brand_color) {
             setBrandConfig({ color: data.brand_color, logo: data.logo_url });
             document.documentElement.style.setProperty('--brand-primary', data.brand_color);
          }
          
          fetch(`${API_URL}/api/hr/invite/${uuid}/capsules`)
            .then(res => res.json())
            .then(caps => setCapsules(caps || []))
            .catch(console.error);
        } else {
          alert('Código de invitación inválido o caducado.');
        }
      })
      .catch(() => alert('Error validando el código de invitación.'));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteUuid = params.get('invite');
    if (inviteUuid) {
      validateInvite(inviteUuid);
    }
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (charName.trim()) {
      socket.emit('join_room', { 
        roomCode, 
        gameMode,
        difficulty,
        character: { name: charName, role: charRole, avatar: charAvatar }
      });
      setJoined(true);
    }
  };

  const handleStartGame = () => socket.emit('start_game', roomCode);
  const handleRestartGame = () => {
    setActiveSituation(null);
    socket.emit('restart_game', roomCode);
  };
  const handleLeaveRoom = () => {
    window.location.reload();
  };
  const handleNextTurn = () => socket.emit('next_turn', roomCode);
  const handleForceEndTurn = () => socket.emit('force_end_turn', roomCode);

  const handleHRLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hr/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: hrEmail, password: hrPassword })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('hr_token', data.token);
        setHrToken(data.token);
        setCurrentView('dashboard');
        fetchHREvaluations(data.token);
        setHrLoginError('');
      } else {
        setHrLoginError(data.error);
      }
    } catch (err) {
      setHrLoginError('Error de conexión con el servidor');
    }
  };

  const fetchHREvaluations = async (token) => {
    try {
      const res = await fetch(`${API_URL}/api/hr/evaluaciones`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setHrEvaluations(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentView === 'dashboard' && hrToken) {
      fetchHREvaluations(hrToken);
    }
  }, [currentView, hrToken]);

  const openSituation = (card, department) => {
    if (myPlayer && !card.resolved && gameState?.gameState?.phase === 'check_in') {
      setActiveSituation({ ...card, department });
      setTextAnswer('');
    }
  };

  const handleResolveSituation = async (optionId) => {
    let finalAudioBase64 = null;
    if (audioBlob) {
      finalAudioBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(audioBlob);
      });
    }

    socket.emit('resolve_situation', { 
      roomCode, 
      cardInstanceId: activeSituation.instanceId, 
      department: activeSituation.department, 
      optionId,
      textAnswer,
      audioBase64: finalAudioBase64
    });
    setActiveSituation(null);
    setTextAnswer('');
    setAudioBlob(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTextAnswer(''); // Clear previous text
      
      // Init SpeechRecognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'es-ES';
        
        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setTextAnswer(prev => prev + ' ' + finalTranscript);
          }
        };
        recognitionRef.current.start();
      }

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("No se pudo acceder al micrófono.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const handleDelegate = (toDepartment) => {
    socket.emit('delegate_situation', {
      roomCode,
      cardInstanceId: activeSituation.instanceId,
      fromDepartment: activeSituation.department,
      toDepartment
    });
    setActiveSituation(null);
  };

  const handleSimulateStripe = () => {
    setTimeout(() => {
      localStorage.setItem('b2b_premium', 'true');
      setB2bPremium(true);
    }, 1500);
  };

  // --- VIEWS ---

  if (currentView === 'b2b_login') {
    return (
      <div className="hero-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '40px', textAlign: 'center' }}>
          
          {brandConfig && brandConfig.logo ? (
            <img src={brandConfig.logo} alt="Logo" style={{ maxHeight: '80px', marginBottom: '20px' }} onError={(e) => e.target.style.display = 'none'} />
          ) : (
            <Icons.Hotel size={48} style={{ color: 'var(--brand-primary)', marginBottom: '20px' }} />
          )}
          
          <h2 style={{ color: 'var(--bg-header)', marginBottom: '30px' }}>Acceso Corporativo</h2>
          {hrLoginError && <div style={{ color: 'red', marginBottom: '16px' }}>{hrLoginError}</div>}
          <input type="text" className="input-corp" placeholder="Email corporativo (ej. rrhh@boutique.com)" style={{ marginBottom: '16px' }} value={hrEmail} onChange={e => setHrEmail(e.target.value)} />
          <input type="password" className="input-corp" placeholder="Contraseña (password)" style={{ marginBottom: '24px' }} value={hrPassword} onChange={e => setHrPassword(e.target.value)} />
          <button className="btn btn-primary" style={{ width: '100%', padding: '16px' }} onClick={handleHRLogin}>Ingresar</button>
          <button className="btn btn-outline" style={{ width: '100%', marginTop: '16px' }} onClick={() => setCurrentView('assessment')}>Volver al Simulador</button>
        </div>
      </div>
    );
  }

  if (currentView === 'dashboard') {
    return <HRDashboard hrToken={hrToken} onLogout={() => { localStorage.removeItem('hr_token'); setHrToken(null); setCurrentView('assessment'); }} />;
  }

  if (currentView === 'assessment') {
    if (!joined) {
      return (
        <div className="hero-bg" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
          <button 
            style={{ position: 'absolute', top: '20px', right: '30px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, zIndex: 20 }}
            onClick={() => setCurrentView('b2b_login')}
          >
            Acceso RRHH (Empresas)
          </button>
          
          <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', padding: '50px', position: 'relative', zIndex: 10 }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              {brandConfig && brandConfig.logo ? (
                <img src={brandConfig.logo} alt="Logo" style={{ maxHeight: '100px', marginBottom: '16px' }} onError={(e) => e.target.style.display = 'none'} />
              ) : (
                <>
                  <div style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '24px', 
                    marginBottom: '24px',
                    backgroundColor: 'white',
                    padding: '16px 32px',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                  }}>
                    <img src="/images/los-pinos.png" alt="Los Pinos" style={{ height: '70px', objectFit: 'contain' }} />
                    <div style={{ width: '1px', height: '50px', backgroundColor: '#e2e8f0' }}></div>
                    <img src="/images/tremun.jpeg" alt="Tremun" style={{ height: '45px', objectFit: 'contain' }} />
                  </div>
                  <h1 className="serif" style={{ fontSize: '2.5rem', color: 'var(--text-main)', margin: '0 0 12px 0' }}>Portal de Entrenamiento</h1>
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Simulador de gestión hotelera premium</p>
                </>
              )}
            </div>
            
            {!hasValidInvite ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <h3 className="serif" style={{ color: 'var(--text-main)', fontSize: '1.8rem', marginBottom: '16px' }}>Acceso con Invitación</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '1.1rem' }}>Por favor, introduce tu código seguro de evaluación proporcionado por Recursos Humanos. Esto garantiza que tu progreso se guarde correctamente en tu legajo.</p>
                <div style={{ display: 'flex', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
                  <input 
                    type="text" 
                    className="input-corp" 
                    placeholder="Ej. 123e4567-e89b-..." 
                    value={inviteCode} 
                    onChange={e => setInviteCode(e.target.value)} 
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-primary" onClick={() => validateInvite(inviteCode)} style={{ padding: '0 24px', borderRadius: '8px' }}>Validar</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Candidato</label>
                    <input 
                      type="text" 
                      className="input-corp" 
                      value={charName}
                      disabled
                      style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'var(--text-main)' }}
                    />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Rol a Evaluar</label>
                    <input 
                      type="text" 
                      className="input-corp" 
                      value={charRole}
                      disabled
                      style={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'var(--text-main)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: 'rgba(72, 187, 120, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(72, 187, 120, 0.3)' }}>
                  <Icons.ShieldCheck size={24} color="#38A169" />
                  <span style={{ fontSize: '0.95rem', color: '#276749', fontWeight: 600 }}>Identidad verificada exitosamente a través del enlace de RRHH.</span>
                </div>

                <div>
                  <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>Nivel de Dificultad</label>
                  <select 
                    className="input-corp" 
                    value={difficulty} 
                    onChange={e => setDifficulty(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.8)' }}
                  >
                    <option value="easy">Modo Formativo (Fácil)</option>
                    <option value="normal">Desempeño Estándar (Normal)</option>
                    <option value="hard">Simulación de Crisis (Difícil)</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-gold" style={{ marginTop: '16px', padding: '18px', fontSize: '1.2rem', borderRadius: '8px', width: '100%' }}>Comenzar Evaluación</button>
              </form>
            )}
          </div>

          {capsules && capsules.length > 0 && (
            <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', padding: '40px', marginTop: '24px', position: 'relative', zIndex: 10, borderLeft: '6px solid #F6E05E' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Icons.BookOpen size={32} color="#D69E2E" />
                <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.8rem' }}>Mi Centro de Entrenamiento</h2>
              </div>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Basado en tus evaluaciones anteriores, hemos preparado estas cápsulas formativas para tu desarrollo:</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {capsules.map(cap => (
                  <div key={cap.id} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ margin: '0 0 12px 0', color: '#2B6CB0', fontSize: '1.2rem' }}>{cap.title}</h3>
                    <p style={{ margin: 0, color: '#4A5568', lineHeight: '1.6' }}>{cap.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  const renderActiveCard = (department) => {
    const list = gameState?.gameState?.departments[department] || [];
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {list.map(card => {
          const isResolved = card.resolved;
          const IconComponent = Icons[card.icon || 'AlertTriangle'] || Icons.AlertTriangle;
          
          const isBlackSwan = card.id === 'cisne-negro';
          
          return (
            <motion.div 
              key={card.instanceId} 
              initial={{ opacity: 0, y: 20 }} 
              animate={
                isBlackSwan && !isResolved 
                  ? { opacity: 1, y: 0, scale: [1, 1.02, 1], boxShadow: ["0 4px 6px rgba(0,0,0,0.2)", "0 0 25px rgba(229, 62, 62, 0.6)", "0 4px 6px rgba(0,0,0,0.2)"] } 
                  : { opacity: isResolved ? 0.85 : 1, y: 0 }
              } 
              transition={
                isBlackSwan && !isResolved 
                  ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" } 
                  : { duration: 0.3 }
              } 
              style={{ backgroundColor: isResolved ? '#1E293B' : (isBlackSwan ? 'rgba(254, 215, 215, 0.1)' : 'var(--bg-card)'), border: isResolved ? '1px solid #10B981' : (isBlackSwan ? '2px solid #E53E3E' : '1px solid var(--border-color)'), borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ backgroundColor: isResolved ? '#9AE6B4' : (isBlackSwan ? 'rgba(229, 62, 62, 0.2)' : '#EBF4FF'), padding: '16px', borderRadius: '12px', color: isResolved ? '#276749' : (isBlackSwan ? '#FC8181' : '#3182CE') }}>
                  {isResolved ? <Icons.CheckCircle size={32} /> : <IconComponent size={32} />}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.2rem', margin: '0 0 8px 0', color: isResolved ? '#48BB78' : 'var(--text-main)' }}>{card.title}</h4>
                  <p style={{ fontSize: '1rem', color: isResolved ? '#38A169' : 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>{card.description}</p>
                </div>
              </div>
              
              {!isResolved && (
                <div style={{ marginTop: '24px', textAlign: 'right' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ padding: '10px 24px', fontSize: '1rem', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    onClick={() => openSituation(card, department)}
                  >
                    <Icons.Play size={18} /> Resolver
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderMetricsBars = (metrics, totalAnswered) => {
    if (totalAnswered === 0) return <div>No hay datos suficientes.</div>;
    const maxScore = totalAnswered * 100;
    const resPct = Math.round((metrics.resolution / maxScore) * 100);
    const anaPct = Math.round((metrics.analysis / maxScore) * 100);
    const empPct = Math.round((metrics.empathy / maxScore) * 100);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', marginBottom: '8px', fontWeight: 600 }}>
            <span>Resolución de Problemas</span><span>{resPct}%</span>
          </div>
          <div style={{ height: '12px', backgroundColor: '#EDF2F7', borderRadius: '6px' }}>
            <div style={{ height: '100%', width: `${resPct}%`, backgroundColor: '#4299E1', borderRadius: '6px' }}></div>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', marginBottom: '8px', fontWeight: 600 }}>
            <span>Análisis Crítico</span><span>{anaPct}%</span>
          </div>
          <div style={{ height: '12px', backgroundColor: '#EDF2F7', borderRadius: '6px' }}>
            <div style={{ height: '100%', width: `${anaPct}%`, backgroundColor: '#9F7AEA', borderRadius: '6px' }}></div>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', marginBottom: '8px', fontWeight: 600 }}>
            <span>Empatía y Servicio</span><span>{empPct}%</span>
          </div>
          <div style={{ height: '12px', backgroundColor: '#EDF2F7', borderRadius: '6px' }}>
            <div style={{ height: '100%', width: `${empPct}%`, backgroundColor: '#48BB78', borderRadius: '6px' }}></div>
          </div>
        </div>
      </div>
    );
  };

  const renderFeedbackReport = () => {
    const feedbacks = myPlayer?.feedbacks || [];
    if (feedbacks.length === 0) return null;

    // Separate into positives and areas of improvement based on effectiveness
    let strengths = feedbacks.filter(f => f.effectiveness >= 80);
    let weaknesses = feedbacks.filter(f => f.effectiveness <= 40);

    // Deduplicate to avoid repeating the same text if the user answered identical things
    const uniqueStrengthsMap = new Map();
    strengths.forEach(f => uniqueStrengthsMap.set(f.feedback, f));
    strengths = Array.from(uniqueStrengthsMap.values()).slice(0, 4);

    const uniqueWeaknessesMap = new Map();
    weaknesses.forEach(f => uniqueWeaknessesMap.set(f.feedback, f));
    weaknesses = Array.from(uniqueWeaknessesMap.values()).slice(0, 4);

    return (
      <div style={{ marginTop: '30px', textAlign: 'left' }}>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '20px', borderBottom: '2px solid #E2E8F0', paddingBottom: '10px' }}>Feedback Cualitativo</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ backgroundColor: '#F0FFF4', padding: '20px', borderRadius: '8px', border: '1px solid #C6F6D5' }}>
            <h4 style={{ color: '#2F855A', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.TrendingUp size={20} /> Principales Aciertos
            </h4>
            {strengths.length > 0 ? strengths.map((f, i) => (
              <div key={i} style={{ marginBottom: '16px', fontSize: '0.95rem', backgroundColor: 'white', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #38A169', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ margin: '0 0 8px 0', color: '#4A5568', fontStyle: 'italic' }}><strong>Situación:</strong> {f.question}</p>
                <p style={{ margin: '0 0 8px 0', color: '#2D3748' }}><strong>Tú decidiste:</strong> {f.choice}</p>
                <p style={{ margin: 0, color: '#276749', fontWeight: 600 }}>✓ Análisis: {f.feedback}</p>
              </div>
            )) : <p style={{ margin: 0, color: '#276749' }}>No destacaste en ninguna decisión clave.</p>}
          </div>

          <div style={{ backgroundColor: '#FFF5F5', padding: '20px', borderRadius: '8px', border: '1px solid #FED7D7' }}>
            <h4 style={{ color: '#C53030', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.AlertOctagon size={20} /> Áreas de Mejora Críticas
            </h4>
            {weaknesses.length > 0 ? weaknesses.map((f, i) => (
              <div key={i} style={{ marginBottom: '16px', fontSize: '0.95rem', backgroundColor: 'white', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #E53E3E', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ margin: '0 0 8px 0', color: '#4A5568', fontStyle: 'italic' }}><strong>Situación:</strong> {f.question}</p>
                <p style={{ margin: '0 0 8px 0', color: '#2D3748' }}><strong>Tú decidiste:</strong> {f.choice}</p>
                <p style={{ margin: 0, color: '#9B2C2C', fontWeight: 600 }}>⚠ Análisis: {f.feedback}</p>
              </div>
            )) : <p style={{ margin: 0, color: '#9B2C2C' }}>Excelente desempeño, sin errores críticos.</p>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container" style={{ backgroundColor: 'var(--bg-main)' }}>
      <header style={{ backgroundColor: 'white', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
        <div className="serif" style={{ fontSize: '1.6rem', color: 'var(--bg-header)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <img src="/images/los-pinos.png" alt="Los Pinos" style={{ height: '45px', objectFit: 'contain' }} />
          <div style={{ width: '1px', height: '30px', backgroundColor: '#e2e8f0' }}></div>
          <img src="/images/tremun.jpeg" alt="Tremun" style={{ height: '32px', objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evaluación Activa</div>
          <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '40px', color: 'var(--text-main)' }}>Día Operativo: <strong className="serif" style={{ fontSize: '1.4rem', color: 'var(--brand-primary)' }}>{gameState?.gameState?.turn || 1}/5</strong></div>
          {gameState?.gameState?.phase === 'game_over' && (
            <div style={{ padding: '8px 20px', borderRadius: '30px', border: '1px solid var(--border-color)', backgroundColor: '#F8FAFC' }}>
              NPS Global: <strong style={{ color: (gameState?.gameState?.nps || 0) < 50 ? 'var(--status-bad)' : 'var(--status-good)', fontSize: '1.2rem', marginLeft: '8px' }}>{gameState?.gameState?.nps || 75}</strong>
            </div>
          )}
        </div>
      </header>

      {/* Situation Modal */}
      {activeSituation && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4, ease: "easeOut" }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 15, 25, 0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="hotel-card" style={{ width: '100%', maxWidth: '800px', padding: '50px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 className="serif" style={{ fontSize: '2.2rem', color: 'var(--bg-header)', margin: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
                   <Icons.Activity size={32} color="var(--brand-primary)"/> Cuestionario Situacional
                </h2>
                <span style={{ border: '1px solid var(--brand-primary)', color: 'var(--brand-primary)', padding: '6px 16px', borderRadius: '30px', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{activeSituation.department}</span>
              </div>
            
            <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '32px', borderRadius: '16px', marginBottom: '40px', border: '1px solid var(--border-color)' }}>
              <p style={{ fontSize: '1.25rem', color: 'var(--text-main)', margin: 0, lineHeight: '1.7' }}>{activeSituation.description}</p>
            </div>
            
            <h4 style={{ marginBottom: '20px', color: 'var(--text-muted)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>¿Qué harías en esta situación?</h4>
            
            {activeSituation.isAudioResponse ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '40px', borderRadius: '16px', border: '1px dashed var(--brand-primary)' }}>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-main)', textAlign: 'center' }}>
                  Esta es una situación crítica. Debes responder usando el micrófono o escribiendo tu respuesta libre. No hay opciones correctas pre-armadas.
                </div>
                {audioBlob ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', width: '100%' }}>
                    <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', width: '100%', color: 'white', minHeight: '60px' }}>
                      <strong>Transcripción:</strong> {textAnswer || "No se detectó voz. Puedes escribir abajo."}
                    </div>
                    <textarea 
                      value={textAnswer}
                      onChange={e => setTextAnswer(e.target.value)}
                      placeholder="Edita tu respuesta aquí si la transcripción falló..."
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', minHeight: '80px', fontSize: '1rem', fontFamily: 'inherit', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                    />
                    <audio src={URL.createObjectURL(audioBlob)} controls style={{ width: '100%' }} />
                    <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
                      <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setAudioBlob(null); setTextAnswer(''); }}>
                        Descartar y Volver a Grabar
                      </button>
                      <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleResolveSituation(null)} disabled={textAnswer.trim().length < 5}>
                        Enviar Respuesta
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button 
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onMouseLeave={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                      style={{
                        width: '120px', height: '120px', borderRadius: '50%', border: 'none',
                        backgroundColor: isRecording ? '#E53E3E' : 'var(--brand-primary)',
                        color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                        cursor: 'pointer', transform: isRecording ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s',
                        boxShadow: isRecording ? '0 0 30px rgba(229, 62, 62, 0.6)' : '0 10px 25px rgba(197, 160, 89, 0.3)'
                      }}
                    >
                      <Icons.Mic size={40} style={{ marginBottom: '8px' }} />
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold', userSelect: 'none' }}>{isRecording ? 'Grabando...' : 'Mantener para Hablar'}</span>
                    </button>
                    
                    <p style={{ color: 'var(--text-muted)' }}>O si no tienes micrófono:</p>
                    <textarea 
                      value={textAnswer}
                      onChange={e => setTextAnswer(e.target.value)}
                      placeholder="Escribe tu respuesta libre aquí..."
                      style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', minHeight: '100px', fontSize: '1rem', fontFamily: 'inherit', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                    />
                    {textAnswer.trim().length >= 5 && (
                      <button className="btn btn-primary" onClick={() => handleResolveSituation(null)}>
                        Enviar Respuesta Escrita
                      </button>
                    )}
                  </>
                )}
              </div>
            ) : activeSituation.isOpenEnded ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <textarea 
                  value={textAnswer}
                  onChange={e => setTextAnswer(e.target.value)}
                  placeholder="Escribe tu respuesta aquí..."
                  style={{ width: '100%', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', minHeight: '120px', fontSize: '1rem', fontFamily: 'inherit' }}
                />
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '16px', fontSize: '1.1rem', borderRadius: '8px' }}
                  onClick={() => handleResolveSituation(null)}
                  disabled={textAnswer.trim().length < 5}
                >
                  Enviar Respuesta
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeSituation.options.map((opt) => (
                  <button 
                    key={opt.id}
                    style={{ textAlign: 'left', padding: '24px', fontSize: '1.1rem', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s ease', display: 'flex', alignItems: 'flex-start', gap: '20px' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                    onClick={() => handleResolveSituation(opt.id)}
                  >
                    <Icons.ArrowRightCircle size={24} color="var(--brand-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ lineHeight: '1.5' }}>{opt.text}</span>
                  </button>
                ))}
              </div>
            )}
            
            <button className="btn btn-outline" style={{ marginTop: '30px', width: '100%', padding: '16px', fontSize: '1rem', borderRadius: '8px' }} onClick={() => { setActiveSituation(null); setTextAnswer(''); }}>Cancelar Intervención</button>
          </div>
          </motion.div>
        </AnimatePresence>
      )}

      <div style={{ padding: '32px', maxWidth: '1600px', margin: '0 auto', position: 'relative' }}>
        
        {/* Game Over Overlay */}
        {gameState?.gameState?.phase === 'game_over' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(11, 15, 25, 0.98)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', zIndex: 1000, height: '100%', minHeight: '80vh', borderRadius: '8px', padding: '40px', overflowY: 'auto' }}>
            <div className="hotel-card" style={{ padding: '60px', textAlign: 'center', width: '100%', maxWidth: '900px', borderTop: '6px solid var(--brand-primary)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
              
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring' }} className="diploma-card">
                <Icons.CheckCircle size={80} color="var(--brand-primary)" style={{ marginBottom: '20px' }} />
                <h2 className="serif" style={{ color: 'var(--brand-primary)', fontSize: '3rem', margin: '0 0 10px 0' }}>Evaluación Completada</h2>
                <h1 className="serif" style={{ fontSize: '2.5rem', color: 'white', margin: '20px 0 30px 0' }}>{myPlayer?.character?.name}</h1>
                <p style={{ fontSize: '1.3rem', color: 'var(--text-main)', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 40px auto' }}>
                  Gracias por completar la evaluación situacional. Tu perfil y respuestas han sido registradas exitosamente. El equipo de Recursos Humanos se pondrá en contacto contigo a la brevedad.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '50px' }} className="no-print">
                  <button className="btn btn-outline" style={{ padding: '16px 32px', fontSize: '1.1rem', borderRadius: '8px' }} onClick={handleLeaveRoom}>
                    Volver al Inicio
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Briefing Overlay */}
        <AnimatePresence>
          {gameState?.gameState?.phase === 'briefing' && (
            <motion.div initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(8px)' }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(26, 54, 93, 0.95)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 900, height: '100%', borderRadius: '8px' }}>
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', bounce: 0.4 }} className="enterprise-panel" style={{ padding: '60px', textAlign: 'center', width: '100%', maxWidth: '700px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', background: 'linear-gradient(180deg, #ffffff 0%, #f7fafc 100%)' }}>
                <div style={{ display: 'inline-block', backgroundColor: '#EDF2F7', color: '#4A5568', padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '16px' }}>RESUMEN DE JORNADA</div>
                <h2 style={{ margin: '0 0 32px 0', color: 'var(--bg-header)', fontSize: '2.8rem', fontWeight: 800 }}>Día {gameState.gameState.turn} Completado</h2>
                
                <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '16px', marginBottom: '40px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '1.4rem', color: '#4A5568', marginBottom: '16px', fontWeight: 600 }}>Tus Decisiones Han Sido Evaluadas</div>
                  <div style={{ fontSize: '1.2rem', color: '#718096', lineHeight: '1.6' }}>
                    El simulador está calculando el impacto de tus gestiones en la rentabilidad y satisfacción del huésped. Tu evaluación de desempeño se revelará al finalizar tu turno.
                  </div>
                </div>
                
                <button className="btn btn-primary" style={{ padding: '20px 40px', fontSize: '1.4rem', width: '100%', borderRadius: '12px', background: 'linear-gradient(135deg, #3182CE 0%, #2B6CB0 100%)', boxShadow: '0 4px 14px 0 rgba(49, 130, 206, 0.39)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', transition: 'all 0.3s ease' }} onClick={handleNextTurn}>
                  Comenzar Día {gameState.gameState.turn + 1} <Icons.ArrowRight size={28} />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Control Panel */}
        <div className="hotel-card" style={{ padding: '24px 32px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {myPlayer && (
              <div style={{ backgroundColor: '#F8FAFC', padding: '16px 24px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ backgroundColor: '#F1F5F9', padding: '12px', borderRadius: '50%' }}>
                  <Icons.User size={32} color="var(--brand-primary)" />
                </div>
                <div>
                  <div className="serif" style={{ fontWeight: 600, fontSize: '1.4rem', color: 'var(--text-main)' }}>{myPlayer.character.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{myPlayer.character.role}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            {gameState?.gameState?.phase === 'lobby' && (
              <button className="btn btn-primary" style={{ padding: '16px 40px', fontSize: '1.3rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={handleStartGame}>
                <Icons.PlayCircle size={24} /> Iniciar Día 1
              </button>
            )}
            
            {gameState?.gameState?.timer > 0 && gameState?.gameState?.phase === 'check_in' && (() => {
              // Calculate unresolved count
              let activeCount = 0;
              if (gameState?.gameState?.departments) {
                const deps = Object.keys(gameState.gameState.departments);
                deps.forEach(d => {
                  activeCount += gameState.gameState.departments[d].filter(c => !c.resolved).length;
                });
              }

              return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <button 
                  className="btn btn-outline" 
                  style={{ borderColor: '#A0AEC0', color: '#4A5568', padding: '12px 24px', borderRadius: '12px', fontWeight: 600 }} 
                  onClick={handleForceEndTurn}
                  title="Cerrar turno"
                >
                  Cerrar Turno
                </button>
                <div style={{ backgroundColor: '#FFF5F5', color: '#C53030', padding: '16px 32px', borderRadius: '12px', fontWeight: 800, fontSize: '1.5rem', border: '2px solid #FEB2B2', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icons.Timer size={28} />
                  {Math.floor(gameState.gameState.timer / 60).toString().padStart(2, '0')}:{(gameState.gameState.timer % 60).toString().padStart(2, '0')}
                </div>
              </div>
            )})()}
          </div>
        </div>

        {/* Dynamic Departments Board */}
        {gameState?.gameState?.phase !== 'lobby' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '32px' }}>
            
            {Object.keys(gameState?.gameState?.departments || {}).map(dep => (
              <div key={dep} className="hotel-card" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="panel-header" style={{ backgroundColor: 'var(--bg-header)', color: 'white', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Icons.Briefcase size={28} color="var(--brand-primary)" />
                  <span className="serif" style={{ fontSize: '1.5rem', letterSpacing: '0.02em' }}>{dep}</span>
                </div>
                <div style={{ padding: '32px', minHeight: '350px', backgroundColor: 'var(--bg-main)' }}>
                  {renderActiveCard(dep)}
                </div>
              </div>
            ))}
            
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
