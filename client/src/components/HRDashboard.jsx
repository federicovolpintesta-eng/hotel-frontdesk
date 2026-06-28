const API_URL = import.meta.env.VITE_API_URL || 'https://caosfrontdesk-backend.onrender.com';
import React, { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import * as Icons from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function HRDashboard({ hrToken, onLogout }) {
  const [empleados, setEmpleados] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [analisis, setAnalisis] = useState(null);
  
  // Tabs: 'general', 'config'
  const [currentTab, setCurrentTab] = useState('general');
  const [leaderboard, setLeaderboard] = useState([]);
    const [profileData, setProfileData] = useState({ nombre: '', password: '', profile_image: null, file: null });
  const [editingUser, setEditingUser] = useState(null);
  const [config, setConfig] = useState({ brand_color: '#C5A059', logo_url: '', slack_webhook_url: '' });
  
  // New employee form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newRol, setNewRol] = useState('Front Desk');
  const [newTipo, setNewTipo] = useState('candidato');
  const [newCv, setNewCv] = useState(null);

  // Area Managers state
  const [areaUsers, setAreaUsers] = useState([]);
  const [newAreaUser, setNewAreaUser] = useState({ nombre: '', email: '', password: '', area_asignada: 'Front Desk' });

    const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hr/profile`, { headers: { 'Authorization': `Bearer ${hrToken}` } });
      if (res.ok) {
        const data = await res.json();
        setProfileData({ nombre: data.nombre || '', password: '', profile_image: data.profile_image || null, file: null });
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchProfile();
  }, [hrToken]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      if (profileData.nombre) formData.append('nombre', profileData.nombre);
      if (profileData.password) formData.append('password', profileData.password);
      if (profileData.file) formData.append('profile_image', profileData.file);
      
      const res = await fetch(`${API_URL}/api/hr/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${hrToken}` },
        body: formData
      });
      if (res.ok) {
        alert(t('profileUpdated') || 'Perfil actualizado correctamente');
        fetchProfile();
      }
    } catch(err) {}
  };

  const handleUpdateAreaUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/hr/usuarios/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hrToken}` },
        body: JSON.stringify(editingUser)
      });
      if (res.ok) {
        alert('Usuario actualizado');
        setEditingUser(null);
        fetchAreaUsers();
      }
    } catch(err){}
  };

  const fetchAreaUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hr/usuarios`, { headers: { 'Authorization': `Bearer ${hrToken}` } });
      if (res.ok) {
        const data = await res.json();
        setAreaUsers(data);
      }
    } catch(err) {}
  };

  useEffect(() => {
    if (currentTab === 'accesos') fetchAreaUsers();
  }, [currentTab]);

  const handleCreateAreaUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/hr/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hrToken}` },
        body: JSON.stringify(newAreaUser)
      });
      if (res.ok) {
        fetchAreaUsers();
        setNewAreaUser({ nombre: '', email: '', password: '', area_asignada: 'Front Desk' });
      } else {
        const errData = await res.json();
        alert(errData.error || 'Error al crear usuario');
      }
    } catch(err) {
      alert('Error de red al crear usuario');
    }
  };

  // i18n and Dark Mode
  const [lang, setLang] = useState('es');
  const [theme, setTheme] = useState('light');

  const getRoleFromToken = (token) => {
    if (!token) return { rol: 'admin', area_asignada: null, nombre: 'Admin' };
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { rol: payload.rol || 'admin', area_asignada: payload.area_asignada || null, nombre: payload.nombre || 'Admin' };
    } catch(e) {
      return { rol: 'admin', area_asignada: null, nombre: 'Admin' };
    }
  };
  const { rol: userRole, area_asignada: userArea, nombre: userName } = getRoleFromToken(hrToken);
  
  useEffect(() => {
    if (userRole === 'area_manager' && userArea) {
      setNewRol(userArea);
    }
  }, [userRole, userArea]);
  const dict = {
    es: {
      title: "Hotel HR Analytics",
      overview: "Vista General",
      nineBox: "Matriz de Talento (9-Box)",
      config: "Configuración White-Label",
      logout: "Cerrar Sesión",
      personnel: "Gestión de Personal",
      addPersonnel: "+ Agregar Personal",
      newRecord: "Nuevo Registro",
      name: "Nombre",
      role: "Rol",
      type: "Tipo",
      cv: "CV (Opcional - PDF)",
      candidate: "Candidato (Entrevista)",
      staff: "Efectivo (Staff actual)",
      cancel: "Cancelar",
      save: "Guardar",
      sendAudio: "Analizando Audio...",
      loadingAnalysis: "Cargando análisis...",
      newCandidates: "Nuevos Candidatos",
      leadershipNps: "Liderazgo y NPS",
      highPotential: "Alto Potencial",
      avgNps: "NPS Promedio",
      link: "Enlace",
      profile: "Perfil",
      compare: "Comparar",
      compareTitle: "Comparador 'Cara a Cara'",
      resolution: "Resolución",
      analysis: "Análisis",
      empathy: "Empatía",
      globalNps: "NPS Global",
      exportPdf: "Exportar Reporte PDF",
      burnoutRisk: "Riesgo de Burnout Detectado",
      attritionRisk: "Riesgo de Fuga Detectado",
      aiReport: "Reporte de Evaluación IA",
      strengths: "Puntos Fuertes",
      areasToImprove: "Áreas de Mejora",
      promotionAlgorithm: "Análisis de Algoritmo de Ascenso",
      continuousTraining: "Plan de Formación Continuo",
      generateAiPlan: "Generar Plan IA",
      noTrainingPlan: "No se ha generado un plan de acción para este colaborador.",
      leaderboardTitle: "Leaderboard B2B (NPS por Departamento)",
      notEnoughData: "No hay suficientes datos de departamentos.",
      matrixTitle: "Matriz de Talento Global (9-Box)",
      matrixDesc: "Visión general del desempeño y potencial de todo el equipo.",
      configTitle: "Personalización White-Label",
      configDesc: "Adapta el entorno de evaluación con la identidad visual de tu hotel.",
      brandColor: "Color Corporativo Principal",
      logoUrl: "URL del Logo (Opcional)",
      slackWebhook: "Webhook de Slack (Notificaciones)",
      saveChanges: "Guardar y Aplicar Cambios",
      pipeline: "Pipeline de Personal",
      pending: "Pendientes / En Progreso",
      attentionRequired: "Atención Requerida",
      copyLink: "Copiar Link",
      idCopied: "ID copiado",
      welcome: "BIENVENIDO",
      cvAnalysis: "Análisis de CV (IA)",
      suggestedQuestions: "Preguntas Sugeridas para Entrevista:",
      noEvaluation: "El candidato aún no ha completado ninguna evaluación interactiva.",
      benchmarkIdeal: "Benchmark Ideal",
      lastEvaluation: "Última Evaluación",
      historicalAvg: "Promedio Histórico",
      burnoutDesc: "Métricas sugieren sobrecarga o desconexión emocional.",
      attritionDesc: "Bajo compromiso. Riesgo de renuncia o abandono en próximos meses.",
      aiReportDesc: "Generado combinando NPS, NLP y psicometría sobre 5 casos críticos.",
      psychProfile: "Perfil Psicológico (IA)",
      rolePlayAudio: "Grabación de Role-Play",
      audioDesc: "Escucha la respuesta real del candidato bajo presión.",
      cultureFit: "Culture Fit Score (Match)",
      cultureFitDesc: "Medición de alineación con los valores Core del hotel (Agilidad, Empatía y Protocolo).",
      quadrant: "Cuadrante",
      nineBoxDict: {
        'Enigma': 'Enigma',
        'High Potential': 'Alto Potencial',
        'Future Leader': 'Futuro Líder',
        'Dilemma': 'Dilema',
        'Core Player': 'Jugador Clave',
        'High Performer': 'Alto Rendimiento',
        'Underperformer': 'Bajo Rendimiento',
        'Effective Operator': 'Operador Efectivo',
        'Trusted Professional': 'Profesional Confiable'
      }
    },
    en: {
      title: "Hotel HR Analytics",
      overview: "Overview",
      nineBox: "Talent Matrix (9-Box)",
      config: "White-Label Settings",
      logout: "Logout",
      personnel: "Personnel Management",
      addPersonnel: "+ Add Personnel",
      newRecord: "New Record",
      name: "Name",
      role: "Role",
      type: "Type",
      cv: "CV (Optional - PDF)",
      candidate: "Candidate (Interview)",
      staff: "Staff (Current)",
      cancel: "Cancel",
      save: "Save",
      sendAudio: "Analyzing Audio...",
      loadingAnalysis: "Loading analysis...",
      newCandidates: "New Candidates",
      leadershipNps: "Leadership & NPS",
      highPotential: "High Potential",
      avgNps: "Avg NPS",
      link: "Link",
      profile: "Profile",
      compare: "Compare",
      compareTitle: "'Face-to-Face' Comparator",
      resolution: "Resolution",
      analysis: "Analysis",
      empathy: "Empathy",
      globalNps: "Global NPS",
      exportPdf: "Export PDF Report",
      burnoutRisk: "Burnout Risk Detected",
      attritionRisk: "Flight Risk Detected",
      aiReport: "AI Evaluation Report",
      strengths: "Strengths",
      areasToImprove: "Areas for Improvement",
      promotionAlgorithm: "Promotion Algorithm Analysis",
      continuousTraining: "Continuous Training Plan",
      generateAiPlan: "Generate AI Plan",
      noTrainingPlan: "No action plan generated for this collaborator.",
      leaderboardTitle: "B2B Leaderboard (NPS by Department)",
      notEnoughData: "Not enough department data.",
      matrixTitle: "Global Talent Matrix (9-Box)",
      matrixDesc: "Overview of team performance and potential.",
      configTitle: "White-Label Customization",
      configDesc: "Adapt the evaluation environment to your hotel's visual identity.",
      brandColor: "Main Corporate Color",
      logoUrl: "Logo URL (Optional)",
      slackWebhook: "Slack Webhook (Notifications)",
      saveChanges: "Save and Apply Changes",
      pipeline: "Personnel Pipeline",
      pending: "Pending / In Progress",
      attentionRequired: "Attention Required",
      copyLink: "Copy Link",
      idCopied: "ID copied",
      welcome: "Welcome",
      cvAnalysis: "CV Analysis (AI)",
      suggestedQuestions: "Suggested Interview Questions:",
      noEvaluation: "The candidate hasn't completed any interactive evaluation yet.",
      benchmarkIdeal: "Ideal Benchmark",
      lastEvaluation: "Last Evaluation",
      historicalAvg: "Historical Average",
      burnoutDesc: "Metrics suggest overload or emotional disconnection.",
      attritionDesc: "Low engagement. Risk of resignation in the coming months.",
      aiReportDesc: "Generated by combining NPS, NLP, and psychometrics on 5 critical cases.",
      psychProfile: "Psychological Profile (AI)",
      rolePlayAudio: "Role-Play Recording",
      audioDesc: "Listen to the candidate's real response under pressure.",
      cultureFit: "Culture Fit Score (Match)",
      cultureFitDesc: "Measures alignment with the hotel's Core values (Agility, Empathy, and Protocol).",
      quadrant: "Quadrant"
    }
  };
  const t = (key) => dict[lang][key] || key;
  const renderMarkdown = (text) => {
    if (!text) return null;
    let formatted = text.replace(/\\n/g, '\n');
    return formatted.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i} style={{ display: 'block', minHeight: '1em' }}>
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
        </span>
      );
    });
  };

  const bgTheme = theme === 'dark' ? '#1A202C' : '#F7FAFC';
  const textTheme = theme === 'dark' ? '#E2E8F0' : '#2D3748';
  const cardTheme = theme === 'dark' ? '#2D3748' : '#FFFFFF';
  const cardBorder = theme === 'dark' ? '#4A5568' : '#E2E8F0';

  // Comparator State
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareData, setCompareData] = useState([]);

  const toggleCompare = (emp, e) => {
    e.stopPropagation(); // Prevent opening profile
    if (selectedForCompare.find(s => s.id === emp.id)) {
      setSelectedForCompare(selectedForCompare.filter(s => s.id !== emp.id));
    } else {
      if (selectedForCompare.length < 3) {
        setSelectedForCompare([...selectedForCompare, emp]);
      } else {
        alert("Máximo 3 candidatos para comparar.");
      }
    }
  };

  const handleCompare = async () => {
    const data = [];
    for (let emp of selectedForCompare) {
      const res = await fetch(`${API_URL}/api/hr/empleados/${emp.id}/analisis`, { headers: { 'Authorization': `Bearer ${hrToken}` }});
      if (res.ok) {
        const d = await res.json();
        data.push({ emp, radar: d.ultimo_radar || [] });
      }
    }
    setCompareData(data);
    setShowCompareModal(true);
  };

  const fetchEmpleados = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hr/empleados`, {
        headers: { 'Authorization': `Bearer ${hrToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmpleados(data);
      }
    } catch (err) { console.error(err); }
  };

  const fetchDashboardData = async () => {
    try {
      const resL = await fetch(`${API_URL}/api/hr/leaderboard`, { headers: { 'Authorization': `Bearer ${hrToken}` }});
      if (resL.ok) setLeaderboard(await resL.json());

      const resC = await fetch(`${API_URL}/api/hr/config`, { headers: { 'Authorization': `Bearer ${hrToken}` }});
      if (resC.ok) {
         const cData = await resC.json();
         if (cData.brand_color) setConfig(cData);
      }
    } catch(err) {}
  };

  useEffect(() => {
    fetchEmpleados();
    fetchDashboardData();
  }, [hrToken]);

  const saveConfig = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_URL}/api/hr/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hrToken}` },
        body: JSON.stringify(config)
      });
      alert('Configuración guardada. Tus evaluaciones ahora usarán este branding.');
    } catch(err) { console.error(err); }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('nombre', newNombre);
      formData.append('rol', newRol);
      formData.append('tipo_perfil', newTipo);
      if (newCv) formData.append('cv', newCv);

      const res = await fetch(`${API_URL}/api/hr/empleados/nuevo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${hrToken}` },
        body: formData
      });
      if (res.ok) {
        setShowAddForm(false);
        setNewNombre('');
        setNewCv(null);
        fetchEmpleados();
      }
    } catch (err) { console.error(err); }
  };

  const generateTrainingPlan = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hr/empleados/${selectedEmp.id}/plan_capacitacion`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${hrToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalisis(prev => ({ ...prev, training_plan: data.training_plan }));
        alert('Plan de capacitación generado con éxito.');
      }
    } catch (err) { console.error(err); }
  };

  const verAnalisis = async (empId) => {
    setSelectedEmp(empleados.find(e => e.id === empId));
    setAnalisis(null);
    try {
      const res = await fetch(`${API_URL}/api/hr/empleados/${empId}/analisis`, {
        headers: { 'Authorization': `Bearer ${hrToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalisis(data);
      }
    } catch(err) { console.error(err); }
  };

  const copyLink = (uuid) => {
    const url = `http://localhost:5173/?invite=${uuid}`;
    navigator.clipboard.writeText(url);
    alert('Link copiado: ' + url);
  };

  const exportPDF = async () => {
    const el = document.getElementById('perfil-container');
    if (!el) return;
    
    // Esconder botones de acción para el PDF
    const actionsDiv = document.getElementById('perfil-actions');
    if (actionsDiv) actionsDiv.style.display = 'none';
    
    // Temporarily allow the container to expand to its full height
    const originalHeight = el.style.height;
    const originalOverflow = el.style.overflowY;
    el.style.height = 'max-content';
    el.style.overflowY = 'visible';

    const canvas = await html2canvas(el, { 
      scale: 2,
      windowHeight: el.scrollHeight
    });
    
    // Restore styling
    el.style.height = originalHeight;
    el.style.overflowY = originalOverflow;
    if (actionsDiv) actionsDiv.style.display = 'flex';
    
    const imgData = canvas.toDataURL('image/png');
    
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Generate a single continuous page using dynamic height
    const pdf = new jsPDF('p', 'mm', [pdfWidth, pdfHeight]);
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Reporte_${selectedEmp.nombre}.pdf`);
  };

  return (
    <div className="responsive-dashboard" style={{ display: 'flex', minHeight: '100vh', backgroundColor: bgTheme, color: textTheme }}>
      {/* Sidebar */}
      <div className="responsive-sidebar" style={{ width: '280px', backgroundColor: theme === 'dark' ? '#111827' : '#2D3748', color: 'white', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', background: 'white', padding: '16px', borderRadius: '12px', alignItems: 'center' }}>
          <img src="/images/los-pinos.png" alt="Los Pinos" style={{ height: '40px', objectFit: 'contain' }} />
          <div style={{ height: '1px', background: '#e2e8f0', width: '100%' }}></div>
          <img src="/images/tremun.jpeg" alt="Tremun" style={{ height: '45px', objectFit: 'contain' }} />
        </div>
        
        <div style={{ padding: '0 10px 20px 10px', textAlign: 'center', color: 'white', fontSize: '1.1rem', fontWeight: 'bold' }}>
          {t('welcome')}, {userName}
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
           <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
             {lang === 'es' ? '🇪🇸 ES' : '🇬🇧 EN'}
           </button>
           <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
             {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
           </button>
        </div>

        <div onClick={() => setCurrentTab('general')} style={{ marginBottom: '20px', cursor: 'pointer', padding: '12px', backgroundColor: currentTab === 'general' ? 'rgba(255,255,255,0.1)' : 'transparent', borderRadius: '8px' }}>
          {t('overview')}
        </div>
        <div onClick={() => setCurrentTab('9box')} style={{ marginBottom: '20px', cursor: 'pointer', padding: '12px', backgroundColor: currentTab === '9box' ? 'rgba(255,255,255,0.1)' : 'transparent', borderRadius: '8px' }}>
          {t('nineBox')}
        </div>
        {userRole === 'admin' && (
          <>
            
        <div onClick={() => setCurrentTab('perfil')} style={{ marginBottom: '20px', cursor: 'pointer', padding: '12px', backgroundColor: currentTab === 'perfil' ? 'rgba(255,255,255,0.1)' : 'transparent', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Icons.User size={24} color={currentTab === 'perfil' ? '#FFF' : '#A0AEC0'} />
            <span style={{ color: currentTab === 'perfil' ? '#FFF' : '#A0AEC0', fontWeight: currentTab === 'perfil' ? 'bold' : 'normal' }}>Mi Perfil</span>
          </div>
        </div>
        <div onClick={() => setCurrentTab('config')} style={{ marginBottom: '20px', cursor: 'pointer', padding: '12px', backgroundColor: currentTab === 'config' ? 'rgba(255,255,255,0.1)' : 'transparent', borderRadius: '8px' }}>
              {t('config')}
            </div>
            <div onClick={() => setCurrentTab('accesos')} style={{ marginBottom: '20px', cursor: 'pointer', padding: '12px', backgroundColor: currentTab === 'accesos' ? 'rgba(255,255,255,0.1)' : 'transparent', borderRadius: '8px' }}>
              Gestión de Accesos
            </div>
          </>
        )}

        <button 
          onClick={onLogout}
          style={{ marginTop: 'auto', background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '10px', width: '100%', borderRadius: '8px', cursor: 'pointer' }}>
          {t('logout')}
        </button>
      </div>

      {/* Main Content */}
      <div className="responsive-main" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {currentTab === 'general' && (
          <>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: textTheme, margin: 0 }}>{t('personnel')}</h1>
          <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '12px 24px', backgroundColor: '#6772E5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            {t('addPersonnel')}
          </button>
        </div>

        {showAddForm && (
          <div style={{ background: cardTheme, padding: '24px', borderRadius: '12px', marginBottom: '32px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: `1px solid ${cardBorder}` }}>
            <h3 style={{ marginTop: 0, color: textTheme }}>{t('newRecord')}</h3>
            <form onSubmit={handleAddEmployee} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: textTheme }}>{t('name')}</label>
                <input required type="text" value={newNombre} onChange={e=>setNewNombre(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${cardBorder}`, borderRadius: '6px', background: bgTheme, color: textTheme }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: textTheme }}>{t('role')}</label>
                <select value={newRol} onChange={e=>setNewRol(e.target.value)} disabled={userRole === 'area_manager'} style={{ width: '100%', padding: '10px', border: `1px solid ${cardBorder}`, borderRadius: '6px', background: bgTheme, color: textTheme }}>
                  {userRole === 'area_manager' ? (
                    <option value={userArea}>{userArea}</option>
                  ) : (
                    <>
                      <option value="Front Desk">Front Desk</option>
                      <option value="Housekeeping">Housekeeping</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="F&B">F&B</option>
                      <option value="Cultura y Valores">Cultura y Valores</option>
                    </>
                  )}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: textTheme }}>{t('type')}</label>
                <select value={newTipo} onChange={e=>setNewTipo(e.target.value)} style={{ width: '100%', padding: '10px', border: `1px solid ${cardBorder}`, borderRadius: '6px', background: bgTheme, color: textTheme }}>
                  <option value="candidato">{t('candidate')}</option>
                  <option value="efectivo">{t('staff')}</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '8px', color: textTheme }}>{t('cv')}</label>
                <input type="file" accept=".pdf" onChange={e => setNewCv(e.target.files[0])} style={{ width: '100%', padding: '7px', border: `1px solid ${cardBorder}`, borderRadius: '6px', background: bgTheme, color: textTheme }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: '10px 16px', background: 'transparent', border: `1px solid ${cardBorder}`, borderRadius: '6px', cursor: 'pointer', color: textTheme }}>{t('cancel')}</button>
                <button type="submit" style={{ padding: '10px 16px', background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>{t('save')}</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: 'flex', gap: '32px' }}>
          {/* Listado Kanban */}
          <div style={{ flex: 1 }}>
            <h3 style={{ marginTop: 0, marginBottom: '24px', color: textTheme }}>{t('pipeline')}</h3>
            <div className="pipeline-container" style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
              
              {/* Columna: Pendientes */}
              <div className="pipeline-column" style={{ flex: 1, minWidth: '250px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', borderTop: '4px solid #CBD5E0' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#A0AEC0' }}>{t('pending')}</h4>
                {empleados.filter(e => e.promedio_nps === 0).length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#A0AEC0', fontSize: '0.9rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px dashed #CBD5E0' }}>Sin registros</div>}
                {empleados.filter(e => e.promedio_nps === 0).map(e => (
                  <div key={e.id} style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 'bold', color: '#2D3748' }}>{e.nombre}</div>
                      <input type="checkbox" checked={!!selectedForCompare.find(s => s.id === e.id)} onChange={(evt) => toggleCompare(e, evt)} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '8px' }}>{e.rol} • {e.tipo_perfil}</div>
                    <div onClick={() => { navigator.clipboard.writeText(e.uuid_evaluacion); alert(t('idCopied') + ': ' + e.uuid_evaluacion); }} style={{ fontSize: '0.7rem', color: '#A0AEC0', marginBottom: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontFamily: 'monospace' }}>ID: {e.uuid_evaluacion.split('-')[0]}...</span> <Icons.Copy size={12} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => copyLink(e.uuid_evaluacion)} style={{ flex: 1, padding: '6px', background: '#EDF2F7', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Icons.Copy size={14}/> {t('link')}</button>
                      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent('Hola! Aquí tienes el link para tu evaluación interactiva: http://localhost:5173/?invite=' + e.uuid_evaluacion)}`, '_blank')} style={{ flex: 1, padding: '6px', background: '#25D366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Icons.MessageCircle size={14}/> WhatsApp</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Columna: Atención Requerida */}
              <div className="pipeline-column" style={{ flex: 1, minWidth: '250px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', borderTop: '4px solid #E53E3E' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#E53E3E' }}>{t('attentionRequired')}</h4>
                {empleados.filter(e => (e.burnoutRisk || e.attritionRisk)).length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#A0AEC0', fontSize: '0.9rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px dashed #CBD5E0' }}>Sin registros</div>}
                {empleados.filter(e => (e.burnoutRisk || e.attritionRisk)).map(e => (
                  <div key={e.id} style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #E53E3E' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 'bold', color: '#2D3748' }}>{e.nombre}</div>
                      <input type="checkbox" checked={!!selectedForCompare.find(s => s.id === e.id)} onChange={(evt) => toggleCompare(e, evt)} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '8px' }}>NPS: {Math.round(e.promedio_nps)}</div>
                    <div onClick={() => { navigator.clipboard.writeText(e.uuid_evaluacion); alert(t('idCopied') + ': ' + e.uuid_evaluacion); }} style={{ fontSize: '0.7rem', color: '#A0AEC0', marginBottom: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontFamily: 'monospace' }}>ID: {e.uuid_evaluacion.split('-')[0]}...</span> <Icons.Copy size={12} />
                    </div>
                    {e.attritionRisk && <div style={{ fontSize: '0.75rem', color: '#DD6B20' }}>⚠️ {t('attritionRisk')}</div>}
                    {e.burnoutRisk && <div style={{ fontSize: '0.75rem', color: '#E53E3E' }}>🚩 {t('burnoutRisk')}</div>}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button onClick={() => copyLink(e.uuid_evaluacion)} style={{ flex: 1, padding: '6px', background: '#EDF2F7', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Icons.Copy size={14}/> {t('link')}</button>
                      <button onClick={() => verAnalisis(e.id)} style={{ flex: 1, padding: '6px', background: 'transparent', border: '1px solid #CBD5E0', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>{t('profile')}</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Columna: Nuevos */}
              <div className="pipeline-column" style={{ flex: 1, minWidth: '250px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', borderTop: '4px solid #3182CE' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#3182CE' }}>{t('newCandidates')}</h4>
                {empleados.filter(e => e.promedio_nps > 0 && e.promedio_nps < 80 && !e.burnoutRisk && !e.attritionRisk).length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#A0AEC0', fontSize: '0.9rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px dashed #CBD5E0' }}>Sin registros</div>}
                {empleados.filter(e => e.promedio_nps > 0 && e.promedio_nps < 80 && !e.burnoutRisk && !e.attritionRisk).map(e => (
                  <div key={e.id} style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #3182CE' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 'bold', color: '#2D3748' }}>{e.nombre}</div>
                      <input type="checkbox" checked={!!selectedForCompare.find(s => s.id === e.id)} onChange={(evt) => toggleCompare(e, evt)} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '8px' }}>NPS: {Math.round(e.promedio_nps)}</div>
                    <div onClick={() => { navigator.clipboard.writeText(e.uuid_evaluacion); alert(t('idCopied') + ': ' + e.uuid_evaluacion); }} style={{ fontSize: '0.7rem', color: '#A0AEC0', marginBottom: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontFamily: 'monospace' }}>ID: {e.uuid_evaluacion.split('-')[0]}...</span> <Icons.Copy size={12} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button onClick={() => copyLink(e.uuid_evaluacion)} style={{ flex: 1, padding: '6px', background: '#EDF2F7', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Icons.Copy size={14}/> {t('link')}</button>
                      <button onClick={() => verAnalisis(e.id)} style={{ flex: 1, padding: '6px', background: '#EBF4FF', border: '1px solid #BEE3F8', color: '#2B6CB0', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>{t('profile')}</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Columna: Destacados */}
              <div className="pipeline-column" style={{ flex: 1, minWidth: '250px', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', borderTop: '4px solid #48BB78' }}>
                <h4 style={{ margin: '0 0 16px 0', color: '#48BB78' }}>Alto Potencial</h4>
                {empleados.filter(e => e.promedio_nps >= 80 && !e.burnoutRisk && !e.attritionRisk).length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#A0AEC0', fontSize: '0.9rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px dashed #CBD5E0' }}>Sin registros</div>}
                {empleados.filter(e => e.promedio_nps >= 80 && !e.burnoutRisk && !e.attritionRisk).map(e => (
                  <div key={e.id} style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #48BB78' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ fontWeight: 'bold', color: '#2D3748' }}>{e.nombre}</div>
                      <input type="checkbox" checked={!!selectedForCompare.find(s => s.id === e.id)} onChange={(evt) => toggleCompare(e, evt)} />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#718096', marginBottom: '8px' }}>⭐ NPS: {Math.round(e.promedio_nps)}</div>
                    <div onClick={() => { navigator.clipboard.writeText(e.uuid_evaluacion); alert('ID copiado: ' + e.uuid_evaluacion); }} style={{ fontSize: '0.7rem', color: '#A0AEC0', marginBottom: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontFamily: 'monospace' }}>ID: {e.uuid_evaluacion.split('-')[0]}...</span> <Icons.Copy size={12} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button onClick={() => copyLink(e.uuid_evaluacion)} style={{ flex: 1, padding: '6px', background: '#EDF2F7', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Icons.Copy size={14}/> {t('link')}</button>
                      <button onClick={() => verAnalisis(e.id)} style={{ flex: 1, padding: '6px', background: '#F0FFF4', border: '1px solid #9AE6B4', color: '#276749', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>{t('profile')}</button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {selectedForCompare.length >= 2 && (
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 900 }}>
              <button onClick={handleCompare} style={{ padding: '16px 32px', borderRadius: '30px', backgroundColor: 'var(--brand-primary)', color: 'white', fontWeight: 'bold', fontSize: '1.1rem', border: 'none', cursor: 'pointer', boxShadow: '0 10px 25px rgba(197, 160, 89, 0.4)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icons.Users size={24} /> {t('compare')} ({selectedForCompare.length}/3)
              </button>
            </motion.div>
          )}

          {/* Compare Modal */}
          {showCompareModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '90%', maxWidth: '800px', backgroundColor: 'white', borderRadius: '16px', padding: '40px', position: 'relative' }}>
                <button onClick={() => setShowCompareModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <Icons.X size={24} color="#718096" />
                </button>
                <h2 style={{ marginTop: 0, color: '#2D3748', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icons.Swords size={28} color="var(--brand-primary)" /> {t('compareTitle')}
                </h2>
                
                <div style={{ height: '400px', margin: '40px 0' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: t('resolution'), ...Object.fromEntries(compareData.map(d => [d.emp.nombre, d.radar.find(r => r.subject==='Resolución')?.Última || 0])) },
                      { subject: t('analysis'), ...Object.fromEntries(compareData.map(d => [d.emp.nombre, d.radar.find(r => r.subject==='Análisis')?.Última || 0])) },
                      { subject: t('empathy'), ...Object.fromEntries(compareData.map(d => [d.emp.nombre, d.radar.find(r => r.subject==='Empatía')?.Última || 0])) },
                      { subject: t('globalNps'), ...Object.fromEntries(compareData.map(d => [d.emp.nombre, d.radar.find(r => r.subject==='NPS Global')?.Última || 0])) }
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      {compareData.map((d, idx) => {
                        const colors = ['#D53F8C', '#3182CE', '#38A169'];
                        return <Radar key={d.emp.id} name={d.emp.nombre} dataKey={d.emp.nombre} stroke={colors[idx]} fill={colors[idx]} fillOpacity={0.4} />;
                      })}
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>
          )}

          {/* Analysis View (Off-Canvas Drawer) */}
          <AnimatePresence>
          {selectedEmp && (
            <motion.div id="perfil-container" className="modal-right" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '550px', background: 'white', padding: '40px', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', zIndex: 1000, overflowY: 'auto', borderLeft: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ margin: '0 0 8px 0', color: textTheme, fontSize: '1.8rem' }}>{selectedEmp.nombre}</h2>
                  <div style={{ color: '#718096', fontSize: '1rem', display: 'flex', gap: '12px' }}>
                    <span>{selectedEmp.rol}</span>
                    <span>•</span>
                    <span>{selectedEmp.tipo_perfil}</span>
                  </div>
                </div>
                <div id="perfil-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button onClick={() => exportPDF()} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #CBD5E0', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icons.Download size={18} /> {t('exportPdf')}
                  </button>
                  <button onClick={() => setSelectedEmp(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
                    <Icons.X size={24} color="#718096" />
                  </button>
                </div>
              </div>
              
              {analisis && analisis.cv_summary && (
                <div style={{ padding: '20px', background: '#F0FFF4', borderRadius: '12px', borderLeft: '4px solid #38A169', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#22543D', display: 'flex', alignItems: 'center', gap: '8px' }}><Icons.FileText size={20} /> {t('cvAnalysis')}</h4>
                  <p style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: '#276749', lineHeight: '1.6' }}>{analisis.cv_summary}</p>
                  {analisis.interview_questions && analisis.interview_questions.length > 0 && (
                    <>
                      <h5 style={{ margin: '0 0 8px 0', color: '#2F855A' }}>{t('suggestedQuestions')}</h5>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#276749', fontSize: '0.9rem' }}>
                        {analisis.interview_questions.map((q, i) => <li key={i} style={{ marginBottom: '4px' }}>{q}</li>)}
                      </ul>
                    </>
                  )}
                </div>
              )}

              {analisis && analisis.error ? (
                <div style={{ padding: '20px', background: '#F7FAFC', borderRadius: '8px', textAlign: 'center', color: '#718096' }}>
                  {t('noEvaluation')}
                </div>
              ) : analisis && analisis.ultimo_radar ? (
                <>
                  <div style={{ height: '350px', marginBottom: '30px', background: '#F8FAFC', borderRadius: '12px', padding: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={
                        analisis.ultimo_radar.map(d => ({
                          ...d,
                          Ideal: selectedEmp.rol === 'Front Desk' ? (d.subject==='Empatía'?95:d.subject==='Resolución'?85:90) : 
                                 selectedEmp.rol === 'Mantenimiento' ? (d.subject==='Resolución'?95:d.subject==='Empatía'?70:85) : 85
                        }))
                      }>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name={t('benchmarkIdeal')} dataKey="Ideal" stroke="#A0AEC0" fill="#A0AEC0" fillOpacity={0.1} strokeDasharray="3 3" />
                        <Radar name={t('lastEvaluation')} dataKey="Última" stroke="#6772E5" fill="#6772E5" fillOpacity={0.6} />
                        <Radar name={t('historicalAvg')} dataKey="Promedio" stroke="#C5A059" fill="#C5A059" fillOpacity={0.3} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {selectedEmp.burnoutRisk && (
                    <div style={{ padding: '16px', background: '#FFF5F5', color: '#C53030', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '4px solid #E53E3E' }}>
                      <Icons.AlertTriangle size={24} />
                      <div>
                        <strong>{t('burnoutRisk')}</strong>
                        <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>{t('burnoutDesc')}</div>
                      </div>
                    </div>
                  )}

                  {selectedEmp.attritionRisk && (
                    <div style={{ padding: '16px', background: '#FFFAF0', color: '#C05621', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '4px solid #DD6B20' }}>
                      <Icons.AlertTriangle size={24} />
                      <div>
                        <strong>{t('attritionRisk')}</strong>
                        <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>{t('attritionDesc')}</div>
                      </div>
                    </div>
                  )}

                  <div style={{ padding: '20px', background: 'var(--brand-primary)', color: 'white', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 10px 25px rgba(197, 160, 89, 0.3)' }}>
                    <Icons.Cpu size={32} />
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem' }}>{t('aiReport')}</h3>
                      <p style={{ margin: 0, opacity: 0.9 }}>{t('aiReportDesc')}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                    {analisis.puntos_fuertes && (
                      <div style={{ background: '#F0FFF4', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #48BB78' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#276749' }}>{t('strengths')}</h4>
                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#2F855A' }}>
                          {analisis.puntos_fuertes.map((pf, i) => <li key={i} style={{ marginBottom: '8px' }}>{pf}</li>)}
                        </ul>
                      </div>
                    )}
                    
                    {analisis.areas_mejora && (
                      <div style={{ background: '#FFF5F5', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #E53E3E' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#9B2C2C' }}>{t('areasToImprove')}</h4>
                        <ul style={{ margin: 0, paddingLeft: '20px', color: '#C53030' }}>
                          {analisis.areas_mejora.map((am, i) => <li key={i} style={{ marginBottom: '8px' }}>{am}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>

                  {analisis.personalityProfile && (
                    <div style={{ padding: '20px', background: 'white', borderRadius: '12px', borderLeft: '4px solid #ED8936', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#C05621', display: 'flex', alignItems: 'center', gap: '8px' }}><Icons.Brain size={20} /> {t('psychProfile')}</h4>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: '#7B341E', lineHeight: '1.6' }}>
                        {analisis.personalityProfile}
                      </p>
                    </div>
                  )}

                  {analisis.audioBase64 && (
                    <div style={{ padding: '20px', background: 'white', borderRadius: '12px', borderLeft: '4px solid #38B2AC', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#2C7A7B', display: 'flex', alignItems: 'center', gap: '8px' }}><Icons.Mic size={20} /> {t('rolePlayAudio')}</h4>
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#4A5568' }}>{t('audioDesc')}</p>
                      <audio controls src={analisis.audioBase64} style={{ width: '100%' }} />
                    </div>
                  )}

                  {selectedEmp.cultureFitMatch !== null && selectedEmp.cultureFitMatch !== undefined && (
                    <div style={{ padding: '20px', background: 'white', borderRadius: '12px', borderLeft: '4px solid #D53F8C', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <h4 style={{ margin: '0 0 12px 0', color: '#B83280', display: 'flex', alignItems: 'center', gap: '8px' }}><Icons.Heart size={20} /> {t('cultureFit')}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ flex: 1, background: '#EDF2F7', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ width: `${selectedEmp.cultureFitMatch}%`, background: 'linear-gradient(90deg, #F687B3 0%, #D53F8C 100%)', height: '100%', borderRadius: '6px' }} />
                        </div>
                        <div style={{ fontWeight: '900', fontSize: '1.4rem', color: '#97266D' }}>{selectedEmp.cultureFitMatch}%</div>
                      </div>
                      <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem', color: '#718096' }}>{t('cultureFitDesc')}</p>
                    </div>
                  )}

                  <div style={{ padding: '20px', background: 'white', borderRadius: '12px', borderLeft: '4px solid #6772E5', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#2B6CB0', display: 'flex', alignItems: 'center', gap: '8px' }}><Icons.Grid size={20} /> {t('nineBox')}</h4>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#2A4365', lineHeight: '1.6', fontWeight: 'bold' }}>
                      {t('quadrant')}: {selectedEmp.nineBox || 'No Data'}
                    </p>
                    {selectedEmp.nineBox && selectedEmp.nineBox !== 'No Data' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '16px' }}>
                        {['Enigma', 'High Potential', 'Future Leader', 'Dilemma', 'Core Player', 'High Performer', 'Underperformer', 'Effective Operator', 'Trusted Professional'].map(b => (
                          <div key={b} style={{ 
                            background: b === selectedEmp.nineBox ? '#4299E1' : '#EDF2F7', 
                            color: b === selectedEmp.nineBox ? 'white' : '#718096', 
                            padding: '12px 4px', 
                            textAlign: 'center', 
                            fontSize: '0.7rem', 
                            lineHeight: '1.2',
                            fontWeight: 'bold', 
                            borderRadius: '6px',
                            boxShadow: b === selectedEmp.nineBox ? '0 4px 10px rgba(66, 153, 225, 0.4)' : 'none',
                            transform: b === selectedEmp.nineBox ? 'scale(1.05)' : 'none',
                            transition: 'all 0.2s ease'
                          }}>
                            {b}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ padding: '20px', background: 'white', borderRadius: '12px', borderLeft: '4px solid #48BB78', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#276749', display: 'flex', alignItems: 'center', gap: '8px' }}><Icons.TrendingUp size={20} /> {t('promotionAlgorithm')}</h4>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#22543D', lineHeight: '1.6' }}>
                      {analisis.recomendacionAscenso}
                    </p>
                  </div>

                  <div style={{ padding: '20px', background: '#EBF4FF', borderRadius: '12px', borderLeft: '4px solid #3182CE', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#2A4365', display: 'flex', alignItems: 'center', gap: '8px' }}><Icons.GraduationCap size={20} /> {t('continuousTraining')}</h4>
                    {analisis.training_plan ? (
                      <div style={{ fontSize: '0.9rem', color: '#2C5282', lineHeight: '1.6' }}>
                        {renderMarkdown(analisis.training_plan)}
                      </div>
                    ) : (
                      <div>
                        <p style={{ margin: '0 0 16px 0', fontSize: '0.9rem', color: '#2C5282' }}>{t('noTrainingPlan')}</p>
                        <button onClick={generateTrainingPlan} style={{ padding: '8px 16px', background: '#3182CE', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Icons.Sparkles size={16} /> {t('generateAiPlan')}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#718096' }}>{t('loadingAnalysis')}</div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* Leaderboard Section */}
        <div style={{ marginTop: '40px', background: cardTheme, padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: `1px solid ${cardBorder}` }}>
          <h3 style={{ marginTop: 0, marginBottom: '24px', color: textTheme }}>{t('leaderboardTitle')}</h3>
          {leaderboard.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
              {leaderboard.sort((a,b) => b.avg_nps - a.avg_nps).map((dept, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: textTheme, fontWeight: 500, fontSize: '1.05rem' }}>
                    <span>{dept.department}</span>
                    <span style={{ color: '#48BB78', fontWeight: 'bold' }}>{Math.round(dept.avg_nps)} NPS</span>
                  </div>
                  <div style={{ width: '100%', height: '14px', background: 'var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${dept.avg_nps}%` }}
                      transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                      style={{ height: '100%', background: 'linear-gradient(90deg, #48BB78 0%, #38A169 100%)', borderRadius: '8px' }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: '#A0AEC0', border: '1px dashed #CBD5E0', borderRadius: '8px', background: 'rgba(0,0,0,0.01)' }}>
              <Icons.BarChart2 size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p style={{ margin: 0, fontSize: '1.1rem' }}>{t('notEnoughData')}</p>
            </div>
          )}
        </div>
          </>
        )}

        {currentTab === '9box' && (
          <div>
            <h1 style={{ color: textTheme, marginBottom: '20px' }}>{t('matrixTitle')}</h1>
            <p style={{ color: '#718096', marginBottom: '40px' }}>{t('matrixDesc')}</p>
            
            <div className="grid-9box" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', background: cardTheme, padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: `1px solid ${cardBorder}` }}>
              {['Enigma', 'High Potential', 'Future Leader', 'Dilemma', 'Core Player', 'High Performer', 'Underperformer', 'Effective Operator', 'Trusted Professional'].map(box => {
                const boxEmployees = empleados.filter(e => e.nineBox === box);
                return (
                  <div key={box} style={{ background: '#F7FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '16px', minHeight: '150px' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#4A5568', borderBottom: '2px solid #CBD5E0', paddingBottom: '8px', fontSize: '0.9rem' }}>{t('nineBoxDict')[box]} ({boxEmployees.length})</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {boxEmployees.map(emp => (
                        <div key={emp.id} onClick={() => verAnalisis(emp.id)} style={{ background: 'white', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '3px solid #6772E5' }}>
                          <span style={{ fontWeight: 'bold', color: '#2D3748' }}>{emp.nombre}</span>
                          <span style={{ color: '#718096', fontSize: '0.75rem' }}>NPS: {Math.round(emp.promedio_nps)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentTab === 'perfil' && (
          <div>
            <h1 style={{ color: textTheme, marginBottom: '20px' }}>Mi Perfil</h1>
            <p style={{ color: '#718096', marginBottom: '40px' }}>Actualiza tus datos personales, contraseña y foto de perfil.</p>
            
            <div style={{ background: cardTheme, padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: `1px solid ${cardBorder}`, maxWidth: '600px' }}>
              <form onSubmit={handleUpdateProfile}>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                  {profileData.profile_image ? (
                    <img src={profileData.profile_image} alt="Perfil" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: `2px solid var(--brand-primary)` }} />
                  ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#EDF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icons.User size={40} color="#A0AEC0" />
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: textTheme }}>Foto de Perfil</label>
                    <input type="file" accept="image/*" onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setProfileData({...profileData, file: e.target.files[0], profile_image: URL.createObjectURL(e.target.files[0])});
                      }
                    }} style={{ fontSize: '0.9em' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: textTheme }}>Nombre</label>
                  <input type="text" value={profileData.nombre} onChange={e => setProfileData({...profileData, nombre: e.target.value})} style={{ width: '100%', padding: '12px', border: `1px solid ${cardBorder}`, borderRadius: '6px', boxSizing: 'border-box', background: bgTheme, color: textTheme }} />
                </div>
                
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: textTheme }}>Nueva Contraseña (opcional)</label>
                  <input type="password" placeholder="Dejar en blanco para no cambiar" value={profileData.password} onChange={e => setProfileData({...profileData, password: e.target.value})} style={{ width: '100%', padding: '12px', border: `1px solid ${cardBorder}`, borderRadius: '6px', boxSizing: 'border-box', background: bgTheme, color: textTheme }} />
                </div>
                
                <button type="submit" style={{ padding: '14px 28px', backgroundColor: '#2D3748', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
                  Guardar Perfil
                </button>
              </form>
            </div>
          </div>
        )}

        {currentTab === 'config' && (
          <div>
            <h1 style={{ color: textTheme, marginBottom: '20px' }}>{t('configTitle')}</h1>
            <p style={{ color: '#718096', marginBottom: '40px' }}>{t('configDesc')}</p>
            
            <div style={{ background: cardTheme, padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: `1px solid ${cardBorder}`, maxWidth: '600px' }}>
              <form onSubmit={saveConfig}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: textTheme }}>{t('brandColor')}</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input type="color" value={config.brand_color} onChange={e => setConfig({...config, brand_color: e.target.value})} style={{ width: '50px', height: '50px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }} />
                    <input type="text" value={config.brand_color} onChange={e => setConfig({...config, brand_color: e.target.value})} style={{ padding: '10px', border: `1px solid ${cardBorder}`, borderRadius: '6px', width: '100px', background: bgTheme, color: textTheme }} />
                  </div>
                </div>
                
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: textTheme }}>{t('logoUrl')}</label>
                  <input type="text" value={config.logo_url} onChange={e => setConfig({...config, logo_url: e.target.value})} placeholder="https://mi-hotel.com/logo.png" style={{ width: '100%', padding: '12px', border: `1px solid ${cardBorder}`, borderRadius: '6px', boxSizing: 'border-box', background: bgTheme, color: textTheme }} />
                </div>
                
                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: textTheme }}>{t('slackWebhook')}</label>
                  <input type="text" value={config.slack_webhook_url || ''} onChange={e => setConfig({...config, slack_webhook_url: e.target.value})} placeholder="https://hooks.slack.com/services/..." style={{ width: '100%', padding: '12px', border: `1px solid ${cardBorder}`, borderRadius: '6px', boxSizing: 'border-box', background: bgTheme, color: textTheme }} />
                </div>
                
                <button type="submit" style={{ padding: '14px 28px', backgroundColor: '#2D3748', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
                  {t('saveChanges')}
                </button>
              </form>
            </div>
          </div>
        )}

        {currentTab === 'accesos' && userRole === 'admin' && (
          <div>
            <h1 style={{ color: textTheme, marginBottom: '20px' }}>Gestión de Accesos</h1>
            <p style={{ color: '#718096', marginBottom: '40px' }}>Crea cuentas para Jefes de Área. Ellos solo tendrán acceso a la información de los empleados de su departamento.</p>
            
            <div className="pipeline-container" style={{ display: 'flex', gap: '30px' }}>
              <div style={{ flex: 1, background: cardTheme, padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: `1px solid ${cardBorder}` }}>
                <h3 style={{ marginBottom: '20px', color: textTheme }}>Alta de Jefe de Área</h3>
                <form onSubmit={handleCreateAreaUser}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: textTheme }}>Nombre</label>
                    <input type="text" value={newAreaUser.nombre} onChange={e => setNewAreaUser({...newAreaUser, nombre: e.target.value})} required style={{ width: '100%', padding: '12px', border: `1px solid ${cardBorder}`, borderRadius: '6px', background: bgTheme, color: textTheme }} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: textTheme }}>Email</label>
                    <input type="email" value={newAreaUser.email} onChange={e => setNewAreaUser({...newAreaUser, email: e.target.value})} required style={{ width: '100%', padding: '12px', border: `1px solid ${cardBorder}`, borderRadius: '6px', background: bgTheme, color: textTheme }} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: textTheme }}>Contraseña</label>
                    <input type="password" value={newAreaUser.password} onChange={e => setNewAreaUser({...newAreaUser, password: e.target.value})} required style={{ width: '100%', padding: '12px', border: `1px solid ${cardBorder}`, borderRadius: '6px', background: bgTheme, color: textTheme }} />
                  </div>
                  <div style={{ marginBottom: '30px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: textTheme }}>Departamento Asignado</label>
                    <select value={newAreaUser.area_asignada} onChange={e => setNewAreaUser({...newAreaUser, area_asignada: e.target.value})} style={{ width: '100%', padding: '12px', border: `1px solid ${cardBorder}`, borderRadius: '6px', background: bgTheme, color: textTheme }}>
                      <option value="Front Desk">Front Desk</option>
                      <option value="Housekeeping">Housekeeping</option>
                      <option value="F&B">F&B</option>
                      <option value="Mantenimiento">Mantenimiento</option>
                      <option value="Spa">Spa / Termal</option>
                    </select>
                  </div>
                  <button type="submit" style={{ padding: '14px 28px', backgroundColor: '#2D3748', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
                    Crear Usuario
                  </button>
                </form>
              </div>

              <div style={{ flex: 1, background: cardTheme, padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: `1px solid ${cardBorder}` }}>
                <h3 style={{ marginBottom: '20px', color: textTheme }}>Usuarios Registrados</h3>
                {areaUsers.length === 0 ? (
                  <p style={{ color: '#718096' }}>No hay jefes de área registrados.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {areaUsers.map(u => (
                      <div key={u.id} style={{ padding: '15px', border: `1px solid ${cardBorder}`, borderRadius: '8px', background: bgTheme, marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: textTheme }}>{u.nombre}</div>
                            <div style={{ color: '#718096', fontSize: '0.9em' }}>{u.email}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ padding: '6px 12px', background: 'var(--brand-primary)', color: 'white', borderRadius: '20px', fontSize: '0.85em', fontWeight: 'bold' }}>
                              {u.area_asignada}
                            </div>
                            <button onClick={() => setEditingUser(u)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px' }}>
                              <Icons.Settings size={18} color="#718096" />
                            </button>
                          </div>
                        </div>
                        {editingUser && editingUser.id === u.id && (
                          <form onSubmit={handleUpdateAreaUser} style={{ marginTop: '15px', padding: '15px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{ display: 'block', fontSize: '0.85em', color: textTheme }}>Nombre</label>
                              <input type="text" value={editingUser.nombre} onChange={e => setEditingUser({...editingUser, nombre: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${cardBorder}` }} />
                            </div>
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{ display: 'block', fontSize: '0.85em', color: textTheme }}>Nueva Contraseña (dejar en blanco para no cambiar)</label>
                              <input type="password" value={editingUser.password || ''} onChange={e => setEditingUser({...editingUser, password: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: `1px solid ${cardBorder}` }} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button type="submit" style={{ padding: '8px 16px', background: 'var(--brand-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Guardar</button>
                              <button type="button" onClick={() => setEditingUser(null)} style={{ padding: '8px 16px', background: '#E2E8F0', color: '#4A5568', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                            </div>
                          </form>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
