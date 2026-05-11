import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard, LogOut, ShieldCheck, AlertTriangle, Plus,
  FileText, Sparkles, Clock, Building2, Landmark, Target, ChevronRight, ChevronDown,
  Upload, Info, ArrowLeft, CheckCircle, Printer, MessageCircle, Mail, Phone,
  FileSearch, User, ChevronLeft, Loader2, BarChart2, Bell, Lightbulb,
  AlertCircle, Save, TrendingUp, Zap, Activity, Database,
  FileSpreadsheet, PenLine, FolderOpen, ArrowRight, DollarSign,
  Shield, Brain, Cpu, AlertOctagon, X,
  TrendingDown, Trash2, Pencil, CalendarDays, Wallet, Receipt,
  Camera, Menu
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, ComposedChart
} from 'recharts'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import { formatBRL, formatCurrency, maskCNPJ, maskPhone, isValidEmail, isValidCNPJ, FILE_EMOJI, parseChartData } from './utils'
import { InputField, RadioGroup, TextAreaField, FileUploadField } from './components/FormComponents'
import { StepBar, StatusBadge, SemaforoCard, ScoreRing, IndicadorCard } from './components/UIComponents'
import { STEPS_V1, FormStepV1, STEPS_G, FormStepG, EMPTY_FORM, SCENARIOS } from './forms/steps'
import { calcMetrics, calcLiveMetrics, genCashFlowData, genLiveCashFlowData, genAlerts, genLiveAlerts } from './logic/metrics'
import { DRAFT_KEY, CHART_COLORS } from './config'
import ContasReceberView from './ContasReceberView'
import BancosContas from './BancosContas'
// ── SimComparativo ────────────────────────────────────────────────────────────
const SimComparativo = ({label, before, after, formato, lowerIsBetter=false}) => {
  const melhorou = lowerIsBetter ? after <= before : after >= before;
  const diff = Math.abs(after - before);
  const fmt = v => formato==='brl' ? formatBRL(v) : formato==='meses' ? `${Math.max(0,v).toFixed(1)}m` : `${v.toFixed(1)}%`;
  return (
    <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-2">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-400 text-sm font-bold line-through">{fmt(before)}</span>
        <span className="text-slate-300 text-xs">→</span>
        <span className={`text-xl font-black ${melhorou?'text-emerald-600':'text-red-500'}`}>{fmt(after)}</span>
        <span className={`ml-auto text-[9px] font-black px-2 py-0.5 rounded-full border ${melhorou?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-red-50 text-red-600 border-red-100'}`}>{melhorou?'▲':'▼'} {fmt(diff)}</span>
      </div>
    </div>
  );
};

// ── MultiFileDropzone ─────────────────────────────────────────────────────────
const MultiFileDropzone = () => {
  const [files,setFiles] = useState([]);
  const add = e => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev=>{
      const exist=new Set(prev.map(f=>f.name));
      return [...prev,...newFiles.filter(f=>!exist.has(f.name))];
    });
  };
  const remove = name => setFiles(prev=>prev.filter(f=>f.name!==name));
  const fmtSize = b => b<1048576?`${(b/1024).toFixed(0)} KB`:`${(b/1048576).toFixed(1)} MB`;
  return (
    <div className="space-y-3">
      <label className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center cursor-pointer hover:bg-slate-50 hover:border-[#137789]/40 transition-all group relative">
        <input type="file" multiple accept=".pdf,.xlsx,.xls,.csv,.ofx" onChange={add} className="absolute inset-0 opacity-0 cursor-pointer"/>
        <div className="w-14 h-14 bg-[#137789]/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Upload size={24} className="text-[#137789]"/></div>
        <p className="text-sm font-black text-[#05121b] uppercase tracking-wide mb-1">Arraste ou clique para selecionar</p>
        <p className="text-[10px] text-slate-400 text-center">DRE · Fluxo de Caixa · Extrato Bancário · Balanço</p>
        <p className="text-[9px] text-slate-400 mt-1">PDF, Excel (.xlsx), CSV, OFX · Múltiplos arquivos aceitos</p>
        {files.length>0&&<span className="mt-3 bg-[#137789] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">{files.length} arquivo{files.length>1?'s':''} selecionado{files.length>1?'s':''}</span>}
      </label>
      {files.length>0&&(
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{files.length} arquivo{files.length>1?'s':''} na fila</p>
            <button onClick={()=>setFiles([])} className="text-[9px] text-red-400 font-bold hover:text-red-600 transition-colors">Remover todos</button>
          </div>
          {files.map((f,i)=>(
            <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl">
              <span className="text-xl leading-none">{FILE_EMOJI(f.name)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[#05121b] truncate">{f.name}</p>
                <p className="text-[9px] text-slate-400">{fmtSize(f.size)}</p>
              </div>
              <button onClick={()=>remove(f.name)} className="text-slate-300 hover:text-red-400 transition-colors shrink-0"><X size={15}/></button>
            </div>
          ))}
          <button className="w-full mt-1 bg-[#137789] hover:bg-[#0e6070] text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"><Upload size={13}/> Enviar {files.length} arquivo{files.length>1?'s':''}</button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// §7  APP PRINCIPAL
//     Estado · Effects · Handlers · Render (Sidebar + todas as Views + Modals)
// ─────────────────────────────────────────────────────────────────────────────
const App = () => {
  const [view, setView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [formMode, setFormMode] = useState(null);
  const [formStep, setFormStep] = useState(0);
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [profileData, setProfileData] = useState({full_name:'',email:'',phone:'',cnpj:'',razao_social:''});
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [diagnostics, setDiagnostics] = useState([]);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [newlyCompleted, setNewlyCompleted] = useState(null);
  const [profileFilledForm, setProfileFilledForm] = useState(false);
  const [formData, setFormData] = useState({...EMPTY_FORM});
  const [simType, setSimType] = useState('aumentar_ticket');
  const [simValue, setSimValue] = useState('');
  const [simPct, setSimPct] = useState('');
  const [simGroup, setSimGroup] = useState('Todos');
  const [simResult, setSimResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [isDark, setIsDark] = useState(()=>{try{return localStorage.getItem('oluap_theme')==='dark';}catch{return false;}});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(()=>{
    try{localStorage.setItem('oluap_theme',isDark?'dark':'light');}catch{}
    let s=document.getElementById('oluap-dark-css');
    if(!s){s=document.createElement('style');s.id='oluap-dark-css';document.head.appendChild(s);}
    s.textContent=isDark?`
      /* ── FUNDAÇÃO ───────────────────────────────────────────────── */
      .dk{background-color:#0d1117!important;color:#e6edf3!important}

      /* ── BACKGROUNDS ────────────────────────────────────────────── */
      .dk aside.bg-white{background-color:#161b22!important;border-color:#30363d!important}
      .dk .bg-white{background-color:#1c2333!important}
      .dk .bg-slate-50{background-color:#161b22!important}
      .dk .bg-slate-100{background-color:#21262d!important}
      .dk .bg-slate-200{background-color:#2d333b!important}
      .dk .bg-white\\/95{background-color:rgba(22,27,34,0.97)!important}
      .dk .bg-\\[#f5f5f0\\]{background-color:#0d1117!important}
      /* Elementos intencionalmente escuros (botões ativos, nav, score card) ficam médio-escuro */
      .dk .bg-\\[#05121b\\]{background-color:#2d333b!important}

      /* ── BORDAS ─────────────────────────────────────────────────── */
      .dk .border-slate-50{border-color:#21262d!important}
      .dk .border-slate-100{border-color:#30363d!important}
      .dk .border-slate-200{border-color:#374151!important}
      .dk .border-slate-300{border-color:#484f58!important}
      .dk .border-\\[#05121b\\]{border-color:#4c5568!important}

      /* ── TEXTO – ESCURO VIRA CLARO ──────────────────────────────── */
      .dk .text-\\[#05121b\\]{color:#e6edf3!important}
      .dk .text-\\[#05121b\\]\\/50{color:rgba(230,237,243,0.55)!important}
      .dk .text-\\[#05121b\\]\\/60{color:rgba(230,237,243,0.65)!important}
      .dk .text-\\[#05121b\\]\\/70{color:rgba(230,237,243,0.75)!important}
      .dk .text-\\[#05121b\\]\\/80{color:rgba(230,237,243,0.85)!important}
      .dk .text-slate-900{color:#e6edf3!important}
      .dk .text-slate-800{color:#cdd9e5!important}
      .dk .text-slate-700{color:#c9d1d9!important}
      .dk .text-slate-600{color:#b1bac4!important}
      .dk .text-slate-500{color:#8b949e!important}
      .dk .text-slate-400{color:#6e7681!important}
      .dk .text-slate-300{color:#484f58!important}
      .dk .hover\\:text-\\[#05121b\\]:hover{color:#e6edf3!important}

      /* ── COR PRIMÁRIA TEAL – CLAREAR PARA DARK ──────────────────── */
      .dk .text-\\[#137789\\]{color:#56d3e6!important}
      .dk .hover\\:text-\\[#137789\\]:hover{color:#56d3e6!important}
      /* Backgrounds teal (botões primários mantêm a cor da marca) */
      .dk .bg-\\[#137789\\]\\/5{background-color:rgba(19,119,137,0.2)!important}
      .dk .bg-\\[#137789\\]\\/10{background-color:rgba(19,119,137,0.25)!important}
      .dk .border-\\[#137789\\]\\/20{border-color:rgba(86,211,230,0.3)!important}
      .dk .border-\\[#137789\\]\\/40{border-color:rgba(86,211,230,0.5)!important}
      .dk .ring-\\[#137789\\]{--tw-ring-color:rgba(86,211,230,0.4)!important}

      /* ── LARANJA ACCENT – CLAREAR LEVEMENTE ─────────────────────── */
      .dk .text-\\[#ff7b00\\]{color:#ffaa44!important}
      .dk .hover\\:text-\\[#ff7b00\\]:hover{color:#ffaa44!important}

      /* ── INPUTS E FORMULÁRIOS ───────────────────────────────────── */
      .dk input:not([type=range]):not([type=checkbox]):not([type=radio]),.dk textarea,.dk select{background-color:#161b22!important;border-color:#30363d!important;color:#c9d1d9!important}
      .dk input::placeholder,.dk textarea::placeholder{color:#6e7681!important}
      .dk .focus\\:border-\\[#137789\\]:focus{border-color:#56d3e6!important}
      .dk .focus\\:border-\\[#ff7b00\\]:focus{border-color:#ffaa44!important}

      /* ── TABELAS ────────────────────────────────────────────────── */
      .dk table thead tr{border-color:#30363d!important}
      .dk .divide-y>*+*{border-color:#30363d!important}

      /* ── SOMBRAS ────────────────────────────────────────────────── */
      .dk .shadow-sm{box-shadow:0 1px 4px rgba(0,0,0,.6)!important}
      .dk .shadow-md{box-shadow:0 4px 12px rgba(0,0,0,.7)!important}
      .dk .shadow-lg{box-shadow:0 4px 20px rgba(0,0,0,.7)!important}
      .dk .shadow-xl,.dk .shadow-2xl{box-shadow:0 8px 32px rgba(0,0,0,.8)!important}

      /* ── ESTADOS HOVER ──────────────────────────────────────────── */
      .dk .hover\\:bg-slate-50:hover{background-color:#21262d!important}
      .dk .hover\\:bg-slate-800:hover{background-color:#30363d!important}
      .dk .hover\\:bg-\\[#0e6070\\]:hover{background-color:#0e6070!important}
      .dk .hover\\:bg-\\[#0e5f6b\\]:hover{background-color:#0e5f6b!important}
      .dk .hover\\:bg-\\[#05121b\\]:hover,.dk .hover\\:bg-slate-900:hover{background-color:#30363d!important}
      .dk .hover\\:border-slate-200:hover{border-color:#484f58!important}
      .dk .hover\\:border-slate-300:hover{border-color:#4c5568!important}
      .dk .hover\\:text-red-400:hover{color:#f85149!important}

      /* ── VERDE (positivo) – MANTER ──────────────────────────────── */
      .dk .bg-emerald-50{background-color:#0b2318!important}
      .dk .bg-emerald-100{background-color:#0f2d1e!important}
      .dk .border-emerald-100{border-color:#1a4228!important}
      .dk .border-emerald-200{border-color:#2ea043!important}
      .dk .text-emerald-800{color:#56d364!important}
      .dk .text-emerald-700{color:#56d364!important}
      .dk .text-emerald-600{color:#3fb950!important}
      .dk .text-emerald-500{color:#3fb950!important}
      .dk .bg-emerald-500{background-color:#238636!important}

      /* ── VERMELHO (negativo) – MANTER ───────────────────────────── */
      .dk .bg-red-50{background-color:#2d1014!important}
      .dk .bg-red-100{background-color:#3d1217!important}
      .dk .border-red-100{border-color:#6e1a1a!important}
      .dk .border-red-200{border-color:#da3633!important}
      .dk .text-red-800{color:#f85149!important}
      .dk .text-red-700{color:#f85149!important}
      .dk .text-red-600{color:#f85149!important}
      .dk .text-red-500{color:#ff7b7b!important}
      .dk .text-red-400{color:#ff9898!important}
      .dk .hover\\:text-red-400:hover{color:#f85149!important}

      /* ── ÂMBAR (avisos) ─────────────────────────────────────────── */
      .dk .bg-amber-50{background-color:#2b1d0e!important}
      .dk .bg-amber-100{background-color:#332210!important}
      .dk .border-amber-100{border-color:#5a3c10!important}
      .dk .border-amber-200{border-color:#d29922!important}
      .dk .text-amber-800{color:#e3b341!important}
      .dk .text-amber-700{color:#e3b341!important}
      .dk .text-amber-600{color:#d29922!important}
      .dk .text-amber-500{color:#d29922!important}

      /* ── AZUL ───────────────────────────────────────────────────── */
      .dk .bg-blue-50{background-color:#0d1f2b!important}
      .dk .bg-blue-100{background-color:#0f2335!important}
      .dk .bg-blue-200{background-color:#1a3a4e!important}
      .dk .bg-blue-600{background-color:#1f6feb!important}
      .dk .hover\\:bg-blue-700:hover{background-color:#1a5cc0!important}
      .dk .border-blue-100{border-color:#1a3a4e!important}
      .dk .border-blue-200{border-color:#1f6feb!important}
      .dk .text-blue-800{color:#58a6ff!important}
      .dk .text-blue-700{color:#58a6ff!important}
      .dk .text-blue-600{color:#58a6ff!important}
      .dk .text-blue-500{color:#79c0ff!important}

      /* ── ROXO (Dívidas – comprometimento) ───────────────────────── */
      .dk .bg-purple-50{background-color:#1e1329!important}
      .dk .bg-purple-100{background-color:#281a3d!important}
      .dk .border-purple-100{border-color:#3b2d5e!important}
      .dk .border-purple-200{border-color:#6e40c9!important}
      .dk .text-purple-700{color:#c084fc!important}
      .dk .text-purple-600{color:#c084fc!important}
      .dk .text-purple-500{color:#d8b4fe!important}

      /* ── INLINE STYLES (attribute selectors) ───────────────────── */
      /* Cards de resumo verde */
      .dk [style*="#E1F5EE"]{background-color:#0b2318!important}
      .dk [style*="#9FE1CB"]{border-color:#2ea043!important}
      /* Cards de resumo vermelho */
      .dk [style*="#FCEBEB"]{background-color:#2d1014!important}
      .dk [style*="#F7C1C1"]{border-color:#da3633!important}
      /* Box de aviso âmbar */
      .dk [style*="#FAEEDA"]{background-color:#2b1d0e!important}
      .dk [style*="#EF9F27"]{border-color:#d29922!important}
      .dk [style*="#BA7517"]{background-color:#d29922!important}
      /* Botões inline da tabela fluxo */
      .dk [style*="#EAF3DE"]{background-color:#0b2318!important}
      /* Linhas de tabela com fundo */
      .dk [style*="rgba(5,18,27,0.04)"]{background-color:rgba(255,255,255,0.03)!important}
      .dk [style*="rgba(29,158,117,0.08)"]{background-color:rgba(29,158,117,0.12)!important}
      .dk [style*="rgba(216,90,48,0.08)"]{background-color:rgba(216,90,48,0.12)!important}
      /* Linha selecionada */
      .dk [style*="#f0f9ff"]{background-color:#0d1f2b!important}
      /* Tooltip customizado */
      .dk [style*="background:#fff"]{background-color:#1c2333!important;border-color:#30363d!important}
      .dk [style*="background: #fff"]{background-color:#1c2333!important;border-color:#30363d!important}
      /* TEXTOS EM INLINE STYLE */
      /* Texto escuro principal → branco */
      .dk [style*="color:#05121b"]{color:#e6edf3!important}
      .dk [style*="color: #05121b"]{color:#e6edf3!important}
      /* Verde (receita / positivo) → verde claro */
      .dk [style*="color:#085041"]{color:#56d364!important}
      .dk [style*="color: #085041"]{color:#56d364!important}
      .dk [style*="color:#1D9E75"]{color:#3fb950!important}
      .dk [style*="color: #1D9E75"]{color:#3fb950!important}
      .dk [style*="color:#3B6D11"]{color:#56d364!important}
      .dk [style*="color: #3B6D11"]{color:#56d364!important}
      /* Vermelho (despesa / negativo) → vermelho claro */
      .dk [style*="color:#791F1F"]{color:#f85149!important}
      .dk [style*="color: #791F1F"]{color:#f85149!important}
      .dk [style*="color:#D85A30"]{color:#f85149!important}
      .dk [style*="color: #D85A30"]{color:#f85149!important}
      .dk [style*="color:#A32D2D"]{color:#f85149!important}
      .dk [style*="color: #A32D2D"]{color:#f85149!important}
      /* Âmbar (aviso) */
      .dk [style*="color:#633806"]{color:#e3b341!important}
      .dk [style*="color: #633806"]{color:#e3b341!important}
      .dk [style*="color:#412402"]{color:#ffaa44!important}
      .dk [style*="color: #412402"]{color:#ffaa44!important}

      /* ── RECHARTS ───────────────────────────────────────────────── */
      .dk .recharts-default-tooltip{background-color:#1c2333!important;border-color:#30363d!important}
      .dk .recharts-tooltip-label{color:#c9d1d9!important}
      .dk .recharts-legend-item-text{color:#8b949e!important}
    `:'';
  },[isDark]);

  // ── Estado: módulo financeiro (bancos, lançamentos, contas, modals) ──────────
  const [bancos, setBancos] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [contasPagar, setContasPagar] = useState([]);
  const [contasReceber, setContasReceber] = useState([]);
  const [dividas, setDividas] = useState([]);
  const [fluxoFiltro, setFluxoFiltro] = useState('mensal');
  const [fluxoDataInicio, setFluxoDataInicio] = useState('');
  const [fluxoDataFim, setFluxoDataFim] = useState('');
  const [savingItem, setSavingItem] = useState(false);
  // Modal forms (null = closed, {} = new, {id:...} = editing)
  const [modalBanco, setModalBanco] = useState(null);
  const [modalReceita, setModalReceita] = useState(null);
  const [modalDespesa, setModalDespesa] = useState(null);
  const [modalImport, setModalImport] = useState(null);
  const [modalCP, setModalCP] = useState(null);
  const [modalSolicitarAnalise, setModalSolicitarAnalise] = useState(false);
  const [modalCR, setModalCR] = useState(null);
  const [modalDivida, setModalDivida] = useState(null);
  const [investimentos, setInvestimentos] = useState([]);
  const [modalInvestimento, setModalInvestimento] = useState(null);
  const [periodoReceitas, setPeriodoReceitas] = useState(null);
  const [filtroReceitas, setFiltroReceitas] = useState('todos');
  const [periodoDespesas, setPeriodoDespesas] = useState(null);
  const [cfoPeriodo, setCfoPeriodo] = useState('mensal');
  const [cfoDataInicio, setCfoDataInicio] = useState('');
  const [cfoDataFim, setCfoDataFim] = useState('');
  const [filtroDespesas, setFiltroDespesas] = useState('todos');
  const [fluxoTabFilter, setFluxoTabFilter] = useState('todos');
  const [cpFiltro, setCpFiltro] = useState('todos');
  const [cpMes, setCpMes] = useState(new Date().toISOString().slice(0,7));
  const [cpSelected, setCpSelected] = useState(new Set());
  const [recSelected, setRecSelected] = useState(new Set());
  const [despSelected, setDespSelected] = useState(new Set());
  const [modalPagarCP, setModalPagarCP] = useState(null);
  const [modalPagarCR, setModalPagarCR] = useState(null);
  const [lancamentosWindow, setLancamentosWindow] = useState(null); // YYYY-MM-DD: início da janela carregada
  const [cpCrWindow, setCpCrWindow] = useState(null);
  const [simDividaIdx, setSimDividaIdx] = useState(0);
  const [simDividaSlider, setSimDividaSlider] = useState(0);

  useEffect(()=>{
    if(formMode&&view==='form'){
      try{localStorage.setItem(DRAFT_KEY,JSON.stringify({formData,formMode,formStep}));}catch(e){}
    }
  },[formData,formMode,formStep,view]);

  useEffect(()=>{
    const h=e=>{if(view==='form'&&formMode){e.preventDefault();e.returnValue='';}};
    window.addEventListener('beforeunload',h);
    return()=>window.removeEventListener('beforeunload',h);
  },[view,formMode]);

  useEffect(()=>{
    const checkSession=async()=>{
      const {data:{session}}=await supabase.auth.getSession();
      if(session&&session.user){
        const cu=session.user;
        setUser(cu);
        fetchDiagnostics(cu.id);
        fetchFinanceiro(cu.id);
        try{if(localStorage.getItem(DRAFT_KEY))setHasDraft(true);}catch(e){}
        if(cu.user_metadata){
          const m=cu.user_metadata;
          setProfileData({full_name:m.full_name||'',email:cu.email||'',phone:m.phone||'',cnpj:m.cnpj||'',razao_social:m.razao_social||''});
          setAvatarUrl(m.avatar_url||'');
          setProfileFilledForm(!!(m.full_name||m.cnpj||m.razao_social));
          setFormData(prev=>({...prev,
            v1_responsavel:m.full_name||prev.v1_responsavel,v1_email:cu.email||prev.v1_email,v1_phone:m.phone||prev.v1_phone,v1_cnpj:m.cnpj||prev.v1_cnpj,v1_razao:m.razao_social||prev.v1_razao,
            g_responsavel:m.full_name||prev.g_responsavel,g_email:cu.email||prev.g_email,g_phone:m.phone||prev.g_phone,g_cnpj:m.cnpj||prev.g_cnpj,g_razao:m.razao_social||prev.g_razao,
          }));
        }
        setAuthChecking(false);
      } else {await supabase.auth.signOut();window.location.href='login.html';}
    };
    checkSession();
  },[]);

  const fetchDiagnostics=async(userId)=>{
    const{data}=await supabase.from('diagnosticos').select('*').eq('user_id',userId).order('created_at',{ascending:false});
    if(data){
      const mapped=data.map(d=>({...d,submittedAt:d.created_at}));
      setDiagnostics(mapped);
      const seenKey='oluap_seen_completed';
      let seen=[];try{seen=JSON.parse(localStorage.getItem(seenKey)||'[]');}catch(e){}
      const fresh=mapped.find(d=>d.internal_status==='completed'&&!seen.includes(d.id));
      if(fresh)setNewlyCompleted(fresh);
    }
  };

  const fetchFinanceiro=async(userId)=>{
    try{
      // Janela padrão: 13 meses (mês atual + 12 anteriores)
      const janela=new Date(); janela.setMonth(janela.getMonth()-12); janela.setDate(1);
      const dataInicio=janela.toISOString().slice(0,10);
      const[{data:bD},{data:lD},{data:cpD},{data:crD},{data:dD},{data:invD}]=await Promise.all([
        supabase.from('bancos').select('*').eq('user_id',userId).order('created_at'),
        // Lançamentos: apenas últimos 13 meses
        supabase.from('lancamentos').select('*').eq('user_id',userId).gte('data',dataInicio).order('data',{ascending:false}),
        // CP: tudo pendente + pagos dos últimos 13 meses
        supabase.from('contas_pagar').select('*').eq('user_id',userId).or(`status.neq.pago,vencimento.gte.${dataInicio}`).order('vencimento'),
        // CR: tudo pendente + recebidos dos últimos 13 meses
        supabase.from('contas_receber').select('*').eq('user_id',userId).or(`status.neq.recebido,vencimento.gte.${dataInicio}`).order('vencimento'),
        supabase.from('dividas').select('*').eq('user_id',userId).order('created_at'),
        supabase.from('investimentos').select('*').eq('user_id',userId).order('created_at'),
      ]);
      if(bD)setBancos(bD);
      if(lD)setLancamentos(lD);
      if(cpD)setContasPagar(cpD);
      if(crD)setContasReceber(crD);
      if(dD)setDividas(dD);
      if(invD)setInvestimentos(invD);
      setLancamentosWindow(dataInicio);
      setCpCrWindow(dataInicio);
    }catch(e){console.error('fetchFinanceiro',e);}
  };

  // Carrega lançamentos de um mês específico fora da janela padrão
  const carregarLancamentosMes=async(mesYYYYMM)=>{
    if(!user)return;
    const dataIni=`${mesYYYYMM}-01`;
    const d=new Date(mesYYYYMM+'-01'); d.setMonth(d.getMonth()+1); d.setDate(0);
    const dataFim=d.toISOString().slice(0,10);
    const{data:lD}=await supabase.from('lancamentos').select('*').eq('user_id',user.id).gte('data',dataIni).lte('data',dataFim).order('data',{ascending:false});
    if(lD?.length>0){
      setLancamentos(prev=>{
        const ids=new Set(prev.map(l=>l.id));
        return [...prev,...lD.filter(l=>!ids.has(l.id))].sort((a,b)=>b.data>a.data?1:-1);
      });
      setLancamentosWindow(prev=>(!prev||dataIni<prev)?dataIni:prev);
    }
  };

  // Carrega CP e CR de um mês específico fora da janela padrão
  const carregarCPCRMes=async(mesYYYYMM)=>{
    if(!user)return;
    const dataIni=`${mesYYYYMM}-01`;
    const d=new Date(mesYYYYMM+'-01'); d.setMonth(d.getMonth()+1); d.setDate(0);
    const dataFim=d.toISOString().slice(0,10);
    const[{data:cpD},{data:crD}]=await Promise.all([
      supabase.from('contas_pagar').select('*').eq('user_id',user.id).gte('vencimento',dataIni).lte('vencimento',dataFim),
      supabase.from('contas_receber').select('*').eq('user_id',user.id).gte('vencimento',dataIni).lte('vencimento',dataFim),
    ]);
    if(cpD?.length>0) setContasPagar(prev=>{const ids=new Set(prev.map(c=>c.id));return [...prev,...cpD.filter(c=>!ids.has(c.id))].sort((a,b)=>a.vencimento>b.vencimento?1:-1);});
    if(crD?.length>0) setContasReceber(prev=>{const ids=new Set(prev.map(c=>c.id));return [...prev,...crD.filter(c=>!ids.has(c.id))].sort((a,b)=>a.vencimento>b.vencimento?1:-1);});
    setCpCrWindow(prev=>(!prev||dataIni<prev)?dataIni:prev);
  };

  // Auto lazy-load: CFO período personalizado
  useEffect(()=>{
    if(!user||!lancamentosWindow)return;
    if(cfoPeriodo==='periodo'&&cfoDataInicio&&cfoDataInicio<lancamentosWindow)
      carregarLancamentosMes(cfoDataInicio.slice(0,7));
  },[cfoPeriodo,cfoDataInicio,lancamentosWindow]);

  // Auto lazy-load: Fluxo de caixa período personalizado
  useEffect(()=>{
    if(!user||!lancamentosWindow)return;
    if(fluxoFiltro==='periodo'&&fluxoDataInicio&&fluxoDataInicio<lancamentosWindow)
      carregarLancamentosMes(fluxoDataInicio.slice(0,7));
  },[fluxoFiltro,fluxoDataInicio,lancamentosWindow]);

  // Auto lazy-load: navegação de mês em CP
  useEffect(()=>{
    if(!user||!cpCrWindow)return;
    if(cpMes<cpCrWindow.slice(0,7)) carregarCPCRMes(cpMes);
  },[cpMes,cpCrWindow]);

  const cleanPayload=(obj)=>Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,v===''?null:v]));

  const saveItem=async(table,payload,setModal,resetList)=>{
    setSavingItem(true);
    const clean=cleanPayload(payload);
    try{
      if(clean.id){
        const{id,...rest}=clean;
        const{error}=await supabase.from(table).update(rest).eq('id',id);
        if(error)throw error;
      }else{
        const{error}=await supabase.from(table).insert(clean);
        if(error)throw error;
      }
      await resetList();
      setModal(null);
    }catch(e){console.error(e);alert(`Erro ao salvar: ${e.message||'Tente novamente'}`);}
    setSavingItem(false);
  };

  const deleteItem=async(table,id,resetList)=>{
    if(!confirm('Confirmar exclusão?'))return;
    await supabase.from(table).delete().eq('id',id);
    await resetList();
  };

  const handleImportFile=(file,tipoImport='despesa')=>{
    if(!file)return;
    const ext=file.name.split('.').pop().toLowerCase();
    // PDF / Word → show "received" stage (AI processing placeholder)
    if(['pdf','doc','docx'].includes(ext)){
      setModalImport({stage:'pdf_received',tipoImport,fileName:file.name});
      return;
    }
    const reader=new FileReader();
    reader.onload=(evt)=>{
      try{
        let rows;
        if(ext==='txt'||ext==='tsv'){
          // Parse as delimited text (tab or semicolon or comma)
          const text=evt.target.result;
          const lines=text.split(/\r?\n/).filter(l=>l.trim());
          const sep=text.includes('\t')?'\t':text.includes(';')?';':',';
          rows=lines.map(l=>l.split(sep).map(c=>c.replace(/^"|"$/g,'').trim()));
        } else {
          const wb=XLSX.read(evt.target.result,{type:'binary'});
          const ws=wb.Sheets[wb.SheetNames[0]];
          rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:''});
        }
        if(!rows.length){alert('Arquivo vazio ou sem dados.');return;}
        const headers=rows[0].map(h=>String(h||''));
        const detectCol=(h)=>{
          const l=h.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
          if(/data|date|\bdt\b|vencim/.test(l))return'data';
          if(/descri|histor|memo|lancam|narr|movimento|fornec/.test(l))return'descricao';
          if(/valor|value|amount|debito|debit|\bvl\b|r\$|saida|credito/.test(l))return'valor';
          if(/categ|tipo|type|class/.test(l))return'categoria';
          return'';
        };
        const mappings={data:'',descricao:'',valor:'',categoria:''};
        headers.forEach((h,i)=>{const f=detectCol(h);if(f&&mappings[f]==='')mappings[f]=String(i);});
        setModalImport({stage:'map',tipoImport,headers,rows:rows.slice(1),mappings});
      }catch(e){alert('Erro ao ler o arquivo. Verifique se é .csv, .xlsx ou .txt');}
    };
    if(ext==='txt'||ext==='tsv') reader.readAsText(file,'UTF-8');
    else reader.readAsBinaryString(file);
  };

  const confirmarImport=async()=>{
    if(!modalImport?.rows)return;
    const{rows,mappings,tipoImport}=modalImport;
    const today2=new Date().toISOString().split('T')[0];
    const parseData=(rd)=>{
      if(!rd)return today2;
      const pts=rd.split(/[\/\-\.]/);
      if(pts.length===3){
        if(pts[2]?.length===4)return`${pts[2]}-${pts[1].padStart(2,'0')}-${pts[0].padStart(2,'0')}`;
        if(pts[0]?.length===4)return rd.slice(0,10);
      }
      return today2;
    };
    const g=(r,k)=>mappings[k]!==''&&mappings[k]!==undefined?String(r[parseInt(mappings[k])]||'').trim():'';
    const parseValor=(s)=>{const raw=s.replace(/[^\d,\.]/g,'');return parseFloat(raw.includes(',')?raw.replace(',','.'):raw)||0;};
    setSavingItem(true);
    try{
      if(tipoImport==='contas_pagar'){
        const records=rows.filter(r=>r&&r.some(c=>c!=='')).map(r=>{
          const valor=parseValor(g(r,'valor'));
          if(!valor)return null;
          return{descricao:g(r,'descricao')||'Importado',valor,vencimento:parseData(g(r,'data')),categoria:g(r,'categoria')||'Outros',tipo_custo:'variavel',status:'pendente',user_id:user.id};
        }).filter(Boolean);
        if(!records.length){alert('Nenhum registro válido encontrado. Verifique o mapeamento.');setSavingItem(false);return;}
        await supabase.from('contas_pagar').insert(records);
        await fetchFinanceiro(user.id);
        setModalImport(null);
        alert(`${records.length} conta(s) a pagar importada(s) com sucesso!`);
      } else {
        const tipo=tipoImport==='receita'?'receita':'despesa';
        const records=rows.filter(r=>r&&r.some(c=>c!=='')).map(r=>{
          const valor=parseValor(g(r,'valor'));
          if(!valor)return null;
          return{descricao:g(r,'descricao')||'Importado',valor,data:parseData(g(r,'data')),categoria:g(r,'categoria')||'Outros',tipo,user_id:user.id,banco_id:null,meio_pagamento:''};
        }).filter(Boolean);
        if(!records.length){alert('Nenhum registro válido encontrado. Verifique o mapeamento.');setSavingItem(false);return;}
        await supabase.from('lancamentos').insert(records);
        await fetchFinanceiro(user.id);
        setModalImport(null);
        const label=tipo==='receita'?'receita(s)':'despesa(s)';
        alert(`${records.length} ${label} importada(s) com sucesso!`);
      }
    }catch(e){console.error(e);alert('Erro ao importar. Verifique os dados e tente novamente.');}
    setSavingItem(false);
  };

  const fmtDate=d=>d&&d.length>=10?`${d.slice(8,10)}/${d.slice(5,7)}/${d.slice(0,4)}`:'—';
  const today=new Date().toISOString().split('T')[0];

  // Saldo calculado por banco
  const saldoBanco=(bancoId)=>{
    const b=bancos.find(x=>x.id===bancoId);
    if(!b)return 0;
    const ent=lancamentos.filter(l=>l.banco_id===bancoId&&l.tipo==='receita').reduce((a,l)=>a+Number(l.valor),0);
    const sai=lancamentos.filter(l=>l.banco_id===bancoId&&l.tipo==='despesa').reduce((a,l)=>a+Number(l.valor),0);
    return Number(b.saldo_inicial)+ent-sai;
  };

  // Handlers chamados pelo BancosContas
  const handleSaveBancoFromBancosContas = async (payload) => {
    setSavingItem(true);
    try {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase.from('bancos').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('bancos').insert({ ...payload, user_id: user.id });
        if (error) throw error;
      }
      await fetchFinanceiro(user.id);
    } catch (e) { console.error(e); alert(`Erro ao salvar banco: ${e.message}`); }
    setSavingItem(false);
  };

  const handleDeleteBanco = async (id) => {
    setSavingItem(true);
    try {
      const { error } = await supabase.from('bancos').delete().eq('id', id);
      if (error) throw error;
      await fetchFinanceiro(user.id);
    } catch (e) { console.error(e); alert(`Erro ao excluir banco: ${e.message}`); }
    setSavingItem(false);
  };

  const handleSaveLancamentoEspecie = async (payload) => {
    setSavingItem(true);
    try {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase.from('lancamentos').update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lancamentos').insert({ ...payload, user_id: user.id });
        if (error) throw error;
      }
      await fetchFinanceiro(user.id);
    } catch (e) { console.error(e); alert(`Erro ao salvar movimentação: ${e.message}`); }
    setSavingItem(false);
  };

  const handleDeleteLancamentos = async (ids) => {
    setSavingItem(true);
    try {
      const { error } = await supabase.from('lancamentos').delete().in('id', ids);
      if (error) throw error;
      await fetchFinanceiro(user.id);
    } catch (e) { console.error(e); alert(`Erro ao excluir lançamento: ${e.message}`); }
    setSavingItem(false);
  };

  const handleSalvarCR = async (payload) => {
    setSavingItem(true);
    try {
      const { id, ...data } = payload;
      if (id) {
        await supabase.from('contas_receber').update({ ...data }).eq('id', id);
      } else {
        await supabase.from('contas_receber').insert({ ...data, user_id: user.id });
      }
      await fetchFinanceiro(user.id);
    } catch (e) { console.error(e); }
    setSavingItem(false);
  };

  const handleReceberCR = async (id, meioPagamento, dataPagamento, bancoId, cat) => {
    setSavingItem(true);
    try {
      const dp = dataPagamento || new Date().toISOString().slice(0,10);
      const { data: cr } = await supabase.from('contas_receber').select('descricao,valor').eq('id', id).single();
      await supabase.from('contas_receber').update({
        status: 'recebido',
        meio_pagamento: meioPagamento,
        data_pagamento: dp,
      }).eq('id', id);
      if (cr) {
        await supabase.from('lancamentos').insert({
          descricao: cr.descricao,
          valor: Number(cr.valor),
          data: dp,
          categoria: cat || 'Receitas',
          tipo: 'receita',
          meio_pagamento: meioPagamento,
          banco_id: bancoId || null,
          user_id: user.id,
        });
      }
      await fetchFinanceiro(user.id);
    } catch (e) { console.error(e); alert(`Erro ao registrar recebimento: ${e.message}`); }
    setSavingItem(false);
  };

  const handlePagamentoParcial = async ({ id, desc, valorPago, novaData, dataRecebimento, meio, bancoId, cat, valorTotal }) => {
    setSavingItem(true);
    try {
      const dp = dataRecebimento || new Date().toISOString().slice(0,10);
      const resto = Number(valorTotal) - Number(valorPago);
      await supabase.from('contas_receber').update({
        valor: resto > 0 ? resto : 0,
        vencimento: novaData,
        status: resto > 0 ? 'parcial' : 'recebido',
        data_pagamento: resto > 0 ? null : dp,
      }).eq('id', id);
      await supabase.from('lancamentos').insert({
        descricao: `${desc} (parcial)`,
        valor: Number(valorPago),
        data: dp,
        categoria: cat || 'Receitas',
        tipo: 'receita',
        meio_pagamento: meio,
        banco_id: bancoId || null,
        user_id: user.id,
      });
      await fetchFinanceiro(user.id);
    } catch (e) { console.error(e); alert(`Erro ao registrar pagamento parcial: ${e.message}`); }
    setSavingItem(false);
  };

  const handleExcluirCR = async (ids) => {
    setSavingItem(true);
    try {
      await supabase.from('contas_receber').delete().in('id', ids);
      await fetchFinanceiro(user.id);
    } catch (e) { console.error(e); }
    setSavingItem(false);
  };

  const handleConfirmPagarCP = async () => {
    if (!modalPagarCP) return;
    const { id, desc, valor, meioPagamento, bancoId, dataPagamento, cat, tipo_custo } = modalPagarCP;
    setSavingItem(true);
    try {
      const dp = dataPagamento || today;
      await supabase.from('contas_pagar').update({ status: 'pago', meio_pagamento: meioPagamento, data_pagamento: dp }).eq('id', id);
      await supabase.from('lancamentos').insert({
        descricao: desc, valor: Number(valor), data: dp,
        categoria: cat || 'Outros', tipo: 'despesa',
        meio_pagamento: meioPagamento,
        banco_id: bancoId || null,
        tipo_custo: tipo_custo || 'variavel',
        user_id: user.id,
      });
      await fetchFinanceiro(user.id);
      setModalPagarCP(null);
    } catch (e) { console.error(e); alert(`Erro ao registrar pagamento: ${e.message}`); }
    setSavingItem(false);
  };

  const markAsSeen=id=>{
    try{const k='oluap_seen_completed';let s=JSON.parse(localStorage.getItem(k)||'[]');if(!s.includes(id)){s.push(id);localStorage.setItem(k,JSON.stringify(s));}}catch(e){}
    setNewlyCompleted(null);
  };

  const handleUpdateProfile=async(e)=>{
    e.preventDefault();setIsUpdatingProfile(true);setProfileSuccess("");
    const{error}=await supabase.auth.updateUser({data:{full_name:profileData.full_name,phone:profileData.phone,cnpj:profileData.cnpj,razao_social:profileData.razao_social}});
    setIsUpdatingProfile(false);
    if(!error){
      setProfileSuccess("Perfil atualizado!");
      setFormData(prev=>({...prev,v1_responsavel:profileData.full_name,v1_phone:profileData.phone,v1_cnpj:profileData.cnpj,v1_razao:profileData.razao_social,g_responsavel:profileData.full_name,g_phone:profileData.phone,g_cnpj:profileData.cnpj,g_razao:profileData.razao_social}));
      setProfileFilledForm(true);setTimeout(()=>setProfileSuccess(""),4000);
    }
  };

  const handleAvatarUpload=(e)=>{
    const file=e.target.files?.[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      const img=new Image();
      img.onload=async()=>{
        const canvas=document.createElement('canvas');
        const size=160;
        canvas.width=size;canvas.height=size;
        const ctx=canvas.getContext('2d');
        const min=Math.min(img.width,img.height);
        const sx=(img.width-min)/2;
        const sy=(img.height-min)/2;
        ctx.drawImage(img,sx,sy,min,min,0,0,size,size);
        const dataUrl=canvas.toDataURL('image/jpeg',0.85);
        setAvatarUrl(dataUrl);
        await supabase.auth.updateUser({data:{avatar_url:dataUrl}});
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleLogout=async()=>{await supabase.auth.signOut();window.location.href='login.html';};
  const handleBackToHub=()=>{window.location.href='hub_cliente.html';};
  const handleResumeDraft=()=>{try{const s=JSON.parse(localStorage.getItem(DRAFT_KEY));if(s){setFormData(s.formData);setFormMode(s.formMode);setFormStep(s.formStep||0);setView('form');setHasDraft(false);}}catch(e){}};
  const handleDiscardDraft=()=>{try{localStorage.removeItem(DRAFT_KEY);}catch(e){}setHasDraft(false);};

  const getStepRequiredFields=(isV1,step)=>{
    if(isV1){const sf=[["v1_razao","v1_cnpj","v1_responsavel","v1_email","v1_phone","v1_segmento","v1_tempoOperacao","v1_numFuncionarios","v1_controleFinanceiro"],["v1_fatMedio","v1_fat12","v1_mixFaturamento","v1_numVendas","v1_lucra","v1_meios","v1_inadimplencia"],["v1_custosDiretos","v1_taxaRecebimento","v1_folha","v1_prolabore","v1_mkt","v1_estrutura"],["v1_descricaoDividas","v1_saldo","v1_reserva","v1_detalhesCredito"],["v1_desafio","v1_objetivo"]];return sf[step]||[];}
    else{const sf=[["g_razao","g_cnpj","g_responsavel","g_email","g_phone"],["g_oqueVende","g_tempoExistencia","g_pessoas","g_faturamento","g_mixFaturamento","g_meioVenda","g_frequencia","g_sobrePreco","g_produtoLucrativo"],["g_aluguel","g_gastoFunc","g_prolabore","g_custosDiretos","g_taxaMaquininha","g_outrosFixos","g_raloDinheiro"],["g_descricaoDividas","g_contasEmDia","g_misturaContas","g_folegoCaixa"],["g_desafio","g_futuro"]];return sf[step]||[];}
  };

  const validateStep=()=>{
    const isV1=formMode==='standard';
    const required=getStepRequiredFields(isV1,formStep);
    const errs={};let hasErr=false,missing=0,msg="";
    required.forEach(f=>{if(!formData[f]||formData[f].toString().trim()===""){errs[f]=true;hasErr=true;missing++;}});
    if(formStep===0){
      const em=isV1?formData.v1_email:formData.g_email;
      const cn=isV1?formData.v1_cnpj:formData.g_cnpj;
      if(em&&!isValidEmail(em)){errs[isV1?'v1_email':'g_email']=true;hasErr=true;msg="E-mail inválido.";}
      if(cn&&!isValidCNPJ(cn)){errs[isV1?'v1_cnpj':'g_cnpj']=true;hasErr=true;msg="CNPJ inválido.";}
    }
    if(hasErr){
      setFieldErrors(errs);
      if(missing>0)msg=`${missing} campo${missing>1?'s obrigatórios':' obrigatório'} não preenchido${missing>1?'s':''}.`;
      setFormError(msg);
      setTimeout(()=>{const el=document.getElementById(`field-${Object.keys(errs)[0]}`);if(el)el.scrollIntoView({behavior:'smooth',block:'center'});},100);
      return false;
    }
    setFieldErrors({});setFormError("");return true;
  };

  const handleNextStep=()=>{
    if(!validateStep())return;
    const total=formMode==='standard'?STEPS_V1.length:STEPS_G.length;
    if(formStep<total-1){setFormStep(s=>s+1);window.scrollTo({top:0,behavior:'smooth'});}
  };
  const handlePrevStep=()=>{if(formStep>0){setFormStep(s=>s-1);setFormError("");setFieldErrors({});window.scrollTo({top:0,behavior:'smooth'});}};

  const validateAndSubmit=async()=>{
    if(!validateStep())return;
    setIsSubmitting(true);setFormError("Salvando...");
    try{
      if(!user)throw new Error("Sessão expirada.");
      const isV1=formMode==='standard';
      const payload={user_id:user.id,client_name:isV1?formData.v1_responsavel:formData.g_responsavel,razao_social:isV1?formData.v1_razao:formData.g_razao,cnpj:maskCNPJ(isV1?formData.v1_cnpj:formData.g_cnpj),email:isV1?formData.v1_email:formData.g_email,telefone:isV1?formData.v1_phone:formData.g_phone,status:"⏳ Em análise",internal_status:"pending",form_type:isV1?'Estruturado':'Guiado',data:formData};
      const{error}=await supabase.from('diagnosticos').insert([payload]);
      if(error)throw new Error(error.message);
      try{localStorage.removeItem(DRAFT_KEY);}catch(e){}
      setFormData({...EMPTY_FORM});await fetchDiagnostics(user.id);setFormMode(null);setFormStep(0);setHasDraft(false);setView('success');
    }catch(err){setFormError("ERRO: "+err.message);}
    finally{setIsSubmitting(false);}
  };

  const handleViewResult=s=>{markAsSeen(s.id);setFormData(s.data);setFormMode(s.form_type==='Estruturado'?'standard':'guided');setSelectedSubmission(s);setView('result');window.scrollTo({top:0,behavior:'smooth'});};
  const handleViewSubmissionData=s=>{setFormData(s.data);setFormMode(s.form_type==='Estruturado'?'standard':'guided');setSelectedSubmission(s);setView('view_data');window.scrollTo({top:0,behavior:'smooth'});};
  const handleDownloadAdminPDF=()=>{if(selectedSubmission?.admin_result_pdf)window.open(selectedSubmission.admin_result_pdf,'_blank');else alert("PDF ainda não disponível.");};
  const handleContactExpert=()=>{window.open("https://wa.me/5511999999999?text=Olá, gostaria de falar sobre meu diagnóstico OLUAP.","_blank");};

  const handleSimulate=async()=>{
    setSimLoading(true);setSimResult(null);
    await new Promise(r=>setTimeout(r,1000));
    const sc=SCENARIOS.find(s=>s.id===simType)||SCENARIOS[0];
    const raw=sc.tipo==='pct'
      ?parseFloat(simPct||'0')
      :parseFloat((simValue.replace(/\D/g,'')||'0'))/100;
    if(!metrics){setSimResult({noMetrics:true});setSimLoading(false);return;}
    let dR=0,dCF=0,dCV=0,dS=0,insight='';
    if(sc.id==='aumentar_ticket'){dR=metrics.receita*(raw/100);insight=`Com preços ${raw.toFixed(1)}% maiores, o resultado mensal melhora ${formatBRL(dR)}.`;}
    else if(sc.id==='queda_receita'){dR=-(metrics.receita*(raw/100));insight=`Queda de ${raw.toFixed(1)}%: você perde ${formatBRL(Math.abs(dR))}/mês de receita.`;}
    else if(sc.id==='perda_cliente'){dR=-raw;insight=`Sem esse contrato, o resultado mensal cai ${formatBRL(raw)}.`;}
    else if(sc.id==='novo_contrato'){dR=raw;insight=`Novo contrato de ${formatBRL(raw)}/mês melhora margem e runway imediatamente.`;}
    else if(sc.id==='contratar_func'){dCF=raw*1.3;insight=`Salário de ${formatBRL(raw)} + encargos = ${formatBRL(raw*1.3)}/mês de custo fixo novo.`;}
    else if(sc.id==='nova_despesa'){dCF=raw;insight=`Nova despesa de ${formatBRL(raw)}/mês reduz seu runway.`;}
    else if(sc.id==='reduzir_custo'){dCF=-raw;insight=`Cortar ${formatBRL(raw)}/mês libera ${formatBRL(raw*12)}/ano no caixa.`;}
    else if(sc.id==='investimento'){dS=-raw;insight=`Investimento de ${formatBRL(raw)} sai imediatamente do caixa.`;}
    else if(sc.id==='emprestimo'){dS=raw;dCF=raw/12;insight=`Captação de ${formatBRL(raw)}: entra no caixa agora, mas parcela de ${formatBRL(raw/12)}/mês pesa nos custos.`;}
    else if(sc.id==='pagar_divida'){dCF=-raw;dS=-raw;insight=`Quitar ${formatBRL(raw)}/mês: melhora a margem futura, mas consome ${formatBRL(raw)} de caixa hoje.`;}
    const nR=metrics.receita+dR;
    const nCF=Math.max(0,metrics.custFix+dCF);
    const nCV=Math.max(0,metrics.custVar+dCV);
    const nTotal=nCF+nCV;
    const nLucro=nR-nTotal;
    const nMargLiq=nR>0?(nLucro/nR)*100:0;
    const nMargC=nR>0?((nR-nCV)/nR)*100:0;
    const nPontoEq=nMargC>0?nCF/(nMargC/100):0;
    const nSaldo=Math.max(0,metrics.saldo+dS);
    const nRunway=nTotal>0&&nSaldo>0?nSaldo/nTotal:0;
    setSimResult({
      before:{lucro:metrics.lucro,margLiq:metrics.margLiq,runway:metrics.runwayMeses,pontoEq:metrics.pontoEq},
      after:{lucro:nLucro,margLiq:nMargLiq,runway:nRunway,pontoEq:nPontoEq},
      insight,positivo:nLucro>=metrics.lucro
    });
    setSimLoading(false);
  };

  if(authChecking)return(<div className="min-h-screen bg-[#05121b] flex items-center justify-center"><Loader2 className="animate-spin text-[#ff7b00]" size={32}/></div>);

  const parsedCharts=selectedSubmission?.chart_data_input?parseChartData(selectedSubmission.chart_data_input):null;
  const hasCharts=parsedCharts&&(parsedCharts.estruturaResultado.length>0||parsedCharts.despesasOperacionais.length>0);
  const isV1=formMode==='standard';
  const currentSteps=isV1?STEPS_V1:STEPS_G;
  const isLastStep=formStep===currentSteps.length-1;

  const navItems=[
    {id:'dashboard',       label:'Dashboard',             icon:LayoutDashboard},
    {id:'alertas',         label:'CFO Digital',           icon:Brain},
    {id:'fluxo',           label:'Fluxo de Caixa',        icon:Activity},
    {id:'receitas',        label:'Receitas',              icon:TrendingUp},
    {id:'despesas',        label:'Despesas',              icon:TrendingDown},
    {id:'contas_pagar',    label:'Contas a Pagar',        icon:Receipt},
    {id:'contas_receber',  label:'Contas a Receber',      icon:Wallet},
    {id:'simulador',       label:'Simulador de Cenários', icon:Zap},
    {id:'dividas',         label:'Dívidas',               icon:AlertOctagon},
    {id:'bancos',          label:'Bancos',                icon:Landmark},
    {id:'investimentos',   label:'Investimentos',         icon:DollarSign},
    {id:'fontes',          label:'Fonte de Dados',        icon:Database},
    {id:'analises',        label:'Meus Diagnósticos',     icon:FolderOpen},
    {id:'relatorios',      label:'Relatórios',            icon:FileSpreadsheet},
    {id:'profile',         label:'Meu Perfil',            icon:User},
  ];

  const liveMetrics = calcLiveMetrics(lancamentos, bancos, dividas);
  const metrics = liveMetrics;
  const cashFlowData = genLiveCashFlowData(lancamentos);
  const usingLiveData = cashFlowData.some(d=>d.Entradas>0||d.Saidas>0);
  const alertsFeed = liveMetrics ? genLiveAlerts(liveMetrics, contasPagar, contasReceber, dividas, today) : [];
  const lancamentosParaCFO = (() => {
    if (cfoPeriodo === 'mensal') return null;
    const d = new Date();
    if (cfoPeriodo === 'diaria') return lancamentos.filter(l => l.data === today);
    if (cfoPeriodo === 'semanal') {
      const s = new Date(d); s.setDate(s.getDate() - 6);
      const si = s.toISOString().slice(0,10);
      return lancamentos.filter(l => l.data && l.data >= si && l.data <= today);
    }
    if (cfoPeriodo === 'anual') {
      const y = d.getFullYear().toString();
      return lancamentos.filter(l => l.data && l.data.startsWith(y));
    }
    if (cfoPeriodo === 'periodo' && cfoDataInicio && cfoDataFim)
      return lancamentos.filter(l => l.data && l.data >= cfoDataInicio && l.data <= cfoDataFim);
    return null;
  })();
  const cfoMetrics = lancamentosParaCFO != null ? calcLiveMetrics(lancamentos, bancos, dividas, lancamentosParaCFO) : liveMetrics;

  // KPIs: Custo Fixo Real & Ponto de Equilíbrio (baseados na classificação fixa/variável)
  const mesAtualPE = new Date().toISOString().slice(0, 7);
  // Contas a pagar fixas não pagas do mês (evita dupla contagem com lançamentos gerados ao pagar)
  const itensFixosCP = contasPagar.filter(cp => (cp.tipo_custo || 'variavel') === 'fixa' && cp.status !== 'pago' && cp.vencimento?.startsWith(mesAtualPE));
  // Lançamentos de despesa fixos do mês (inclui contas a pagar já pagas que viraram lançamento)
  const itensFixosLanc = lancamentos.filter(l => l.tipo === 'despesa' && (l.tipo_custo || 'variavel') === 'fixa' && l.data?.startsWith(mesAtualPE));
  const custoFixoMensal = itensFixosCP.reduce((a, cp) => a + Number(cp.valor), 0) + itensFixosLanc.reduce((a, l) => a + Number(l.valor), 0);
  const receitaMensal = lancamentos.filter(l => l.tipo === 'receita' && l.data?.startsWith(mesAtualPE)).reduce((a, l) => a + Number(l.valor), 0);
  const custVarMensal = lancamentos.filter(l => l.tipo === 'despesa' && (l.tipo_custo || 'variavel') === 'variavel' && l.data?.startsWith(mesAtualPE)).reduce((a, l) => a + Number(l.valor), 0);
  const margemContribPct = receitaMensal > 0 ? (receitaMensal - custVarMensal) / receitaMensal : 0;
  const pontoEquilibrioReal = margemContribPct > 0 ? custoFixoMensal / margemContribPct : (custoFixoMensal > 0 ? custoFixoMensal : 0);

  // PMR / PMP live: (total pendente / receita ou custo mensal) × 30 dias
  const totalCRPendente = contasReceber.filter(cr => cr.status !== 'recebido').reduce((a, cr) => a + Number(cr.valor), 0);
  const totalCPPendente = contasPagar.filter(cp => cp.status !== 'pago').reduce((a, cp) => a + Number(cp.valor), 0);
  const pmrLive = receitaMensal > 0 ? Math.round((totalCRPendente / receitaMensal) * 30) : 0;
  const pmpLive = liveMetrics && liveMetrics.totalCust > 0 ? Math.round((totalCPPendente / liveMetrics.totalCust) * 30) : 0;

  // Projeção do próximo mês: média dos últimos 3 meses
  const getMonthData = (monthsAgo) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - monthsAgo);
    const m = d.toISOString().slice(0, 7);
    const rec = lancamentos.filter(l => l.tipo === 'receita' && l.data?.startsWith(m)).reduce((a, l) => a + Number(l.valor), 0);
    const desp = lancamentos.filter(l => l.tipo === 'despesa' && l.data?.startsWith(m)).reduce((a, l) => a + Number(l.valor), 0);
    return { rec, desp };
  };
  const [pm1, pm2, pm3] = [1, 2, 3].map(getMonthData);
  const projecaoReceita = (pm1.rec + pm2.rec + pm3.rec) / 3;
  const projecaoDespesa = (pm1.desp + pm2.desp + pm3.desp) / 3;
  const projecaoLucro = projecaoReceita - projecaoDespesa;
  const hasProjecao = projecaoReceita > 0 || projecaoDespesa > 0;

  // Inadimplência: aging por faixa
  const inadVencidas = contasReceber.filter(cr => cr.status !== 'recebido' && cr.vencimento && cr.vencimento < today);
  const diasAtraso = (venc) => Math.floor((new Date(today) - new Date(venc)) / 86400000);
  const inad30 = inadVencidas.filter(cr => diasAtraso(cr.vencimento) < 30);
  const inad60 = inadVencidas.filter(cr => { const d = diasAtraso(cr.vencimento); return d >= 30 && d < 60; });
  const inad60p = inadVencidas.filter(cr => diasAtraso(cr.vencimento) >= 60);
  const totalInad = inadVencidas.reduce((a, cr) => a + Number(cr.valor), 0);
  const totalInad30 = inad30.reduce((a, cr) => a + Number(cr.valor), 0);
  const totalInad60 = inad60.reduce((a, cr) => a + Number(cr.valor), 0);
  const totalInad60p = inad60p.reduce((a, cr) => a + Number(cr.valor), 0);
  const inadIndice = receitaMensal > 0 ? (totalInad / receitaMensal) * 100 : 0;

  // Receita recorrente vs. avulsa: detecta por descrição em múltiplos meses
  const descMesesMap = {};
  lancamentos.filter(l => l.tipo === 'receita').forEach(l => {
    const mes = l.data?.slice(0, 7);
    const desc = (l.descricao || '').toLowerCase().trim();
    if (!desc || !mes) return;
    if (!descMesesMap[desc]) descMesesMap[desc] = new Set();
    descMesesMap[desc].add(mes);
  });
  const descsRecorrentes = new Set(Object.keys(descMesesMap).filter(d => descMesesMap[d].size >= 2));
  const receitasMesAtualList = lancamentos.filter(l => l.tipo === 'receita' && l.data?.startsWith(mesAtualPE));
  const receitaRecorrente = receitasMesAtualList.filter(l => descsRecorrentes.has((l.descricao || '').toLowerCase().trim())).reduce((a, l) => a + Number(l.valor), 0);
  const receitaAvulsa = receitaMensal - receitaRecorrente;
  const pctRecorrente = receitaMensal > 0 ? (receitaRecorrente / receitaMensal) * 100 : 0;

  const AC={red:{bg:'bg-red-50',border:'border-red-100',ic:'text-red-500'},yellow:{bg:'bg-amber-50',border:'border-amber-100',ic:'text-amber-500'},green:{bg:'bg-emerald-50',border:'border-emerald-100',ic:'text-emerald-500'}};

  const firstName=(profileData.full_name||'Cliente').split(' ')[0];

  // ── RENDER ────────────────────────────────────────────────────────────────
  return(
    <div className={`min-h-screen bg-[#f5f5f0] flex text-[#05121b] overflow-x-hidden${isDark?' dk':''}`}>

      {/* Mobile overlay */}
      {mobileOpen&&<div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={()=>setMobileOpen(false)}/>}

      <aside className={`bg-white h-screen border-r border-slate-100 py-5 flex flex-col fixed left-0 top-0 z-40 print:hidden transition-all duration-300
        ${isSidebarOpen?'w-56 px-4':'w-16 px-2'}
        ${mobileOpen?'translate-x-0':'-translate-x-full lg:translate-x-0'}`}>
        <button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="hidden lg:flex absolute -right-3 top-8 bg-white border border-slate-200 p-1.5 rounded-full shadow-sm text-slate-400 hover:text-[#ff7b00] z-50 items-center justify-center transition-all hover:scale-110">
          <ChevronLeft size={13} style={{transform:isSidebarOpen?'rotate(0deg)':'rotate(180deg)',transition:'transform 0.3s'}}/>
        </button>
        <div className={`flex items-center ${isSidebarOpen?'justify-start px-1':'justify-center'} mb-6 mt-1`}>
          {isSidebarOpen?<img src="logo2.png" alt="OLUAP" className="h-7 object-contain" onError={e=>{e.target.style.display='none';}}/>:<img src="icone.png" alt="OLUAP" className="w-7 h-7 object-contain" onError={e=>{e.target.style.display='none';}}/>}
        </div>
        <nav className="flex-1 space-y-1 mt-2 overflow-y-auto min-h-0" style={{scrollbarWidth:'thin',scrollbarColor:'#e2e8f0 transparent'}}>
          {navItems.map(item=>{
            const I=item.icon;
            const active=view===item.id||(item.id==='analises'&&(view==='success'||view==='result'||view==='view_data'));
            const handleNavClick = () => {
              if (item.id === 'nova_analise') { setFormMode(null); setFormStep(0); setView('form'); }
              else setView(item.id);
              setMobileOpen(false);
            };
            return(<button key={item.id} onClick={handleNavClick} title={!isSidebarOpen?item.label:''}
              className={`w-full flex items-center ${isSidebarOpen?'justify-start gap-3 px-3':'justify-center px-0'} py-2.5 rounded-xl font-bold text-[11px] transition-all ${active?'bg-[#05121b] text-white shadow-md':'text-slate-400 hover:bg-slate-50 hover:text-[#05121b]'}`}>
              <I size={isSidebarOpen?16:20} className="shrink-0"/>
              {isSidebarOpen&&<span className="truncate">{item.label}</span>}
              {isSidebarOpen&&item.id==='dashboard'&&newlyCompleted&&<span className="ml-auto w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0"></span>}
            </button>);
          })}
        </nav>
        <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-slate-100">
          <button onClick={handleBackToHub} title={!isSidebarOpen?'Hub':''} className={`w-full flex items-center ${isSidebarOpen?'justify-start gap-3 px-3':'justify-center px-0'} py-2.5 text-slate-400 font-bold text-[11px] hover:text-[#137789] hover:bg-slate-50 rounded-xl transition-colors`}>
            <ArrowLeft size={isSidebarOpen?16:20} className="shrink-0"/>{isSidebarOpen&&<span>Voltar ao Hub</span>}
          </button>
          <button onClick={handleLogout} title={!isSidebarOpen?'Sair':''} className={`w-full flex items-center ${isSidebarOpen?'justify-start gap-3 px-3':'justify-center px-0'} py-2.5 text-slate-400 font-bold text-[11px] hover:text-red-500 hover:bg-slate-50 rounded-xl transition-colors`}>
            <LogOut size={isSidebarOpen?16:20} className="shrink-0"/>{isSidebarOpen&&<span>Sair</span>}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen?'lg:ml-56':'lg:ml-16'} min-h-screen min-w-0`}>

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-2.5 flex items-center justify-between shadow-sm print:hidden">
          <button onClick={()=>setMobileOpen(true)} className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-slate-50 transition-colors">
            <Menu size={20} className="text-[#05121b]"/>
          </button>
          <span className="lg:hidden text-sm font-black text-[#05121b]">
            {navItems.find(n=>n.id===view)?.label||'Dashboard'}
          </span>
          <div className="hidden lg:block flex-1"/>
          {/* Profile widget */}
          <div className="relative">
            <button onClick={()=>setProfileDropdown(v=>!v)}
              className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-full pl-1 pr-3 py-1 shadow-sm hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#137789]/10 border border-[#137789]/20 flex items-center justify-center shrink-0">
                {avatarUrl?<img src={avatarUrl} className="w-full h-full object-cover" alt="avatar"/>:<span className="text-xs font-black text-[#137789]">{firstName[0]}</span>}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black text-[#05121b] leading-tight">{firstName}</p>
                <p className="text-[10px] text-slate-400 leading-none">{profileData.email}</p>
              </div>
            </button>
            {profileDropdown&&(
              <>
                <div className="fixed inset-0 z-40" onClick={()=>setProfileDropdown(false)}/>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <button onClick={()=>{setView('profile');setProfileDropdown(false);setMobileOpen(false);}}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-xs font-bold text-[#05121b] transition-colors">
                    <User size={14}/> Meu Perfil
                  </button>
                  <div className="border-t border-slate-100"/>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-xs font-bold text-red-500 transition-colors">
                    <LogOut size={14}/> Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

      <main className={`flex-1 p-6 md:p-8 overflow-y-auto min-w-0`}>

        {/* ── DASHBOARD ──────────────────────────────────────────────────── */}
        {view==='dashboard'&&(
          <div className="max-w-7xl mx-auto fade-in">
            <header className="mb-8">
              <p className="text-xs text-slate-500 font-medium">Visão Geral · {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</p>
              <h1 className="text-xl font-medium text-[#05121b]">Painel Financeiro</h1>
            </header>
            {newlyCompleted&&(
              <div className="slide-down mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3"><div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0"><Bell size={16} className="text-white"/></div><div><h4 className="font-black text-emerald-800 text-sm">Diagnóstico concluído! 🎉</h4><p className="text-[10px] text-emerald-600 mt-0.5">Análise de <strong>{newlyCompleted.client_name}</strong> disponível.</p></div></div>
                <button onClick={()=>handleViewResult(newlyCompleted)} className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">Ver Resultado <ChevronRight size={12}/></button>
              </div>
            )}
            {hasDraft&&(
              <div className="slide-down mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3"><div className="w-9 h-9 bg-amber-400 rounded-xl flex items-center justify-center shrink-0"><Save size={16} className="text-white"/></div><div><h4 className="font-black text-amber-800 text-sm">Formulário salvo automaticamente</h4><p className="text-[10px] text-amber-600 mt-0.5">Deseja continuar de onde parou?</p></div></div>
                <div className="flex gap-2 shrink-0"><button onClick={handleDiscardDraft} className="text-[10px] font-bold text-amber-600 hover:text-amber-800 px-3 py-2 rounded-lg hover:bg-amber-100 transition-colors">Descartar</button><button onClick={handleResumeDraft} className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">Continuar <ChevronRight size={12}/></button></div>
              </div>
            )}
            {(()=>{
              const mesAtual=new Date().toISOString().slice(0,7);
              const lancMes=lancamentos.filter(l=>l.data&&l.data.startsWith(mesAtual));
              const entradasMes=lancMes.filter(l=>l.tipo==='receita').reduce((a,l)=>a+Number(l.valor),0);
              const saidasMes=lancMes.filter(l=>l.tipo==='despesa').reduce((a,l)=>a+Number(l.valor),0);
              const totalBancos=bancos.reduce((a,b)=>a+saldoBanco(b.id),0);
              const dinheiroCaixa=lancamentos.reduce((a,l)=>{
                if(l.meio_pagamento!=='Dinheiro')return a;
                return l.tipo==='receita'?a+Number(l.valor):a-Number(l.valor);
              },0);
              const totalInvestido=investimentos.filter(i=>i.status==='ativo').reduce((a,i)=>a+Number(i.valor_atual||i.valor_aplicado||0),0);
              return(
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Disponível</p>
                    <p className={`text-xl font-black ${(totalBancos+dinheiroCaixa)>=0?'text-[#05121b]':'text-red-600'}`}>{formatBRL(totalBancos+dinheiroCaixa)}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[9px] text-slate-400">Banco: <span className="font-bold text-[#05121b]">{formatBRL(totalBancos)}</span></span>
                      <span className="text-slate-200">·</span>
                      <span className="text-[9px] text-slate-400">Dinheiro: <span className="font-bold text-[#05121b]">{formatBRL(dinheiroCaixa)}</span></span>
                    </div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex flex-col gap-1">
                    <p className="text-xs text-emerald-600 font-medium">Entradas · {new Date().toLocaleDateString('pt-BR',{month:'short'})}</p>
                    <p className="text-xl font-black text-emerald-800">{formatBRL(entradasMes)}</p>
                    <p className="text-[9px] text-emerald-600 font-medium">Receitas do mês</p>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex flex-col gap-1">
                    <p className="text-xs text-red-500 font-medium">Saídas · {new Date().toLocaleDateString('pt-BR',{month:'short'})}</p>
                    <p className="text-xl font-black text-red-700">{formatBRL(saidasMes)}</p>
                    <p className="text-[9px] text-red-500 font-medium">Despesas do mês</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex flex-col gap-1">
                    <p className="text-xs text-blue-600 font-medium">Investimentos</p>
                    <p className="text-xl font-black text-blue-800">{formatBRL(totalInvestido)}</p>
                    <p className="text-[9px] text-blue-500 font-medium">Carteira ativa</p>
                  </div>
                </div>
              );
            })()}
            {!metrics ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0"><Brain size={18} className="text-slate-300"/></div>
                <div>
                  <p className="font-black text-[#05121b] text-sm">Indicadores aguardando lançamentos</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Registre receitas e despesas no <button onClick={()=>setView('fluxo')} className="text-[#137789] hover:text-[#ff7b00] font-black underline underline-offset-2 transition-colors">Fluxo de Caixa</button> para ativar o score e os indicadores financeiros.</p>
                </div>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center gap-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Saúde Geral</p>
                      <ScoreRing score={metrics.score}/>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full pulse-dot ${metrics.score>=70?'bg-emerald-500':metrics.score>=40?'bg-amber-500':'bg-red-500'}`}></div>
                        <span className={`text-[10px] font-bold ${metrics.score>=70?'text-emerald-700':metrics.score>=40?'text-amber-700':'text-red-700'}`}>{metrics.score>=70?'Saudável':metrics.score>=40?'Atenção':'Crítico'}</span>
                      </div>
                    </div>
                    <SemaforoCard icon={Clock} title="Fôlego de Caixa" value={`${metrics.folegoDias} dias`} subtitle="Sem novas vendas" status={metrics.folegoDias>=60?'green':metrics.folegoDias>=30?'yellow':'red'}/>
                    <SemaforoCard icon={Target} title="Ponto de Equilíbrio" value={formatBRL(metrics.pontoEq)} subtitle="Necessário por mês" status={metrics.receita>=metrics.pontoEq?'green':metrics.receita>=metrics.pontoEq*0.8?'yellow':'red'}/>
                    <SemaforoCard icon={TrendingUp} title="Margem Líquida" value={`${metrics.margLiq.toFixed(1)}%`} subtitle="Por R$100 vendidos" status={metrics.margLiq>=15?'green':metrics.margLiq>=5?'yellow':'red'}/>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div><h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide">{usingLiveData?'Fluxo de Caixa Real':'Projeção de Caixa'}</h3><p className="text-[10px] text-slate-400 mt-0.5">{usingLiveData?'Entradas vs Saídas · Últimos 6 meses':'Entradas vs Saídas — Próximas 6 semanas'}</p></div>
                      <span className="text-[9px] bg-slate-50 border border-slate-200 text-slate-500 font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">{usingLiveData?'Dados reais':'Aguardando lançamentos'}</span>
                    </div>
                    <div className="h-[210px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cashFlowData} margin={{top:5,right:5,left:-20,bottom:0}}>
                          <defs>
                            <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#137789" stopOpacity={0.12}/><stop offset="95%" stopColor="#137789" stopOpacity={0}/></linearGradient>
                            <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff7b00" stopOpacity={0.12}/><stop offset="95%" stopColor="#ff7b00" stopOpacity={0}/></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                          <XAxis dataKey="name" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v/1000}k`}/>
                          <RTooltip formatter={v=>formatBRL(v)} contentStyle={{borderRadius:'10px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.08)',fontSize:'11px',fontWeight:'bold'}}/>
                          <Area type="monotone" dataKey="Entradas" stroke="#137789" strokeWidth={2.5} fill="url(#gE)" dot={{r:3,fill:'#137789'}}/>
                          <Area type="monotone" dataKey="Saidas" stroke="#ff7b00" strokeWidth={2.5} fill="url(#gS)" dot={{r:3,fill:'#ff7b00'}}/>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                <div className="xl:col-span-1">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm h-full">
                    <div className="p-5 border-b border-slate-50"><div className="flex items-center gap-2"><Cpu size={15} className="text-[#ff7b00]"/><h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide">Alertas do CFO Digital</h3></div><p className="text-[10px] text-slate-400 mt-1">{usingLiveData?'Baseado nos seus lançamentos reais':'Registre lançamentos para ativar os alertas'}</p></div>
                    <div className="p-3 space-y-2 max-h-[460px] overflow-y-auto">
                      {alertsFeed.slice(0,6).map((a,i)=>{const I=a.icon;const c=AC[a.type];return(<div key={i} className={`${c.bg} border ${c.border} rounded-xl p-3.5 flex gap-3`}><I size={14} className={`${c.ic} shrink-0 mt-0.5`}/><div>{a.titulo&&<p className="text-[10px] font-black text-[#05121b] mb-0.5">{a.titulo}</p>}<p className="text-[10px] text-slate-500 leading-relaxed">{a.msg}</p></div></div>);})}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── INDICADORES RÁPIDOS ─────────────────────────────────── */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide">Indicadores-Chave</h3>
                  <button onClick={()=>setView('alertas')} className="text-[9px] font-black text-[#137789] hover:text-[#ff7b00] uppercase tracking-widest transition-colors flex items-center gap-1">CFO Digital <ChevronRight size={11}/></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <IndicadorCard titulo="Margem Bruta" valor={`${metrics.margemBruta.toFixed(1)}%`} formula="Receita − Custos Diretos" status={metrics.margemBruta>=40?'green':metrics.margemBruta>=20?'yellow':'red'}/>
                  <IndicadorCard titulo="Margem Líquida" valor={`${metrics.margLiq.toFixed(1)}%`} formula="Lucro ÷ Receita" status={metrics.margLiq>=15?'green':metrics.margLiq>=5?'yellow':'red'} destaque/>
                  <IndicadorCard titulo="Burn Rate" valor={formatBRL(metrics.burnRate)} formula="Custos totais / mês" status="neutral"/>
                  <IndicadorCard titulo="Runway" valor={metrics.runwayMeses>0?`${metrics.runwayMeses.toFixed(1)} meses`:'—'} formula="Saldo ÷ Burn Rate" status={metrics.runwayMeses>=3?'green':metrics.runwayMeses>=1.5?'yellow':metrics.runwayMeses>0?'red':'neutral'}/>
                </div>
              </div>
              </>
            )}

            {/* ── POSIÇÃO EM BANCOS ───────────────────────────────────────── */}
            {bancos.length>0&&(
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide flex items-center gap-2"><Landmark size={14} className="text-[#137789]"/> Posição em Bancos</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-[#05121b]">Total: <span className={bancos.reduce((a,b)=>a+saldoBanco(b.id),0)>=0?'text-[#05121b]':'text-red-600'}>{formatBRL(bancos.reduce((a,b)=>a+saldoBanco(b.id),0))}</span></span>
                    <button onClick={()=>setView('bancos')} className="text-xs font-semibold text-[#137789] hover:text-[#ff7b00] transition-colors">Ver todos →</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {bancos.slice(0,4).map(b=>{
                    const s=saldoBanco(b.id);
                    const ent=lancamentos.filter(l=>l.banco_id===b.id&&l.tipo==='receita').reduce((a,l)=>a+Number(l.valor),0);
                    const sai=lancamentos.filter(l=>l.banco_id===b.id&&l.tipo==='despesa').reduce((a,l)=>a+Number(l.valor),0);
                    return(
                      <div key={b.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={()=>setView('bancos')}>
                        <div className="flex items-center gap-2 mb-3">
                          <div style={{background:b.color||'#137789'}} className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
                            <Landmark size={13} className="text-white"/>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-[#05121b] truncate">{b.nome}</p>
                            <p className="text-[9px] text-slate-400 truncate">{b.tipo}</p>
                          </div>
                        </div>
                        <p className={`text-lg font-black mb-2 ${s>=0?'text-[#05121b]':'text-red-600'}`}>{formatBRL(s)}</p>
                        <div className="flex justify-between text-[9px] font-bold">
                          <span className="text-emerald-600">▲ {formatBRL(ent)}</span>
                          <span className="text-red-500">▼ {formatBRL(sai)}</span>
                        </div>
                      </div>
                    );
                  })}
                  {bancos.length>4&&(
                    <button onClick={()=>setView('bancos')} className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
                      <span className="text-xl font-black text-slate-300">+{bancos.length-4}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ver todos</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── CONTAS A PAGAR / RECEBER ────────────────────────────────── */}
            {(contasPagar.length>0||contasReceber.length>0)&&(()=>{
              const d30=new Date(); d30.setDate(d30.getDate()+30);
              const d30s=d30.toISOString().split('T')[0];
              const proxPag=contasPagar.filter(cp=>cp.status!=='pago'&&cp.vencimento<=d30s).sort((a,b)=>a.vencimento.localeCompare(b.vencimento)).slice(0,5);
              const proxRec=contasReceber.filter(cr=>cr.status!=='recebido').sort((a,b)=>a.vencimento.localeCompare(b.vencimento)).slice(0,5);
              const totalPag=proxPag.reduce((a,cp)=>a+Number(cp.valor),0);
              const totalRec=proxRec.reduce((a,cr)=>a+Number(cr.valor),0);
              return(
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2"><Receipt size={14} className="text-red-400"/><h3 className="font-black text-[#05121b] text-xs uppercase tracking-widest">A Pagar · próx. 30 dias</h3></div>
                      <span className="text-xs font-black text-red-500">{formatBRL(totalPag)}</span>
                    </div>
                    {proxPag.length===0?(
                      <p className="text-center text-slate-300 font-bold text-[10px] uppercase tracking-widest py-8">Nenhuma conta no período</p>
                    ):(
                      <div className="divide-y divide-slate-50">
                        {proxPag.map(cp=>{
                          const isAtrasado=cp.vencimento<today&&cp.status!=='pago';
                          return(
                            <div key={cp.id} className="px-5 py-3 flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${isAtrasado?'bg-red-500':cp.status==='pago'?'bg-emerald-500':'bg-amber-400'}`}/>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-[#05121b] truncate">{cp.descricao}</p>
                                <p className="text-[9px] text-slate-400">{cp.vencimento?new Date(cp.vencimento+'T00:00:00').toLocaleDateString('pt-BR'):''}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-black text-red-500">{formatBRL(cp.valor)}</p>
                                {isAtrasado&&<p className="text-[8px] font-black text-red-400 uppercase">Atrasado</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="p-3 border-t border-slate-50">
                      <button onClick={()=>setView('contas_pagar')} className="w-full text-xs font-semibold text-[#137789] hover:text-[#ff7b00] transition-colors py-1">Ver todas →</button>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2"><Wallet size={14} className="text-emerald-500"/><h3 className="font-black text-[#05121b] text-xs uppercase tracking-widest">A Receber · pendentes</h3></div>
                      <span className="text-xs font-black text-emerald-600">{formatBRL(totalRec)}</span>
                    </div>
                    {proxRec.length===0?(
                      <p className="text-center text-slate-300 font-bold text-[10px] uppercase tracking-widest py-8">Nenhum lançamento pendente</p>
                    ):(
                      <div className="divide-y divide-slate-50">
                        {proxRec.map(cr=>{
                          const isAtrasado=cr.vencimento<today&&cr.status!=='recebido';
                          return(
                            <div key={cr.id} className="px-5 py-3 flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${isAtrasado?'bg-red-500':'bg-emerald-400'}`}/>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-[#05121b] truncate">{cr.descricao}</p>
                                <p className="text-[9px] text-slate-400">{cr.cliente?cr.cliente+' · ':''}{cr.vencimento?new Date(cr.vencimento+'T00:00:00').toLocaleDateString('pt-BR'):''}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-black text-emerald-600">{formatBRL(cr.valor)}</p>
                                {isAtrasado&&<p className="text-[8px] font-black text-red-400 uppercase">Atrasado</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="p-3 border-t border-slate-50">
                      <button onClick={()=>setView('contas_receber')} className="w-full text-xs font-semibold text-[#137789] hover:text-[#ff7b00] transition-colors py-1">Ver todas →</button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ── DÍVIDAS ATIVAS ──────────────────────────────────────────── */}
            {dividas.filter(d=>d.status!=='quitada').length>0&&(()=>{
              const ativas=dividas.filter(d=>d.status!=='quitada');
              const totalDividas=ativas.reduce((a,d)=>a+Number(d.valor_total||0),0);
              const totalParcelas=ativas.reduce((a,d)=>a+Number(d.valor_parcela||0),0);
              return(
                <div className="mt-6">
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2"><AlertOctagon size={14} className="text-red-500"/><h3 className="font-black text-red-700 text-xs uppercase tracking-widest">Dívidas Ativas</h3><span className="text-[9px] bg-red-100 text-red-600 font-black px-2 py-0.5 rounded-full">{ativas.length}</span></div>
                      <div className="text-right">
                        <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest">Total em dívida</p>
                        <p className="text-sm font-black text-red-600">{formatBRL(totalDividas)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-white rounded-xl p-3 border border-red-100">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Parcelas / mês</p>
                        <p className="text-sm font-black text-red-600 mt-0.5">{formatBRL(totalParcelas)}</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-red-100">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Dívidas ativas</p>
                        <p className="text-sm font-black text-[#05121b] mt-0.5">{ativas.length}</p>
                      </div>
                    </div>
                    <button onClick={()=>setView('dividas')} className="w-full text-xs font-semibold text-red-500 hover:text-red-700 transition-colors py-1">Gerenciar dívidas →</button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── CFO DIGITAL · DIAGNÓSTICO & ALERTAS ───────────────────────── */}
        {view==='alertas'&&(()=>{
          const metrics = cfoMetrics || liveMetrics;
          const cfoPeriodoLabel = cfoPeriodo==='diaria'?`Hoje · ${fmtDate(today)}`:cfoPeriodo==='semanal'?'Últimos 7 dias':cfoPeriodo==='anual'?`Ano ${new Date().getFullYear()}`:cfoPeriodo==='periodo'&&cfoDataInicio&&cfoDataFim?`${fmtDate(cfoDataInicio)} – ${fmtDate(cfoDataFim)}`:new Date().toLocaleString('pt-BR',{month:'long',year:'numeric'});
          return (
          <div className="max-w-7xl mx-auto fade-in">
            <header className="mb-8">
              <p className="text-xs font-medium text-[#ff7b00] mb-1">CFO Digital · Análise Completa</p>
              <h1 className="text-xl font-medium text-[#05121b]">CFO Digital</h1>
              <p className="text-slate-400 text-sm font-medium mt-1">Todos os indicadores financeiros da sua empresa em um único lugar.</p>
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                {['diaria','semanal','mensal','anual','periodo'].map(p=>(
                  <button key={p} onClick={()=>setCfoPeriodo(p)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${cfoPeriodo===p?'bg-[#05121b] text-white border-[#05121b]':'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-[#05121b]'}`}>
                    {{diaria:'Hoje',semanal:'Semana',mensal:'Mês',anual:'Ano',periodo:'Período'}[p]}
                  </button>
                ))}
                {cfoPeriodo==='periodo'&&(
                  <div className="flex items-center gap-2 ml-2 flex-wrap">
                    <input type="date" value={cfoDataInicio} onChange={e=>setCfoDataInicio(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-[#05121b] font-medium outline-none focus:border-[#137789]"/>
                    <span className="text-slate-400 text-xs font-bold">–</span>
                    <input type="date" value={cfoDataFim} onChange={e=>setCfoDataFim(e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-[#05121b] font-medium outline-none focus:border-[#137789]"/>
                  </div>
                )}
                <span className="ml-auto text-[10px] text-slate-400 font-medium">{cfoPeriodoLabel}</span>
              </div>
            </header>

            {!metrics ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl mx-auto mb-5 flex items-center justify-center"><Activity size={26} className="text-slate-300"/></div>
                <h2 className="text-lg font-black text-[#05121b] mb-2">Nenhum dado financeiro ainda</h2>
                <p className="text-slate-400 text-sm font-medium mb-4 max-w-sm mx-auto leading-relaxed">Registre receitas e despesas no <strong>Fluxo de Caixa</strong> para que o CFO Digital calcule todos os indicadores automaticamente.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={()=>setView('fluxo')} className="bg-[#137789] text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-[#0e5f6b] transition-colors inline-flex items-center gap-2"><Plus size={13}/> Registrar Lançamentos</button>
                  <button onClick={()=>setView('receitas')} className="bg-slate-50 border border-slate-200 text-slate-500 px-4 py-2 rounded-xl font-semibold text-sm hover:border-[#137789] hover:text-[#137789] transition-colors inline-flex items-center gap-2"><TrendingUp size={13}/> Receitas & Despesas</button>
                </div>
              </div>
            ) : (
              <>
                {/* ── MoM STRIP ── */}
                {cfoPeriodo==='mensal'&&(liveMetrics?.momReceita!=null||liveMetrics?.momDespesa!=null||liveMetrics?.momLucro!=null)&&(
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                      {label:'Receita',val:liveMetrics.momReceita,cur:liveMetrics.receita,lowerBetter:false},
                      {label:'Despesas',val:liveMetrics.momDespesa,cur:liveMetrics.totalCust,lowerBetter:true},
                      {label:'Resultado',val:liveMetrics.momLucro,cur:liveMetrics.lucro,lowerBetter:false},
                    ].map((item,i)=>{
                      if(item.val==null) return null;
                      const positivo=item.lowerBetter ? item.val<=0 : item.val>=0;
                      return(
                        <div key={i} className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-2 ${positivo?'bg-emerald-50 border-emerald-100':'bg-red-50 border-red-100'}`}>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{item.label}</p>
                            <p className="text-sm font-black text-[#05121b]">{formatBRL(item.cur)}</p>
                          </div>
                          <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${positivo?'bg-emerald-100 text-emerald-700 border-emerald-200':'bg-red-100 text-red-600 border-red-200'}`}>
                            {item.val>=0?'▲':'▼'} {Math.abs(item.val).toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── SCORE + SEMÁFOROS ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="bg-[#05121b] rounded-3xl p-8 text-white flex flex-col items-center gap-4">
                    <p className="text-xs text-slate-500 font-medium">Score de Saúde</p>
                    <ScoreRing score={metrics.score}/>
                    <div className="text-center">
                      <p className={`font-black text-sm ${metrics.score>=70?'text-emerald-400':metrics.score>=40?'text-amber-400':'text-red-400'}`}>{metrics.score>=70?'Financeiramente Saudável':metrics.score>=40?'Requer Atenção':'Situação Crítica'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{usingLiveData?'Calculado dos dados lançados':'Baseado no último diagnóstico'}</p>
                    </div>
                    <div className="w-full border-t border-white/10 pt-4 grid grid-cols-2 gap-3">
                      <div className="text-center"><p className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Resultado</p><p className={`text-sm font-black ${metrics.lucro>=0?'text-emerald-400':'text-red-400'}`}>{formatBRL(metrics.lucro)}</p></div>
                      <div className="text-center"><p className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Faturamento</p><p className="text-sm font-black text-white">{formatBRL(metrics.receita)}</p></div>
                    </div>
                  </div>
                  <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                    <SemaforoCard icon={Clock} title="Fôlego de Caixa" value={`${metrics.folegoDias} dias`} subtitle="Operação garantida sem novas vendas" status={metrics.folegoDias>=60?'green':metrics.folegoDias>=30?'yellow':'red'}/>
                    <SemaforoCard icon={Target} title="Custo Mensal do Negócio" value={formatBRL(custoFixoMensal||metrics.custFix)} subtitle="Total de custos fixos classificados" status={custoFixoMensal>0?(custoFixoMensal/Math.max(1,metrics.receita)<=0.5?'green':custoFixoMensal/Math.max(1,metrics.receita)<=0.7?'yellow':'red'):'neutral'}/>
                    <SemaforoCard icon={DollarSign} title="Margem de Contribuição" value={`${metrics.margContrib.toFixed(1)}%`} subtitle="Sobra após custos variáveis" status={metrics.margContrib>=30?'green':metrics.margContrib>=15?'yellow':'red'}/>
                    <SemaforoCard icon={TrendingUp} title="Margem Líquida" value={`${metrics.margLiq.toFixed(1)}%`} subtitle="Por R$100 vendidos" status={metrics.margLiq>=15?'green':metrics.margLiq>=5?'yellow':'red'}/>
                  </div>
                </div>

                {/* ── PROJEÇÃO DE CAIXA ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between mb-5">
                    <div><h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide">{usingLiveData?'Fluxo de Caixa Real':'Projeção de Caixa'}</h3><p className="text-[10px] text-slate-400 mt-0.5">{usingLiveData?'Entradas vs Saídas · Últimos 6 meses · dados reais':'Entradas vs Saídas — Próximas 6 semanas · baseado no diagnóstico'}</p></div>
                    <div className="flex items-center gap-4 text-[9px] font-bold">
                      <span className="flex items-center gap-1.5 text-[#137789]"><span className="w-2 h-2 rounded-full bg-[#137789] inline-block"/>Entradas</span>
                      <span className="flex items-center gap-1.5 text-[#ff7b00]"><span className="w-2 h-2 rounded-full bg-[#ff7b00] inline-block"/>Saídas</span>
                    </div>
                  </div>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cashFlowData} margin={{top:5,right:5,left:-20,bottom:0}}>
                        <defs>
                          <linearGradient id="gEa" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#137789" stopOpacity={0.15}/><stop offset="95%" stopColor="#137789" stopOpacity={0}/></linearGradient>
                          <linearGradient id="gSa" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ff7b00" stopOpacity={0.15}/><stop offset="95%" stopColor="#ff7b00" stopOpacity={0}/></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                        <XAxis dataKey="name" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v/1000}k`}/>
                        <RTooltip formatter={v=>formatBRL(v)} contentStyle={{borderRadius:'10px',border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.08)',fontSize:'11px',fontWeight:'bold'}}/>
                        <Area type="monotone" dataKey="Entradas" stroke="#137789" strokeWidth={2.5} fill="url(#gEa)" dot={{r:3,fill:'#137789'}}/>
                        <Area type="monotone" dataKey="Saidas" stroke="#ff7b00" strokeWidth={2.5} fill="url(#gSa)" dot={{r:3,fill:'#ff7b00'}}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* ── PROJEÇÃO PRÓXIMO MÊS ── */}
                {hasProjecao&&(
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp size={14} className="text-[#137789]"/>
                      <h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide">Projeção · Próximo Mês</h3>
                      <span className="text-[8px] bg-slate-50 border border-slate-200 text-slate-500 font-black px-2 py-0.5 rounded-full uppercase tracking-widest ml-auto">Média 3 meses</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        {label:'Receita Projetada',val:projecaoReceita,color:'text-emerald-700',bg:'bg-emerald-50',border:'border-emerald-100'},
                        {label:'Despesas Projetadas',val:projecaoDespesa,color:'text-red-700',bg:'bg-red-50',border:'border-red-100'},
                        {label:'Resultado Projetado',val:projecaoLucro,color:projecaoLucro>=0?'text-emerald-700':'text-red-700',bg:projecaoLucro>=0?'bg-emerald-50':'bg-red-50',border:projecaoLucro>=0?'border-emerald-100':'border-red-100'},
                      ].map((item,i)=>(
                        <div key={i} className={`rounded-xl border px-4 py-3 ${item.bg} ${item.border}`}>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                          <p className={`text-base font-black ${item.color}`}>{formatBRL(item.val)}</p>
                          {receitaMensal>0&&i===0&&<p className="text-[9px] text-slate-400 mt-0.5">{projecaoReceita>=receitaMensal?'▲':'▼'} {Math.abs(((projecaoReceita-receitaMensal)/receitaMensal)*100).toFixed(1)}% vs mês atual</p>}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3">Estimativa baseada na média dos últimos 3 meses. Não considera sazonalidade.</p>
                  </div>
                )}

                {/* ── DRE SIMPLIFICADO ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide flex items-center gap-2"><FileText size={14} className="text-[#137789]"/> DRE Simplificado · Mensal</h3>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${usingLiveData?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-slate-50 border-slate-200 text-slate-500'}`}>{usingLiveData?'Dados reais':'Baseado no diagnóstico'}</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      {label:'Faturamento Bruto',     valor:metrics.receita,     pct:100,                                                bg:'bg-emerald-50',  txt:'text-emerald-800', border:'border-emerald-100'},
                      {label:'(-) Custos Diretos',    valor:-metrics.custDir,    pct:metrics.receita>0?-(metrics.custDir/metrics.receita*100):0,   bg:'bg-red-50',      txt:'text-red-700',    border:'border-red-100'},
                      {label:'(=) Margem Bruta',      valor:metrics.receita-metrics.custDir, pct:metrics.margemBruta,                   bg:'bg-slate-50',    txt:'text-[#05121b]',  border:'border-slate-200', bold:true},
                      {label:'(-) Custos Fixos',      valor:-metrics.custFix,    pct:metrics.receita>0?-(metrics.custFix/metrics.receita*100):0,   bg:'bg-red-50',      txt:'text-red-700',    border:'border-red-100'},
                      {label:'(=) Resultado Líquido', valor:metrics.lucro,       pct:metrics.margLiq,                                   bg:metrics.lucro>=0?'bg-emerald-50':'bg-red-50', txt:metrics.lucro>=0?'text-emerald-800':'text-red-700', border:metrics.lucro>=0?'border-emerald-200':'border-red-200', bold:true, destaque:true},
                    ].map((row,i)=>(
                      <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${row.bg} ${row.border} ${row.destaque?'ring-1 ring-offset-0 ring-current/20':''}`}>
                        <span className={`text-xs ${row.bold?'font-black':'font-medium'} ${row.txt}`}>{row.label}</span>
                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] font-bold ${row.txt} opacity-60`}>{row.pct.toFixed(1)}%</span>
                          <span className={`text-sm ${row.bold?'font-black':'font-bold'} ${row.txt} min-w-[110px] text-right`}>{formatBRL(Math.abs(row.valor))}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── ALERTAS ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
                  <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="font-black text-[#05121b] uppercase text-xs tracking-widest flex items-center gap-2"><Bell size={13} className="text-[#ff7b00]"/> Alertas do CFO Digital {usingLiveData&&<span className="text-[8px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-black px-2 py-0.5 rounded-full">Dados reais</span>}</h3>
                    <div className="flex items-center gap-2">
                      {alertsFeed.filter(a=>a.type==='red').length>0&&<span className="text-[9px] bg-red-50 text-red-600 border border-red-100 font-black px-3 py-1 rounded-full uppercase tracking-widest">{alertsFeed.filter(a=>a.type==='red').length} crítico{alertsFeed.filter(a=>a.type==='red').length>1?'s':''}</span>}
                      {alertsFeed.filter(a=>a.type==='yellow').length>0&&<span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100 font-black px-3 py-1 rounded-full uppercase tracking-widest">{alertsFeed.filter(a=>a.type==='yellow').length} atenção</span>}
                    </div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {alertsFeed.map((a,i)=>{const I=a.icon;const c=AC[a.type];const lbl={red:'Crítico',yellow:'Atenção',green:'Oportunidade'}[a.type];return(
                      <div key={i} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0 mt-0.5`}><I size={15} className={c.ic}/></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${c.bg} ${c.border} ${c.ic}`}>{lbl}</span>
                            {a.cat&&<span className="inline-block text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500">{a.cat}</span>}
                          </div>
                          {a.titulo&&<p className="text-xs font-black text-[#05121b] mb-0.5">{a.titulo}</p>}
                          <p className="text-[11px] text-slate-500 leading-relaxed">{a.msg}</p>
                        </div>
                      </div>
                    );})}
                  </div>
                </div>

                {/* ── INADIMPLÊNCIA ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Wallet size={14} className="text-[#ff7b00]"/>
                      <h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide">Inadimplência</h3>
                    </div>
                    {inadIndice>0?(
                      <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${inadIndice>=10?'bg-red-50 text-red-600 border-red-100':inadIndice>=5?'bg-amber-50 text-amber-600 border-amber-100':'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        Índice {inadIndice.toFixed(1)}%
                      </span>
                    ):(
                      <span className="text-[9px] font-black px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-widest">Sem atrasos</span>
                    )}
                  </div>
                  {inadVencidas.length===0?(
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                      <CheckCircle size={15} className="text-emerald-500 shrink-0"/>
                      <p className="text-xs font-medium text-emerald-700">Todos os recebíveis estão em dia. Nenhum valor em atraso.</p>
                    </div>
                  ):(
                    <>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          {label:'Até 30 dias',itens:inad30,total:totalInad30,color:'text-amber-700',bg:'bg-amber-50',border:'border-amber-100'},
                          {label:'30 a 60 dias',itens:inad60,total:totalInad60,color:'text-orange-700',bg:'bg-orange-50',border:'border-orange-100'},
                          {label:'Acima 60 dias',itens:inad60p,total:totalInad60p,color:'text-red-700',bg:'bg-red-50',border:'border-red-100'},
                        ].map((faixa,i)=>(
                          <div key={i} className={`rounded-xl border px-4 py-3 ${faixa.bg} ${faixa.border}`}>
                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{faixa.label}</p>
                            <p className={`text-base font-black ${faixa.color}`}>{formatBRL(faixa.total)}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{faixa.itens.length} recebível{faixa.itens.length!==1?'s':''}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                        <span className="text-xs font-black text-red-700">Total inadimplente</span>
                        <span className="text-sm font-black text-red-700">{formatBRL(totalInad)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* ── RECEITA RECORRENTE VS AVULSA ── */}
                {receitaMensal>0&&(
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity size={14} className="text-[#137789]"/>
                      <h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide">Receita Recorrente vs. Avulsa</h3>
                      <span className="ml-auto text-[9px] text-slate-400 font-bold">{new Date().toLocaleString('pt-BR',{month:'long',year:'numeric'})}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-xl border bg-emerald-50 border-emerald-100 px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Recorrente</p>
                        <p className="text-base font-black text-emerald-700">{formatBRL(receitaRecorrente)}</p>
                        <p className="text-[10px] text-emerald-600 font-medium mt-0.5">{pctRecorrente.toFixed(0)}% do faturamento</p>
                      </div>
                      <div className="rounded-xl border bg-slate-50 border-slate-100 px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Avulsa / Pontual</p>
                        <p className="text-base font-black text-[#05121b]">{formatBRL(receitaAvulsa)}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{(100-pctRecorrente).toFixed(0)}% do faturamento</p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full transition-all" style={{width:`${Math.min(100,pctRecorrente)}%`}}/>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">Receita recorrente = mesma descrição em 2+ meses. Quanto maior, mais previsível é o seu caixa.</p>
                  </div>
                )}

                {/* ── INDICADORES COMPLETOS ── */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide">Indicadores Financeiros</h3>
                    <span className="text-[8px] bg-[#05121b] text-white px-2.5 py-1 rounded-full font-black uppercase tracking-widest">Completo</span>
                  </div>

                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2"><TrendingUp size={10}/> Rentabilidade</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <IndicadorCard titulo="Margem Bruta" valor={`${metrics.margemBruta.toFixed(1)}%`} formula="(Receita − Custos Diretos) ÷ Receita" status={metrics.margemBruta>=40?'green':metrics.margemBruta>=20?'yellow':'red'}/>
                    <IndicadorCard titulo="Margem de Contribuição" valor={`${metrics.margContrib.toFixed(1)}%`} formula="(Receita − Custos Variáveis) ÷ Receita" status={metrics.margContrib>=30?'green':metrics.margContrib>=15?'yellow':'red'} destaque/>
                    <IndicadorCard titulo="Margem Líquida" valor={`${metrics.margLiq.toFixed(1)}%`} formula="Lucro Líquido ÷ Receita" status={metrics.margLiq>=15?'green':metrics.margLiq>=5?'yellow':'red'}/>
                    <IndicadorCard titulo="Ponto de Equilíbrio" valor={formatBRL(pontoEquilibrioReal||metrics.pontoEq)} formula="Custo Fixo ÷ Margem de Contribuição" status={metrics.receita>=(pontoEquilibrioReal||metrics.pontoEq)?'green':metrics.receita>=(pontoEquilibrioReal||metrics.pontoEq)*0.85?'yellow':'red'}/>
                  </div>

                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2"><Activity size={10}/> Caixa & Liquidez</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <IndicadorCard titulo="Cash Burn Rate" valor={formatBRL(metrics.burnRate)} formula="Total de custos por mês" status="neutral"/>
                    <IndicadorCard titulo="Runway" valor={metrics.runwayMeses>0?`${metrics.runwayMeses.toFixed(1)} meses`:'—'} formula="Saldo ÷ Burn Rate mensal" status={metrics.runwayMeses>=3?'green':metrics.runwayMeses>=1.5?'yellow':metrics.runwayMeses>0?'red':'neutral'} destaque/>
                    <IndicadorCard titulo="Ticket Médio" valor={metrics.ticketMedio>0?formatBRL(metrics.ticketMedio):'—'} formula={`Faturamento ÷ ${metrics.nVendas||0} lançamentos de receita`} status={metrics.ticketMedio>0?'neutral':'neutral'}/>
                    <IndicadorCard titulo="Prazo Médio Recebimento" valor={pmrLive>0?`${pmrLive} dias`:'—'} formula="(Recebíveis pendentes ÷ Receita) × 30" status={pmrLive>0?(pmrLive<=30?'green':pmrLive<=60?'yellow':'red'):'neutral'}/>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-6">
                    <IndicadorCard titulo="Prazo Médio Pagamento" valor={pmpLive>0?`${pmpLive} dias`:'—'} formula="(Contas a pagar pendentes ÷ Custos) × 30" status={pmpLive>0?(pmpLive>=30?'green':pmpLive>=15?'yellow':'red'):'neutral'}/>
                    <IndicadorCard titulo="Ciclo Financeiro" valor={(pmrLive>0&&pmpLive>0)?`${pmrLive-pmpLive} dias`:'—'} formula="PMR − PMP (negativo = caixa antecipado)" status={(pmrLive>0&&pmpLive>0)?(pmrLive-pmpLive<=0?'green':pmrLive-pmpLive<=30?'yellow':'red'):'neutral'} destaque/>
                  </div>

                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2"><Shield size={10}/> Estrutura de Custos</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <IndicadorCard titulo="Custos Variáveis" valor={formatBRL(metrics.custVar)} formula="CMV + Taxas + Comissões" status="neutral"/>
                    <IndicadorCard titulo="Custos Fixos" valor={formatBRL(metrics.custFix)} formula="Folha + Aluguel + Fixos" status="neutral"/>
                    <IndicadorCard titulo="% Custo sobre Receita" valor={metrics.receita>0?`${(metrics.totalCust/metrics.receita*100).toFixed(1)}%`:'—'} formula="Total custos ÷ Receita" status={metrics.receita>0?(metrics.totalCust/metrics.receita<=0.7?'green':metrics.totalCust/metrics.receita<=0.85?'yellow':'red'):'neutral'} destaque/>
                    <IndicadorCard titulo="Resultado Mensal" valor={formatBRL(metrics.lucro)} formula="Receita − Total de Custos" status={metrics.lucro>0?'green':metrics.lucro===0?'neutral':'red'}/>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-6">
                    <IndicadorCard titulo="CMV (Custo das Mercadorias)" valor={metrics.cmv>0?formatBRL(metrics.cmv):'—'} formula="Despesas em Fornecedor / Mercadoria / Estoque" status={metrics.cmv>0?(metrics.receita>0&&metrics.cmv/metrics.receita<=0.4?'green':metrics.receita>0&&metrics.cmv/metrics.receita<=0.6?'yellow':'red'):'neutral'}/>
                    <IndicadorCard titulo="Markup" valor={metrics.markup!=null?`${metrics.markup.toFixed(1)}%`:'—'} formula="(Receita − CMV) ÷ CMV × 100" status={metrics.markup!=null?(metrics.markup>=100?'green':metrics.markup>=50?'yellow':'red'):'neutral'} destaque/>
                  </div>

                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2"><BarChart2 size={10}/> EBITDA & Eficiência</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <IndicadorCard titulo="EBITDA (simplificado)" valor={formatBRL(metrics.lucro+metrics.custFix*0.1)} formula="Resultado + estimativa D&A" status={metrics.lucro>=0?'green':'red'}/>
                    <IndicadorCard titulo="EBITDA Margin" valor={metrics.receita>0?`${((metrics.lucro+metrics.custFix*0.1)/metrics.receita*100).toFixed(1)}%`:'—'} formula="EBITDA ÷ Receita" status={metrics.receita>0?((metrics.lucro+metrics.custFix*0.1)/metrics.receita>=0.15?'green':(metrics.lucro+metrics.custFix*0.1)/metrics.receita>=0.05?'yellow':'red'):'neutral'} destaque/>
                    <IndicadorCard titulo="Eficiência Operacional" valor={metrics.receita>0?`${(metrics.custFix/metrics.receita*100).toFixed(1)}%`:'—'} formula="Custos Fixos ÷ Receita" status={metrics.receita>0?(metrics.custFix/metrics.receita<=0.4?'green':metrics.custFix/metrics.receita<=0.6?'yellow':'red'):'neutral'}/>
                    <IndicadorCard titulo="Alavancagem Operacional" valor={metrics.margContrib>0?`${(metrics.margContrib/Math.max(0.1,metrics.margLiq)).toFixed(1)}×`:'—'} formula="Margem Contribuição ÷ Margem Líquida" status={metrics.lucro>0?'green':'neutral'}/>
                  </div>
                </div>

              </>
            )}
          </div>
          );
        })()}

        {/* ── SIMULADOR ─────────────────────────────────────────────────── */}
        {view==='simulador'&&(()=>{
          const sc=SCENARIOS.find(s=>s.id===simType)||SCENARIOS[0];
          const grupos=['Todos','Receita','Custo','Investimento','Dívida'];
          const scFiltrados=simGroup==='Todos'?SCENARIOS:SCENARIOS.filter(s=>s.group===simGroup);
          const canCalc=sc.tipo==='pct'?!!simPct:!!simValue;
          return(
          <div className="max-w-7xl mx-auto fade-in">
            <header className="mb-8">
              <p className="text-xs font-medium text-[#137789] mb-1">IA · Simulador</p>
              <h1 className="text-xl font-medium text-[#05121b]">Simulador de Cenários</h1>
              <p className="text-slate-400 text-sm font-medium mt-1">Teste decisões antes de executar. Veja o impacto real nos seus indicadores financeiros.</p>
            </header>

            {!metrics&&(
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3 mb-6">
                <Info size={15} className="text-amber-500 shrink-0 mt-0.5"/>
                <p className="text-[12px] text-amber-700 font-medium leading-relaxed">Registre receitas e despesas no <strong>Fluxo de Caixa</strong> para que o simulador calcule o impacto com base nos dados reais da sua empresa.</p>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 mb-5">
              {/* Grupo filter */}
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                {grupos.map(g=>(
                  <button key={g} onClick={()=>{setSimGroup(g);setSimResult(null);}} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${simGroup===g?'bg-[#05121b] text-white border-[#05121b]':'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>{g}</button>
                ))}
              </div>

              {/* Scenario grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-7">
                {scFiltrados.map(s=>(
                  <button key={s.id} onClick={()=>{setSimType(s.id);setSimValue('');setSimPct('');setSimResult(null);}} className={`flex flex-col gap-1.5 p-3 rounded-2xl border text-left transition-all ${simType===s.id?'bg-[#05121b] border-[#05121b] shadow-md':'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-white'}`}>
                    <span className="text-xl leading-none">{s.emoji}</span>
                    <p className={`text-[10px] font-black leading-tight ${simType===s.id?'text-white':'text-[#05121b]'}`}>{s.label}</p>
                    <p className={`text-[9px] leading-tight ${simType===s.id?'text-slate-400':'text-slate-400'}`}>{s.desc}</p>
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="border-t border-slate-50 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#05121b] rounded-xl flex items-center justify-center"><span className="text-base">{sc.emoji}</span></div>
                  <div><p className="font-black text-[#05121b] text-sm">{sc.label}</p><p className="text-[10px] text-slate-400">{sc.desc}</p></div>
                </div>
                <label className="text-xs text-slate-500 font-medium block mb-2">{sc.inputLabel}</label>
                {sc.tipo==='pct'
                  ?<div className="relative"><input type="number" min="0" max="100" step="0.5" value={simPct} onChange={e=>{setSimPct(e.target.value);setSimResult(null);}} placeholder="0" className="w-full bg-white border border-slate-200 focus:border-[#ff7b00] focus:ring-1 focus:ring-[#ff7b00] px-4 py-3 pr-10 rounded-xl font-bold text-[#05121b] outline-none text-sm transition-all"/><span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">%</span></div>
                  :<input type="text" value={simValue} onChange={e=>{setSimValue(formatCurrency(e.target.value));setSimResult(null);}} placeholder="R$ 0,00" className="w-full bg-white border border-slate-200 focus:border-[#ff7b00] focus:ring-1 focus:ring-[#ff7b00] px-4 py-3 rounded-xl font-bold text-[#05121b] outline-none text-sm transition-all"/>
                }
                <button onClick={handleSimulate} disabled={!canCalc||simLoading||!metrics} className="w-full mt-4 bg-[#05121b] hover:bg-slate-800 disabled:opacity-40 text-white py-4 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md transition-all">
                  {simLoading?<><Loader2 size={15} className="animate-spin"/>Calculando...</>:<><Zap size={15}/>Projetar Impacto</>}
                </button>
              </div>
            </div>

            {/* Resultado */}
            {simResult&&!simResult.noMetrics&&(
              <div className="slide-down bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-3 h-3 rounded-full ${simResult.positivo?'bg-emerald-500':'bg-red-500'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Projeção · Antes vs Depois</span>
                </div>
                <p className="text-sm font-semibold text-[#05121b] mb-6 leading-relaxed">{simResult.insight}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <SimComparativo label="Resultado Mensal" before={simResult.before.lucro} after={simResult.after.lucro} formato="brl"/>
                  <SimComparativo label="Margem Líquida" before={simResult.before.margLiq} after={simResult.after.margLiq} formato="pct"/>
                  <SimComparativo label="Runway (meses de caixa)" before={simResult.before.runway} after={simResult.after.runway} formato="meses"/>
                  <SimComparativo label="Ponto de Equilíbrio" before={simResult.before.pontoEq} after={simResult.after.pontoEq} formato="brl" lowerIsBetter={true}/>
                </div>
                <div className={`rounded-xl p-4 flex items-start gap-3 ${simResult.positivo?'bg-emerald-50 border border-emerald-100':'bg-red-50 border border-red-100'}`}>
                  <span className="text-xl">{simResult.positivo?'✅':'⚠️'}</span>
                  <p className={`text-[11px] font-semibold leading-relaxed ${simResult.positivo?'text-emerald-800':'text-red-700'}`}>{simResult.positivo?'Essa decisão melhora o resultado mensal. Avalie se o ganho é consistente ou sazonal antes de comprometer gastos recorrentes.':'Essa decisão piora o resultado mensal. Certifique-se de ter runway suficiente antes de executar ou busque uma contrapartida de receita.'}</p>
                </div>
              </div>
            )}

            {/* Quick examples */}
            <div className="mt-5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Exemplos rápidos</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {id:'contratar_func',emoji:'👤',ex:'E se contratar um vendedor por R$ 3.000?',v:'R$ 3.000,00',pct:''},
                  {id:'queda_receita', emoji:'📉',ex:'E se as vendas caírem 20%?',              v:'',           pct:'20'},
                  {id:'investimento',  emoji:'⚙️', ex:'E se comprar um equipamento de R$ 50.000?',v:'R$ 50.000,00',pct:''},
                  {id:'novo_contrato', emoji:'🤝', ex:'E se fechar um contrato de R$ 8.000/mês?',v:'R$ 8.000,00',pct:''},
                ].map((ex,i)=>(
                  <button key={i} onClick={()=>{setSimType(ex.id);setSimGroup('Todos');if(ex.v)setSimValue(ex.v);if(ex.pct)setSimPct(ex.pct);setSimResult(null);}} className="bg-white border border-slate-100 rounded-2xl p-4 text-left hover:border-slate-200 hover:shadow-sm transition-all">
                    <span className="text-xl mb-2 block">{ex.emoji}</span>
                    <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">{ex.ex}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          );
        })()}

        {/* ── FONTES DE DADOS ───────────────────────────────────────────── */}
        {view==='fontes'&&(
          <div className="max-w-7xl mx-auto fade-in">
            <header className="mb-8"><p className="text-xs text-slate-500 font-medium">Configuração</p><h1 className="text-xl font-medium text-[#05121b]">Fontes de Dados</h1><p className="text-slate-400 text-sm font-medium mt-1">Escolha como quer trazer os dados da sua empresa.</p></header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <button onClick={()=>setSelectedSource('planilha')} className={`bg-white rounded-2xl border-2 p-7 text-left flex flex-col gap-4 transition-all hover:shadow-md ${selectedSource==='planilha'?'border-[#137789] ring-2 ring-[#137789]/20 shadow-md':'border-slate-100 hover:border-slate-200'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${selectedSource==='planilha'?'bg-[#137789]':'bg-slate-100'}`}><FileSpreadsheet size={22} className={selectedSource==='planilha'?'text-white':'text-slate-400'}/></div>
                <div><h3 className="font-black text-[#05121b] text-sm uppercase tracking-tight mb-1.5">Planilhas & PDFs</h3><p className="text-slate-400 text-xs leading-relaxed">Envie DRE, extrato, fluxo de caixa, Excel ou PDFs financeiros.</p></div>
                {selectedSource==='planilha'&&<span className="text-[9px] font-black text-[#137789] uppercase tracking-widest flex items-center gap-1"><CheckCircle size={11}/> Selecionado</span>}
              </button>
              <div className="bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-7 text-left flex flex-col gap-4 opacity-60 cursor-not-allowed relative">
                <span className="absolute top-3 right-3 text-[8px] font-black uppercase tracking-widest bg-slate-200 text-slate-500 px-2 py-1 rounded-full">Em desenvolvimento</span>
                <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center"><Database size={22} className="text-slate-400"/></div>
                <div><h3 className="font-black text-slate-400 text-sm uppercase tracking-tight mb-1.5">Conectar ERP</h3><p className="text-slate-400 text-xs leading-relaxed">Integração com Bling, Omie, Conta Azul e outros sistemas em breve.</p></div>
              </div>
              <button onClick={()=>{setSelectedSource('manual');setView('form');setFormMode(null);setFormStep(0);}} className="bg-white rounded-2xl border-2 border-slate-100 p-7 text-left flex flex-col gap-4 hover:border-slate-200 hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center"><PenLine size={22} className="text-slate-400"/></div>
                <div><h3 className="font-black text-[#05121b] text-sm uppercase tracking-tight mb-1.5">Preencher Manualmente</h3><p className="text-slate-400 text-xs leading-relaxed">Responda o formulário guiado com informações da sua empresa.</p></div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1"><ArrowRight size={11}/> Abrir formulário</span>
              </button>
            </div>
            {selectedSource==='planilha'&&(
              <div className="slide-down bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                <h3 className="font-black text-[#05121b] uppercase text-xs tracking-widest mb-1 flex items-center gap-2"><Upload size={13} className="text-[#137789]"/> Upload de Documentos</h3>
                <p className="text-[11px] text-slate-400 mb-5 leading-relaxed">Envie um ou mais arquivos financeiros. A IA extrai os dados automaticamente. Formatos aceitos: PDF, Excel (.xlsx), CSV, OFX.</p>
                <MultiFileDropzone/>
              </div>
            )}
            {selectedSource==='erp'&&(
              <div className="slide-down bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
                <h3 className="font-black text-[#05121b] uppercase text-xs tracking-widest mb-6 flex items-center gap-2"><Database size={13} className="text-[#ff7b00]"/> Integrar com ERP</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {['Bling','Omie','Conta Azul','ContaLX'].map(erp=>(
                    <div key={erp} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center font-black text-xs text-[#05121b]">{erp[0]}</div>
                      <span className="text-[10px] font-bold text-slate-600">{erp}</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Em breve</span>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3"><Info size={13} className="text-amber-500 shrink-0 mt-0.5"/><p className="text-[11px] text-amber-700 font-medium leading-relaxed">Integrações com ERPs em desenvolvimento. Para ser notificado, fale com nosso suporte pelo WhatsApp.</p></div>
              </div>
            )}
          </div>
        )}

        {/* ── MEUS RELATÓRIOS ──────────────────────────────────────────── */}
        {view==='analises'&&(
          <div className="max-w-7xl mx-auto fade-in">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div><p className="text-xs text-slate-500 font-medium">Central de</p><h1 className="text-xl font-medium text-[#05121b]">Meus Diagnósticos</h1></div>
              <button onClick={()=>setModalSolicitarAnalise(true)} className="bg-[#ff7b00] text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-md hover:scale-[1.02] transition-transform self-start sm:self-auto flex items-center gap-2"><Plus size={13}/> Solicitar Nova Análise</button>
            </header>
            {newlyCompleted&&(<div className="slide-down mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0"><Bell size={16} className="text-white"/></div><div><h4 className="font-black text-emerald-800 text-sm">Diagnóstico concluído! 🎉</h4><p className="text-[10px] text-emerald-600 mt-0.5"><strong>{newlyCompleted.client_name}</strong> — resultado disponível</p></div></div><button onClick={()=>handleViewResult(newlyCompleted)} className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2">Ver Resultado <ChevronRight size={12}/></button></div>)}
            <div className="space-y-3">
              {diagnostics.length>0?diagnostics.map(d=>(
                <div key={d.id} className={`bg-white p-5 rounded-2xl flex flex-col md:flex-row md:justify-between md:items-center gap-4 border shadow-sm hover:shadow transition-shadow ${d.internal_status==='completed'&&newlyCompleted?.id===d.id?'border-emerald-200 ring-1 ring-emerald-200':'border-slate-100'}`}>
                  <div className="flex items-center gap-4"><div className="w-10 h-10 shrink-0 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><FileText size={17}/></div><div><h3 className="font-black text-[#05121b] uppercase text-xs mb-0.5">{d.client_name}</h3><div className="flex items-center gap-2 mt-1"><span className="text-[9px] font-bold text-slate-400 uppercase">{d.form_type}</span><span className="w-1 h-1 bg-slate-200 rounded-full"></span><span className="text-[9px] font-bold text-slate-400">{new Date(d.submittedAt).toLocaleDateString('pt-BR')}</span></div></div></div>
                  <div className="flex flex-wrap items-center gap-3"><StatusBadge internalStatus={d.internal_status}/><button onClick={()=>handleViewSubmissionData(d)} className="bg-white border border-slate-200 text-slate-500 px-4 py-1.5 rounded-full font-bold text-[9px] uppercase tracking-widest hover:border-[#137789] hover:text-[#137789] transition-colors">Ver Detalhes</button>{d.internal_status==='completed'&&<button onClick={()=>handleViewResult(d)} className="bg-[#137789] text-white px-5 py-1.5 rounded-full font-bold text-[9px] uppercase tracking-widest hover:bg-[#05121b] transition-colors flex items-center gap-1.5">Ver Resultado <ChevronRight size={11}/></button>}</div>
                </div>
              )):(
                <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl mx-auto mb-4 flex items-center justify-center text-slate-300"><Info size={22}/></div>
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-4">Nenhuma análise ainda.</p>
                  <button onClick={()=>setModalSolicitarAnalise(true)} className="bg-[#ff7b00] text-white px-4 py-2 rounded-xl font-semibold text-sm hover:scale-[1.02] transition-transform">Solicitar Agora</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ── FLUXO DE CAIXA ────────────────────────────────────────── */}
        {view==='fluxo'&&(()=>{
          const now=new Date();
          const filteredLanc=lancamentos.filter(l=>{
            if(!l.data)return false;
            const d=new Date(l.data+'T00:00:00');
            if(fluxoFiltro==='diario')return d.toDateString()===now.toDateString();
            if(fluxoFiltro==='semanal'){const s=new Date(now);s.setDate(now.getDate()-7);return d>=s;}
            if(fluxoFiltro==='mensal')return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
            if(fluxoFiltro==='anual')return d.getFullYear()===now.getFullYear();
            if(fluxoFiltro==='periodo'){
              if(fluxoDataInicio&&l.data<fluxoDataInicio)return false;
              if(fluxoDataFim&&l.data>fluxoDataFim)return false;
              return true;
            }
            return true;
          });
          const totalEnt=filteredLanc.filter(l=>l.tipo==='receita').reduce((a,l)=>a+Number(l.valor),0);
          const totalSai=filteredLanc.filter(l=>l.tipo==='despesa').reduce((a,l)=>a+Number(l.valor),0);
          const saldoOperacional=totalEnt-totalSai;
          // Saldo inicial = base bancária + todos os movimentos ANTES do período
          const periodoInicio=(()=>{
            if(fluxoFiltro==='diario')return today;
            if(fluxoFiltro==='semanal'){const s=new Date(now);s.setDate(now.getDate()-7);return s.toISOString().slice(0,10);}
            if(fluxoFiltro==='mensal')return`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
            if(fluxoFiltro==='anual')return`${now.getFullYear()}-01-01`;
            if(fluxoFiltro==='periodo'&&fluxoDataInicio)return fluxoDataInicio;
            return null;
          })();
          const bancosBase=bancos.reduce((a,b)=>a+Number(b.saldo_inicial||0),0);
          const movAntes=periodoInicio?lancamentos.filter(l=>l.data&&l.data<periodoInicio).reduce((a,l)=>l.tipo==='receita'?a+Number(l.valor):a-Number(l.valor),0):0;
          const saldoInic=bancosBase+movAntes;
          const saldoFinal=saldoInic+saldoOperacional;
          const saldoAtual=bancos.reduce((a,b)=>a+saldoBanco(b.id),0);
          const daysMap={diario:1,semanal:7,mensal:30,anual:365};
          const periodoDias=fluxoFiltro==='periodo'&&fluxoDataInicio&&fluxoDataFim
            ?Math.max(1,Math.round((new Date(fluxoDataFim)-new Date(fluxoDataInicio))/(1000*60*60*24)))
            :30;
          const dias=daysMap[fluxoFiltro]||periodoDias;
          const burnRate=totalSai>0?totalSai/dias:0;
          const runway=burnRate>0?Math.floor(saldoAtual/burnRate):0;
          // Alert: contasPagar due in next 7 days
          const d7=new Date(now);d7.setDate(now.getDate()+7);
          const d7str=d7.toISOString().split('T')[0];
          const alertas=contasPagar.filter(cp=>cp.status!=='pago'&&cp.vencimento&&cp.vencimento>=today&&cp.vencimento<=d7str);
          const alertTotal=alertas.reduce((a,cp)=>a+Number(cp.valor),0);
          // Running balance for table
          const sortedLanc=[...filteredLanc].sort((a,b)=>a.data>b.data?1:a.data<b.data?-1:0);
          let runBal=saldoInic;
          const tableRows=sortedLanc.map(l=>{
            const delta=l.tipo==='receita'?Number(l.valor):-Number(l.valor);
            runBal+=delta;
            return{...l,saldo:runBal,tipo_flow:l.tipo==='receita'?'entrada':'saida',met:l.meio_pagamento||'—',cat:l.categoria||'—',st:'realizado'};
          });
          const tFiltFn={todos:()=>true,entradas:r=>r.tipo_flow==='entrada',saidas:r=>r.tipo_flow==='saida',previstos:r=>r.st==='previsto'};
          const filtrados=tableRows.filter(tFiltFn[fluxoTabFilter]||tFiltFn.todos);
          const entFiltered=tableRows.filter(r=>r.tipo_flow==='entrada');
          const saiFiltered=tableRows.filter(r=>r.tipo_flow==='saida');
          // Evolução real dos últimos 6 meses
          const evolucao=(()=>{const result=[];for(let i=5;i>=0;i--){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);const mes=d.toISOString().slice(0,7);const label=d.toLocaleDateString('pt-BR',{month:'short'});const ent=lancamentos.filter(l=>l.data?.startsWith(mes)&&l.tipo==='receita').reduce((a,l)=>a+Number(l.valor),0);const sai=lancamentos.filter(l=>l.data?.startsWith(mes)&&l.tipo==='despesa').reduce((a,l)=>a+Number(l.valor),0);result.push({name:label.charAt(0).toUpperCase()+label.slice(1).replace('.',''),Entradas:ent,Saídas:sai,Resultado:ent-sai});}return result;})();
          const flowDonut=[{name:'Entradas',value:totalEnt,color:'#1D9E75'},{name:'Saídas',value:totalSai,color:'#D85A30'}];
          const statusStyle={
            realizado:{cls:'bg-[#EAF3DE] text-[#3B6D11] border-[#9FE1CB]',lbl:'Realizado'},
            previsto:{cls:'bg-[#E6F1FB] text-[#185FA5] border-[#B5D4F4]',lbl:'Previsto'},
            atrasado:{cls:'bg-[#FCEBEB] text-[#A32D2D] border-[#F7C1C1]',lbl:'Atrasado'},
          };
          const Tip=({active,payload,label})=>{
            if(!active||!payload?.length)return null;
            return(<div className="bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-lg"><p className="text-[10px] font-bold text-slate-600 mb-1">{label}</p>{payload.map(p=><p key={p.name} className="text-[10px]" style={{color:p.color||p.stroke}}>{p.name}: {formatBRL(p.value)}</p>)}</div>);
          };
          const TRow=({l,showPlus})=>{
            const ss=statusStyle[l.st]||statusStyle.realizado;
            return(
              <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-[#05121b] text-sm max-w-[200px] truncate">{l.descricao}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{l.cat}</td>
                <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{fmtDate(l.data)}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{l.met}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${ss.cls}`}>{ss.lbl}</span></td>
                <td className="px-4 py-3 text-right text-xs font-medium whitespace-nowrap" style={{color:showPlus?'#085041':'#791F1F'}}>{showPlus?'+':'-'}{formatBRL(l.valor)}</td>
                <td className="px-4 py-3 text-right text-xs text-slate-400 whitespace-nowrap">{formatBRL(l.saldo)}</td>
              </tr>
            );
          };
          return(
            <div className="max-w-7xl mx-auto fade-in space-y-4">
              {/* 1. HEADER */}
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Visão financeira</p>
                  <h1 className="text-[22px] font-medium text-[#05121b] mt-0.5">Fluxo de Caixa</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1">
                    {[{id:'diario',l:'Diário'},{id:'semanal',l:'Semanal'},{id:'mensal',l:'Mensal'},{id:'anual',l:'Anual'},{id:'periodo',l:'Período'}].map(f=>(
                      <button key={f.id} onClick={()=>setFluxoFiltro(f.id)} className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${fluxoFiltro===f.id?'bg-[#05121b] text-white shadow-sm':'text-slate-500 hover:text-[#05121b]'}`}>{f.l}</button>
                    ))}
                  </div>
                  {fluxoFiltro==='periodo'&&(
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5">
                      <input type="date" value={fluxoDataInicio} onChange={e=>setFluxoDataInicio(e.target.value)}
                        className="text-xs text-[#05121b] border-none outline-none bg-transparent cursor-pointer" />
                      <span className="text-slate-300 text-xs">—</span>
                      <input type="date" value={fluxoDataFim} onChange={e=>setFluxoDataFim(e.target.value)}
                        className="text-xs text-[#05121b] border-none outline-none bg-transparent cursor-pointer" />
                    </div>
                  )}
                </div>
              </div>
              {/* 2. METRIC CARDS */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:'12px'}}>
                <div className="bg-white border border-slate-100 rounded-2xl p-4">
                  <p className="text-[11px] font-medium text-slate-500 mb-1.5">Saldo inicial</p>
                  <p className="text-[19px] font-medium text-[#05121b] leading-tight">{formatBRL(saldoInic)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">1º de {now.toLocaleString('pt-BR',{month:'long'})}</p>
                </div>
                <div className="rounded-2xl p-4 border" style={{background:'#E1F5EE',borderColor:'#9FE1CB'}}>
                  <p className="text-[11px] font-medium mb-1.5" style={{color:'#085041'}}>Total entradas</p>
                  <p className="text-[19px] font-medium leading-tight" style={{color:'#085041'}}>{formatBRL(totalEnt)}</p>
                </div>
                <div className="rounded-2xl p-4 border" style={{background:'#FCEBEB',borderColor:'#F7C1C1'}}>
                  <p className="text-[11px] font-medium mb-1.5" style={{color:'#791F1F'}}>Total saídas</p>
                  <p className="text-[19px] font-medium leading-tight" style={{color:'#791F1F'}}>{formatBRL(totalSai)}</p>
                </div>
                <div className="rounded-2xl p-4 border" style={saldoOperacional>=0?{background:'#E1F5EE',borderColor:'#1D9E75'}:{background:'#FCEBEB',borderColor:'#D85A30'}}>
                  <p className="text-[11px] font-medium mb-1.5" style={{color:saldoOperacional>=0?'#085041':'#791F1F'}}>Saldo Operacional</p>
                  <p className="text-[19px] font-medium leading-tight" style={{color:saldoOperacional>=0?'#085041':'#791F1F'}}>{saldoOperacional>=0?'+':''}{formatBRL(saldoOperacional)}</p>
                  <p className="text-[10px] font-bold mt-1" style={{color:saldoOperacional>=0?'#1D9E75':'#D85A30'}}>{saldoOperacional>=0?'✓ Mês no verde':'✗ Mês no vermelho'}</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4">
                  <p className="text-[11px] font-medium text-slate-500 mb-1.5">Saldo final</p>
                  <p className="text-[19px] font-medium text-[#05121b] leading-tight">{formatBRL(saldoFinal)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Inicial + Operacional</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4">
                  <p className="text-[11px] font-medium text-slate-500 mb-1.5">Burn rate</p>
                  <p className="text-[19px] font-medium text-[#05121b] leading-tight">{formatBRL(burnRate)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">por dia</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4">
                  <p className="text-[11px] font-medium text-slate-500 mb-1.5">Runway</p>
                  <p className="text-[19px] font-medium text-[#05121b] leading-tight">{runway} dias</p>
                  <p className="text-[11px] text-slate-400 mt-1">com saldo atual</p>
                </div>
              </div>
              {/* 3. ALERT */}
              {alertas.length>0&&(
                <div className="rounded-2xl border px-4 py-3 flex items-start gap-3" style={{background:'#FAEEDA',borderColor:'#EF9F27'}}>
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{background:'#BA7517'}}/>
                  <p className="text-xs leading-relaxed" style={{color:'#633806'}}>
                    <span className="font-bold" style={{color:'#412402'}}>Vencimentos nos próximos 7 dias: </span>
                    {alertas.map((cp,i)=><span key={cp.id}>{cp.descricao||cp.nome||'—'} {formatBRL(cp.valor)} ({fmtDate(cp.vencimento)}){i<alertas.length-1?', ':''}</span>)}
                    {' '} — total <span className="font-bold" style={{color:'#412402'}}>{formatBRL(alertTotal)}</span>
                  </p>
                </div>
              )}
              {/* 4. CHARTS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-white border border-slate-100 rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-[#05121b] mb-3">Evolução no período</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <ComposedChart data={evolucao} margin={{top:4,right:4,bottom:0,left:-16}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false}/>
                      <XAxis dataKey="name" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`R$${Math.round(v/1000)}k`:`R$${v}`} width={46}/>
                      <RTooltip content={<Tip/>}/>
                      <Bar dataKey="Entradas" fill="#1D9E75" radius={[3,3,0,0]} maxBarSize={18}/>
                      <Bar dataKey="Saídas" fill="#D85A30" radius={[3,3,0,0]} maxBarSize={18}/>
                      <Line dataKey="Resultado" stroke="#378ADD" type="monotone" dot={{r:3,fill:'#378ADD'}} strokeWidth={2}/>
                    </ComposedChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-3 h-2.5 rounded-sm inline-block" style={{background:'#1D9E75'}}/>Entradas</span>
                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-3 h-2.5 rounded-sm inline-block" style={{background:'#D85A30'}}/>Saídas</span>
                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{background:'#378ADD'}}/>Resultado</span>
                  </div>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5">
                  <h3 className="text-sm font-medium text-[#05121b] mb-3">Distribuição do período</h3>
                  {totalEnt>0||totalSai>0?(
                    <>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={flowDonut} dataKey="value" cx="50%" cy="50%" innerRadius="58%" outerRadius="80%" strokeWidth={0} paddingAngle={2}>
                            {flowDonut.map((e,j)=><Cell key={j} fill={e.color}/>)}
                          </Pie>
                          <RTooltip content={<Tip/>}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        {flowDonut.map(d=><span key={d.name} className="flex items-center gap-1.5 text-[10px] text-slate-500"><span className="w-3 h-2.5 rounded-sm inline-block" style={{background:d.color}}/>{d.name}: {formatBRL(d.value)}</span>)}
                      </div>
                    </>
                  ):(
                    <div className="h-[180px] flex items-center justify-center"><p className="text-slate-300 text-xs font-bold uppercase tracking-widest">Sem dados no período</p></div>
                  )}
                </div>
              </div>
              {/* 5. TABLE */}
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filtrados.length} lançamentos</span>
                    <div className="flex gap-1 flex-wrap">
                      {[{k:'todos',l:'Todos'},{k:'entradas',l:'Entradas'},{k:'saidas',l:'Saídas'},{k:'previstos',l:'Previstos'}].map(f=>(
                        <button key={f.k} onClick={()=>setFluxoTabFilter(f.k)} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${fluxoTabFilter===f.k?'bg-[#05121b] text-white border-[#05121b]':'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{f.l}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={()=>setModalReceita({tipo:'receita',descricao:'',valor:'',data:today,categoria:'',banco_id:'',meio_pagamento:''})} className="px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors" style={{background:'#EAF3DE',color:'#3B6D11',borderColor:'#9FE1CB'}}><Plus size={11}/>Receita</button>
                    <button onClick={()=>setModalDespesa({tipo:'despesa',tipo_custo:'variavel',descricao:'',valor:'',data:today,categoria:'',categoria_custom:'',banco_id:'',meio_pagamento:'',taxa_cartao:''})} className="px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors" style={{background:'#FCEBEB',color:'#A32D2D',borderColor:'#F7C1C1'}}><Plus size={11}/>Despesa</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {tableRows.length===0?(
                    <div className="py-14 text-center"><p className="text-slate-400 text-xs font-semibold">Nenhum lançamento no período</p></div>
                  ):(
                    <table className="w-full text-sm min-w-[640px]">
                      <thead><tr className="border-b border-slate-100">
                        {['Descrição','Categoria','Data','Método','Status','Valor','Saldo'].map(h=>(
                          <th key={h} className={`px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wide ${['Valor','Saldo'].includes(h)?'text-right':'text-left'}`}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {fluxoTabFilter==='todos'?(
                          <>
                            <tr className="border-b border-slate-100" style={{background:'rgba(5,18,27,0.04)'}}>
                              <td className="px-4 py-2.5 font-bold text-[#05121b] text-xs" colSpan={5}>Saldo inicial</td>
                              <td className="px-4 py-2.5 text-right text-xs font-bold text-[#05121b]">{formatBRL(saldoInic)}</td>
                              <td className="px-4 py-2.5 text-right text-xs font-bold text-[#05121b]">{formatBRL(saldoInic)}</td>
                            </tr>
                            {entFiltered.length>0&&<>
                              <tr className="bg-slate-50"><td colSpan={7} className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entradas</td></tr>
                              {entFiltered.map((l,i)=><TRow key={l.id||i} l={l} showPlus={true}/>)}
                            </>}
                            {saiFiltered.length>0&&<>
                              <tr className="bg-slate-50"><td colSpan={7} className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Saídas</td></tr>
                              {saiFiltered.map((l,i)=><TRow key={l.id||i} l={l} showPlus={false}/>)}
                            </>}
                            <tr className="border-t border-slate-100" style={{background:saldoOperacional>=0?'rgba(29,158,117,0.08)':'rgba(216,90,48,0.08)'}}>
                              <td className="px-4 py-2.5 font-black text-xs" colSpan={5} style={{color:saldoOperacional>=0?'#085041':'#791F1F'}}>
                                {saldoOperacional>=0?'✓':'✗'} Saldo Operacional (FCO)
                              </td>
                              <td className="px-4 py-2.5 text-right text-xs font-black" style={{color:saldoOperacional>=0?'#085041':'#791F1F'}} colSpan={2}>
                                {saldoOperacional>=0?'+':''}{formatBRL(saldoOperacional)}
                              </td>
                            </tr>
                            <tr className="border-t-2 border-slate-200" style={{background:'rgba(5,18,27,0.04)'}}>
                              <td className="px-4 py-2.5 font-bold text-[#05121b] text-xs" colSpan={5}>Saldo final</td>
                              <td className="px-4 py-2.5 text-right text-xs font-bold text-[#05121b]">{formatBRL(saldoFinal)}</td>
                              <td className="px-4 py-2.5 text-right text-xs font-bold text-[#05121b]">{formatBRL(saldoFinal)}</td>
                            </tr>
                          </>
                        ):(
                          filtrados.length===0?(
                            <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-xs">Nenhum resultado para o filtro</td></tr>
                          ):(
                            filtrados.map((l,i)=><TRow key={l.id||i} l={l} showPlus={l.tipo_flow==='entrada'}/>)
                          )
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════
            ── RECEITAS ──────────────────────────────────────────────── */}
        {view==='receitas'&&(()=>{
          const receitasAll=lancamentos.filter(l=>l.tipo==='receita');
          // Period options from real data + current month
          const periodoOpts=(()=>{
            const meses=new Set();
            receitasAll.forEach(l=>{if(l.data)meses.add(l.data.substring(0,7));});
            meses.add(today.substring(0,7));
            return[...meses].sort((a,b)=>b.localeCompare(a)).slice(0,12).map(m=>{
              const[y,mo]=m.split('-');
              const nome=new Date(parseInt(y),parseInt(mo)-1).toLocaleString('pt-BR',{month:'long',year:'numeric'});
              return{key:m,nome:nome.charAt(0).toUpperCase()+nome.slice(1)};
            });
          })();
          const periodoKey=periodoReceitas||(periodoOpts[0]?.key||today.substring(0,7));
          const receitasMes=receitasAll.filter(l=>l.data?.startsWith(periodoKey));
          // Metrics
          const totalMes=receitasMes.reduce((a,l)=>a+Number(l.valor),0);
          const mensalidades=receitasMes.filter(l=>l.categoria==='Mensalidade').reduce((a,l)=>a+Number(l.valor),0);
          const avulsas=receitasMes.filter(l=>l.categoria!=='Mensalidade').reduce((a,l)=>a+Number(l.valor),0);
          const prevKey=(()=>{const[y,m]=periodoKey.split('-');const d=new Date(parseInt(y),parseInt(m)-2);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;})();
          const receitasPrev=receitasAll.filter(l=>l.data?.startsWith(prevKey));
          const totalPrev=receitasPrev.reduce((a,l)=>a+Number(l.valor),0);
          const mensalidadesPrev=receitasPrev.filter(l=>l.categoria==='Mensalidade').reduce((a,l)=>a+Number(l.valor),0);
          const avulsasPrev=receitasPrev.filter(l=>l.categoria!=='Mensalidade').reduce((a,l)=>a+Number(l.valor),0);
          const inadimplencia=contasReceber.filter(cr=>cr.vencimento<today&&cr.status!=='recebido').reduce((a,cr)=>a+Number(cr.valor),0);
          const deltaStr=(curr,prev)=>{if(prev===0)return null;const p=((curr-prev)/prev*100);return{txt:`${p>=0?'↑':'↓'} ${Math.abs(p).toFixed(1)}% vs anterior`,pos:p>=0};};
          // Donut
          const catMap={};
          receitasMes.forEach(l=>{const c=l.categoria||'Outros';catMap[c]=(catMap[c]||0)+Number(l.valor);});
          const donutColors=['#137789','#34d399','#ff7b00','#a78bfa','#f87171','#fbbf24','#60a5fa'];
          const donutData=Object.entries(catMap).map(([label,value],i)=>({label,value,color:donutColors[i%donutColors.length]}));
          // Line — last 6 months
          const lineData=(()=>{
            const result=[];
            const[py,pm]=periodoKey.split('-');
            for(let i=5;i>=0;i--){
              const d=new Date(parseInt(py),parseInt(pm)-1-i);
              const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
              result.push({
                month:d.toLocaleString('pt-BR',{month:'short'}).replace('.',''),
                total:receitasAll.filter(l=>l.data?.startsWith(k)).reduce((a,l)=>a+Number(l.valor),0),
                recorrente:receitasAll.filter(l=>l.data?.startsWith(k)&&l.categoria==='Mensalidade').reduce((a,l)=>a+Number(l.valor),0),
              });
            }
            return result;
          })();
          // Table filter
          const filtroFn={
            todos:()=>true,
            mensalidade:l=>l.categoria==='Mensalidade',
            servico:l=>l.categoria==='Venda de Serviço',
            avulso:l=>l.categoria!=='Mensalidade'&&l.categoria!=='Venda de Serviço',
          };
          const filtrados=receitasMes.filter(filtroFn[filtroReceitas]||filtroFn.todos);
          const DonutTip=({active,payload})=>{if(!active||!payload?.length)return null;return(<div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg"><p className="text-xs font-semibold text-[#05121b]">{payload[0].name}</p><p className="text-xs text-slate-500 mt-0.5">{formatBRL(payload[0].value)}</p></div>);};
          const LineTip=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg"><p className="text-xs font-semibold text-[#05121b] mb-1">{label}</p>{payload.map(p=><p key={p.dataKey} className="text-xs" style={{color:p.color}}>{p.dataKey==='total'?'Total':'Mensalidades'}: {formatBRL(p.value)}</p>)}</div>);};
          const metricCards=[
            {label:'Total do mês',       value:formatBRL(totalMes),     delta:deltaStr(totalMes,totalPrev)},
            {label:'Receita recorrente',  value:formatBRL(mensalidades),  delta:deltaStr(mensalidades,mensalidadesPrev)},
            {label:'Receita avulsa',      value:formatBRL(avulsas),       delta:deltaStr(avulsas,avulsasPrev)},
            {label:'Inadimplência',       value:formatBRL(inadimplencia), delta:inadimplencia>0?{txt:'Contas vencidas',pos:false}:null},
          ];
          return(
            <div className="max-w-7xl mx-auto fade-in space-y-5">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Gestão Financeira</p>
                  <h1 className="text-xl font-medium text-[#05121b] mt-0.5">Receitas</h1>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="relative">
                    <select value={periodoKey} onChange={e=>setPeriodoReceitas(e.target.value)} className="appearance-none border border-slate-200 bg-white rounded-xl px-4 py-2 pr-8 text-sm font-medium text-[#05121b] outline-none focus:border-[#137789] cursor-pointer transition-colors">
                      {periodoOpts.map(p=><option key={p.key} value={p.key}>{p.nome}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                  </div>
                  <button onClick={()=>setModalImport({stage:'upload',tipoImport:'receita'})} className="border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                    <Upload size={14}/>Importar
                  </button>
                  <button onClick={()=>setModalReceita({tipo:'receita',descricao:'',valor:'',data:today,categoria:'',banco_id:'',meio_pagamento:''})} className="flex items-center gap-1.5 bg-[#05121b] text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-[#0c2133] transition-colors">
                    <Plus size={14}/>Lançar receita
                  </button>
                </div>
              </div>
              {/* Metric Cards */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))',gap:'12px'}}>
                {metricCards.map((m,i)=>(
                  <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 font-medium mb-2">{m.label}</p>
                    <p className="text-[20px] font-medium text-[#05121b] leading-tight">{m.value}</p>
                    {m.delta&&<p className="text-xs font-semibold mt-1.5" style={{color:m.delta.pos?'#34d399':'#f87171'}}>{m.delta.txt}</p>}
                  </div>
                ))}
              </div>
              {/* Charts */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:'16px'}}>
                {/* Donut */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-[#05121b] mb-3">Receita por categoria</h3>
                  {donutData.length>0?(
                    <>
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie data={donutData} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius="58%" outerRadius="82%" strokeWidth={0} paddingAngle={0}>
                            {donutData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                          </Pie>
                          <RTooltip content={<DonutTip/>}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-3 space-y-1.5">
                        {donutData.map((d,i)=>(
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:d.color}}/><span className="text-slate-600">{d.label}</span></div>
                            <span className="font-medium text-[#05121b]">{formatBRL(d.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ):(
                    <div className="h-40 flex items-center justify-center"><p className="text-slate-300 text-xs font-bold uppercase tracking-widest">Sem dados no período</p></div>
                  )}
                </div>
                {/* Line */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#05121b]">Evolução mensal</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-0.5 rounded" style={{background:'#137789'}}/>Total</span>
                      <span className="flex items-center gap-1.5"><svg width="20" height="4" viewBox="0 0 20 4"><line x1="0" y1="2" x2="20" y2="2" stroke="#34d399" strokeWidth="2" strokeDasharray="4 2"/></svg>Mensalidades</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={190}>
                    <LineChart data={lineData} margin={{top:4,right:4,bottom:0,left:0}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                      <XAxis dataKey="month" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`R$${Math.round(v/1000)}k`:`R$${v}`} width={52}/>
                      <RTooltip content={<LineTip/>}/>
                      <Line type="monotone" dataKey="total" stroke="#137789" strokeWidth={2} dot={{r:3,fill:'#137789',strokeWidth:0}} activeDot={{r:5}}/>
                      <Line type="monotone" dataKey="recorrente" stroke="#34d399" strokeWidth={2} strokeDasharray="5 3" dot={{r:3,fill:'#34d399',strokeWidth:0}} activeDot={{r:5}}/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Table */}
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-[#05121b]">Lançamentos</h3>
                    {recSelected.size>0&&(
                      <button onClick={async()=>{if(!confirm(`Excluir ${recSelected.size} receita(s)?`))return;setSavingItem(true);await supabase.from('lancamentos').delete().in('id',Array.from(recSelected));await fetchFinanceiro(user.id);setRecSelected(new Set());setSavingItem(false);}} className="px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">
                        Excluir {recSelected.size} selecionada(s)
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[{key:'todos',label:'Todos'},{key:'mensalidade',label:'Mensalidade'},{key:'servico',label:'Serviço'},{key:'avulso',label:'Avulso'}].map(f=>(
                      <button key={f.key} onClick={()=>setFiltroReceitas(f.key)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${filtroReceitas===f.key?'bg-[#05121b] text-white border-[#05121b]':'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{f.label}</button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {filtrados.length===0?(
                    <div className="py-14 text-center"><TrendingUp size={26} className="text-slate-200 mx-auto mb-3"/><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{receitasMes.length===0?'Nenhuma receita no período':'Nenhum resultado para o filtro'}</p></div>
                  ):(
                    <table className="w-full text-sm min-w-[520px]">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="px-4 py-3 w-8"><input type="checkbox" checked={filtrados.length>0&&filtrados.every(l=>recSelected.has(l.id))} onChange={e=>{const ids=filtrados.map(l=>l.id);setRecSelected(e.target.checked?new Set(ids):new Set());}} style={{cursor:'pointer',accentColor:'#137789'}}/></th>
                          {['Descrição','Categoria','Tipo','Data','Banco','Valor',''].map(h=><th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide ${h==='Valor'?'text-right':'text-left'}`}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {filtrados.map((l,idx)=>{
                          const tipoInfo=l.categoria==='Mensalidade'
                            ?{cls:'bg-cyan-50 text-cyan-700 border-cyan-200',lbl:'Recorrente'}
                            :l.categoria==='Venda de Serviço'
                            ?{cls:'bg-emerald-50 text-emerald-700 border-emerald-200',lbl:'Serviço'}
                            :{cls:'bg-amber-50 text-amber-700 border-amber-200',lbl:'Avulso'};
                          const isSelR=recSelected.has(l.id);
                          return(
                            <tr key={l.id} className={`hover:bg-slate-50 transition-colors ${idx<filtrados.length-1?'border-b border-slate-100':''}`} style={{background:isSelR?'#f0f9ff':undefined}}>
                              <td className="px-4 py-3.5"><input type="checkbox" checked={isSelR} onChange={()=>setRecSelected(prev=>{const n=new Set(prev);n.has(l.id)?n.delete(l.id):n.add(l.id);return n;})} style={{cursor:'pointer',accentColor:'#137789'}}/></td>
                              <td className="px-4 py-3.5 font-medium text-[#05121b] text-sm">{l.descricao}</td>
                              <td className="px-4 py-3.5 text-slate-500 text-xs">{l.categoria||'—'}</td>
                              <td className="px-4 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${tipoInfo.cls}`}>{tipoInfo.lbl}</span></td>
                              <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{fmtDate(l.data)}</td>
                              <td className="px-4 py-3.5 text-slate-500 text-xs">{bancos.find(b=>b.id===l.banco_id)?.nome||'—'}</td>
                              <td className="px-4 py-3.5 text-right font-medium text-emerald-700 whitespace-nowrap">+{formatBRL(l.valor)}</td>
                              <td className="px-4 py-3.5"><button onClick={()=>deleteItem('lancamentos',l.id,()=>fetchFinanceiro(user.id))} className="text-slate-200 hover:text-red-400 transition-colors"><Trash2 size={13}/></button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════
            ── DESPESAS ──────────────────────────────────────────────── */}
        {view==='despesas'&&(()=>{
          const despesasAll=lancamentos.filter(l=>l.tipo==='despesa');
          // Period options
          const periodoOpts=(()=>{
            const meses=new Set();
            despesasAll.forEach(l=>{if(l.data)meses.add(l.data.substring(0,7));});
            meses.add(today.substring(0,7));
            return[...meses].sort((a,b)=>b.localeCompare(a)).slice(0,12).map(m=>{
              const[y,mo]=m.split('-');
              const nome=new Date(parseInt(y),parseInt(mo)-1).toLocaleString('pt-BR',{month:'long',year:'numeric'});
              return{key:m,nome:nome.charAt(0).toUpperCase()+nome.slice(1)};
            });
          })();
          const periodoKey=periodoDespesas||(periodoOpts[0]?.key||today.substring(0,7));
          const despesasMes=despesasAll.filter(l=>l.data?.startsWith(periodoKey));
          const prevKey=(()=>{const[y,m]=periodoKey.split('-');const d=new Date(parseInt(y),parseInt(m)-2);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;})();
          const despesasPrev=despesasAll.filter(l=>l.data?.startsWith(prevKey));
          // Type from categoria
          const tipoFromCat=cat=>{
            if(['Folha de Pagamento','Aluguel','Serviços/Software','Boleto Bancário'].includes(cat))return'fixa';
            if(['Impostos','Impostos e taxas','Imposto / DAS'].includes(cat))return'imposto';
            return'variavel';
          };
          // Metrics
          const totalMes=despesasMes.reduce((a,l)=>a+Number(l.valor),0);
          const totalPrev=despesasPrev.reduce((a,l)=>a+Number(l.valor),0);
          const fixas=despesasMes.filter(l=>tipoFromCat(l.categoria)==='fixa').reduce((a,l)=>a+Number(l.valor),0);
          const variaveis=despesasMes.filter(l=>tipoFromCat(l.categoria)==='variavel').reduce((a,l)=>a+Number(l.valor),0);
          const variavelsPrev=despesasPrev.filter(l=>tipoFromCat(l.categoria)==='variavel').reduce((a,l)=>a+Number(l.valor),0);
          const aPagar=contasPagar.filter(cp=>cp.status!=='pago'&&cp.vencimento?.startsWith(periodoKey)).reduce((a,cp)=>a+Number(cp.valor),0);
          const aPagarCount=contasPagar.filter(cp=>cp.status!=='pago'&&cp.vencimento?.startsWith(periodoKey)).length;
          // Delta: expense rising = bad (red), falling = good (green)
          const deltaStr=(curr,prev)=>{if(prev===0)return null;const p=((curr-prev)/prev*100);return{txt:`${p>=0?'↑':'↓'} ${Math.abs(p).toFixed(1)}% vs anterior`,pos:p<0};};
          // Donut
          const catMap={};
          despesasMes.forEach(l=>{const c=l.categoria||'Outros';catMap[c]=(catMap[c]||0)+Number(l.valor);});
          const catColors={'Folha de Pagamento':'#137789','Fornecedor':'#a78bfa','Fornecedores':'#a78bfa','Infraestrutura':'#ff7b00','Impostos':'#f87171','Impostos e taxas':'#f87171','Marketing':'#34d399','Aluguel':'#fbbf24','Serviços/Software':'#60a5fa'};
          const fallback=['#137789','#a78bfa','#ff7b00','#f87171','#34d399','#fbbf24','#60a5fa','#94a3b8'];
          const donutData=Object.entries(catMap).map(([label,value],i)=>({label,value,color:catColors[label]||fallback[i%fallback.length]}));
          // Bar: top 5 categories, prev vs current
          const topCats=[...new Set([...Object.keys(catMap),...despesasPrev.map(l=>l.categoria||'Outros')])].slice(0,5);
          const barData=topCats.map(cat=>({
            cat:cat.length>9?cat.substring(0,9)+'..':cat,
            anterior:despesasPrev.filter(l=>(l.categoria||'Outros')===cat).reduce((a,l)=>a+Number(l.valor),0),
            atual:despesasMes.filter(l=>(l.categoria||'Outros')===cat).reduce((a,l)=>a+Number(l.valor),0),
          }));
          // Table
          const filtroFnD={todos:()=>true,fixa:l=>tipoFromCat(l.categoria)==='fixa',variavel:l=>tipoFromCat(l.categoria)==='variavel',imposto:l=>tipoFromCat(l.categoria)==='imposto'};
          const filtradosD=despesasMes.filter(filtroFnD[filtroDespesas]||filtroFnD.todos);
          const TIPO_STYLE={fixa:'bg-cyan-50 text-cyan-700 border-cyan-200',variavel:'bg-violet-50 text-violet-700 border-violet-200',imposto:'bg-amber-50 text-amber-700 border-amber-200'};
          const TIPO_LABEL={fixa:'Fixa',variavel:'Variável',imposto:'Imposto'};
          const DonutTip=({active,payload})=>{if(!active||!payload?.length)return null;return(<div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg"><p className="text-xs font-semibold text-[#05121b]">{payload[0].name}</p><p className="text-xs text-slate-500 mt-0.5">{formatBRL(payload[0].value)}</p></div>);};
          const BarTip=({active,payload,label})=>{if(!active||!payload?.length)return null;return(<div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg"><p className="text-xs font-semibold text-[#05121b] mb-1">{label}</p>{payload.map(p=><p key={p.name} className="text-xs" style={{color:p.color}}>{p.name}: {formatBRL(p.value)}</p>)}</div>);};
          const metricCards=[
            {label:'Total do mês',       value:formatBRL(totalMes),  delta:deltaStr(totalMes,totalPrev)},
            {label:'Despesas fixas',     value:formatBRL(fixas),     delta:totalMes>0?{txt:`${(fixas/totalMes*100).toFixed(1)}% do total`,pos:null}:null},
            {label:'Despesas variáveis', value:formatBRL(variaveis), delta:deltaStr(variaveis,variavelsPrev)},
            {label:'A pagar ainda',      value:formatBRL(aPagar),    delta:aPagarCount>0?{txt:`${aPagarCount} vencimento${aPagarCount>1?'s':''}`,pos:null}:null},
          ];
          return(
            <div className="max-w-7xl mx-auto fade-in space-y-5">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Gestão Financeira</p>
                  <h1 className="text-xl font-medium text-[#05121b] mt-0.5">Despesas</h1>
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="relative">
                    <select value={periodoKey} onChange={e=>setPeriodoDespesas(e.target.value)} className="appearance-none border border-slate-200 bg-white rounded-xl px-4 py-2 pr-8 text-sm font-medium text-[#05121b] outline-none focus:border-[#137789] cursor-pointer transition-colors">
                      {periodoOpts.map(p=><option key={p.key} value={p.key}>{p.nome}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                  </div>
                  <button onClick={()=>setModalImport({stage:'upload',tipoImport:'despesa'})} className="border border-slate-200 bg-white text-slate-600 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                    <Upload size={14}/>Importar
                  </button>
                  <button onClick={()=>setModalDespesa({tipo:'despesa',tipo_custo:'variavel',descricao:'',valor:'',data:today,categoria:'',categoria_custom:'',banco_id:'',meio_pagamento:'',taxa_cartao:''})} className="flex items-center gap-1.5 bg-[#05121b] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0c2133] transition-colors">
                    <Plus size={14}/>Lançar despesa
                  </button>
                </div>
              </div>
              {/* Metric Cards */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))',gap:'12px'}}>
                {metricCards.map((m,i)=>(
                  <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 font-medium mb-2">{m.label}</p>
                    <p className="text-[20px] font-medium text-[#05121b] leading-tight">{m.value}</p>
                    {m.delta&&<p className="text-xs font-semibold mt-1.5" style={{color:m.delta.pos===null?'#94a3b8':m.delta.pos?'#34d399':'#f87171'}}>{m.delta.txt}</p>}
                  </div>
                ))}
              </div>
              {/* Charts */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))',gap:'16px'}}>
                {/* Donut */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-[#05121b] mb-3">Despesas por categoria</h3>
                  {donutData.length>0?(
                    <>
                      <ResponsiveContainer width="100%" height={150}>
                        <PieChart>
                          <Pie data={donutData} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius="58%" outerRadius="82%" strokeWidth={0} paddingAngle={0}>
                            {donutData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                          </Pie>
                          <RTooltip content={<DonutTip/>}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-3 space-y-1.5">
                        {donutData.map((d,i)=>(
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:d.color}}/><span className="text-slate-600">{d.label}</span></div>
                            <span className="font-medium text-[#05121b]">{formatBRL(d.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ):(
                    <div className="h-40 flex items-center justify-center"><p className="text-slate-300 text-xs font-semibold">Sem dados no período</p></div>
                  )}
                </div>
                {/* Bar */}
                <div className="bg-white border border-slate-100 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#05121b]">Mês anterior vs atual</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2.5 rounded-sm bg-slate-200"/>Anterior</span>
                      <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-2.5 rounded-sm" style={{background:'#137789'}}/>Atual</span>
                    </div>
                  </div>
                  {barData.length>0?(
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={barData} margin={{top:4,right:4,bottom:0,left:0}} barCategoryGap="35%">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                        <XAxis dataKey="cat" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                        <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`R$${Math.round(v/1000)}k`:`R$${v}`} width={48}/>
                        <RTooltip content={<BarTip/>}/>
                        <Bar dataKey="anterior" name="Anterior" fill="#e2e8f0" radius={[3,3,0,0]}/>
                        <Bar dataKey="atual" name="Atual" fill="#137789" radius={[3,3,0,0]}/>
                      </BarChart>
                    </ResponsiveContainer>
                  ):(
                    <div className="h-40 flex items-center justify-center"><p className="text-slate-300 text-xs font-semibold">Sem dados suficientes</p></div>
                  )}
                </div>
              </div>
              {/* Table */}
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-[#05121b]">Lançamentos</h3>
                    {despSelected.size>0&&(
                      <button onClick={async()=>{if(!confirm(`Excluir ${despSelected.size} despesa(s)?`))return;setSavingItem(true);await supabase.from('lancamentos').delete().in('id',Array.from(despSelected));await fetchFinanceiro(user.id);setDespSelected(new Set());setSavingItem(false);}} className="px-3 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">
                        Excluir {despSelected.size} selecionada(s)
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[{key:'todos',label:'Todos'},{key:'fixa',label:'Fixas'},{key:'variavel',label:'Variáveis'},{key:'imposto',label:'Impostos'}].map(f=>(
                      <button key={f.key} onClick={()=>setFiltroDespesas(f.key)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${filtroDespesas===f.key?'bg-[#05121b] text-white border-[#05121b]':'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50'}`}>{f.label}</button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  {filtradosD.length===0?(
                    <div className="py-14 text-center"><TrendingDown size={26} className="text-slate-200 mx-auto mb-3"/><p className="text-slate-400 text-xs font-semibold">{despesasMes.length===0?'Nenhuma despesa no período':'Nenhum resultado para o filtro'}</p></div>
                  ):(
                    <table className="w-full text-sm min-w-[560px]">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="px-4 py-3 w-8"><input type="checkbox" checked={filtradosD.length>0&&filtradosD.every(l=>despSelected.has(l.id))} onChange={e=>{const ids=filtradosD.map(l=>l.id);setDespSelected(e.target.checked?new Set(ids):new Set());}} style={{cursor:'pointer',accentColor:'#137789'}}/></th>
                          {['Descrição','Categoria','Data','Tipo','Status','Valor',''].map(h=><th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide ${h==='Valor'?'text-right':'text-left'}`}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {filtradosD.map((l,idx)=>{
                          const tipo=tipoFromCat(l.categoria);
                          const isSelD=despSelected.has(l.id);
                          return(
                            <tr key={l.id} className={`hover:bg-slate-50 transition-colors ${idx<filtradosD.length-1?'border-b border-slate-100':''}`} style={{background:isSelD?'#f0f9ff':undefined}}>
                              <td className="px-4 py-3.5"><input type="checkbox" checked={isSelD} onChange={()=>setDespSelected(prev=>{const n=new Set(prev);n.has(l.id)?n.delete(l.id):n.add(l.id);return n;})} style={{cursor:'pointer',accentColor:'#137789'}}/></td>
                              <td className="px-4 py-3.5 font-medium text-[#05121b] text-sm">{l.descricao}</td>
                              <td className="px-4 py-3.5 text-slate-500 text-xs">{l.categoria||'—'}</td>
                              <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">{fmtDate(l.data)}</td>
                              <td className="px-4 py-3.5"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${TIPO_STYLE[tipo]}`}>{TIPO_LABEL[tipo]}</span></td>
                              <td className="px-4 py-3.5"><span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">Pago</span></td>
                              <td className="px-4 py-3.5 text-right font-medium text-red-600 whitespace-nowrap">-{formatBRL(l.valor)}</td>
                              <td className="px-4 py-3.5"><button onClick={()=>deleteItem('lancamentos',l.id,()=>fetchFinanceiro(user.id))} className="text-slate-200 hover:text-red-400 transition-colors"><Trash2 size={13}/></button></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════
            ── CONTAS A PAGAR ────────────────────────────────────────── */}
        {view==='contas_pagar'&&(()=>{
          // Normaliza contasPagar (Supabase) para formato interno da view
          const CP_STATUS_MAP={'pendente':'aberto','pending':'aberto','vencido':'atrasado','overdue':'atrasado'};
          const cpData=contasPagar.map(cp=>({
            id:cp.id,
            desc:cp.descricao||'—',
            cat:cp.categoria||'Outros',
            cc:cp.centro_custo||'—',
            venc:cp.vencimento||'',
            tipo:cp.tipo||'variavel',
            status:CP_STATUS_MAP[cp.status]||cp.status||'aberto',
            valor:Number(cp.valor)||0,
          }));
          const mesAtualCP=cpMes;
          const prevMesCP=(()=>{const[y,m]=cpMes.split('-');const d=new Date(parseInt(y),parseInt(m)-2);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;})();
          const nextMesCP=(()=>{const[y,m]=cpMes.split('-');const d=new Date(parseInt(y),parseInt(m));return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;})();
          const cpMesLabel=(()=>{const[y,m]=cpMes.split('-');const n=new Date(parseInt(y),parseInt(m)-1).toLocaleString('pt-BR',{month:'long',year:'numeric'});return n.charAt(0).toUpperCase()+n.slice(1);})();
          const cpDataFiltradaMes=cpData.filter(c=>c.venc.startsWith(mesAtualCP));
          const vencidas=cpDataFiltradaMes.filter(c=>c.status==='atrasado'||(c.status!=='pago'&&c.venc<today));
          const emAberto=cpDataFiltradaMes.filter(c=>c.status==='aberto'&&c.venc>=today);
          const pagas=cpDataFiltradaMes.filter(c=>c.status==='pago');
          const totalEmAberto=[...vencidas,...emAberto].reduce((a,c)=>a+c.valor,0);
          const totalVencidas=vencidas.reduce((a,c)=>a+c.valor,0);
          const totalVencendo=emAberto.reduce((a,c)=>a+c.valor,0);
          const totalPagas=pagas.reduce((a,c)=>a+c.valor,0);
          const totalMes=cpDataFiltradaMes.reduce((a,c)=>a+c.valor,0);
          const mediaPorConta=cpDataFiltradaMes.length>0?totalMes/cpDataFiltradaMes.length:0;
          const filtrados=cpFiltro==='todos'?cpDataFiltradaMes:cpDataFiltradaMes.filter(c=>
            cpFiltro==='aberto'?c.status==='aberto':
            cpFiltro==='atrasado'?c.status==='atrasado':
            cpFiltro==='pago'?c.status==='pago':
            c.status==='agendado');
          const handleBulkDeleteCP=async()=>{
            if(cpSelected.size===0)return;
            if(!confirm(`Excluir ${cpSelected.size} conta(s)? Essa ação não pode ser desfeita.`))return;
            setSavingItem(true);
            await supabase.from('contas_pagar').delete().in('id',Array.from(cpSelected));
            await fetchFinanceiro(user.id);
            setCpSelected(new Set());
            setSavingItem(false);
          };
          const toggleCpSelect=id=>setCpSelected(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n;});
          const CAT_COLORS={'Folha':'#378ADD','Fornecedores':'#7F77DD','Impostos':'#D85A30','Infraestrutura':'#BA7517','Marketing':'#1D9E75','Utilities':'#137789','Financeiro':'#E8734A','Outros':'#888780'};
          const catMap=cpData.reduce((acc,c)=>{const cat=c.cat||'Outros';acc[cat]=(acc[cat]||0)+c.valor;return acc},{});
          const donutData=Object.entries(catMap).map(([name,value])=>({name,value,color:CAT_COLORS[name]||'#888780'}));
          const barData=[];
          for(let i=5;i>=0;i--){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);const mes=d.toISOString().slice(0,7);const label=d.toLocaleDateString('pt-BR',{month:'short'});const prev=cpData.filter(c=>c.venc.startsWith(mes)).reduce((a,c)=>a+c.valor,0);const pago=cpData.filter(c=>c.venc.startsWith(mes)&&c.status==='pago').reduce((a,c)=>a+c.valor,0);barData.push({mes:label.charAt(0).toUpperCase()+label.slice(1),Previsto:prev,Pago:pago});}
          const dows=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
          const calCells=cpData.filter(c=>c.venc.startsWith(mesAtualCP)).sort((a,b)=>a.venc.localeCompare(b.venc)).map(c=>{const dt=new Date(c.venc+'T00:00:00');return{dia:c.venc.slice(8,10),dow:dows[dt.getDay()],status:c.status==='pago'?'pago':(c.venc<today?'vencendo':'previsto'),valor:c.valor};});
          const calStyle={
            pago:    {bg:'#EAF3DE',border:'#C0DD97',tagBg:'#C0DD97',tagTxt:'#27500A',lbl:'pago'},
            vencendo:{bg:'#FCEBEB',border:'#F09595',tagBg:'#F7C1C1',tagTxt:'#791F1F',lbl:''},
            hoje:    {bg:'#E6F1FB',border:'#378ADD',tagBg:'#B5D4F4',tagTxt:'#0C447C',lbl:'hoje'},
            previsto:{bg:'#f8fafc',border:'#e2e8f0',tagBg:'#f1f5f9',tagTxt:'#94a3b8',lbl:'prev.'},
          };
          const tipoBadge={
            fixa:    {bg:'#E6F1FB',txt:'#185FA5',lbl:'Fixa'},
            variavel:{bg:'#EEEDFE',txt:'#3C3489',lbl:'Variável'},
            imposto: {bg:'#FAEEDA',txt:'#854F0B',lbl:'Imposto'},
          };
          const statusBadge={
            pago:    {bg:'#EAF3DE',txt:'#3B6D11',lbl:'Pago'},
            aberto:  {bg:'#FAEEDA',txt:'#854F0B',lbl:'Em aberto'},
            atrasado:{bg:'#FCEBEB',txt:'#A32D2D',lbl:'Vencida'},
            agendado:{bg:'#E6F1FB',txt:'#185FA5',lbl:'Agendado'},
          };
          const CpTip=({active,payload,label})=>{
            if(!active||!payload?.length)return null;
            return(<div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:12,padding:'8px 12px',boxShadow:'0 4px 16px rgba(0,0,0,.1)'}}>
              <p style={{fontSize:10,fontWeight:700,color:'#64748b',marginBottom:4}}>{label}</p>
              {payload.map(p=><p key={p.dataKey} style={{fontSize:10,color:p.fill}}>{p.name}: {formatBRL(p.value)}</p>)}
            </div>);
          };
          return(
            <div className="max-w-7xl mx-auto fade-in space-y-4">
              {/* 1. HEADER */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',flexWrap:'wrap',gap:12}}>
                <div>
                  <p style={{fontSize:12,color:'#64748b',fontWeight:500}}>Gestão financeira</p>
                  <h1 style={{fontSize:20,fontWeight:500,color:'#05121b',marginTop:2}}>Contas a pagar</h1>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'center',gap:4,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:10,padding:'4px 8px'}}>
                    <button onClick={()=>setCpMes(prevMesCP)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px 4px',color:'#94a3b8',display:'flex',alignItems:'center'}}><ChevronLeft size={14}/></button>
                    <span style={{fontSize:12,color:'#64748b',minWidth:130,textAlign:'center'}}>{cpMesLabel}</span>
                    <button onClick={()=>setCpMes(nextMesCP)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px 4px',color:'#94a3b8',display:'flex',alignItems:'center'}}><ChevronRight size={14}/></button>
                  </div>
                  <button onClick={()=>setModalImport({stage:'upload',tipoImport:'contas_pagar'})} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:500,color:'#05121b',cursor:'pointer',display:'flex',alignItems:'center',gap:4}}><Upload size={12}/>Importar</button>
                  <button onClick={()=>setModalCP({descricao:'',valor:'',vencimento:today,categoria:'',tipo_custo:'variavel',status:'pendente'})} style={{background:'#05121b',color:'#fff',border:'none',borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}><Plus size={12}/>Nova conta</button>
                </div>
              </div>
              {/* 2. METRIC CARDS */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:12}}>
                <div style={{borderRadius:12,padding:'16px 18px',border:'1px solid #F7C1C1',background:'#FCEBEB'}}>
                  <p style={{fontSize:11,fontWeight:500,color:'#993C1D',marginBottom:6}}>Em aberto</p>
                  <p style={{fontSize:19,fontWeight:500,color:'#791F1F',lineHeight:1.2}}>{formatBRL(totalEmAberto)}</p>
                  <p style={{fontSize:11,color:'#993C1D',marginTop:4}}>{vencidas.length+emAberto.length} contas</p>
                </div>
                <div style={{borderRadius:12,padding:'16px 18px',border:'1px solid #F7C1C1',background:'#FCEBEB'}}>
                  <p style={{fontSize:11,fontWeight:500,color:'#993C1D',marginBottom:6}}>Vencidas</p>
                  <p style={{fontSize:19,fontWeight:500,color:'#791F1F',lineHeight:1.2}}>{formatBRL(totalVencidas)}</p>
                  <p style={{fontSize:11,color:'#993C1D',marginTop:4}}>{vencidas.length} contas atrasadas</p>
                </div>
                <div style={{borderRadius:12,padding:'16px 18px',border:'1px solid #FAC775',background:'#FAEEDA'}}>
                  <p style={{fontSize:11,fontWeight:500,color:'#854F0B',marginBottom:6}}>Vencem em 7 dias</p>
                  <p style={{fontSize:19,fontWeight:500,color:'#633806',lineHeight:1.2}}>{formatBRL(totalVencendo)}</p>
                  <p style={{fontSize:11,color:'#854F0B',marginTop:4}}>{emAberto.length} contas</p>
                </div>
                <div style={{borderRadius:12,padding:'16px 18px',border:'1px solid #C0DD97',background:'#EAF3DE'}}>
                  <p style={{fontSize:11,fontWeight:500,color:'#3B6D11',marginBottom:6}}>Pagas no mês</p>
                  <p style={{fontSize:19,fontWeight:500,color:'#27500A',lineHeight:1.2}}>{formatBRL(totalPagas)}</p>
                  <p style={{fontSize:11,color:'#3B6D11',marginTop:4}}>{pagas.length} contas</p>
                </div>
                <div style={{borderRadius:12,padding:'16px 18px',border:'1px solid #B5D4F4',background:'#E6F1FB'}}>
                  <p style={{fontSize:11,fontWeight:500,color:'#185FA5',marginBottom:6}}>Total do mês</p>
                  <p style={{fontSize:19,fontWeight:500,color:'#0C447C',lineHeight:1.2}}>{formatBRL(totalMes)}</p>
                  <p style={{fontSize:11,color:'#185FA5',marginTop:4}}>{new Date().toLocaleDateString('pt-BR',{month:'long'})}</p>
                </div>
                <div style={{borderRadius:12,padding:'16px 18px',border:'1px solid #e2e8f0',background:'#fff'}}>
                  <p style={{fontSize:11,fontWeight:500,color:'#64748b',marginBottom:6}}>Média por conta</p>
                  <p style={{fontSize:19,fontWeight:500,color:'#05121b',lineHeight:1.2}}>{formatBRL(mediaPorConta)}</p>
                  <p style={{fontSize:11,color:'#94a3b8',marginTop:4}}>{cpData.length} contas cadastradas</p>
                </div>
              </div>
              {/* 3. ALERTAS */}
              {vencidas.length>0&&(
                <div style={{borderRadius:12,padding:'12px 18px',border:'1px solid #F09595',background:'#FCEBEB',display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'#D85A30',marginTop:4,flexShrink:0}}/>
                  <p style={{fontSize:12,color:'#791F1F',lineHeight:1.6,margin:0}}>
                    <strong style={{color:'#791F1F'}}>{vencidas.length} contas vencidas: </strong>
                    {vencidas.map((c,i)=><span key={c.id}>{c.desc} {formatBRL(c.valor)} ({c.venc?`${c.venc.slice(8,10)}/${c.venc.slice(5,7)}/${c.venc.slice(0,4)}`:'-'}){i<vencidas.length-1?', ':''}</span>)}.{' '}
                    Total em atraso: <strong>{formatBRL(totalVencidas)}</strong>.
                  </p>
                </div>
              )}
              {emAberto.length>0&&(
                <div style={{borderRadius:12,padding:'12px 18px',border:'1px solid #EF9F27',background:'#FAEEDA',display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'#BA7517',marginTop:4,flexShrink:0}}/>
                  <p style={{fontSize:12,color:'#633806',lineHeight:1.6,margin:0}}>
                    <strong style={{color:'#633806'}}>Vencimentos esta semana: </strong>
                    {emAberto.map((c,i)=><span key={c.id}>{c.desc} {formatBRL(c.valor)} ({c.venc?`${c.venc.slice(8,10)}/${c.venc.slice(5,7)}/${c.venc.slice(0,4)}`:'-'}){i<emAberto.length-1?', ':''}</span>)}.{' '}
                    Prepare <strong>{formatBRL(totalVencendo)}</strong>.
                  </p>
                </div>
              )}
              {/* 4. CALENDÁRIO */}
              <div style={{background:'#fff',border:'1px solid #f1f5f9',borderRadius:16,padding:20}}>
                <h3 style={{fontSize:13,fontWeight:500,color:'#05121b',marginBottom:12}}>Calendário de vencimentos — {cpMesLabel}</h3>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {calCells.map((c,i)=>{
                    const s=calStyle[c.status]||calStyle.previsto;
                    return(
                      <div key={i} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:8,padding:'8px 4px',textAlign:'center'}}>
                        <p style={{fontSize:10,color:'#94a3b8',marginBottom:2}}>{c.dow}</p>
                        <p style={{fontSize:13,fontWeight:500,color:'#05121b',marginBottom:4}}>{c.dia}</p>
                        <div style={{display:'inline-block',background:s.tagBg,borderRadius:99,padding:'1px 5px'}}>
                          <p style={{fontSize:9,fontWeight:500,color:s.tagTxt,whiteSpace:'nowrap',margin:0}}>
                            {c.status==='vencendo'?`R$ ${(c.valor/1000).toFixed(1)}k`:s.lbl}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* 5. GRÁFICOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div style={{background:'#fff',border:'1px solid #f1f5f9',borderRadius:16,padding:20}}>
                  <h3 style={{fontSize:13,fontWeight:500,color:'#05121b',marginBottom:12}}>Contas por categoria</h3>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={donutData} dataKey="value" cx="50%" cy="50%" innerRadius="60%" outerRadius="82%" strokeWidth={0} paddingAngle={1}>
                        {donutData.map((e,j)=><Cell key={j} fill={e.color}/>)}
                      </Pie>
                      <RTooltip formatter={v=>[formatBRL(v),'Valor']}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 12px',marginTop:8}}>
                    {donutData.map(d=>(
                      <div key={d.name} style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:4}}>
                        <span style={{display:'flex',alignItems:'center',gap:5}}>
                          <span style={{width:8,height:8,borderRadius:2,background:d.color,flexShrink:0,display:'inline-block'}}/>
                          <span style={{fontSize:10,color:'#64748b'}}>{d.name}</span>
                        </span>
                        <span style={{fontSize:10,fontWeight:500,color:'#05121b'}}>{formatBRL(d.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{background:'#fff',border:'1px solid #f1f5f9',borderRadius:16,padding:20}}>
                  <h3 style={{fontSize:13,fontWeight:500,color:'#05121b',marginBottom:12}}>Previsto vs pago — últimos 6 meses</h3>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={barData} margin={{top:4,right:4,bottom:0,left:-16}}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" vertical={false}/>
                      <XAxis dataKey="mes" tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${Math.round(v/1000)}k`} width={40}/>
                      <RTooltip content={<CpTip/>}/>
                      <Bar dataKey="Previsto" fill="#D3D1C7" radius={[3,3,0,0]} maxBarSize={14}/>
                      <Bar dataKey="Pago" fill="#378ADD" radius={[3,3,0,0]} maxBarSize={14}/>
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{display:'flex',gap:12,marginTop:8}}>
                    <span style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:'#64748b'}}><span style={{width:8,height:8,borderRadius:2,background:'#D3D1C7',display:'inline-block'}}/>Previsto</span>
                    <span style={{display:'flex',alignItems:'center',gap:5,fontSize:10,color:'#64748b'}}><span style={{width:8,height:8,borderRadius:2,background:'#378ADD',display:'inline-block'}}/>Pago</span>
                  </div>
                </div>
              </div>
              {/* 6. TABELA */}
              <div style={{background:'#fff',border:'1px solid #f1f5f9',borderRadius:16,overflow:'hidden'}}>
                <div style={{padding:'16px 20px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:10,fontWeight:700,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.1em'}}>{filtrados.length} contas</span>
                    <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                      {[{k:'todos',l:'Todas'},{k:'aberto',l:'Em aberto'},{k:'atrasado',l:'Vencidas'},{k:'pago',l:'Pagas'},{k:'agendado',l:'Agendadas'}].map(f=>(
                        <button key={f.k} onClick={()=>setCpFiltro(f.k)} style={{padding:'3px 10px',borderRadius:99,fontSize:10,fontWeight:700,border:`1px solid ${cpFiltro===f.k?'#05121b':'#e2e8f0'}`,background:cpFiltro===f.k?'#05121b':'transparent',color:cpFiltro===f.k?'#fff':'#64748b',cursor:'pointer'}}>{f.l}</button>
                      ))}
                    </div>
                  </div>
                  {cpSelected.size>0&&(
                    <button onClick={handleBulkDeleteCP} style={{padding:'4px 12px',borderRadius:8,fontSize:11,background:'#FCEBEB',color:'#A32D2D',border:'1px solid #F7C1C1',cursor:'pointer',fontWeight:600}}>
                      Excluir {cpSelected.size} selecionada(s)
                    </button>
                  )}
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed'}}>
                    <thead>
                      <tr style={{borderBottom:'1px solid #f1f5f9'}}>
                        <th style={{padding:'10px 12px',width:'4%'}}></th>
                        {[{h:'Fornecedor / descrição',w:'24%'},{h:'Categoria',w:'13%'},{h:'Vencimento',w:'10%'},{h:'Tipo',w:'10%'},{h:'Status',w:'11%'},{h:'Valor',w:'10%'},{h:'Ações',w:'18%'}].map(col=>(
                          <th key={col.h} style={{padding:'10px 16px',fontSize:10,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em',textAlign:col.h==='Valor'?'right':'left',width:col.w}}>{col.h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtrados.map(c=>{
                        const tp=tipoBadge[c.tipo]||{bg:'#f1f5f9',txt:'#64748b',lbl:c.tipo};
                        const sb=statusBadge[c.status]||{bg:'#f1f5f9',txt:'#64748b',lbl:c.status};
                        const isAtrasado=c.status==='atrasado';
                        const isPago=c.status==='pago';
                        const valColor=isPago?'#27500A':isAtrasado?'#791F1F':'#05121b';
                        const canPay=c.status==='aberto'||c.status==='atrasado';
                        const isSelected=cpSelected.has(c.id);
                        return(
                          <tr key={c.id} style={{borderBottom:'1px solid #f8fafc',background:isSelected?'#f0f9ff':undefined}}
                            onMouseEnter={e=>{if(!isSelected)e.currentTarget.style.background='#f8fafc';}}
                            onMouseLeave={e=>{if(!isSelected)e.currentTarget.style.background='transparent';}}>
                            <td style={{padding:'10px 12px',textAlign:'center'}}>
                              <input type="checkbox" checked={isSelected} onChange={()=>toggleCpSelect(c.id)} style={{cursor:'pointer',accentColor:'#137789'}}/>
                            </td>
                            <td style={{padding:'10px 16px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:13,fontWeight:500,color:'#05121b'}}>{c.desc}</td>
                            <td style={{padding:'10px 16px',fontSize:12,color:'#64748b'}}>{c.cat}</td>
                            <td style={{padding:'10px 16px',fontSize:12,fontWeight:isAtrasado?700:400,color:isAtrasado?'#D85A30':'#64748b',whiteSpace:'nowrap'}}>{c.venc?`${c.venc.slice(8,10)}/${c.venc.slice(5,7)}/${c.venc.slice(0,4)}`:'—'}</td>
                            <td style={{padding:'10px 16px'}}><span style={{padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:500,background:tp.bg,color:tp.txt}}>{tp.lbl}</span></td>
                            <td style={{padding:'10px 16px'}}><span style={{padding:'2px 8px',borderRadius:99,fontSize:10,fontWeight:500,background:sb.bg,color:sb.txt}}>{sb.lbl}</span></td>
                            <td style={{padding:'10px 16px',textAlign:'right',fontSize:13,fontWeight:500,color:valColor,whiteSpace:'nowrap'}}>{formatBRL(c.valor)}</td>
                            <td style={{padding:'10px 16px'}}>
                              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                                <button onClick={()=>setModalCP({...contasPagar.find(x=>x.id===c.id)||{},descricao:c.desc,valor:c.valor,vencimento:c.venc,categoria:c.cat,tipo_custo:c.tipo_custo||'variavel',status:c.status,id:c.id})} style={{padding:'3px 8px',borderRadius:8,fontSize:11,background:'#f1f5f9',color:'#64748b',border:'1px solid #e2e8f0',cursor:'pointer',fontWeight:500}}>Editar</button>
                                {canPay&&<button onClick={()=>setModalPagarCP({id:c.id,desc:c.desc,valor:c.valor,cat:c.cat,tipo_custo:contasPagar.find(x=>x.id===c.id)?.tipo_custo||'variavel',meioPagamento:'',bancoId:'',dataPagamento:today})} style={{padding:'3px 10px',borderRadius:99,fontSize:11,background:'#EAF3DE',color:'#3B6D11',border:'1px solid #9FE1CB',cursor:'pointer',fontWeight:500,whiteSpace:'nowrap'}}>Pagar</button>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filtrados.length===0&&(
                        <tr><td colSpan={8} style={{padding:'40px 16px',textAlign:'center',color:'#94a3b8',fontSize:12}}>Nenhuma conta para este filtro</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════
            ── CONTAS A RECEBER ──────────────────────────────────────── */}
        {view==='contas_receber'&&(
          <ContasReceberView
            contasReceber={contasReceber}
            bancos={bancos}
            onSalvar={handleSalvarCR}
            onEditar={cr=>setModalCR({...cr})}
            onReceber={handleReceberCR}
            onExcluir={handleExcluirCR}
            onPagamentoParcial={handlePagamentoParcial}
            onImportClick={()=>setModalImport({stage:'upload',tipoImport:'contas_receber'})}
            savingItem={savingItem}
          />
        )}

        {/* ══════════════════════════════════════════════════════════════
            ── INVESTIMENTOS ─────────────────────────────────────────── */}
        {view==='investimentos'&&(()=>{
          const tiposInv=['CDB','LCI','LCA','Poupança','Fundo de Investimento','Ações','Tesouro Direto','Outros'];
          const liquidezOpts=['Diária','30 dias','60 dias','90 dias','180 dias','No vencimento','Outros'];
          const statusMapInv={ativo:{bg:'bg-emerald-50',border:'border-emerald-200',txt:'text-emerald-700',dot:'bg-emerald-500',lbl:'Ativo'},encerrado:{bg:'bg-slate-50',border:'border-slate-200',txt:'text-slate-500',dot:'bg-slate-400',lbl:'Encerrado'},vencido:{bg:'bg-amber-50',border:'border-amber-200',txt:'text-amber-700',dot:'bg-amber-500',lbl:'Vencido'}};
          const ativos=investimentos.filter(i=>i.status==='ativo');
          const totalAplicado=ativos.reduce((a,i)=>a+Number(i.valor_aplicado||0),0);
          const totalAtual=ativos.reduce((a,i)=>a+Number(i.valor_atual||i.valor_aplicado||0),0);
          const rentTotal=totalAplicado>0?((totalAtual-totalAplicado)/totalAplicado*100):0;
          return(
            <div className="max-w-7xl mx-auto fade-in">
              <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div><p className="text-xs text-slate-500 font-medium">Patrimônio</p><h1 className="text-xl font-medium text-[#05121b]">Investimentos</h1></div>
                <button onClick={()=>setModalInvestimento({nome:'',tipo:'CDB',instituicao:'',valor_aplicado:'',valor_atual:'',rentabilidade_pct:'',data_aplicacao:'',data_vencimento:'',liquidez:'30 dias',status:'ativo'})} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-md"><Plus size={13}/>Novo Investimento</button>
              </header>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5"><p className="text-xs text-blue-600 font-medium mb-1">Total Aplicado</p><p className="text-xl font-medium text-blue-800">{formatBRL(totalAplicado)}</p></div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm"><p className="text-xs text-slate-500 font-medium mb-1">Valor Atual</p><p className="text-xl font-medium text-[#05121b]">{formatBRL(totalAtual)}</p></div>
                <div className={`${rentTotal>=0?'bg-emerald-50 border-emerald-200':'bg-red-50 border-red-200'} border rounded-2xl p-5`}><p className={`text-xs font-medium mb-1 ${rentTotal>=0?'text-emerald-600':'text-red-500'}`}>Rentabilidade</p><p className={`text-xl font-medium ${rentTotal>=0?'text-emerald-800':'text-red-700'}`}>{rentTotal>=0?'+':''}{rentTotal.toFixed(2)}%</p></div>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                {investimentos.length===0?<div className="py-16 text-center"><DollarSign size={28} className="text-slate-200 mx-auto mb-3"/><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Nenhum investimento registrado</p></div>:(
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-100">{['Nome','Tipo','Instituição','Aplicado','Valor Atual','Vencimento','Status',''].map(h=><th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {investimentos.map(inv=>{
                        const S=statusMapInv[inv.status]||statusMapInv.ativo;
                        const rentPct=inv.valor_aplicado>0?((Number(inv.valor_atual||inv.valor_aplicado)-Number(inv.valor_aplicado))/Number(inv.valor_aplicado)*100):0;
                        return(
                          <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3"><p className="text-xs font-bold text-[#05121b]">{inv.nome}</p>{inv.liquidez&&<p className="text-[9px] text-slate-400">{inv.liquidez}</p>}</td>
                            <td className="px-4 py-3"><span className="bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{inv.tipo}</span></td>
                            <td className="px-4 py-3 text-[10px] text-slate-400">{inv.instituicao||'—'}</td>
                            <td className="px-4 py-3 text-xs font-bold text-[#05121b]">{formatBRL(inv.valor_aplicado)}</td>
                            <td className="px-4 py-3">
                              <p className="text-xs font-bold text-[#05121b]">{formatBRL(inv.valor_atual||inv.valor_aplicado)}</p>
                              {rentPct!==0&&<p className={`text-[9px] font-black ${rentPct>=0?'text-emerald-600':'text-red-500'}`}>{rentPct>=0?'+':''}{rentPct.toFixed(2)}%</p>}
                            </td>
                            <td className="px-4 py-3 text-[10px] text-slate-400">{inv.data_vencimento?fmtDate(inv.data_vencimento):'—'}</td>
                            <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${S.bg} ${S.border} ${S.txt}`}><span className={`w-1.5 h-1.5 rounded-full ${S.dot}`}></span>{S.lbl}</span></td>
                            <td className="px-4 py-3"><div className="flex items-center gap-2"><button onClick={()=>setModalInvestimento({...inv,valor_aplicado:formatCurrency(String(Math.round(Number(inv.valor_aplicado)*100))),valor_atual:inv.valor_atual?formatCurrency(String(Math.round(Number(inv.valor_atual)*100))):'' })} className="text-slate-300 hover:text-[#137789] transition-colors"><Pencil size={13}/></button><button onClick={()=>deleteItem('investimentos',inv.id,()=>fetchFinanceiro(user.id))} className="text-slate-200 hover:text-red-400 transition-colors"><Trash2 size={13}/></button></div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════
            ── DÍVIDAS ───────────────────────────────────────────────── */}
        {view==='dividas'&&(()=>{
          const divAtivas=dividas.filter(d=>d.status==='ativa');
          const divQuitadas=dividas.filter(d=>d.status==='quitada');
          const totalSaldo=divAtivas.reduce((a,d)=>a+Number(d.saldo_devedor||d.valor_total||0),0);
          const totalParcelas=divAtivas.reduce((a,d)=>a+Number(d.valor_parcela||0),0);
          const comprometimento=receitaMensal>0?(totalParcelas/receitaMensal)*100:0;
          const dMaiorTaxa=divAtivas.length>0?divAtivas.reduce((mx,d)=>Number(d.taxa_juros||0)>Number(mx.taxa_juros||0)?d:mx,divAtivas[0]):null;
          const maiorTaxa=Number(dMaiorTaxa?.taxa_juros||0);
          const taxaAnual=maiorTaxa>0?(Math.pow(1+maiorTaxa/100,12)-1)*100:0;
          const credoresUnicos=new Set(divAtivas.map(d=>d.credor)).size;
          // Previsão de quitação: mês que a última dívida quita (pelo campo ou proximo_vencimento)
          const datasQuit=divAtivas.map(d=>d.previsao_quitacao||d.proximo_vencimento).filter(Boolean).sort();
          const ultimaQuit=datasQuit[datasQuit.length-1]||null;

          // Gráfico de evolução: projeção 12 meses
          const evoData=(()=>{
            if(divAtivas.length===0)return[];
            const result=[];
            const nowD=new Date();
            const saldos=divAtivas.map(d=>Math.max(0,Number(d.saldo_devedor||d.valor_total||0)));
            const taxas=divAtivas.map(d=>Number(d.taxa_juros||0)/100);
            const pcs=divAtivas.map(d=>Number(d.valor_parcela||0));
            for(let m=0;m<=12;m++){
              const dt=new Date(nowD.getFullYear(),nowD.getMonth()+m,1);
              const lbl=dt.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}).replace('. de ',' ');
              const total=saldos.reduce((a,s)=>a+Math.max(0,s),0);
              result.push({lbl,saldo:Math.round(total)});
              saldos.forEach((s,i)=>{
                if(s<=0)return;
                const j=s*taxas[i];
                const principal=Math.max(0,pcs[i]-j);
                saldos[i]=Math.max(0,s-principal);
              });
            }
            return result;
          })();

          // Composição por tipo (donut)
          const porTipo={};
          divAtivas.forEach(d=>{const t=d.tipo||'Outros';porTipo[t]=(porTipo[t]||0)+Number(d.saldo_devedor||d.valor_total||0);});
          const composicaoData=Object.entries(porTipo).map(([name,value])=>({name,value:Math.round(value)}));
          const donutColors=['#137789','#ff7b00','#05121b','#fbbf24','#a78bfa','#f87171'];

          // Simulator
          const simDivida=divAtivas[simDividaIdx]||null;
          const simSaldo=Number(simDivida?.saldo_devedor||simDivida?.valor_total||0);
          const simTaxa=Number(simDivida?.taxa_juros||0)/100;
          const simParcela=Number(simDivida?.valor_parcela||0);
          const calcMeses=(s,t,p)=>{if(s<=0)return 0;if(p<=0)return 0;let sv=s,m=0;while(sv>0.01&&m<360){const j=sv*t;sv=Math.max(0,sv-(p-j));m++;}return m;};
          const mesesSem=calcMeses(simSaldo,simTaxa,simParcela);
          const mesesCom=simDividaSlider>0?calcMeses(simSaldo,simTaxa,simParcela+simDividaSlider):mesesSem;
          const mesesEcon=Math.max(0,mesesSem-mesesCom);
          const jurosSem=simParcela>0&&mesesSem>0?Math.max(0,simParcela*mesesSem-simSaldo):0;
          const jurosCom=simParcela>0&&mesesCom>0?Math.max(0,(simParcela+simDividaSlider)*mesesCom-simSaldo):0;
          const jurosEcon=Math.max(0,jurosSem-jurosCom);

          const statusMap={ativa:{bg:'bg-amber-50',border:'border-amber-200',txt:'text-amber-700',dot:'bg-amber-400',lbl:'Ativa'},quitada:{bg:'bg-emerald-50',border:'border-emerald-200',txt:'text-emerald-700',dot:'bg-emerald-400',lbl:'Quitada'},em_negociacao:{bg:'bg-blue-50',border:'border-blue-200',txt:'text-blue-700',dot:'bg-blue-400',lbl:'Em Negociação'}};

          return(
            <div className="max-w-7xl mx-auto fade-in">
              {/* Header */}
              <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div><p className="text-xs text-slate-500 font-medium">Passivos</p><h1 className="text-xl font-medium text-[#05121b]">Dívidas</h1></div>
                <button onClick={()=>setModalDivida({credor:'',descricao:'',valor_total:'',valor_parcela:'',parcelas_total:'',parcelas_pagas:0,proximo_vencimento:'',status:'ativa',tipo:'Empréstimo',taxa_juros:'',saldo_devedor:'',data_inicio:'',previsao_quitacao:''})} className="bg-[#05121b] text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-md"><Plus size={13}/>Nova Dívida</button>
              </header>

              {/* 6 KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                {[
                  {lbl:'Saldo Total',val:formatBRL(totalSaldo),sub:`${divAtivas.length} ativa${divAtivas.length!==1?'s':''}`,color:'text-red-600',bg:'bg-red-50',border:'border-red-100'},
                  {lbl:'Parcelas/Mês',val:formatBRL(totalParcelas),sub:'total comprometido',color:'text-amber-600',bg:'bg-amber-50',border:'border-amber-100'},
                  {lbl:'Comprometimento',val:`${comprometimento.toFixed(1)}%`,sub:'da receita mensal',color:comprometimento>30?'text-red-600':comprometimento>15?'text-amber-600':'text-emerald-600',bg:comprometimento>30?'bg-red-50':comprometimento>15?'bg-amber-50':'bg-emerald-50',border:comprometimento>30?'border-red-100':comprometimento>15?'border-amber-100':'border-emerald-100'},
                  {lbl:'Maior Taxa',val:maiorTaxa>0?`${maiorTaxa.toFixed(2)}% a.m.`:'—',sub:maiorTaxa>0?`≈${taxaAnual.toFixed(1)}% a.a.`:'nenhuma ativa',color:'text-purple-600',bg:'bg-purple-50',border:'border-purple-100'},
                  {lbl:'Previsão Quitação',val:ultimaQuit?fmtDate(ultimaQuit):'—',sub:'última parcela',color:'text-[#137789]',bg:'bg-[#137789]/5',border:'border-[#137789]/20'},
                  {lbl:'Credores',val:String(credoresUnicos||0),sub:`${divQuitadas.length} quitada${divQuitadas.length!==1?'s':''}`,color:'text-slate-600',bg:'bg-slate-50',border:'border-slate-100'},
                ].map(c=>(
                  <div key={c.lbl} className={`rounded-2xl p-4 border ${c.bg} ${c.border}`}>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{c.lbl}</p>
                    <p className={`text-lg font-black ${c.color} leading-none mb-1`}>{c.val}</p>
                    <p className="text-[9px] text-slate-400">{c.sub}</p>
                  </div>
                ))}
              </div>

              {/* Alerta de maior taxa */}
              {dMaiorTaxa&&maiorTaxa>0&&(
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5"/>
                  <div>
                    <p className="text-xs font-black text-amber-800">Atenção: dívida com maior custo</p>
                    <p className="text-[10px] text-amber-700 mt-0.5">
                      <span className="font-bold">{dMaiorTaxa.credor}</span> cobra {maiorTaxa.toFixed(2)}% a.m. — equivalente a {taxaAnual.toFixed(1)}% ao ano.
                      {receitaMensal>0&&totalParcelas>0&&<> Suas parcelas comprometem {comprometimento.toFixed(1)}% da receita mensal. Priorize quitar esta dívida primeiro.</>}
                    </p>
                  </div>
                </div>
              )}

              {/* Charts row */}
              {divAtivas.length>0&&(
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                  {/* Evolução do saldo */}
                  <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Projeção de Quitação</p>
                    {evoData.length>0?(
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={evoData} margin={{top:4,right:8,left:0,bottom:0}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                          <XAxis dataKey="lbl" tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                          <YAxis tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                          <RTooltip formatter={v=>formatBRL(v)} labelStyle={{fontSize:10}} contentStyle={{fontSize:10,borderRadius:8,border:'1px solid #e2e8f0'}}/>
                          <Line type="monotone" dataKey="saldo" stroke="#ef4444" strokeWidth={2} dot={false} name="Saldo Devedor"/>
                        </LineChart>
                      </ResponsiveContainer>
                    ):<div className="h-44 flex items-center justify-center text-[10px] text-slate-300">Sem dados suficientes</div>}
                  </div>

                  {/* Composição por tipo */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Composição por Tipo</p>
                    {composicaoData.length>0?(
                      <>
                        <ResponsiveContainer width="100%" height={130}>
                          <PieChart>
                            <Pie data={composicaoData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={2}>
                              {composicaoData.map((_,i)=><Cell key={i} fill={donutColors[i%donutColors.length]}/>)}
                            </Pie>
                            <RTooltip formatter={v=>formatBRL(v)} contentStyle={{fontSize:10,borderRadius:8,border:'1px solid #e2e8f0'}}/>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1 mt-2">
                          {composicaoData.map((e,i)=>(
                            <div key={e.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shrink-0" style={{background:donutColors[i%donutColors.length]}}></span><span className="text-[9px] text-slate-500 truncate max-w-[90px]">{e.name}</span></div>
                              <span className="text-[9px] font-bold text-slate-600">{formatBRL(e.value)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    ):<div className="h-44 flex items-center justify-center text-[10px] text-slate-300">Nenhuma dívida ativa</div>}
                  </div>
                </div>
              )}

              {/* Cards individuais */}
              {divAtivas.length>0&&(
                <div className="mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Dívidas Ativas</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {divAtivas.map((d,i)=>{
                      const prog=d.parcelas_total>0?Math.min(100,Math.round((d.parcelas_pagas/d.parcelas_total)*100)):0;
                      const saldo=Number(d.saldo_devedor||d.valor_total||0);
                      const taxa=Number(d.taxa_juros||0);
                      return(
                        <div key={d.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-xs font-black text-[#05121b]">{d.credor}</p>
                              {d.tipo&&<p className="text-[9px] text-slate-400 mt-0.5">{d.tipo}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={()=>setModalDivida({...d,valor_total:formatCurrency(String(Math.round(Number(d.valor_total||0)*100))),valor_parcela:d.valor_parcela?formatCurrency(String(Math.round(Number(d.valor_parcela)*100))):'',saldo_devedor:d.saldo_devedor?formatCurrency(String(Math.round(Number(d.saldo_devedor)*100))):'',taxa_juros:d.taxa_juros?String(d.taxa_juros):''})} className="text-slate-300 hover:text-[#137789] transition-colors"><Pencil size={13}/></button>
                              <button onClick={()=>deleteItem('dividas',d.id,()=>fetchFinanceiro(user.id))} className="text-slate-200 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                            </div>
                          </div>
                          <p className="text-xl font-black text-red-600 mb-1">{formatBRL(saldo)}</p>
                          <p className="text-[9px] text-slate-400 mb-3">{d.valor_parcela?`${formatBRL(d.valor_parcela)}/mês`:''}{taxa>0?` · ${taxa.toFixed(2)}% a.m.`:''}</p>
                          {d.parcelas_total>0&&(
                            <div>
                              <div className="flex justify-between text-[9px] text-slate-400 mb-1"><span>{d.parcelas_pagas}/{d.parcelas_total} parcelas</span><span>{prog}%</span></div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{width:`${prog}%`}}></div></div>
                            </div>
                          )}
                          {d.proximo_vencimento&&<p className="text-[9px] text-slate-400 mt-2">Próx. venc.: {fmtDate(d.proximo_vencimento)}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Simulador de antecipação */}
              {divAtivas.length>0&&simDivida&&(
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Simulador de Antecipação</p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 mb-2">Selecionar dívida</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {divAtivas.map((d,i)=>(
                          <button key={d.id} onClick={()=>{setSimDividaIdx(i);setSimDividaSlider(0);}} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${simDividaIdx===i?'bg-[#05121b] text-white border-[#05121b]':'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>{d.credor}</button>
                        ))}
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                          <div><p className="text-slate-400">Saldo devedor</p><p className="font-black text-[#05121b]">{formatBRL(simSaldo)}</p></div>
                          <div><p className="text-slate-400">Parcela atual</p><p className="font-black text-[#05121b]">{simParcela>0?formatBRL(simParcela):'—'}</p></div>
                          <div><p className="text-slate-400">Taxa mensal</p><p className="font-black text-[#05121b]">{simTaxa>0?`${(simTaxa*100).toFixed(2)}% a.m.`:'—'}</p></div>
                          <div><p className="text-slate-400">Prazo sem extra</p><p className="font-black text-[#05121b]">{mesesSem>0?`${mesesSem} meses`:'—'}</p></div>
                        </div>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 mb-1">Pagamento extra mensal: <span className="text-[#05121b]">{formatBRL(simDividaSlider)}</span></p>
                      <input type="range" min={0} max={Math.max(simParcela*3,1000)} step={50} value={simDividaSlider} onChange={e=>setSimDividaSlider(Number(e.target.value))} className="w-full accent-[#137789]"/>
                      <div className="flex justify-between text-[9px] text-slate-300 mt-1"><span>R$ 0</span><span>{formatBRL(Math.max(simParcela*3,1000))}</span></div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <p className="text-[10px] font-bold text-slate-500">Resultado da simulação</p>
                      {simDividaSlider>0&&mesesEcon>0?(
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              {lbl:'Meses economizados',val:`${mesesEcon}`,color:'text-emerald-600',bg:'bg-emerald-50'},
                              {lbl:'Juros economizados',val:formatBRL(jurosEcon),color:'text-emerald-600',bg:'bg-emerald-50'},
                              {lbl:'Novo prazo',val:`${mesesCom} meses`,color:'text-[#05121b]',bg:'bg-slate-50'},
                              {lbl:'Nova parcela total',val:formatBRL(simParcela+simDividaSlider),color:'text-[#05121b]',bg:'bg-slate-50'},
                            ].map(s=>(
                              <div key={s.lbl} className={`rounded-xl p-3 ${s.bg}`}>
                                <p className="text-[9px] text-slate-400 mb-1">{s.lbl}</p>
                                <p className={`text-sm font-black ${s.color}`}>{s.val}</p>
                              </div>
                            ))}
                          </div>
                          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mt-1">
                            <p className="text-[10px] text-emerald-700 font-medium">Pagando <span className="font-black">{formatBRL(simDividaSlider)}</span> a mais por mês você quita {mesesEcon} meses mais cedo e economiza <span className="font-black">{formatBRL(jurosEcon)}</span> em juros.</p>
                          </div>
                        </>
                      ):(
                        <div className="flex-1 flex items-center justify-center text-[10px] text-slate-300 bg-slate-50 rounded-xl p-8 text-center">
                          {simParcela>0&&simTaxa>0?'Mova o slider para simular um pagamento extra':'Cadastre taxa de juros e valor da parcela para simular'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tabela histórico: todas as dívidas */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Todas as Dívidas</p>
                  <span className="text-[9px] text-slate-300">{dividas.length} registro{dividas.length!==1?'s':''}</span>
                </div>
                {dividas.length===0?(
                  <div className="py-16 text-center"><AlertOctagon size={28} className="text-slate-200 mx-auto mb-3"/><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Nenhuma dívida registrada</p></div>
                ):(
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead><tr className="border-b border-slate-100">{['Credor','Tipo','Saldo Devedor','Parcela','Taxa a.m.','Progresso','Status',''].map(h=><th key={h} className="px-5 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {dividas.map(d=>{
                          const S=statusMap[d.status]||statusMap.ativa;
                          const prog=d.parcelas_total>0?Math.min(100,Math.round((d.parcelas_pagas/d.parcelas_total)*100)):0;
                          const saldo=Number(d.saldo_devedor||d.valor_total||0);
                          return(
                            <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-5 py-3"><div><p className="text-xs font-black text-[#05121b]">{d.credor}</p>{d.descricao&&<p className="text-[9px] text-slate-400 truncate max-w-[140px]">{d.descricao}</p>}</div></td>
                              <td className="px-5 py-3 text-[10px] text-slate-400">{d.tipo||'—'}</td>
                              <td className="px-5 py-3 text-sm font-black text-red-600 whitespace-nowrap">{formatBRL(saldo)}</td>
                              <td className="px-5 py-3 text-[10px] text-slate-500 whitespace-nowrap">{d.valor_parcela?formatBRL(d.valor_parcela):'—'}</td>
                              <td className="px-5 py-3 text-[10px] text-slate-500 whitespace-nowrap">{d.taxa_juros?`${Number(d.taxa_juros).toFixed(2)}%`:'—'}</td>
                              <td className="px-5 py-3">
                                {d.parcelas_total>0?(
                                  <div className="min-w-[80px]">
                                    <div className="flex justify-between text-[9px] text-slate-400 mb-1"><span>{d.parcelas_pagas}/{d.parcelas_total}x</span><span>{prog}%</span></div>
                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{width:`${prog}%`}}></div></div>
                                  </div>
                                ):<span className="text-[10px] text-slate-300">—</span>}
                              </td>
                              <td className="px-5 py-3"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${S.bg} ${S.border} ${S.txt}`}><span className={`w-1.5 h-1.5 rounded-full ${S.dot}`}></span>{S.lbl}</span></td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <button onClick={()=>setModalDivida({...d,valor_total:formatCurrency(String(Math.round(Number(d.valor_total||0)*100))),valor_parcela:d.valor_parcela?formatCurrency(String(Math.round(Number(d.valor_parcela)*100))):'',saldo_devedor:d.saldo_devedor?formatCurrency(String(Math.round(Number(d.saldo_devedor)*100))):'',taxa_juros:d.taxa_juros?String(d.taxa_juros):''})} className="text-slate-300 hover:text-[#137789] transition-colors"><Pencil size={13}/></button>
                                  <button onClick={()=>deleteItem('dividas',d.id,()=>fetchFinanceiro(user.id))} className="text-slate-200 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════
            ── BANCOS ────────────────────────────────────────────────── */}
        {view==='bancos'&&(
          <div className="fade-in">
            <BancosContas
              bancos={bancos}
              lancamentos={lancamentos}
              userId={user?.id}
              onSaveBanco={handleSaveBancoFromBancosContas}
              onDeleteBanco={handleDeleteBanco}
              onSaveLancamento={handleSaveLancamentoEspecie}
              onDeleteLancamentos={handleDeleteLancamentos}
              onImportClick={()=>setModalImport({stage:'upload',tipoImport:'extrato'})}
              savingItem={savingItem}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ── RELATÓRIOS (download) ─────────────────────────────────── */}
        {view==='relatorios'&&(
          <div className="max-w-7xl mx-auto fade-in">
            <header className="mb-8"><p className="text-xs text-slate-500 font-medium">Documentos</p><h1 className="text-xl font-medium text-[#05121b]">Relatórios</h1></header>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {title:'DRE — Demonstrativo de Resultado',desc:'Receitas, custos, despesas e lucro líquido do período.',icon:FileSpreadsheet,color:'text-[#137789]',bg:'bg-[#137789]/5',border:'border-[#137789]/20',status:'em breve'},
                {title:'Fluxo de Caixa Consolidado',desc:'Entradas e saídas organizadas por período.',icon:Activity,color:'text-blue-600',bg:'bg-blue-50',border:'border-blue-200',status:'em breve'},
                {title:'Relatório de Contas a Pagar',desc:'Lista completa de contas com status e vencimentos.',icon:Receipt,color:'text-amber-600',bg:'bg-amber-50',border:'border-amber-200',status:'em breve'},
                {title:'Relatório de Dívidas',desc:'Posição atualizada de todas as dívidas ativas.',icon:AlertOctagon,color:'text-red-600',bg:'bg-red-50',border:'border-red-200',status:'em breve'},
              ].map(r=>(
                <div key={r.title} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${r.bg} border ${r.border}`}><r.icon size={20} className={r.color}/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-[#05121b] mb-1">{r.title}</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-3">{r.desc}</p>
                    <span className="text-[9px] bg-slate-100 text-slate-400 px-2.5 py-1 rounded-full font-black uppercase tracking-widest">{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MODAIS DE CRUD ─────────────────────────────────────────────────────── */}

        {/* Modal Lançamento (Receita) */}
        {modalReceita&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={()=>setModalReceita(null)}>
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-black text-[#05121b]">Nova Receita</h3><button onClick={()=>setModalReceita(null)} className="text-slate-300 hover:text-red-400 transition-colors"><X size={20}/></button></div>
              <div className="space-y-4">
                <InputField label="Descrição" value={modalReceita.descricao} onChange={v=>setModalReceita({...modalReceita,descricao:v})}/>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Valor" value={modalReceita.valor} onChange={v=>setModalReceita({...modalReceita,valor:v})} maskType="currency"/>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Data</label><input type="date" value={modalReceita.data} onChange={e=>setModalReceita({...modalReceita,data:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"/></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Categoria</label><select value={modalReceita.categoria} onChange={e=>setModalReceita({...modalReceita,categoria:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-emerald-500"><option value="">Selecione...</option>{['Venda de Produto','Venda de Serviço','Mensalidade','Comissão','Juros','Outros'].map(c=><option key={c}>{c}</option>)}</select></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Meio de Recebimento</label><select value={modalReceita.meio_pagamento||''} onChange={e=>setModalReceita({...modalReceita,meio_pagamento:e.target.value,banco_id:e.target.value==='Dinheiro'?'':modalReceita.banco_id})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-emerald-500"><option value="">Selecione...</option>{['PIX','Dinheiro','Transferência Bancária','Cartão de Débito','Cartão de Crédito','Cheque','Outros'].map(c=><option key={c}>{c}</option>)}</select></div>
                </div>
                {modalReceita.meio_pagamento!=='Dinheiro'&&<div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Conta Bancária (opcional)</label><select value={modalReceita.banco_id} onChange={e=>setModalReceita({...modalReceita,banco_id:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-emerald-500"><option value="">— Nenhuma —</option>{bancos.map(b=><option key={b.id} value={b.id}>{b.nome}</option>)}</select></div>}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setModalReceita(null)} className="flex-1 py-3.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50 border border-slate-200 transition-colors">Cancelar</button>
                <button disabled={savingItem||!modalReceita.descricao||!modalReceita.valor} onClick={()=>saveItem('lancamentos',{...modalReceita,valor:parseFloat((modalReceita.valor||'').replace(/[^\d,]/g,'').replace(',','.'))||0,tipo:'receita',user_id:user.id},setModalReceita,()=>fetchFinanceiro(user.id))} className="flex-1 py-3.5 rounded-xl font-black text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{savingItem?<Loader2 size={13} className="animate-spin"/>:null}Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Lançamento (Despesa) */}
        {modalDespesa&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={()=>setModalDespesa(null)}>
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-black text-[#05121b]">Nova Despesa</h3><button onClick={()=>setModalDespesa(null)} className="text-slate-300 hover:text-red-400 transition-colors"><X size={20}/></button></div>
              {(()=>{
                const isCard=modalDespesa.meio_pagamento==='Cartão de Crédito'||modalDespesa.meio_pagamento==='Cartão de Débito';
                const valorBruto=parseFloat((modalDespesa.valor||'').replace(/[^\d,]/g,'').replace(',','.'))||0;
                const taxa=parseFloat(modalDespesa.taxa_cartao)||0;
                const valorLiq=isCard&&taxa>0?valorBruto*(1+taxa/100):valorBruto;
                return(
                <div className="space-y-4">
                  <InputField label="Descrição" value={modalDespesa.descricao} onChange={v=>setModalDespesa({...modalDespesa,descricao:v})}/>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Tipo de custo</label>
                    <div className="flex gap-2">
                      {[{v:'fixa',l:'Custo Fixo'},{v:'variavel',l:'Custo Variável'}].map(({v,l})=>(
                        <button key={v} type="button" onClick={()=>setModalDespesa({...modalDespesa,tipo_custo:v})}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-colors ${(modalDespesa.tipo_custo||'variavel')===v?'bg-red-500 text-white border-red-500':'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Valor" value={modalDespesa.valor} onChange={v=>setModalDespesa({...modalDespesa,valor:v})} maskType="currency"/>
                    <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Data</label><input type="date" value={modalDespesa.data} onChange={e=>setModalDespesa({...modalDespesa,data:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Categoria</label><select value={modalDespesa.categoria} onChange={e=>setModalDespesa({...modalDespesa,categoria:e.target.value,categoria_custom:''})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-red-500"><option value="">Selecione...</option>{['Fornecedor','Folha de Pagamento','Aluguel','Água/Saneamento','Luz/Energia','Internet/Telefone','Marketing','Serviços/Software','Impostos','Estorno','Outros','Personalizado'].map(c=><option key={c}>{c}</option>)}</select></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Meio de Pagamento</label><select value={modalDespesa.meio_pagamento||''} onChange={e=>setModalDespesa({...modalDespesa,meio_pagamento:e.target.value,taxa_cartao:'',banco_id:e.target.value==='Dinheiro'?'':modalDespesa.banco_id})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-red-500"><option value="">Selecione...</option>{['PIX','Dinheiro','Boleto Bancário','Transferência Bancária','Cartão de Débito','Cartão de Crédito','Cheque','Outros'].map(c=><option key={c}>{c}</option>)}</select></div>
                  </div>
                  {modalDespesa.categoria==='Personalizado'&&<div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Nome da despesa específica</label><input type="text" placeholder="Ex: Manutenção, Seguro, Licença..." value={modalDespesa.categoria_custom||''} onChange={e=>setModalDespesa({...modalDespesa,categoria_custom:e.target.value})} className="w-full bg-white border border-red-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"/></div>}
                  {isCard&&(
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-orange-700 uppercase tracking-widest">Taxa do Cartão</p>
                        {taxa>0&&<p className="text-[9px] text-orange-600 font-bold">Custo total: {formatBRL(valorLiq)}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="number" step="0.01" min="0" max="10" placeholder="Ex: 2.5" value={modalDespesa.taxa_cartao||''} onChange={e=>setModalDespesa({...modalDespesa,taxa_cartao:e.target.value})} className="w-28 bg-white border border-orange-200 px-3 py-2 rounded-lg font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-orange-400"/>
                        <span className="text-[10px] text-orange-600 font-bold">% sobre o valor</span>
                      </div>
                    </div>
                  )}
                  {modalDespesa.meio_pagamento!=='Dinheiro'&&<div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Conta Bancária (opcional)</label><select value={modalDespesa.banco_id} onChange={e=>setModalDespesa({...modalDespesa,banco_id:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-red-500"><option value="">— Nenhuma —</option>{bancos.map(b=><option key={b.id} value={b.id}>{b.nome}</option>)}</select></div>}
                </div>
                );
              })()}
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setModalDespesa(null)} className="flex-1 py-3.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50 border border-slate-200 transition-colors">Cancelar</button>
                <button disabled={savingItem||!modalDespesa.descricao||!modalDespesa.valor||(modalDespesa.categoria==='Personalizado'&&!modalDespesa.categoria_custom)} onClick={()=>{const valorBruto=parseFloat((modalDespesa.valor||'').replace(/[^\d,]/g,'').replace(',','.'))||0;const isCard=modalDespesa.meio_pagamento==='Cartão de Crédito'||modalDespesa.meio_pagamento==='Cartão de Débito';const taxa=parseFloat(modalDespesa.taxa_cartao)||0;const valorFinal=isCard&&taxa>0?valorBruto*(1+taxa/100):valorBruto;const catFinal=modalDespesa.categoria==='Personalizado'?(modalDespesa.categoria_custom||'Outros'):modalDespesa.categoria;const{categoria_custom:_cc,...restDesp}=modalDespesa;saveItem('lancamentos',{...restDesp,valor:valorFinal,categoria:catFinal,tipo:'despesa',user_id:user.id,banco_id:modalDespesa.banco_id||null,taxa_cartao:parseFloat(modalDespesa.taxa_cartao)||null,meio_pagamento:modalDespesa.meio_pagamento||null},setModalDespesa,()=>fetchFinanceiro(user.id));}} className="flex-1 py-3.5 rounded-xl font-black text-xs bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{savingItem?<Loader2 size={13} className="animate-spin"/>:null}Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Conta a Pagar */}
        {modalCP&&(()=>{
          const qtdParc=parseInt(modalCP.parcelas)||1;
          const modoRepetir=modalCP.modoRepetir||'parcela';
          const isRepeticao=!modalCP.id&&modoRepetir==='repeticao'&&qtdParc>1;
          const isParcelado=!modalCP.id&&modoRepetir==='parcela'&&qtdParc>1;
          const handleSaveCP=async()=>{
            setSavingItem(true);
            const valorNum=parseFloat((modalCP.valor||'').toString().replace(/[^\d,]/g,'').replace(',','.'))||0;
            const catFinal=modalCP.categoria==='Personalizado'?(modalCP.categoriaCustom||'Outros'):modalCP.categoria;
            // strip tipo/tipo_custo: 'tipo' não existe na tabela; 'tipo_custo' aguarda migration SQL
            const {parcelas:_p,intervalo_dias:_i,tipo:_tp,tipo_custo:_tc,categoriaCustom:_cc,modoRepetir:_mr,...baseRaw}={...modalCP,valor:valorNum,categoria:catFinal,user_id:user.id};
            const baseCP=cleanPayload(baseRaw);
            try{
              if(isRepeticao&&modalCP.vencimento){
                // Repetição mensal: mesmo valor, repete N meses na mesma data
                const inserts=[];
                for(let i=0;i<qtdParc;i++){
                  const d=new Date(modalCP.vencimento+'T00:00:00');
                  d.setMonth(d.getMonth()+i);
                  inserts.push({...baseCP,descricao:`${modalCP.descricao} (${new Date(d).toLocaleDateString('pt-BR',{month:'short',year:'2-digit'})})`,valor:valorNum,vencimento:d.toISOString().split('T')[0],status:'pendente'});
                }
                const{error}=await supabase.from('contas_pagar').insert(inserts);
                if(error)throw error;
              }else if(isParcelado&&modalCP.vencimento){
                const interval=parseInt(modalCP.intervalo_dias)||30;
                const inserts=[];
                for(let i=0;i<qtdParc;i++){
                  const d=new Date(modalCP.vencimento+'T00:00:00');
                  d.setDate(d.getDate()+i*interval);
                  inserts.push({...baseCP,descricao:`${modalCP.descricao} (${i+1}/${qtdParc})`,valor:valorNum/qtdParc,vencimento:d.toISOString().split('T')[0],status:'pendente'});
                }
                const{error}=await supabase.from('contas_pagar').insert(inserts);
                if(error)throw error;
              }else{
                if(baseCP.id){const{id,...rest}=baseCP;const{error}=await supabase.from('contas_pagar').update(rest).eq('id',id);if(error)throw error;}
                else{const{error}=await supabase.from('contas_pagar').insert(baseCP);if(error)throw error;}
              }
              await fetchFinanceiro(user.id);
              setModalCP(null);
            }catch(e){console.error(e);alert(`Erro ao salvar conta: ${e.message||'Tente novamente'}`);}
            setSavingItem(false);
          };
          return(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={()=>setModalCP(null)}>
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-black text-[#05121b]">{modalCP.id?'Editar':'Nova'} Conta a Pagar</h3><button onClick={()=>setModalCP(null)} className="text-slate-300 hover:text-red-400 transition-colors"><X size={20}/></button></div>
              <div className="space-y-4">
                <InputField label="Descrição" value={modalCP.descricao} onChange={v=>setModalCP({...modalCP,descricao:v})}/>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Valor Total" value={modalCP.valor} onChange={v=>setModalCP({...modalCP,valor:v})} maskType="currency"/>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">1º Vencimento</label><input type="date" value={modalCP.vencimento} onChange={e=>setModalCP({...modalCP,vencimento:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00] focus:border-[#ff7b00]"/></div>
                </div>
                {!modalCP.id&&(
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-[#05121b]/60 uppercase tracking-widest">Recorrência / Parcelamento</p>
                      <div className="flex gap-1.5">
                        {[{v:'parcela',l:'Parcelar'},{v:'repeticao',l:'Repetir todo mês'}].map(opt=>(
                          <button key={opt.v} type="button" onClick={()=>setModalCP({...modalCP,modoRepetir:opt.v})}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black border transition-colors ${modoRepetir===opt.v?'bg-[#05121b] text-white border-[#05121b]':'bg-white text-slate-500 border-slate-200'}`}>
                            {opt.l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">{modoRepetir==='repeticao'?'Quantos meses repetir':'Nº de Parcelas'}</label>
                        <input type="number" min="1" max="120" value={modalCP.parcelas||'1'} onChange={e=>setModalCP({...modalCP,parcelas:e.target.value})} className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"/>
                      </div>
                      {modoRepetir==='parcela'&&(
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Intervalo (dias)</label>
                          <select value={modalCP.intervalo_dias||'30'} onChange={e=>setModalCP({...modalCP,intervalo_dias:e.target.value})} className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]">
                            <option value="15">15 dias (quinzenal)</option>
                            <option value="30">30 dias (mensal)</option>
                            <option value="60">60 dias (bimestral)</option>
                            <option value="90">90 dias (trimestral)</option>
                          </select>
                        </div>
                      )}
                    </div>
                    {(isParcelado||isRepeticao)&&modalCP.valor&&modalCP.vencimento&&(
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-xs text-amber-700 font-medium mb-1">Prévia</p>
                        {isRepeticao
                          ? <p className="text-[10px] text-amber-800 font-medium">{qtdParc} meses × {formatBRL(parseFloat((modalCP.valor||'').replace(/[^\d,]/g,'').replace(',','.'))||0)} = {formatBRL((parseFloat((modalCP.valor||'').replace(/[^\d,]/g,'').replace(',','.'))||0)*qtdParc)} total — iniciando em {fmtDate(modalCP.vencimento)}</p>
                          : <p className="text-[10px] text-amber-800 font-medium">{qtdParc}× de {formatBRL((parseFloat((modalCP.valor||'').replace(/[^\d,]/g,'').replace(',','.'))||0)/qtdParc)} — iniciando em {fmtDate(modalCP.vencimento)}</p>
                        }
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Tipo de custo</label>
                  <div className="flex gap-2">
                    {[{v:'fixa',l:'Custo Fixo',sel:'bg-red-600 text-white border-red-600',unsel:'bg-white text-red-600 border-red-200 hover:border-red-300'},{v:'variavel',l:'Custo Variável',sel:'bg-amber-500 text-white border-amber-500',unsel:'bg-white text-amber-600 border-amber-200 hover:border-amber-300'}].map(({v,l,sel,unsel})=>(
                      <button key={v} type="button" onClick={()=>setModalCP({...modalCP,tipo_custo:v})}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black border transition-colors ${modalCP.tipo_custo===v?sel:unsel}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Categoria</label>
                    <select value={modalCP.categoria==='Personalizado'?'Personalizado':(modalCP.categoria||'')} onChange={e=>setModalCP({...modalCP,categoria:e.target.value,categoriaCustom:e.target.value!=='Personalizado'?'':modalCP.categoriaCustom})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]">
                      <option value="">Selecione...</option>
                      {['Fornecedor','Aluguel','Folha de Pagamento','Imposto / DAS','Serviço / Assinatura','Empréstimo / Parcela','Outros','Personalizado'].map(c=><option key={c}>{c}</option>)}
                    </select>
                    {modalCP.categoria==='Personalizado'&&(
                      <input type="text" value={modalCP.categoriaCustom||''} onChange={e=>setModalCP({...modalCP,categoriaCustom:e.target.value})} placeholder="Digite a categoria..." className="w-full mt-1.5 bg-white border border-[#ff7b00] px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"/>
                    )}
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Status</label><select value={modalCP.status} onChange={e=>setModalCP({...modalCP,status:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="atrasado">Atrasado</option></select></div>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Meio de Pagamento</label><select value={modalCP.meio_pagamento||''} onChange={e=>setModalCP({...modalCP,meio_pagamento:e.target.value,banco_id:e.target.value==='Dinheiro'?'':modalCP.banco_id})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"><option value="">Selecione...</option>{['PIX','Boleto Bancário','Transferência Bancária','Cartão de Crédito','Cartão de Débito','Dinheiro','Cheque','Outros'].map(c=><option key={c}>{c}</option>)}</select></div>
                {modalCP.meio_pagamento!=='Dinheiro'&&<div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Conta Bancária (opcional)</label><select value={modalCP.banco_id} onChange={e=>setModalCP({...modalCP,banco_id:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"><option value="">— Nenhuma —</option>{bancos.map(b=><option key={b.id} value={b.id}>{b.nome}</option>)}</select></div>}
                <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Observação (opcional)</label><textarea value={modalCP.observacao||''} onChange={e=>setModalCP({...modalCP,observacao:e.target.value})} placeholder="Ex: fornecedor X, referência do boleto..." className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00] resize-none h-16"/></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setModalCP(null)} className="flex-1 py-3.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50 border border-slate-200 transition-colors">Cancelar</button>
                <button disabled={savingItem||!modalCP.descricao||!modalCP.valor||!modalCP.vencimento} onClick={handleSaveCP} className="flex-1 py-3.5 rounded-xl font-black text-xs bg-[#05121b] text-white hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{savingItem?<Loader2 size={13} className="animate-spin"/>:isRepeticao?`Repetir ${qtdParc} meses`:isParcelado?`Criar ${qtdParc} Parcelas`:'Salvar'}</button>
              </div>
            </div>
          </div>
          );
        })()}

        {/* Modal Confirmar Pagamento CP */}
        {modalPagarCP&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={()=>setModalPagarCP(null)}>
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-7" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-black text-[#05121b]">Confirmar pagamento</h3><button onClick={()=>setModalPagarCP(null)} className="text-slate-300 hover:text-red-400 transition-colors"><X size={18}/></button></div>
              <p className="text-sm text-slate-500 mb-1">{modalPagarCP.desc}</p>
              <p className="text-xl font-black text-[#05121b] mb-5">{formatBRL(modalPagarCP.valor)}</p>
              <div className="space-y-3 mb-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Data do pagamento</label>
                  <input type="date" value={modalPagarCP.dataPagamento||today} onChange={e=>setModalPagarCP({...modalPagarCP,dataPagamento:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-emerald-500"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Forma de pagamento</label>
                  <select value={modalPagarCP.meioPagamento} onChange={e=>setModalPagarCP({...modalPagarCP,meioPagamento:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-emerald-500">
                    <option value="">Selecione...</option>
                    {['PIX','Boleto Bancário','Transferência Bancária','Cartão de Débito','Cartão de Crédito','Dinheiro','Cheque','Outros'].map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
                {modalPagarCP.meioPagamento&&modalPagarCP.meioPagamento!=='Dinheiro'&&(
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Conta bancária debitada</label>
                    <select value={modalPagarCP.bancoId||''} onChange={e=>setModalPagarCP({...modalPagarCP,bancoId:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-emerald-500">
                      <option value="">— Nenhuma —</option>
                      {bancos.map(b=><option key={b.id} value={b.id}>{b.nome}</option>)}
                    </select>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 bg-slate-50 rounded-lg p-2.5">✓ Será lançado automaticamente como despesa no fluxo de caixa.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setModalPagarCP(null)} className="flex-1 py-3 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50 border border-slate-200 transition-colors">Cancelar</button>
                <button disabled={savingItem||!modalPagarCP.meioPagamento} onClick={handleConfirmPagarCP} className="flex-1 py-3 rounded-xl font-black text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{savingItem?<Loader2 size={13} className="animate-spin"/>:null}Marcar como pago</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Confirmar Recebimento CR */}
        {modalPagarCR&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={()=>setModalPagarCR(null)}>
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-7" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-black text-[#05121b]">Confirmar recebimento</h3><button onClick={()=>setModalPagarCR(null)} className="text-slate-300 hover:text-red-400 transition-colors"><X size={18}/></button></div>
              <p className="text-sm text-slate-500 mb-1">{modalPagarCR.desc}</p>
              <p className="text-xl font-black text-[#05121b] mb-4">{formatBRL(modalPagarCR.valor)}</p>
              <div className="space-y-3 mb-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Data do recebimento</label>
                  <input type="date" value={modalPagarCR.dataRecebimento||today} onChange={e=>setModalPagarCR({...modalPagarCR,dataRecebimento:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#137789]"/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Forma de recebimento</label>
                  <select value={modalPagarCR.meioPagamento} onChange={e=>setModalPagarCR({...modalPagarCR,meioPagamento:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#137789]">
                    <option value="">Selecione...</option>
                    {['PIX','Dinheiro','Transferência Bancária','Cartão de Débito','Cartão de Crédito','Cheque','Boleto','Outros'].map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
                {modalPagarCR.meioPagamento&&modalPagarCR.meioPagamento!=='Dinheiro'&&(
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Conta bancária creditada</label>
                    <select value={modalPagarCR.bancoId||''} onChange={e=>setModalPagarCR({...modalPagarCR,bancoId:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#137789]">
                      <option value="">— Nenhuma —</option>
                      {bancos.map(b=><option key={b.id} value={b.id}>{b.nome}</option>)}
                    </select>
                  </div>
                )}
                <p className="text-[10px] text-slate-400 bg-slate-50 rounded-lg p-2.5">✓ Será lançado automaticamente como receita no fluxo de caixa.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setModalPagarCR(null)} className="flex-1 py-3 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50 border border-slate-200 transition-colors">Cancelar</button>
                <button disabled={savingItem||!modalPagarCR.meioPagamento} onClick={async()=>{
                  setSavingItem(true);
                  try{
                    const dr=modalPagarCR.dataRecebimento||today;
                    await supabase.from('contas_receber').update({status:'recebido',meio_pagamento:modalPagarCR.meioPagamento,data_pagamento:dr}).eq('id',modalPagarCR.id);
                    await supabase.from('lancamentos').insert({
                      descricao:modalPagarCR.desc,valor:Number(modalPagarCR.valor),
                      data:dr,categoria:modalPagarCR.cat||'Outros',tipo:'receita',
                      meio_pagamento:modalPagarCR.meioPagamento,
                      banco_id:modalPagarCR.bancoId||null,
                      user_id:user.id,
                    });
                    await fetchFinanceiro(user.id);
                    setModalPagarCR(null);
                  }catch(e){console.error(e);alert(`Erro: ${e.message}`);}
                  setSavingItem(false);
                }} className="flex-1 py-3 rounded-xl font-black text-xs bg-[#137789] text-white hover:bg-[#0e5f6b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{savingItem?<Loader2 size={13} className="animate-spin"/>:null}Marcar como recebido</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Conta a Receber */}
        {modalCR&&(()=>{
          const qtdParc=parseInt(modalCR.parcelas)||1;
          const isParcelado=!modalCR.id&&qtdParc>1;
          const handleSaveCR=async()=>{
            setSavingItem(true);
            const valorNum=parseFloat((modalCR.valor||'').toString().replace(/[^\d,]/g,'').replace(',','.'))||0;
            const {parcelas:_p,intervalo_dias:_i,...baseCR}={...modalCR,valor:valorNum,user_id:user.id};
            try{
              if(isParcelado&&modalCR.vencimento){
                const interval=parseInt(modalCR.intervalo_dias)||30;
                const inserts=[];
                for(let i=0;i<qtdParc;i++){
                  const d=new Date(modalCR.vencimento+'T00:00:00');
                  d.setDate(d.getDate()+i*interval);
                  inserts.push({...baseCR,descricao:`${modalCR.descricao} (${i+1}/${qtdParc})`,valor:valorNum/qtdParc,vencimento:d.toISOString().split('T')[0],status:'pendente'});
                }
                await supabase.from('contas_receber').insert(inserts);
              }else{
                if(baseCR.id){const{id,...rest}=baseCR;await supabase.from('contas_receber').update(rest).eq('id',id);}
                else{await supabase.from('contas_receber').insert(baseCR);}
              }
              await fetchFinanceiro(user.id);
              setModalCR(null);
            }catch(e){console.error(e);}
            setSavingItem(false);
          };
          return(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={()=>setModalCR(null)}>
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-black text-[#05121b]">{modalCR.id?'Editar':'Nova'} Conta a Receber</h3><button onClick={()=>setModalCR(null)} className="text-slate-300 hover:text-red-400 transition-colors"><X size={20}/></button></div>
              <div className="space-y-4">
                <InputField label="Cliente" value={modalCR.cliente} onChange={v=>setModalCR({...modalCR,cliente:v})}/>
                <InputField label="Descrição" value={modalCR.descricao} onChange={v=>setModalCR({...modalCR,descricao:v})}/>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Valor Total" value={modalCR.valor} onChange={v=>setModalCR({...modalCR,valor:v})} maskType="currency"/>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">1º Vencimento</label><input type="date" value={modalCR.vencimento} onChange={e=>setModalCR({...modalCR,vencimento:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#137789] focus:border-[#137789]"/></div>
                </div>
                {!modalCR.id&&(
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-black text-[#05121b]/60 uppercase tracking-widest">Parcelamento</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Nº de Parcelas</label>
                        <input type="number" min="1" max="120" value={modalCR.parcelas||'1'} onChange={e=>setModalCR({...modalCR,parcelas:e.target.value})} className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#137789]"/>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Intervalo (dias)</label>
                        <select value={modalCR.intervalo_dias||'30'} onChange={e=>setModalCR({...modalCR,intervalo_dias:e.target.value})} className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#137789]">
                          <option value="15">15 dias (quinzenal)</option>
                          <option value="30">30 dias (mensal)</option>
                          <option value="60">60 dias (bimestral)</option>
                          <option value="90">90 dias (trimestral)</option>
                        </select>
                      </div>
                    </div>
                    {isParcelado&&modalCR.valor&&modalCR.vencimento&&(
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                        <p className="text-xs text-emerald-700 font-medium mb-1">Prévia do parcelamento</p>
                        <p className="text-[10px] text-emerald-800 font-medium">{qtdParc}× de {formatBRL((parseFloat((modalCR.valor||'').replace(/[^\d,]/g,'').replace(',','.'))||0)/qtdParc)} — iniciando em {fmtDate(modalCR.vencimento)}</p>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Status</label><select value={modalCR.status} onChange={e=>setModalCR({...modalCR,status:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#137789]"><option value="pendente">Pendente</option><option value="recebido">Recebido</option></select></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Meio de Recebimento</label><select value={modalCR.meio_pagamento||''} onChange={e=>setModalCR({...modalCR,meio_pagamento:e.target.value,banco_id:e.target.value==='Dinheiro'?'':modalCR.banco_id})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#137789]"><option value="">Selecione...</option>{['PIX','Dinheiro','Transferência Bancária','Cartão de Débito','Cartão de Crédito','Cheque','Boleto','Outros'].map(c=><option key={c}>{c}</option>)}</select></div>
                </div>
                {modalCR.meio_pagamento!=='Dinheiro'&&<div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Conta Bancária (opcional)</label><select value={modalCR.banco_id} onChange={e=>setModalCR({...modalCR,banco_id:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#137789]"><option value="">— Nenhuma —</option>{bancos.map(b=><option key={b.id} value={b.id}>{b.nome}</option>)}</select></div>}
                <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Observação (opcional)</label><textarea value={modalCR.observacao||''} onChange={e=>setModalCR({...modalCR,observacao:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#137789] resize-none h-16"/></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setModalCR(null)} className="flex-1 py-3.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50 border border-slate-200 transition-colors">Cancelar</button>
                <button disabled={savingItem||!modalCR.cliente||!modalCR.descricao||!modalCR.valor||!modalCR.vencimento} onClick={handleSaveCR} className="flex-1 py-3.5 rounded-xl font-black text-xs bg-[#137789] text-white hover:bg-[#0e5f6b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{savingItem?<Loader2 size={13} className="animate-spin"/>:isParcelado?`Criar ${qtdParc} Parcelas`:'Salvar'}</button>
              </div>
            </div>
          </div>
          );
        })()}

        {/* Modal Dívida */}
        {modalDivida&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={()=>setModalDivida(null)}>
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 max-h-[92vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-black text-[#05121b]">{modalDivida.id?'Editar':'Nova'} Dívida</h3><button onClick={()=>setModalDivida(null)} className="text-slate-300 hover:text-red-400 transition-colors"><X size={20}/></button></div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Credor" value={modalDivida.credor} onChange={v=>setModalDivida({...modalDivida,credor:v})}/>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Tipo</label><select value={modalDivida.tipo||'Empréstimo'} onChange={e=>setModalDivida({...modalDivida,tipo:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]">{['Empréstimo','Financiamento','Cartão de Crédito','Cheque Especial','Outros'].map(t=><option key={t}>{t}</option>)}</select></div>
                </div>
                <InputField label="Descrição (opcional)" value={modalDivida.descricao||''} onChange={v=>setModalDivida({...modalDivida,descricao:v})}/>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Valor Total" value={modalDivida.valor_total} onChange={v=>setModalDivida({...modalDivida,valor_total:v})} maskType="currency"/>
                  <InputField label="Saldo Devedor Atual" value={modalDivida.saldo_devedor||''} onChange={v=>setModalDivida({...modalDivida,saldo_devedor:v})} maskType="currency"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Valor da Parcela" value={modalDivida.valor_parcela||''} onChange={v=>setModalDivida({...modalDivida,valor_parcela:v})} maskType="currency"/>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Taxa de Juros (% a.m.)</label><input type="number" step="0.01" min="0" placeholder="Ex: 2.99" value={modalDivida.taxa_juros||''} onChange={e=>setModalDivida({...modalDivida,taxa_juros:e.target.value})} className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"/></div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Total parcelas</label><input type="number" value={modalDivida.parcelas_total||''} onChange={e=>setModalDivida({...modalDivida,parcelas_total:e.target.value})} className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"/></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Parcelas Pagas</label><input type="number" value={modalDivida.parcelas_pagas||0} onChange={e=>setModalDivida({...modalDivida,parcelas_pagas:e.target.value})} className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"/></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Data de Início</label><input type="date" value={modalDivida.data_inicio||''} onChange={e=>setModalDivida({...modalDivida,data_inicio:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"/></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Previsão de Quitação</label><input type="date" value={modalDivida.previsao_quitacao||''} onChange={e=>setModalDivida({...modalDivida,previsao_quitacao:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"/></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Próx. Vencimento</label><input type="date" value={modalDivida.proximo_vencimento||''} onChange={e=>setModalDivida({...modalDivida,proximo_vencimento:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"/></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Status</label><select value={modalDivida.status} onChange={e=>setModalDivida({...modalDivida,status:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"><option value="ativa">Ativa</option><option value="quitada">Quitada</option><option value="em_negociacao">Em Negociação</option></select></div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setModalDivida(null)} className="flex-1 py-3.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50 border border-slate-200 transition-colors">Cancelar</button>
                <button disabled={savingItem||!modalDivida.credor||!modalDivida.valor_total} onClick={()=>saveItem('dividas',{...modalDivida,valor_total:parseFloat((modalDivida.valor_total||'').toString().replace(/[^\d,]/g,'').replace(',','.'))||0,saldo_devedor:modalDivida.saldo_devedor?parseFloat((modalDivida.saldo_devedor||'').toString().replace(/[^\d,]/g,'').replace(',','.'))||null:null,valor_parcela:modalDivida.valor_parcela?parseFloat((modalDivida.valor_parcela||'').toString().replace(/[^\d,]/g,'').replace(',','.'))||0:null,taxa_juros:modalDivida.taxa_juros?parseFloat(modalDivida.taxa_juros)||null:null,parcelas_total:modalDivida.parcelas_total?parseInt(modalDivida.parcelas_total):null,parcelas_pagas:parseInt(modalDivida.parcelas_pagas)||0,user_id:user.id},setModalDivida,()=>fetchFinanceiro(user.id))} className="flex-1 py-3.5 rounded-xl font-black text-xs bg-[#05121b] text-white hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{savingItem?<Loader2 size={13} className="animate-spin"/>:null}Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Banco */}
        {modalBanco&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={()=>setModalBanco(null)}>
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-black text-[#05121b]">{modalBanco.id?'Editar':'Novo'} Banco</h3><button onClick={()=>setModalBanco(null)} className="text-slate-300 hover:text-red-400 transition-colors"><X size={20}/></button></div>
              <div className="space-y-4">
                <InputField label="Nome do Banco / Conta" value={modalBanco.nome} onChange={v=>setModalBanco({...modalBanco,nome:v})} placeholder="Ex: Itaú Corrente, Caixa..."/>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Tipo</label><select value={modalBanco.tipo} onChange={e=>setModalBanco({...modalBanco,tipo:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]">{['Conta Corrente','Conta Poupança','Conta Digital','Caixa Físico','Outros'].map(t=><option key={t}>{t}</option>)}</select></div>
                  <InputField label="Saldo Inicial" value={modalBanco.saldo_inicial} onChange={v=>setModalBanco({...modalBanco,saldo_inicial:v})} maskType="currency"/>
                </div>
                <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Cor</label><div className="flex gap-2 flex-wrap">{['#137789','#ff7b00','#22c55e','#8b5cf6','#f59e0b','#ef4444','#0ea5e9','#ec4899'].map(c=><button key={c} onClick={()=>setModalBanco({...modalBanco,color:c})} className={`w-8 h-8 rounded-full border-2 transition-all ${modalBanco.color===c?'border-[#05121b] scale-110':'border-transparent'}`} style={{background:c}}/> )}</div></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setModalBanco(null)} className="flex-1 py-3.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50 border border-slate-200 transition-colors">Cancelar</button>
                <button disabled={savingItem||!modalBanco.nome} onClick={()=>saveItem('bancos',{...modalBanco,saldo_inicial:parseFloat((modalBanco.saldo_inicial||'').toString().replace(/[^\d,]/g,'').replace(',','.'))||0,user_id:user.id},setModalBanco,()=>fetchFinanceiro(user.id))} className="flex-1 py-3.5 rounded-xl font-black text-xs bg-[#05121b] text-white hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{savingItem?<Loader2 size={13} className="animate-spin"/>:null}Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Investimento */}
        {modalInvestimento&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={()=>setModalInvestimento(null)}>
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-black text-[#05121b]">{modalInvestimento.id?'Editar':'Novo'} Investimento</h3><button onClick={()=>setModalInvestimento(null)} className="text-slate-300 hover:text-red-400 transition-colors"><X size={20}/></button></div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Nome / Identificação" value={modalInvestimento.nome} onChange={v=>setModalInvestimento({...modalInvestimento,nome:v})} placeholder="Ex: CDB Itaú 12%"/>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Tipo</label><select value={modalInvestimento.tipo} onChange={e=>setModalInvestimento({...modalInvestimento,tipo:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-blue-500">{['CDB','LCI','LCA','Poupança','Fundo de Investimento','Ações','Tesouro Direto','Outros'].map(t=><option key={t}>{t}</option>)}</select></div>
                </div>
                <InputField label="Instituição (opcional)" value={modalInvestimento.instituicao||''} onChange={v=>setModalInvestimento({...modalInvestimento,instituicao:v})} placeholder="Ex: Itaú, XP, Nubank..."/>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Valor Aplicado" value={modalInvestimento.valor_aplicado} onChange={v=>setModalInvestimento({...modalInvestimento,valor_aplicado:v})} maskType="currency"/>
                  <InputField label="Valor Atual (opcional)" value={modalInvestimento.valor_atual||''} onChange={v=>setModalInvestimento({...modalInvestimento,valor_atual:v})} maskType="currency"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Data de Aplicação</label><input type="date" value={modalInvestimento.data_aplicacao||''} onChange={e=>setModalInvestimento({...modalInvestimento,data_aplicacao:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-blue-500"/></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Vencimento (opcional)</label><input type="date" value={modalInvestimento.data_vencimento||''} onChange={e=>setModalInvestimento({...modalInvestimento,data_vencimento:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-blue-500"/></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Liquidez</label><select value={modalInvestimento.liquidez||'30 dias'} onChange={e=>setModalInvestimento({...modalInvestimento,liquidez:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-blue-500">{['Diária','30 dias','60 dias','90 dias','180 dias','No vencimento','Outros'].map(l=><option key={l}>{l}</option>)}</select></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Status</label><select value={modalInvestimento.status} onChange={e=>setModalInvestimento({...modalInvestimento,status:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-blue-500"><option value="ativo">Ativo</option><option value="encerrado">Encerrado</option><option value="vencido">Vencido</option></select></div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setModalInvestimento(null)} className="flex-1 py-3.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50 border border-slate-200 transition-colors">Cancelar</button>
                <button disabled={savingItem||!modalInvestimento.nome||!modalInvestimento.valor_aplicado} onClick={()=>saveItem('investimentos',{...modalInvestimento,valor_aplicado:parseFloat((modalInvestimento.valor_aplicado||'').toString().replace(/[^\d,]/g,'').replace(',','.'))||0,valor_atual:modalInvestimento.valor_atual?parseFloat((modalInvestimento.valor_atual||'').toString().replace(/[^\d,]/g,'').replace(',','.'))||null:null,rentabilidade_pct:modalInvestimento.rentabilidade_pct?parseFloat(modalInvestimento.rentabilidade_pct)||null:null,user_id:user.id},setModalInvestimento,()=>fetchFinanceiro(user.id))} className="flex-1 py-3.5 rounded-xl font-black text-xs bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{savingItem?<Loader2 size={13} className="animate-spin"/>:null}Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Solicitar Análise */}
        {modalSolicitarAnalise&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={()=>setModalSolicitarAnalise(false)}>
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-8" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black text-[#05121b]">Solicitar Nova Análise</h3>
                <button onClick={()=>setModalSolicitarAnalise(false)} className="text-slate-300 hover:text-red-400 transition-colors"><X size={20}/></button>
              </div>
              <p className="text-[11px] text-slate-400 mb-7">Escolha como deseja trazer os dados para esta análise.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onClick={()=>{setModalSolicitarAnalise(false);setFormMode(null);setFormStep(0);setView('form');}} className="flex flex-col items-start gap-3 bg-[#05121b] text-white p-6 rounded-2xl text-left hover:bg-slate-800 transition-colors group">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><LayoutDashboard size={18} className="text-white"/></div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight mb-1">Dados da Plataforma</p>
                    <p className="text-white/60 text-[10px] leading-relaxed">Use os lançamentos, bancos e dados que você já cadastrou aqui.</p>
                  </div>
                  {(lancamentos.length>0||bancos.length>0)&&<span className="text-[8px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{lancamentos.length} lançamentos disponíveis</span>}
                </button>
                <button onClick={()=>{setModalSolicitarAnalise(false);setView('fontes');}} className="flex flex-col items-start gap-3 bg-white border border-slate-200 p-6 rounded-2xl text-left hover:border-[#137789]/50 hover:shadow transition-all group">
                  <div className="w-10 h-10 bg-[#137789]/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><Upload size={18} className="text-[#137789]"/></div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight text-[#05121b] mb-1">Enviar Documentos</p>
                    <p className="text-slate-400 text-[10px] leading-relaxed">Anexe extrato bancário, DRE, fluxo de caixa em PDF ou planilha.</p>
                  </div>
                  <span className="text-[8px] bg-slate-100 text-slate-500 font-black px-2 py-0.5 rounded-full uppercase tracking-widest">PDF · XLSX · CSV</span>
                </button>
                <button onClick={()=>{setModalSolicitarAnalise(false);setFormMode(null);setFormStep(0);setView('form');}} className="flex flex-col items-start gap-3 bg-white border border-slate-200 p-6 rounded-2xl text-left hover:border-[#ff7b00]/50 hover:shadow transition-all group">
                  <div className="w-10 h-10 bg-[#ff7b00]/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><PenLine size={18} className="text-[#ff7b00]"/></div>
                  <div>
                    <p className="font-black text-sm uppercase tracking-tight text-[#05121b] mb-1">Preencher Manualmente</p>
                    <p className="text-slate-400 text-[10px] leading-relaxed">Responda o formulário guiado com as informações da empresa.</p>
                  </div>
                  <span className="text-[8px] bg-slate-100 text-slate-500 font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Formulário guiado</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── PERFIL ────────────────────────────────────────────────────── */}
        {view==='profile'&&(
          <div className="max-w-7xl mx-auto fade-in">
            <header className="mb-8"><p className="text-xs text-slate-500 font-medium">Configurações</p><h1 className="text-xl font-medium text-[#05121b]">Meu Perfil</h1></header>

            {/* Avatar upload */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-5 flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-[#137789]/10 border-2 border-[#137789]/20 flex items-center justify-center">
                  {avatarUrl?<img src={avatarUrl} className="w-full h-full object-cover" alt="avatar"/>:<span className="text-2xl font-black text-[#137789]">{firstName[0]}</span>}
                </div>
                <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#137789] hover:bg-[#05121b] rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors">
                  <Camera size={13} className="text-white"/>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload}/>
                </label>
              </div>
              <p className="text-[10px] text-slate-400">Clique no ícone para alterar a foto</p>
            </div>

            <div className="mb-5 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3"><Lightbulb size={14} className="text-blue-500 shrink-0 mt-0.5"/><p className="text-[11px] text-blue-700 font-medium leading-relaxed"><strong>Dica:</strong> Com CNPJ e Razão Social preenchidos, esses campos são preenchidos automaticamente em novos formulários.</p></div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm mb-5">
              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Nome Completo" value={profileData.full_name} onChange={v=>setProfileData({...profileData,full_name:v})} icon={User}/>
                  <InputField label="E-mail" value={profileData.email} readOnly={true} icon={Mail} subLabel="Não pode ser alterado aqui."/>
                  <InputField label="WhatsApp" value={profileData.phone} onChange={v=>setProfileData({...profileData,phone:maskPhone(v)})} icon={Phone} maskType="phone"/>
                  <InputField label="CNPJ" value={profileData.cnpj} onChange={v=>setProfileData({...profileData,cnpj:maskCNPJ(v)})} maskType="cnpj"/>
                  <div className="md:col-span-2"><InputField label="Razão Social" value={profileData.razao_social} onChange={v=>setProfileData({...profileData,razao_social:v})} icon={Building2}/></div>
                </div>
                <div className="pt-5 border-t border-slate-100 flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-emerald-600">{profileSuccess}</span>
                  <button type="submit" disabled={isUpdatingProfile} className="bg-[#137789] text-white px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-[#05121b] hover:scale-[1.02] transition-all flex items-center gap-2">
                    {isUpdatingProfile?<Loader2 size={13} className="animate-spin"/>:"Salvar"}
                  </button>
                </div>
              </form>
            </div>

            {/* Aparência */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide mb-5 flex items-center gap-2">
                <span className="text-base">{isDark?'🌙':'☀️'}</span> Aparência
              </h3>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-[#05121b] text-sm">{isDark?'Modo Escuro':'Modo Claro'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Alterna entre tema claro e escuro na plataforma.</p>
                </div>
                <button onClick={()=>setIsDark(v=>!v)}
                  className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none ${isDark?'bg-[#137789]':'bg-slate-200'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-300 flex items-center justify-center text-[10px] ${isDark?'translate-x-7':'translate-x-0'}`}>
                    {isDark?'🌙':'☀️'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── FORMULÁRIO ───────────────────────────────────────────────── */}
        {view==='form'&&(
          <div className="max-w-7xl mx-auto fade-in">
            {!formMode?(
              <div className="space-y-10 py-6">
                <header className="text-center"><p className="text-xs text-slate-500 font-medium mb-2">Nova Análise</p><h2 className="text-xl font-medium text-[#05121b] mb-2">Como você quer trazer seus dados?</h2><p className="text-slate-400 text-sm">Escolha o método que melhor se adapta à sua realidade</p></header>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button onClick={()=>{setView('fontes');setSelectedSource('planilha');}} className="bg-white p-8 rounded-3xl border border-slate-100 hover:border-[#137789]/40 text-left shadow-lg group hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="w-14 h-14 bg-[#137789] rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"><FileSpreadsheet size={24} className="text-white"/></div>
                    <h3 className="text-base font-black text-[#05121b] mb-2 uppercase tracking-tight">Planilhas & PDFs</h3>
                    <p className="text-slate-400 font-medium text-xs leading-relaxed">Envie DRE, extrato, fluxo de caixa ou qualquer arquivo financeiro.</p>
                  </button>
                  <div className="bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-200 text-left opacity-60 cursor-not-allowed relative">
                    <span className="absolute top-4 right-4 text-[8px] font-black uppercase tracking-widest bg-slate-200 text-slate-500 px-2 py-1 rounded-full">Em desenvolvimento</span>
                    <div className="w-14 h-14 bg-slate-200 rounded-2xl flex items-center justify-center mb-5"><Database size={24} className="text-slate-400"/></div>
                    <h3 className="text-base font-black text-slate-400 mb-2 uppercase tracking-tight">Conectar ERP</h3>
                    <p className="text-slate-400 font-medium text-xs leading-relaxed">Integração com Bling, Omie, Conta Azul em breve.</p>
                  </div>
                  <div className="bg-[#05121b] p-8 rounded-3xl text-left shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                    <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mb-5"><PenLine size={24} className="text-white"/></div>
                    <h3 className="text-base font-black text-white mb-2 uppercase tracking-tight">Preencher Manualmente</h3>
                    <p className="text-white/50 font-medium text-xs leading-relaxed mb-4">Responda o formulário guiado sem precisar de sistemas.</p>
                    <div className="grid grid-cols-1 gap-2">
                      <button onClick={()=>{setFormMode('standard');setFormStep(0);setFormError("");setFieldErrors({});}} className="bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"><Landmark size={13}/> Tenho os Números</button>
                      <button onClick={()=>{setFormMode('guided');setFormStep(0);setFormError("");setFieldErrors({});}} className="bg-[#137789]/80 hover:bg-[#137789] text-white px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"><Sparkles size={13}/> Não Tenho os Números</button>
                    </div>
                  </div>
                </div>
                {diagnostics.some(d=>d.internal_status==='completed')&&(
                  <div className="bg-[#05121b] rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#ff7b00] rounded-xl flex items-center justify-center shrink-0"><Printer size={18} className="text-white"/></div>
                      <div>
                        <p className="font-black text-white text-sm">Baixar diagnóstico em PDF</p>
                        <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">Relatório completo do seu último diagnóstico concluído, pronto para imprimir ou apresentar.</p>
                      </div>
                    </div>
                    <button onClick={()=>{const last=diagnostics.find(d=>d.internal_status==='completed');if(last?.admin_result_pdf)window.open(last.admin_result_pdf,'_blank');else alert("PDF ainda não disponível para este diagnóstico.");}} className="shrink-0 bg-[#ff7b00] hover:bg-[#e66e00] text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg transition-all hover:scale-[1.02]"><Printer size={13}/> Baixar PDF</button>
                  </div>
                )}
              </div>
            ):(
              <div className="bg-white p-7 md:p-10 rounded-3xl border border-slate-100 shadow-xl mb-12">
                <button onClick={()=>{setFormMode(null);setFormStep(0);setFormError("");setFieldErrors({});}} className="text-slate-300 font-bold flex items-center gap-2 mb-8 text-[9px] uppercase tracking-widest hover:text-[#ff7b00] transition-all">← Voltar e trocar método</button>
                <header className="mb-5"><h2 className="text-xl font-black text-[#05121b] italic uppercase mb-1">{formMode==='standard'?'📊 Diagnóstico Estruturado':'📋 Diagnóstico Guiado'}</h2><p className="text-[#137789] font-bold uppercase text-[9px] tracking-[0.2em]">{formMode==='standard'?'Dados reais para diagnóstico preciso':'Valores aproximados para clareza inicial'}</p></header>
                <div className="mb-5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3"><Clock size={13} className="text-slate-400 shrink-0"/><p className="text-[10px] text-slate-500 font-medium">Diagnóstico pronto em <strong className="text-[#05121b]">até 2 dias úteis</strong>. Progresso salvo automaticamente.</p></div>
                {formStep===0&&profileFilledForm&&(<div className="mb-5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center gap-3"><User size={13} className="text-blue-400 shrink-0"/><p className="text-[10px] text-blue-600 font-medium">Campos preenchidos com dados do seu perfil. Verifique e ajuste se necessário.</p></div>)}
                <StepBar steps={currentSteps} currentStep={formStep} isV1={isV1}/>
                {formError&&(<div className={`mb-5 p-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${formError==='Salvando...'?'bg-blue-50 text-blue-600 border-blue-100':'bg-red-50 text-red-600 border-red-100'}`}><AlertTriangle size={13} className="shrink-0"/><span>{formError}</span></div>)}
                <div className="min-h-[300px]">
                  {isV1?<FormStepV1 step={formStep} formData={formData} setFormData={setFormData} fieldErrors={fieldErrors}/>:<FormStepG step={formStep} formData={formData} setFormData={setFormData} fieldErrors={fieldErrors}/>}
                </div>
                <div className="flex justify-between items-center pt-8 mt-8 border-t border-slate-100">
                  <button onClick={handlePrevStep} disabled={formStep===0} className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest disabled:opacity-30 hover:text-[#05121b] transition-colors"><ArrowLeft size={14}/> Anterior</button>
                  {isLastStep?(
                    <button disabled={isSubmitting} onClick={validateAndSubmit} style={{background:isV1?'#137789':'#ff7b00'}} className="text-white px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50">
                      {isSubmitting?<><Loader2 size={14} className="animate-spin"/>Enviando...</>:<>Solicitar Diagnóstico <ChevronRight size={14}/></>}
                    </button>
                  ):(
                    <button onClick={handleNextStep} style={{background:isV1?'#137789':'#ff7b00'}} className="text-white px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:scale-[1.02] transition-all flex items-center gap-2">
                      Próximo <ChevronRight size={14}/>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── SUCESSO ───────────────────────────────────────────────────── */}
        {view==='success'&&(
          <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center px-4 fade-in">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 mx-auto"><CheckCircle size={38} className="text-emerald-500"/></div>
            <h1 className="text-xl font-medium text-[#05121b] mb-3">Diagnóstico Recebido!</h1>
            <p className="text-slate-500 text-sm font-medium mb-2 max-w-md leading-relaxed">Recebemos todas as informações com sucesso. Nossa equipe já está analisando.</p>
            <p className="text-[#137789] font-black text-[10px] uppercase tracking-widest mb-8">⏱ Prazo: até 2 dias úteis</p>
            <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 shadow-sm mb-8 text-left">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">O que acontece agora?</h3>
              <div className="space-y-4">
                {[{n:'1',title:'Equipe analisa seus dados',desc:'Um especialista OLUAP revisa todas as informações.',color:'bg-blue-50 text-blue-600'},{n:'2',title:'Diagnóstico preparado',desc:'Relatório com pontos fortes, riscos e recomendações.',color:'bg-amber-50 text-amber-600'},{n:'3',title:'Resultado disponível aqui',desc:'Botão "Ver Resultado" aparece em Meus Relatórios.',color:'bg-emerald-50 text-emerald-600'}].map(s=>(
                  <div key={s.n} className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${s.color}`}>{s.n}</div>
                    <div><p className="font-black text-[#05121b] text-xs mb-0.5">{s.title}</p><p className="text-[10px] text-slate-400 leading-relaxed">{s.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <button onClick={handleContactExpert} className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"><MessageCircle size={13}/> WhatsApp</button>
              <button onClick={()=>setView('analises')} className="flex-1 flex items-center justify-center gap-2 bg-[#05121b] hover:bg-slate-800 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"><FolderOpen size={13}/> Meus Diagnósticos</button>
            </div>
          </div>
        )}

        {/* ── VER DADOS ─────────────────────────────────────────────────── */}
        {view==='view_data'&&selectedSubmission&&(
          <div className="max-w-7xl mx-auto fade-in">
            <div className="mb-6 flex items-center justify-between"><button onClick={()=>setView('relatorios')} className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-[#05121b] transition-colors"><ArrowLeft size={13}/> Voltar</button><div className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200 flex items-center gap-1.5"><FileSearch size={11}/> Dados Enviados</div></div>
            <div className="bg-white p-7 md:p-10 rounded-3xl border border-slate-100 shadow-xl mb-12 pointer-events-none opacity-90">
              <header className="mb-8 border-b border-slate-50 pb-6"><h2 className="text-xl font-black text-[#05121b] italic uppercase mb-1">{selectedSubmission.client_name}</h2><p className="text-[#137789] font-bold uppercase text-[10px] tracking-widest">{selectedSubmission.form_type} · {new Date(selectedSubmission.submittedAt).toLocaleDateString('pt-BR')}</p></header>
              {isV1?[0,1,2,3,4].map(s=><FormStepV1 key={s} step={s} formData={formData} setFormData={setFormData} fieldErrors={{}} readOnly={true}/>):[0,1,2,3,4].map(s=><FormStepG key={s} step={s} formData={formData} setFormData={setFormData} fieldErrors={{}} readOnly={true}/>)}
            </div>
          </div>
        )}

        {/* ── RESULTADO ─────────────────────────────────────────────────── */}
        {view==='result'&&selectedSubmission&&(
          <div className="max-w-7xl mx-auto fade-in">
            <button onClick={()=>setView('analises')} className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-[#05121b] transition-colors mb-6"><ArrowLeft size={13}/> Voltar para Diagnósticos</button>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden mb-10">
              <div className={`p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${selectedSubmission.health_status==='healthy'?'bg-emerald-50 border-emerald-100':selectedSubmission.health_status==='warning'?'bg-amber-50 border-amber-100':'bg-red-50 border-red-100'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white ${selectedSubmission.health_status==='healthy'?'bg-emerald-500':selectedSubmission.health_status==='warning'?'bg-amber-500':'bg-red-500'}`}><CheckCircle size={22}/></div>
                  <div>
                    <h2 className={`text-xl font-black uppercase italic ${selectedSubmission.health_status==='healthy'?'text-emerald-800':selectedSubmission.health_status==='warning'?'text-amber-800':'text-red-800'}`}>Diagnóstico Concluído</h2>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${selectedSubmission.health_status==='healthy'?'text-emerald-600':selectedSubmission.health_status==='warning'?'text-amber-600':'text-red-600'}`}>Status: {selectedSubmission.health_status==='healthy'?'Saudável':selectedSubmission.health_status==='warning'?'Precisa Ajustar':'Atenção'}</p>
                  </div>
                </div>
              </div>
              <div className="p-7 md:p-10 pt-5">
                <h3 className="text-base font-black text-[#05121b] uppercase tracking-tight mb-5 flex items-center gap-2"><FileText size={15} className="text-[#ff7b00]"/> Análise do Especialista</h3>
                <div className="prose prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">{selectedSubmission.analysis||"Análise ainda sendo processada."}</div>
                {hasCharts&&(
                  <div className="mt-8 mb-8">
                    <h3 className="text-base font-black text-[#05121b] uppercase tracking-tight mb-5 flex items-center gap-2"><BarChart2 size={15} className="text-[#137789]"/> Visão Gráfica</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {parsedCharts.estruturaResultado.length>0&&(<div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm"><h4 className="text-xs font-black uppercase text-[#05121b] mb-4 text-center">Estrutura de Resultado</h4><div className="h-52"><ResponsiveContainer width="100%" height="100%"><BarChart data={parsedCharts.estruturaResultado} margin={{top:5,right:5,left:-20,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="name" tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false}/><YAxis tickFormatter={v=>`R$${v/1000}k`} tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false}/><RTooltip formatter={v=>formatBRL(v)} contentStyle={{borderRadius:'10px',border:'none',boxShadow:'0 4px 12px rgba(0,0,0,0.08)',fontSize:'11px',fontWeight:'bold'}}/><Bar dataKey="value" radius={[4,4,0,0]}>{parsedCharts.estruturaResultado.map((e,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}</Bar></BarChart></ResponsiveContainer></div></div>)}
                      {parsedCharts.despesasOperacionais.length>0&&(<div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm flex flex-col items-center"><h4 className="text-xs font-black uppercase text-[#05121b] mb-2 text-center w-full">Composição das Despesas</h4><div className="h-52 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={parsedCharts.despesasOperacionais} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">{parsedCharts.despesasOperacionais.map((e,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]}/>)}</Pie><RTooltip formatter={v=>formatBRL(v)} contentStyle={{borderRadius:'10px',border:'none',fontSize:'11px',fontWeight:'bold'}}/><Legend wrapperStyle={{fontSize:'9px'}}/></PieChart></ResponsiveContainer></div></div>)}
                    </div>
                  </div>
                )}
                <div className="mt-8 bg-[#05121b] rounded-2xl p-6 text-white">
                  <div className="flex items-center gap-2 mb-3"><Lightbulb size={14} className="text-[#ff7b00] shrink-0"/><h4 className="font-black text-sm uppercase">Próximo Passo</h4></div>
                  <p className="text-slate-300 text-[11px] leading-relaxed mb-4">Com o diagnóstico em mãos, converse com nosso especialista para entender as recomendações e montar um plano de ação.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[{n:'1',l:'Leia a análise',d:'Entenda os pontos levantados.'},{n:'2',l:'Fale conosco',d:'Tire dúvidas com o especialista.'},{n:'3',l:'Plano de ação',d:'Implemente as mudanças prioritárias.'}].map(s=>(
                      <div key={s.n} className="bg-white/10 rounded-xl p-3"><span className="text-[#ff7b00] font-black text-xs">{s.n}.</span><p className="font-black text-white mt-1 mb-0.5 text-[11px]">{s.l}</p><p className="text-slate-400 text-[9px] leading-relaxed">{s.d}</p></div>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex flex-col md:flex-row gap-4 print:hidden">
                  <button onClick={handleContactExpert} className="flex-1 bg-green-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-600 flex items-center justify-center gap-2 shadow-md transition-colors"><MessageCircle size={14}/> Falar com Especialista</button>
                  <button onClick={handleDownloadAdminPDF} className="flex-1 bg-[#05121b] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 flex items-center justify-center gap-2 shadow-md transition-colors"><Printer size={14}/> Baixar PDF</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Importar — genérico para todos os contextos */}
        {modalImport&&(()=>{
          const tipo=modalImport.tipoImport||'despesa';
          const CONF={
            despesa:   {title:'Importar Despesas',   color:'#D85A30',ring:'focus:ring-red-500',    btn:'bg-red-500 hover:bg-red-600',    dateLabel:'Coluna de Data'},
            receita:   {title:'Importar Receitas',   color:'#1D9E75',ring:'focus:ring-emerald-500',btn:'bg-emerald-600 hover:bg-emerald-700',dateLabel:'Coluna de Data'},
            contas_pagar:{title:'Importar Contas a Pagar',color:'#BA7517',ring:'focus:ring-amber-500',btn:'bg-amber-500 hover:bg-amber-600',dateLabel:'Coluna de Vencimento'},
            extrato:   {title:'Importar Extrato Bancário',color:'#378ADD',ring:'focus:ring-blue-500',btn:'bg-blue-600 hover:bg-blue-700',dateLabel:'Coluna de Data'},
          };
          const cfg=CONF[tipo]||CONF.despesa;
          return(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={()=>setModalImport(null)}>
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-[#05121b]">{cfg.title}</h3>
                <button onClick={()=>setModalImport(null)} className="text-slate-300 hover:text-red-400 transition-colors"><X size={20}/></button>
              </div>

              {/* ── STAGE: upload ── */}
              {modalImport.stage==='upload'&&(
                <div className="space-y-5">
                  <label className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center cursor-pointer hover:border-slate-300 hover:bg-slate-100 transition-all group">
                    <FileSpreadsheet size={36} className="text-slate-300 mb-3 group-hover:text-slate-400 transition-colors"/>
                    <p className="text-sm font-black text-[#05121b] mb-1">Clique ou arraste o arquivo aqui</p>
                    <p className="text-[10px] text-slate-400 mb-4 text-center">Planilhas: <strong>.xlsx · .xls · .csv</strong> · Texto: <strong>.txt</strong> · Documentos: <strong>.pdf · .doc · .docx</strong></p>
                    <span className="text-white text-xs font-black uppercase tracking-widest px-6 py-2.5 rounded-xl transition-colors" style={{background:cfg.color}}>
                      Selecionar arquivo
                    </span>
                    <input type="file" accept=".csv,.xlsx,.xls,.txt,.tsv,.pdf,.doc,.docx" className="hidden"
                      onChange={e=>{if(e.target.files[0])handleImportFile(e.target.files[0],tipo);}}/>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Planilhas (.xlsx, .csv, .txt)</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">Importação automática. O sistema detecta as colunas pelo cabeçalho e você confirma o mapeamento.</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1.5">PDF / Word (.pdf, .doc)</p>
                      <p className="text-[11px] text-blue-700 leading-relaxed">Aceito para extratos e documentos. Após o envio você confirma os dados antes de importar.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STAGE: pdf_received ── */}
              {modalImport.stage==='pdf_received'&&(
                <div className="space-y-5">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                      <FileText size={28} className="text-blue-500"/>
                    </div>
                    <p className="font-black text-blue-900 mb-1">Arquivo recebido</p>
                    <p className="text-[11px] text-blue-700 font-medium mb-0.5">{modalImport.fileName}</p>
                    <p className="text-[11px] text-blue-600 leading-relaxed mt-3 max-w-sm">
                      Para PDFs e documentos Word, faça o upload do arquivo e nossa equipe processará os dados manualmente. Você será notificado quando os registros forem importados.
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <Info size={14} className="text-amber-500 shrink-0 mt-0.5"/>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      <strong>Dica:</strong> Para importação imediata e automática, exporte o extrato do seu banco em formato <strong>CSV ou Excel</strong> e reimporte aqui. Normalmente o botão fica em <em>Internet Banking → Extrato → Exportar</em>.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={()=>setModalImport({stage:'upload',tipoImport:tipo})} className="flex-1 py-3.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50 border border-slate-200 transition-colors">Voltar</button>
                    <button onClick={()=>setModalImport(null)} className={`flex-1 py-3.5 rounded-xl font-black text-xs text-white transition-colors ${cfg.btn}`}>Entendido</button>
                  </div>
                </div>
              )}

              {/* ── STAGE: map ── */}
              {modalImport.stage==='map'&&(
                <div className="space-y-5">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5">
                    <CheckCircle size={13} className="text-emerald-500 shrink-0"/>
                    <p className="text-[11px] text-slate-600 font-medium"><strong>{modalImport.rows?.length||0} linha(s)</strong> encontrada(s). Mapeie as colunas abaixo:</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      {key:'data',     label:cfg.dateLabel},
                      {key:'descricao',label:'Coluna de Descrição'},
                      {key:'valor',    label:'Coluna de Valor'},
                      {key:'categoria',label:'Coluna de Categoria (opcional)'},
                    ].map(({key,label})=>(
                      <div key={key} className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">{label}</label>
                        <select value={modalImport.mappings[key]} onChange={e=>setModalImport({...modalImport,mappings:{...modalImport.mappings,[key]:e.target.value}})}
                          className={`w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 ${cfg.ring}`}>
                          <option value="">— Não mapear —</option>
                          {modalImport.headers.map((h,i)=><option key={i} value={String(i)}>{h||`Coluna ${i+1}`}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  {modalImport.rows?.slice(0,3).filter(r=>r&&r.some(c=>c!=='')).length>0&&(
                    <div className="bg-slate-50 rounded-2xl p-4">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Prévia · primeiras linhas</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px]">
                          <thead><tr className="border-b border-slate-200">{['Data / Vencimento','Descrição','Valor','Categoria'].map(h=><th key={h} className="px-2 py-1.5 text-left font-black text-slate-400 uppercase tracking-wider">{h}</th>)}</tr></thead>
                          <tbody>{modalImport.rows.slice(0,3).filter(r=>r&&r.some(c=>c!=='')).map((r,i)=>{
                            const g=(k)=>modalImport.mappings[k]!==''&&modalImport.mappings[k]!==undefined?String(r[parseInt(modalImport.mappings[k])]||''):'—';
                            return(<tr key={i} className="border-b border-slate-100"><td className="px-2 py-1.5 text-slate-500">{g('data')}</td><td className="px-2 py-1.5 font-medium text-[#05121b] max-w-[150px] truncate">{g('descricao')}</td><td className="px-2 py-1.5 font-bold" style={{color:cfg.color}}>{g('valor')}</td><td className="px-2 py-1.5 text-slate-500">{g('categoria')}</td></tr>);
                          })}</tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button onClick={()=>setModalImport({stage:'upload',tipoImport:tipo})} className="flex-1 py-3.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50 border border-slate-200 transition-colors">Voltar</button>
                    <button disabled={savingItem||!modalImport.mappings.valor} onClick={confirmarImport}
                      className={`flex-1 py-3.5 rounded-xl font-black text-xs text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${cfg.btn}`}>
                      {savingItem?<Loader2 size={13} className="animate-spin"/>:null}
                      Importar {modalImport.rows?.length||0} registros
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          );
        })()}


      </main>
      </div>
    </div>
  );
};
export default App