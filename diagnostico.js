import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard, LogOut, ShieldCheck, AlertTriangle, Plus,
  FileText, Sparkles, Clock, Building2, Landmark, Target, ChevronRight,
  Upload, Info, ArrowLeft, CheckCircle, Printer, MessageCircle, Mail, Phone,
  FileSearch, User, ChevronLeft, Loader2, BarChart2, Bell, Lightbulb,
  AlertCircle, Save, TrendingUp, Zap, Activity, Database,
  FileSpreadsheet, PenLine, FolderOpen, ArrowRight, DollarSign,
  Shield, Brain, Cpu, AlertOctagon, X,
  TrendingDown, Trash2, Pencil, CalendarDays, Wallet, Receipt
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const SUPABASE_URL = 'https://haxonnnbycypirigxsvj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhheG9ubm5ieWN5cGlyaWd4c3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNTYwMzEsImV4cCI6MjA4OTYzMjAzMX0.keYNqjbu7DxBYV9f4_HW1MTaP1_TJZ_bNDTRIvSeSYw';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const DRAFT_KEY = 'oluap_form_draft';
const CHART_COLORS = ['#137789','#ff7b00','#05121b','#fbbf24','#34d399','#f87171','#a78bfa','#60a5fa'];

const formatBRL = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
const formatCurrency = value => {
  if (!value) return "";
  const n = value.replace(/\D/g,"");
  if (!n) return "";
  return `R$ ${new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2}).format(parseFloat(n)/100)}`;
};
const maskCNPJ = v => {
  if (!v) return "";
  return v.replace(/\D/g,'').replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2').replace(/(-\d{2})\d+?$/,'$1');
};
const maskPhone = v => {
  if (!v) return "";
  return v.replace(/\D/g,'').replace(/^(\d{2})(\d)/g,'($1) $2').replace(/(\d)(\d{4})$/,'$1-$2').substring(0,15);
};
const isValidEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isValidCNPJ = c => c.replace(/\D/g,'').length === 14;

const parseChartData = text => {
  if (!text) return null;
  const lines = text.split('\n').map(l=>l.trim());
  const data = {estruturaResultado:[],despesasOperacionais:[],estruturaFinanceira:[],indicadores:[]};
  let sec = "";
  lines.forEach(line => {
    if (line.includes("Estrutura de Resultado")) sec="estruturaResultado";
    else if (line.includes("Despesas Operacionais")) sec="despesasOperacionais";
    else if (line.includes("Estrutura Financeira")) sec="estruturaFinanceira";
    else if (line.includes("Indicadores")) sec="indicadores";
    else if (line.includes(":") && sec) {
      const [key,valStr] = line.split(":");
      if (key&&valStr) {
        const value = parseFloat(valStr.replace(/R\$/g,'').replace(/%/g,'').trim().replace(/\./g,'').replace(',','.'));
        if (!isNaN(value)) data[sec].push({name:key.trim(),value});
      }
    }
  });
  return data;
};

// ── FORM COMPONENTS ──────────────────────────────────────────────────────────
const InputField = ({label,value,onChange,placeholder,maskType="text",error,optional=false,subLabel,readOnly=false,type="text",icon:Icon,fieldId}) => {
  const handleChange = e => {
    const r = e.target.value;
    if (maskType==='currency') onChange(formatCurrency(r));
    else if (maskType==='cnpj') onChange(maskCNPJ(r));
    else if (maskType==='phone') onChange(maskPhone(r));
    else onChange(r);
  };
  return (
    <div className="space-y-1.5 w-full text-left min-w-0" id={fieldId?`field-${fieldId}`:undefined}>
      <label className={`text-[10px] font-bold uppercase tracking-wider px-1 ${error?'text-red-500':'text-[#05121b]/50'}`}>
        {label} {optional&&<span className="lowercase font-normal italic opacity-60">(opcional)</span>}
      </label>
      {subLabel&&<p className="text-[10px] text-slate-400 px-1 leading-relaxed">{subLabel}</p>}
      <div className="relative">
        {Icon&&<Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300"/>}
        <input type={type} value={value||""} onChange={handleChange} readOnly={readOnly}
          placeholder={placeholder||(maskType==='currency'?"R$ 0,00":maskType==='cnpj'?"00.000.000/0000-00":maskType==='phone'?"(00) 00000-0000":"")}
          maxLength={maskType==='cnpj'?18:maskType==='phone'?15:undefined}
          className={`w-full bg-white border ${Icon?'pl-10':'px-4'} pr-4 py-2.5 rounded-xl font-medium text-[#05121b] transition-all outline-none text-xs min-w-0 ${error?'border-red-500 ring-2 ring-red-500/20 error-pulse':readOnly?'border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed':'border-slate-200 focus:ring-1 focus:ring-[#ff7b00] focus:border-[#ff7b00]'}`}
        />
      </div>
      {error&&<p className="text-[10px] text-red-500 font-bold px-1 flex items-center gap-1"><AlertCircle size={10}/> Campo obrigatório</p>}
    </div>
  );
};

const RadioGroup = ({label,value,options,onChange,error,subLabel,readOnly=false,fieldId}) => (
  <div className="space-y-2 text-left" id={fieldId?`field-${fieldId}`:undefined}>
    <label className={`text-[10px] font-bold uppercase tracking-wider px-1 ${error?'text-red-500':'text-[#05121b]/50'}`}>{label}</label>
    {subLabel&&<p className="text-[10px] text-slate-400 px-1 leading-relaxed">{subLabel}</p>}
    <div className="flex flex-wrap gap-2">
      {options.map(opt=>(
        <button key={opt} onClick={()=>!readOnly&&onChange(opt)} disabled={readOnly}
          className={`px-4 py-2 rounded-xl font-bold text-[10px] border transition-all ${value===opt?'bg-[#ff7b00] text-white border-[#ff7b00] shadow-md':'bg-white text-[#05121b]/60 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
          {opt}
        </button>
      ))}
    </div>
    {error&&<p className="text-[10px] text-red-500 font-bold px-1 flex items-center gap-1"><AlertCircle size={10}/> Selecione uma opção</p>}
  </div>
);

const TextAreaField = ({label,value,onChange,placeholder,error,subLabel,readOnly=false,optional=false,fieldId}) => (
  <div className="space-y-1.5 w-full text-left" id={fieldId?`field-${fieldId}`:undefined}>
    <label className={`text-[10px] font-bold uppercase tracking-wider px-1 ${error?'text-red-500':'text-[#05121b]/50'}`}>
      {label} {optional&&<span className="lowercase font-normal italic opacity-60">(opcional)</span>}
    </label>
    {subLabel&&<p className="text-[10px] text-slate-400 px-1 leading-relaxed">{subLabel}</p>}
    <textarea value={value||""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly}
      className={`w-full bg-white border px-4 py-3 rounded-xl font-medium text-[#05121b] outline-none resize-none text-xs h-24 transition-all ${error?'border-red-500 ring-2 ring-red-500/20 error-pulse':readOnly?'border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed':'border-slate-200 focus:ring-1 focus:ring-[#ff7b00] focus:border-[#ff7b00]'}`}/>
    {error&&<p className="text-[10px] text-red-500 font-bold px-1 flex items-center gap-1"><AlertCircle size={10}/> Campo obrigatório</p>}
  </div>
);

const FILE_EMOJI = name => { const e=name.split('.').pop().toLowerCase(); return e==='pdf'?'📄':['xlsx','xls','csv'].includes(e)?'📊':e==='ofx'?'🏦':'📎'; };

const FileUploadField = ({onFilesSelected,readOnly}) => {
  const [files,setFiles] = useState([]);
  const add = e => {
    const newNames = Array.from(e.target.files).map(f=>f.name);
    setFiles(prev=>{
      const exist=new Set(prev);
      const merged=[...prev,...newNames.filter(n=>!exist.has(n))];
      if(onFilesSelected) onFilesSelected(merged.join(', '));
      return merged;
    });
  };
  const remove = name => setFiles(prev=>{
    const next=prev.filter(f=>f!==name);
    if(onFilesSelected) onFilesSelected(next.join(', '));
    return next;
  });
  if(readOnly) return null;
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50 px-1">Anexar Arquivos (Opcional)</label>
      <label className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center cursor-pointer hover:bg-slate-50 hover:border-[#137789]/40 transition-all group relative">
        <input type="file" multiple accept=".pdf,.xlsx,.xls,.csv,.ofx,.doc,.docx,.jpg,.png" onChange={add} className="absolute inset-0 opacity-0 cursor-pointer"/>
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
          <Upload size={17} className="text-slate-400 group-hover:text-[#137789]"/>
        </div>
        <p className="text-xs font-bold text-[#05121b] mb-0.5 uppercase tracking-wide">Clique para selecionar</p>
        <p className="text-[10px] text-slate-400 text-center">PDF, Excel, CSV, OFX, Imagens · vários arquivos</p>
        {files.length>0&&<span className="mt-2 bg-[#137789] text-white text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest">{files.length} arquivo{files.length>1?'s':''}</span>}
      </label>
      {files.length>0&&(
        <div className="space-y-1.5">
          {files.map((f,i)=>(
            <div key={i} className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
              <span className="text-base leading-none">{FILE_EMOJI(f)}</span>
              <span className="text-[10px] font-bold text-[#05121b] truncate flex-1">{f}</span>
              <button type="button" onClick={()=>remove(f)} className="text-slate-300 hover:text-red-400 transition-colors shrink-0"><X size={13}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── STEP BAR ──────────────────────────────────────────────────────────────────
const StepBar = ({steps,currentStep,isV1}) => {
  const ac = isV1 ? '#137789' : '#ff7b00';
  return (
    <div className="mb-8">
      <div className="flex items-center gap-0 mb-4">
        {steps.map((s,i)=>{
          const done=i<currentStep, active=i===currentStep;
          return (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div style={{background:done||active?ac:'#e2e8f0',color:done||active?'#fff':'#94a3b8',boxShadow:active?`0 0 0 4px ${ac}22`:'none'}} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300">
                  {done?'✓':i+1}
                </div>
                <span style={{color:done||active?ac:'#94a3b8'}} className="text-[8px] font-bold uppercase tracking-wide whitespace-nowrap hidden sm:block">{s.label}</span>
              </div>
              {i<steps.length-1&&<div style={{background:done?ac:'#e2e8f0'}} className="flex-1 h-0.5 mx-1 mb-3 transition-all duration-300"/>}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p style={{color:ac}} className="text-[10px] font-black uppercase tracking-widest">Etapa {currentStep+1} de {steps.length}</p>
          <h2 className="text-lg font-black text-[#05121b] mt-0.5">{steps[currentStep].label}</h2>
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">{Math.round((currentStep/steps.length)*100)}% completo</span>
      </div>
    </div>
  );
};

// ── FORM STEPS V1 ─────────────────────────────────────────────────────────────
const STEPS_V1 = [{label:'Identificação'},{label:'Vendas'},{label:'Custos'},{label:'Caixa e Dívidas'},{label:'Visão e Docs'}];
const FormStepV1 = ({step,formData:fd,setFormData,fieldErrors:fe}) => {
  const set = (k,v) => setFormData({...fd,[k]:v});
  if(step===0) return(<div className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><InputField label="Razão Social" value={fd.v1_razao} onChange={v=>set('v1_razao',v)} error={fe.v1_razao} fieldId="v1_razao"/><InputField label="CNPJ" value={fd.v1_cnpj} onChange={v=>set('v1_cnpj',v)} error={fe.v1_cnpj} maskType="cnpj" fieldId="v1_cnpj"/><div className="md:col-span-2"><InputField label="Nome do Responsável" value={fd.v1_responsavel} onChange={v=>set('v1_responsavel',v)} error={fe.v1_responsavel} fieldId="v1_responsavel"/></div><InputField label="Email" value={fd.v1_email} onChange={v=>set('v1_email',v)} error={fe.v1_email} icon={Mail} fieldId="v1_email"/><InputField label="WhatsApp" value={fd.v1_phone} onChange={v=>set('v1_phone',v)} error={fe.v1_phone} icon={Phone} maskType="phone" fieldId="v1_phone"/><div className="md:col-span-2"><InputField label="Segmento de Atuação" placeholder="Ex: Comércio de Roupas..." value={fd.v1_segmento} onChange={v=>set('v1_segmento',v)} error={fe.v1_segmento} fieldId="v1_segmento"/></div><InputField label="Tempo de Operação" placeholder="Ex: 5 anos" value={fd.v1_tempoOperacao} onChange={v=>set('v1_tempoOperacao',v)} error={fe.v1_tempoOperacao} fieldId="v1_tempoOperacao"/><InputField label="Número de Funcionários" value={fd.v1_numFuncionarios} onChange={v=>set('v1_numFuncionarios',v)} error={fe.v1_numFuncionarios} fieldId="v1_numFuncionarios"/><div className="md:col-span-2"><RadioGroup label="Como controla as finanças?" value={fd.v1_controleFinanceiro} options={["Planilha","Sistema / ERP","Contabilidade","Não possui controle"]} onChange={v=>set('v1_controleFinanceiro',v)} error={fe.v1_controleFinanceiro} fieldId="v1_controleFinanceiro"/></div></div></div>);
  if(step===1) return(<div className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><InputField label="Faturamento Médio (6 meses)" value={fd.v1_fatMedio} onChange={v=>set('v1_fatMedio',v)} maskType="currency" error={fe.v1_fatMedio} fieldId="v1_fatMedio"/><InputField label="Faturamento Total (12 meses)" value={fd.v1_fat12} onChange={v=>set('v1_fat12',v)} maskType="currency" error={fe.v1_fat12} fieldId="v1_fat12"/><div className="md:col-span-2"><InputField label="Receita: Produtos, Serviços ou Ambos?" subLabel="Se ambos, qual proporção?" placeholder="Ex: 60% produto / 40% serviço" value={fd.v1_mixFaturamento} onChange={v=>set('v1_mixFaturamento',v)} error={fe.v1_mixFaturamento} fieldId="v1_mixFaturamento"/></div><div className="md:col-span-2"><InputField label="Número médio de vendas por mês" value={fd.v1_numVendas} onChange={v=>set('v1_numVendas',v)} error={fe.v1_numVendas} fieldId="v1_numVendas"/></div><div className="md:col-span-2"><RadioGroup label="A empresa gera lucro?" value={fd.v1_lucra} options={["Sim","Não","Não sei"]} onChange={v=>set('v1_lucra',v)} error={fe.v1_lucra} fieldId="v1_lucra"/></div><div className="md:col-span-2"><InputField label="Lucro médio mensal" optional={true} value={fd.v1_lucroMensal} onChange={v=>set('v1_lucroMensal',v)} maskType="currency"/></div><div className="md:col-span-2"><TextAreaField label="Meios de Recebimento" subLabel="Ex: 50% Pix, 30% Cartão, 20% Boleto" value={fd.v1_meios} onChange={v=>set('v1_meios',v)} error={fe.v1_meios} fieldId="v1_meios"/></div><InputField label="Impostos sobre Vendas" optional={true} value={fd.v1_impostos} onChange={v=>set('v1_impostos',v)} placeholder="R$ ou %"/><InputField label="Taxa de Inadimplência" value={fd.v1_inadimplencia} onChange={v=>set('v1_inadimplencia',v)} error={fe.v1_inadimplencia} fieldId="v1_inadimplencia"/></div></div>);
  if(step===2) return(<div className="space-y-5"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100">Custos Diretos</p><InputField label="Custo com Mercadorias ou Serviços" subLabel="Valor médio mensal." value={fd.v1_custosDiretos} onChange={v=>set('v1_custosDiretos',v)} maskType="currency" error={fe.v1_custosDiretos} fieldId="v1_custosDiretos"/><InputField label="Taxas de Recebimento" subLabel="Maquininhas, gateways, boleto." value={fd.v1_taxaRecebimento} onChange={v=>set('v1_taxaRecebimento',v)} maskType="currency" error={fe.v1_taxaRecebimento} fieldId="v1_taxaRecebimento"/><InputField label="Comissões" optional={true} value={fd.v1_comissoes} onChange={v=>set('v1_comissoes',v)} maskType="currency"/><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100 pt-4">Despesas Fixas</p><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><InputField label="Folha de Pagamento" value={fd.v1_folha} onChange={v=>set('v1_folha',v)} maskType="currency" error={fe.v1_folha} fieldId="v1_folha"/><InputField label="Pró-labore dos Sócios" value={fd.v1_prolabore} onChange={v=>set('v1_prolabore',v)} maskType="currency" error={fe.v1_prolabore} fieldId="v1_prolabore"/><InputField label="Marketing e Anúncios" value={fd.v1_mkt} onChange={v=>set('v1_mkt',v)} maskType="currency" error={fe.v1_mkt} fieldId="v1_mkt"/><InputField label="Estrutura e Consumo" subLabel="Aluguel, Luz, Internet, Software" value={fd.v1_estrutura} onChange={v=>set('v1_estrutura',v)} maskType="currency" error={fe.v1_estrutura} fieldId="v1_estrutura"/><div className="md:col-span-2"><InputField label="Outras Despesas Fixas" value={fd.v1_outrasFixas} onChange={v=>set('v1_outrasFixas',v)} maskType="currency"/></div></div></div>);
  if(step===3) return(<div className="space-y-5"><TextAreaField label="A empresa possui dívidas?" subLabel="Se não, escreva 'Não'." value={fd.v1_descricaoDividas} onChange={v=>set('v1_descricaoDividas',v)} error={fe.v1_descricaoDividas} fieldId="v1_descricaoDividas"/><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><InputField label="Valor total das dívidas" optional={true} value={fd.v1_valorTotalDividas} onChange={v=>set('v1_valorTotalDividas',v)} maskType="currency"/><InputField label="Parcelas Mensais" optional={true} value={fd.v1_pesoDivida} onChange={v=>set('v1_pesoDivida',v)} maskType="currency"/><InputField label="Prazo Médio Recebimento (dias)" optional={true} value={fd.v1_prazoRec} onChange={v=>set('v1_prazoRec',v)}/><InputField label="Prazo Médio Pagamento (dias)" optional={true} value={fd.v1_prazoPag} onChange={v=>set('v1_prazoPag',v)}/></div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-100 pt-4">Posição de Caixa</p><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><InputField label="Saldo atual em banco/caixa" value={fd.v1_saldo} onChange={v=>set('v1_saldo',v)} maskType="currency" error={fe.v1_saldo} fieldId="v1_saldo"/><InputField label="Reserva financeira" subLabel="Caso não possua, informar 0" value={fd.v1_reserva} onChange={v=>set('v1_reserva',v)} maskType="currency" error={fe.v1_reserva} fieldId="v1_reserva"/></div><InputField label="Valor em Estoque" optional={true} value={fd.v1_estoque} onChange={v=>set('v1_estoque',v)}/><TextAreaField label="Pretende contratar crédito em breve?" value={fd.v1_detalhesCredito} onChange={v=>set('v1_detalhesCredito',v)} error={fe.v1_detalhesCredito} fieldId="v1_detalhesCredito"/></div>);
  if(step===4) return(<div className="space-y-5"><TextAreaField label="Maior desafio financeiro hoje?" value={fd.v1_desafio} onChange={v=>set('v1_desafio',v)} error={fe.v1_desafio} fieldId="v1_desafio"/><TextAreaField label="Objetivo para os próximos 12 meses?" value={fd.v1_objetivo} onChange={v=>set('v1_objetivo',v)} error={fe.v1_objetivo} fieldId="v1_objetivo"/><div className="bg-slate-50/50 p-6 rounded-2xl border border-dashed border-slate-200 space-y-4"><div className="flex items-center gap-2"><Upload size={13} className="text-slate-400"/><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documentos</p><span className="ml-auto text-[9px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-bold">Opcional</span></div><TextAreaField label="Links de Planilhas" optional={true} placeholder="https://docs.google.com/..." value={fd.v1_linksAnexos} onChange={v=>set('v1_linksAnexos',v)}/><FileUploadField onFilesSelected={n=>set('v1_nomesArquivos',n)}/></div></div>);
  return null;
};

// ── FORM STEPS GUIADO ─────────────────────────────────────────────────────────
const STEPS_G = [{label:'Identificação'},{label:'Negócio e Vendas'},{label:'Gastos'},{label:'Dívidas e Caixa'},{label:'Futuro e Docs'}];
const FormStepG = ({step,formData:fd,setFormData,fieldErrors:fe}) => {
  const set = (k,v) => setFormData({...fd,[k]:v});
  if(step===0) return(<div className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><InputField label="Razão Social" value={fd.g_razao} onChange={v=>set('g_razao',v)} error={fe.g_razao} fieldId="g_razao"/><InputField label="CNPJ" value={fd.g_cnpj} onChange={v=>set('g_cnpj',v)} error={fe.g_cnpj} maskType="cnpj" fieldId="g_cnpj"/><div className="md:col-span-2"><InputField label="Nome do Responsável" value={fd.g_responsavel} onChange={v=>set('g_responsavel',v)} error={fe.g_responsavel} fieldId="g_responsavel"/></div><InputField label="Email" value={fd.g_email} onChange={v=>set('g_email',v)} error={fe.g_email} icon={Mail} fieldId="g_email"/><InputField label="WhatsApp" value={fd.g_phone} onChange={v=>set('g_phone',v)} error={fe.g_phone} icon={Phone} maskType="phone" fieldId="g_phone"/></div></div>);
  if(step===1) return(<div className="space-y-5"><TextAreaField label="A empresa vende Produtos, Serviços ou os dois?" value={fd.g_oqueVende} onChange={v=>set('g_oqueVende',v)} error={fe.g_oqueVende} fieldId="g_oqueVende"/><InputField label="Há quanto tempo existe?" value={fd.g_tempoExistencia} onChange={v=>set('g_tempoExistencia',v)} error={fe.g_tempoExistencia} fieldId="g_tempoExistencia"/><InputField label="Quantas pessoas trabalham?" value={fd.g_pessoas} onChange={v=>set('g_pessoas',v)} error={fe.g_pessoas} fieldId="g_pessoas"/><InputField label="Faturamento mensal" value={fd.g_faturamento} onChange={v=>set('g_faturamento',v)} maskType="currency" error={fe.g_faturamento} fieldId="g_faturamento"/><InputField label="De onde vem a maior parte do dinheiro?" value={fd.g_mixFaturamento} onChange={v=>set('g_mixFaturamento',v)} error={fe.g_mixFaturamento} fieldId="g_mixFaturamento"/><InputField label="Principais meios de recebimento?" value={fd.g_meioVenda} onChange={v=>set('g_meioVenda',v)} error={fe.g_meioVenda} fieldId="g_meioVenda"/><InputField label="Com que frequência realiza vendas?" value={fd.g_frequencia} onChange={v=>set('g_frequencia',v)} error={fe.g_frequencia} fieldId="g_frequencia"/><TextAreaField label="Como avalia a precificação?" value={fd.g_sobrePreco} onChange={v=>set('g_sobrePreco',v)} error={fe.g_sobrePreco} fieldId="g_sobrePreco"/><InputField label="Produto/serviço mais lucrativo?" value={fd.g_produtoLucrativo} onChange={v=>set('g_produtoLucrativo',v)} error={fe.g_produtoLucrativo} fieldId="g_produtoLucrativo"/></div>);
  if(step===2) return(<div className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><InputField label="Aluguel mensal" value={fd.g_aluguel} onChange={v=>set('g_aluguel',v)} maskType="currency" error={fe.g_aluguel} fieldId="g_aluguel"/><InputField label="Gasto com funcionários" value={fd.g_gastoFunc} onChange={v=>set('g_gastoFunc',v)} maskType="currency" error={fe.g_gastoFunc} fieldId="g_gastoFunc"/><InputField label="Seu salário (pró-labore)" value={fd.g_prolabore} onChange={v=>set('g_prolabore',v)} maskType="currency" error={fe.g_prolabore} fieldId="g_prolabore"/><InputField label="Gastos com mercadorias/serviço" value={fd.g_custosDiretos} onChange={v=>set('g_custosDiretos',v)} maskType="currency" error={fe.g_custosDiretos} fieldId="g_custosDiretos"/><InputField label="Taxas de maquininha" value={fd.g_taxaMaquininha} onChange={v=>set('g_taxaMaquininha',v)} maskType="currency" error={fe.g_taxaMaquininha} fieldId="g_taxaMaquininha"/><InputField label="Outros gastos fixos" subLabel="Água, luz, internet, contador" value={fd.g_outrosFixos} onChange={v=>set('g_outrosFixos',v)} maskType="currency" error={fe.g_outrosFixos} fieldId="g_outrosFixos"/></div><TextAreaField label="Maior 'ralo' de dinheiro hoje?" value={fd.g_raloDinheiro} onChange={v=>set('g_raloDinheiro',v)} error={fe.g_raloDinheiro} fieldId="g_raloDinheiro"/></div>);
  if(step===3) return(<div className="space-y-5"><TextAreaField label="Possui empréstimos ou dívidas?" subLabel="Se não, escreva 'Não'." value={fd.g_descricaoDividas} onChange={v=>set('g_descricaoDividas',v)} error={fe.g_descricaoDividas} fieldId="g_descricaoDividas"/><div className="grid grid-cols-1 md:grid-cols-2 gap-5"><InputField label="Valor total das dívidas" optional={true} value={fd.g_valorTotalDivida} onChange={v=>set('g_valorTotalDivida',v)} maskType="currency"/><InputField label="Como está o pagamento das contas?" value={fd.g_contasEmDia} onChange={v=>set('g_contasEmDia',v)} error={fe.g_contasEmDia} fieldId="g_contasEmDia"/><InputField label="Mistura contas da empresa com pessoais?" value={fd.g_misturaContas} onChange={v=>set('g_misturaContas',v)} error={fe.g_misturaContas} fieldId="g_misturaContas"/><InputField label="Se parar de vender, quanto tempo sobrevive?" value={fd.g_folegoCaixa} onChange={v=>set('g_folegoCaixa',v)} error={fe.g_folegoCaixa} fieldId="g_folegoCaixa"/></div><TextAreaField label="Pensa em pegar empréstimo?" optional={true} value={fd.g_querEmprestimo} onChange={v=>set('g_querEmprestimo',v)}/><InputField label="Em quantos meses pagaria?" optional={true} value={fd.g_prazoPagamento} onChange={v=>set('g_prazoPagamento',v)}/></div>);
  if(step===4) return(<div className="space-y-5"><TextAreaField label="Maior desafio financeiro?" value={fd.g_desafio} onChange={v=>set('g_desafio',v)} error={fe.g_desafio} fieldId="g_desafio"/><TextAreaField label="Se nada mudar, o que acontece em 3 meses?" value={fd.g_futuro} onChange={v=>set('g_futuro',v)} error={fe.g_futuro} fieldId="g_futuro"/><div className="bg-slate-50/50 p-6 rounded-2xl border border-dashed border-slate-200 space-y-4"><div className="flex items-center gap-2"><Upload size={13} className="text-slate-400"/><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documentos</p><span className="ml-auto text-[9px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-bold">Opcional</span></div><TextAreaField label="Links de Planilhas" optional={true} placeholder="https://docs.google.com/..." value={fd.g_linksAnexos} onChange={v=>set('g_linksAnexos',v)}/><FileUploadField onFilesSelected={n=>set('g_nomesArquivos',n)}/></div></div>);
  return null;
};

// ── EMPTY FORM ────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  v1_razao:"",v1_cnpj:"",v1_responsavel:"",v1_email:"",v1_phone:"",v1_segmento:"",
  v1_tempoOperacao:"",v1_numFuncionarios:"",v1_controleFinanceiro:"",
  v1_fatMedio:"",v1_fat12:"",v1_mixFaturamento:"",v1_numVendas:"",v1_meios:"",v1_impostos:"",v1_inadimplencia:"",
  v1_lucra:"",v1_lucroMensal:"",v1_custosDiretos:"",v1_taxaRecebimento:"",v1_comissoes:"",
  v1_folha:"",v1_prolabore:"",v1_mkt:"",v1_estrutura:"",v1_outrasFixas:"",
  v1_descricaoDividas:"",v1_pesoDivida:"",v1_valorTotalDividas:"",v1_prazoRec:"",v1_prazoPag:"",
  v1_saldo:"",v1_reserva:"",v1_estoque:"",v1_detalhesCredito:"",v1_desafio:"",v1_objetivo:"",
  v1_linksAnexos:"",v1_nomesArquivos:"",
  g_razao:"",g_cnpj:"",g_responsavel:"",g_email:"",g_phone:"",g_oqueVende:"",g_tempoExistencia:"",g_pessoas:"",
  g_faturamento:"",g_mixFaturamento:"",g_meioVenda:"",g_frequencia:"",g_sobrePreco:"",g_produtoLucrativo:"",
  g_aluguel:"",g_gastoFunc:"",g_prolabore:"",g_custosDiretos:"",g_taxaMaquininha:"",g_outrosFixos:"",g_raloDinheiro:"",
  g_descricaoDividas:"",g_valorTotalDivida:"",g_contasEmDia:"",g_misturaContas:"",
  g_folegoCaixa:"",g_estoque:"",g_querEmprestimo:"",g_finalidadeEmprestimo:"",g_prazoPagamento:"",
  g_desafio:"",g_futuro:"",g_linksAnexos:"",g_nomesArquivos:""
};

// ── STATUS BADGE ──────────────────────────────────────────────────────────────
const StatusBadge = ({internalStatus}) => {
  if(internalStatus==='completed') return(
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle size={11}/><span className="text-[9px] font-black uppercase tracking-widest">Concluído</span>
    </div>
  );
  return(
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 w-fit">
        <Clock size={11} className="animate-pulse"/><span className="text-[9px] font-black uppercase tracking-widest">Em análise</span>
      </div>
      <div className="flex items-center gap-1 ml-1">
        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
        <div className="w-5 h-0.5 bg-slate-200"></div>
        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
        <div className="w-5 h-0.5 bg-slate-200"></div>
        <div className="w-2 h-2 rounded-full bg-slate-200"></div>
        <span className="text-[8px] text-slate-400 font-bold ml-1">até 2 dias úteis</span>
      </div>
    </div>
  );
};

// ── SEMAFORO CARD ─────────────────────────────────────────────────────────────
const SemaforoCard = ({icon:Icon,title,value,subtitle,status}) => {
  const C = {
    green:{bg:'bg-emerald-50',border:'border-emerald-200',dot:'bg-emerald-500',txt:'text-emerald-700',val:'text-emerald-800'},
    yellow:{bg:'bg-amber-50',border:'border-amber-200',dot:'bg-amber-500',txt:'text-amber-700',val:'text-amber-800'},
    red:{bg:'bg-red-50',border:'border-red-200',dot:'bg-red-500',txt:'text-red-700',val:'text-red-800'},
  }[status]||{bg:'bg-emerald-50',border:'border-emerald-200',dot:'bg-emerald-500',txt:'text-emerald-700',val:'text-emerald-800'};
  return(
    <div className={`${C.bg} border ${C.border} rounded-2xl p-5 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <div className={`w-8 h-8 rounded-lg ${C.bg} border ${C.border} flex items-center justify-center`}><Icon size={15} className={C.txt}/></div>
        <div className={`w-3 h-3 rounded-full ${C.dot} pulse-dot`}></div>
      </div>
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${C.txt} mb-1`}>{title}</p>
        <p className={`text-xl font-black ${C.val}`}>{value}</p>
        {subtitle&&<p className={`text-[10px] font-medium ${C.txt} mt-1`}>{subtitle}</p>}
      </div>
    </div>
  );
};

// ── SCORE RING ────────────────────────────────────────────────────────────────
const ScoreRing = ({score}) => {
  const r=40, circ=2*Math.PI*r, offset=circ-(score/100)*circ;
  const color = score>=70?'#22c55e':score>=40?'#f59e0b':'#ef4444';
  return(
    <svg width="96" height="96" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8"/>
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 50 50)"
        style={{transition:'stroke-dashoffset 1.2s ease-out'}}/>
      <text x="50" y="50" textAnchor="middle" dy="0.35em" fontSize="19" fontWeight="900" fill={color}>{score}</text>
    </svg>
  );
};

// ── MÉTRICAS REAIS ────────────────────────────────────────────────────────────
const pc = v => parseFloat((v||'').replace(/\D/g,'')) / 100 || 0;

const calcMetrics = (diag) => {
  if (!diag?.data) return null;
  const d = diag.data;
  const v1 = diag.form_type === 'Estruturado';

  // ── Receitas ──
  const receita    = pc(v1 ? d.v1_fatMedio      : d.g_faturamento);

  // ── Custos variáveis ──
  const custDir    = pc(v1 ? d.v1_custosDiretos  : d.g_custosDiretos);
  const taxaRec    = pc(v1 ? d.v1_taxaRecebimento: d.g_taxaMaquininha);
  const comissoes  = pc(v1 ? d.v1_comissoes      : '0');
  const custVar    = custDir + taxaRec + comissoes;

  // ── Custos fixos ──
  const folha      = pc(v1 ? d.v1_folha          : d.g_gastoFunc);
  const prolabore  = pc(v1 ? d.v1_prolabore       : d.g_prolabore);
  const mkt        = pc(v1 ? d.v1_mkt             : '0');
  const aluguel    = pc(v1 ? d.v1_estrutura       : d.g_aluguel);
  const outrasFixas= pc(v1 ? d.v1_outrasFixas     : d.g_outrosFixos);
  const pesoDivida = pc(v1 ? d.v1_pesoDivida      : '0');
  const custFix    = folha + prolabore + mkt + aluguel + outrasFixas + pesoDivida;

  // ── Caixa ──
  const saldo      = pc(v1 ? d.v1_saldo           : '0');

  // ── Operacionais (só formulário Estruturado tem esses campos) ──
  const numVendas  = v1 ? (parseFloat((d.v1_numVendas||'').replace(/\D/g,'')) || 0) : 0;
  const pmr        = v1 ? (parseFloat(d.v1_prazoRec) || 0) : 0;
  const pmp        = v1 ? (parseFloat(d.v1_prazoPag) || 0) : 0;

  // ── Cálculos derivados ──
  const totalCust     = custVar + custFix;
  const lucro         = receita - totalCust;
  const margemBruta   = receita > 0 ? ((receita - custDir) / receita) * 100 : 0;
  const margContrib   = receita > 0 ? ((receita - custVar) / receita) * 100 : 0;
  const margLiq       = receita > 0 ? (lucro / receita) * 100 : 0;
  const pontoEq       = margContrib > 0 ? custFix / (margContrib / 100) : 0;
  const burnRate      = totalCust;
  const runwayMeses   = burnRate > 0 && saldo > 0 ? saldo / burnRate : 0;
  const folegoDias    = Math.round(runwayMeses * 30);
  const ticketMedio   = numVendas > 0 ? receita / numVendas : 0;

  // ── Score de saúde (0–100) ──
  let score = 50;
  if (margLiq >= 15) score += 20; else if (margLiq >= 5) score += 10; else if (margLiq < 0) score -= 25;
  if (folegoDias >= 90) score += 15; else if (folegoDias >= 45) score += 5; else if (folegoDias > 0 && folegoDias < 20) score -= 15;
  if (receita > 0 && pontoEq <= receita) score += 10; else if (receita > 0) score -= 10;
  if (margemBruta >= 40) score += 5; else if (margemBruta < 15) score -= 5;
  score = Math.max(10, Math.min(100, Math.round(score)));

  return {
    receita, custDir, custVar, custFix, totalCust, lucro, saldo,
    margemBruta, margContrib, margLiq,
    pontoEq, burnRate, runwayMeses, folegoDias,
    ticketMedio, pmr, pmp,
    score,
  };
};

const genCashFlowData = (m) => {
  if (!m || !m.receita) return [];
  const rSem = m.receita / 4;
  const cSem = m.totalCust / 4;
  const ve = [0.9,1.1,0.85,1.15,0.95,1.2];
  const vs = [0.95,1.0,1.05,0.9,1.1,0.95];
  return ['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5','Sem 6'].map((name,i)=>({
    name, Entradas: Math.round(rSem*ve[i]), Saidas: Math.round(cSem*vs[i])
  }));
};

const genAlerts = (m) => {
  if (!m) return [];
  const alerts = [];
  if (m.margLiq < 0)
    alerts.push({type:'red',icon:AlertOctagon,msg:`Empresa operando com prejuízo de ${formatBRL(Math.abs(m.lucro))}/mês. Os custos superam o faturamento.`,time:'agora'});
  else if (m.margLiq < 5)
    alerts.push({type:'yellow',icon:AlertTriangle,msg:`Margem líquida de ${m.margLiq.toFixed(1)}% está baixa. Por cada R$100 vendidos, sobram R$${m.margLiq.toFixed(0)}.`,time:'agora'});
  if (m.folegoDias > 0 && m.folegoDias < 30)
    alerts.push({type:'red',icon:AlertOctagon,msg:`Fôlego de caixa crítico: apenas ${m.folegoDias} dias de operação garantidos sem novas vendas.`,time:'agora'});
  else if (m.folegoDias >= 30 && m.folegoDias < 60)
    alerts.push({type:'yellow',icon:AlertTriangle,msg:`Fôlego de caixa de ${m.folegoDias} dias. Recomendamos ao menos 60 dias como reserva operacional.`,time:'agora'});
  if (m.receita > 0 && m.pontoEq > m.receita)
    alerts.push({type:'yellow',icon:AlertTriangle,msg:`Ponto de equilíbrio (${formatBRL(m.pontoEq)}/mês) está acima do faturamento atual (${formatBRL(m.receita)}/mês).`,time:'agora'});
  if (m.margLiq >= 15)
    alerts.push({type:'green',icon:TrendingUp,msg:`Margem líquida saudável de ${m.margLiq.toFixed(1)}%. Continue monitorando os custos para manter esse resultado.`,time:'agora'});
  if (m.folegoDias >= 60)
    alerts.push({type:'green',icon:CheckCircle,msg:`Fôlego de caixa saudável: ${m.folegoDias} dias de operação garantidos sem novas vendas.`,time:'agora'});
  if (alerts.length === 0)
    alerts.push({type:'green',icon:CheckCircle,msg:'Indicadores dentro do esperado com base no seu diagnóstico. Continue monitorando regularmente.',time:'agora'});
  return alerts;
};

// ── INDICADOR CARD ────────────────────────────────────────────────────────────
const IndicadorCard = ({titulo, valor, formula, status, destaque=false}) => {
  const C = {
    green:   {bg:'bg-emerald-50', border:'border-emerald-200', val:'text-emerald-800', badge:'bg-emerald-100 text-emerald-700 border-emerald-200'},
    yellow:  {bg:'bg-amber-50',   border:'border-amber-200',   val:'text-amber-800',   badge:'bg-amber-100 text-amber-700 border-amber-200'},
    red:     {bg:'bg-red-50',     border:'border-red-200',     val:'text-red-800',     badge:'bg-red-100 text-red-700 border-red-200'},
    neutral: {bg:'bg-white',      border:'border-slate-100',   val:'text-[#05121b]',   badge:'bg-slate-100 text-slate-500 border-slate-200'},
  }[status] || {bg:'bg-white',border:'border-slate-100',val:'text-[#05121b]',badge:'bg-slate-100 text-slate-500 border-slate-200'};
  const dot = {green:'bg-emerald-500', yellow:'bg-amber-500', red:'bg-red-500', neutral:'bg-slate-300'}[status]||'bg-slate-300';
  return (
    <div className={`${C.bg} border ${C.border} rounded-2xl p-5 flex flex-col gap-2 ${destaque?'ring-2 ring-offset-1 ring-[#137789]/20':''}`}>
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{titulo}</p>
        <div className={`w-2 h-2 rounded-full ${dot} pulse-dot`}></div>
      </div>
      <p className={`text-2xl font-black ${C.val} leading-none`}>{valor}</p>
      {formula && <p className="text-[9px] text-slate-400 font-medium leading-relaxed">{formula}</p>}
    </div>
  );
};

// ── SCENARIOS ─────────────────────────────────────────────────────────────────
const SCENARIOS = [
  {id:'aumentar_ticket',group:'Receita',     emoji:'📈',label:'Aumentar Preço',        desc:'Cobrar % a mais por venda ou serviço',            tipo:'pct',   inputLabel:'Aumento no preço (%)'},
  {id:'queda_receita',  group:'Receita',     emoji:'📉',label:'Queda na Receita',       desc:'Simule sazonalidade ou perda de clientes',        tipo:'pct',   inputLabel:'Queda percentual (%)'},
  {id:'perda_cliente',  group:'Receita',     emoji:'⚠️', label:'Perder Cliente Fixo',   desc:'Receita mensal que deixaria de entrar',           tipo:'valor', inputLabel:'Receita perdida/mês'},
  {id:'novo_contrato',  group:'Receita',     emoji:'🤝', label:'Novo Contrato',         desc:'Receita extra entrando todo mês',                 tipo:'valor', inputLabel:'Valor do contrato/mês'},
  {id:'contratar_func', group:'Custo',       emoji:'👤',label:'Contratar Funcionário',  desc:'Salário base (+30% encargos calculado)',          tipo:'valor', inputLabel:'Salário base mensal'},
  {id:'nova_despesa',   group:'Custo',       emoji:'🏢',label:'Nova Despesa Fixa',      desc:'Aluguel, assinatura, licença ou serviço',         tipo:'valor', inputLabel:'Valor mensal'},
  {id:'reduzir_custo',  group:'Custo',       emoji:'✂️', label:'Cortar Custo Fixo',     desc:'Renegociação ou eliminação de despesa',           tipo:'valor', inputLabel:'Economia mensal'},
  {id:'investimento',   group:'Investimento',emoji:'⚙️', label:'Investimento à Vista',  desc:'Sai do caixa imediatamente (equip. ou reforma)', tipo:'valor', inputLabel:'Valor do investimento'},
  {id:'emprestimo',     group:'Dívida',      emoji:'🏦',label:'Captar Empréstimo',      desc:'Entra no caixa; parcela fixada em 12x',           tipo:'valor', inputLabel:'Valor captado'},
  {id:'pagar_divida',   group:'Dívida',      emoji:'🎯',label:'Quitar Parcela Mensal',  desc:'Elimina custo fixo mensal, consome caixa hoje',   tipo:'valor', inputLabel:'Parcela quitada/mês'},
];

// ── SIM COMPARATIVO ───────────────────────────────────────────────────────────
const SimComparativo = ({label, before, after, formato, lowerIsBetter=false}) => {
  const melhorou = lowerIsBetter ? after <= before : after >= before;
  const diff = Math.abs(after - before);
  const fmt = v => formato==='brl' ? formatBRL(v) : formato==='meses' ? `${Math.max(0,v).toFixed(1)}m` : `${v.toFixed(1)}%`;
  return (
    <div className="bg-slate-50 rounded-2xl p-4 flex flex-col gap-2">
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-400 text-sm font-bold line-through">{fmt(before)}</span>
        <span className="text-slate-300 text-xs">→</span>
        <span className={`text-xl font-black ${melhorou?'text-emerald-600':'text-red-500'}`}>{fmt(after)}</span>
        <span className={`ml-auto text-[9px] font-black px-2 py-0.5 rounded-full border ${melhorou?'bg-emerald-50 text-emerald-700 border-emerald-200':'bg-red-50 text-red-600 border-red-100'}`}>{melhorou?'▲':'▼'} {fmt(diff)}</span>
      </div>
    </div>
  );
};

// ── MULTI FILE DROPZONE ───────────────────────────────────────────────────────
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
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{files.length} arquivo{files.length>1?'s':''} na fila</p>
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

// ── MAIN APP ──────────────────────────────────────────────────────────────────
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

  useEffect(()=>{
    try{localStorage.setItem('oluap_theme',isDark?'dark':'light');}catch{}
    let s=document.getElementById('oluap-dark-css');
    if(!s){s=document.createElement('style');s.id='oluap-dark-css';document.head.appendChild(s);}
    s.textContent=isDark?`
      .dk{background-color:#0d1117!important;color:#c9d1d9!important}
      .dk aside.bg-white{background-color:#161b22!important;border-color:#30363d!important}
      .dk .bg-white{background-color:#1c2333!important}
      .dk .bg-slate-50{background-color:#161b22!important}
      .dk .bg-slate-100{background-color:#1c2333!important}
      .dk .bg-\\[#f5f5f0\\]{background-color:#0d1117!important}
      .dk .border-slate-100{border-color:#30363d!important}
      .dk .border-slate-200{border-color:#374151!important}
      .dk .text-\\[#05121b\\]{color:#e6edf3!important}
      .dk .text-slate-500{color:#8b949e!important}
      .dk .text-slate-400{color:#6e7681!important}
      .dk input:not([type=range]):not([type=checkbox]):not([type=radio]),.dk textarea,.dk select{background-color:#161b22!important;border-color:#30363d!important;color:#c9d1d9!important}
      .dk input::placeholder,.dk textarea::placeholder{color:#6e7681!important}
      .dk table thead tr{border-color:#30363d!important}
      .dk .divide-y>*+*{border-color:#30363d!important}
      .dk .shadow-sm{box-shadow:0 1px 4px rgba(0,0,0,.6)!important}
      .dk .shadow-xl,.dk .shadow-2xl{box-shadow:0 8px 32px rgba(0,0,0,.8)!important}
      .dk .hover\\:bg-slate-50:hover{background-color:#1c2333!important}
      .dk .bg-\\[#05121b\\]{background-color:#101827!important}
    `:'';
  },[isDark]);

  // ── FINANCIAL MODULE STATE ─────────────────────────────────────────────────
  const [bancos, setBancos] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [contasPagar, setContasPagar] = useState([]);
  const [contasReceber, setContasReceber] = useState([]);
  const [dividas, setDividas] = useState([]);
  const [fluxoFiltro, setFluxoFiltro] = useState('mensal');
  const [savingItem, setSavingItem] = useState(false);
  // Modal forms (null = closed, {} = new, {id:...} = editing)
  const [modalBanco, setModalBanco] = useState(null);
  const [modalReceita, setModalReceita] = useState(null);
  const [modalDespesa, setModalDespesa] = useState(null);
  const [modalCP, setModalCP] = useState(null);
  const [modalCR, setModalCR] = useState(null);
  const [modalDivida, setModalDivida] = useState(null);

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
      const[{data:bD},{data:lD},{data:cpD},{data:crD},{data:dD}]=await Promise.all([
        supabase.from('bancos').select('*').eq('user_id',userId).order('created_at'),
        supabase.from('lancamentos').select('*').eq('user_id',userId).order('data',{ascending:false}),
        supabase.from('contas_pagar').select('*').eq('user_id',userId).order('vencimento'),
        supabase.from('contas_receber').select('*').eq('user_id',userId).order('vencimento'),
        supabase.from('dividas').select('*').eq('user_id',userId).order('created_at'),
      ]);
      if(bD)setBancos(bD);
      if(lD)setLancamentos(lD);
      if(cpD)setContasPagar(cpD);
      if(crD)setContasReceber(crD);
      if(dD)setDividas(dD);
    }catch(e){console.error('fetchFinanceiro',e);}
  };

  const saveItem=async(table,payload,setModal,resetList)=>{
    setSavingItem(true);
    try{
      if(payload.id){
        const{id,...rest}=payload;
        await supabase.from(table).update(rest).eq('id',id);
      }else{
        await supabase.from(table).insert(payload);
      }
      await resetList();
      setModal(null);
    }catch(e){console.error(e);}
    setSavingItem(false);
  };

  const deleteItem=async(table,id,resetList)=>{
    if(!confirm('Confirmar exclusão?'))return;
    await supabase.from(table).delete().eq('id',id);
    await resetList();
  };

  const fmtDate=d=>d?new Date(d+'T00:00:00').toLocaleDateString('pt-BR'):'—';
  const today=new Date().toISOString().split('T')[0];

  // Saldo calculado por banco
  const saldoBanco=(bancoId)=>{
    const b=bancos.find(x=>x.id===bancoId);
    if(!b)return 0;
    const ent=lancamentos.filter(l=>l.banco_id===bancoId&&l.tipo==='receita').reduce((a,l)=>a+Number(l.valor),0);
    const sai=lancamentos.filter(l=>l.banco_id===bancoId&&l.tipo==='despesa').reduce((a,l)=>a+Number(l.valor),0);
    return Number(b.saldo_inicial)+ent-sai;
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
    {id:'alertas',         label:'Diagnóstico & Alertas', icon:Brain},
    {id:'fluxo',           label:'Fluxo de Caixa',        icon:Activity},
    {id:'receitas',        label:'Receitas',              icon:TrendingUp},
    {id:'despesas',        label:'Despesas',              icon:TrendingDown},
    {id:'contas_pagar',    label:'Contas a Pagar',        icon:Receipt},
    {id:'contas_receber',  label:'Contas a Receber',      icon:Wallet},
    {id:'simulador',       label:'Simulador de Cenários', icon:Zap},
    {id:'dividas',         label:'Dívidas',               icon:AlertOctagon},
    {id:'bancos',          label:'Bancos',                icon:Landmark},
    {id:'fontes',          label:'Fonte de Dados',        icon:Database},
    {id:'analises',        label:'Minhas Análises',       icon:FolderOpen},
    {id:'relatorios',      label:'Relatórios',            icon:FileSpreadsheet},
    {id:'profile',         label:'Meu Perfil',            icon:User},
  ];

  const metrics = calcMetrics(diagnostics[0]);
  const cashFlowData = genCashFlowData(metrics);
  const alertsFeed = genAlerts(metrics);
  const AC={red:{bg:'bg-red-50',border:'border-red-100',ic:'text-red-500'},yellow:{bg:'bg-amber-50',border:'border-amber-100',ic:'text-amber-500'},green:{bg:'bg-emerald-50',border:'border-emerald-100',ic:'text-emerald-500'}};

  // ── SIDEBAR ────────────────────────────────────────────────────────────────
  return(
    <div className={`min-h-screen bg-[#f5f5f0] flex text-[#05121b] overflow-x-hidden${isDark?' dk':''}`}>

      <aside className={`bg-white h-screen border-r border-slate-100 py-5 flex flex-col fixed left-0 top-0 z-40 print:hidden transition-all duration-300 ${isSidebarOpen?'w-56 px-4':'w-16 px-2'}`}>
        <button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="absolute -right-3 top-8 bg-white border border-slate-200 p-1.5 rounded-full shadow-sm text-slate-400 hover:text-[#ff7b00] z-50 flex items-center justify-center transition-all hover:scale-110">
          <ChevronLeft size={13} style={{transform:isSidebarOpen?'rotate(0deg)':'rotate(180deg)',transition:'transform 0.3s'}}/>
        </button>
        <div className={`flex items-center ${isSidebarOpen?'justify-start px-1':'justify-center'} mb-6 mt-1`}>
          {isSidebarOpen?<img src="logo2.png" alt="OLUAP" className="h-7 object-contain" onError={e=>{e.target.style.display='none';}}/>:<img src="icone.png" alt="OLUAP" className="w-7 h-7 object-contain" onError={e=>{e.target.style.display='none';}}/>}
        </div>
        <nav className="flex-1 space-y-1 mt-2">
          {navItems.map(item=>{
            const I=item.icon;
            const active=view===item.id||(item.id==='analises'&&(view==='success'||view==='result'||view==='view_data'));
            const handleNavClick = () => {
              if (item.id === 'nova_analise') { setFormMode(null); setFormStep(0); setView('form'); }
              else setView(item.id);
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

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen?'ml-56':'ml-16'} p-6 md:p-8 overflow-y-auto min-h-screen min-w-0`}>

        {/* ── DASHBOARD ──────────────────────────────────────────────────── */}
        {view==='dashboard'&&(
          <div className="max-w-7xl mx-auto fade-in">
            <header className="mb-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Visão Geral · {new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}</p>
              <h1 className="text-2xl font-black text-[#05121b] italic">Painel Financeiro</h1>
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
            {!metrics ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl mx-auto mb-5 flex items-center justify-center"><Activity size={26} className="text-slate-300"/></div>
                <h2 className="text-lg font-black text-[#05121b] mb-2">Painel ainda sem dados</h2>
                <p className="text-slate-400 text-sm font-medium mb-6 max-w-sm mx-auto leading-relaxed">Envie seu primeiro diagnóstico financeiro para que o painel seja preenchido com os dados reais da sua empresa.</p>
                <button onClick={()=>{setFormMode(null);setFormStep(0);setView('form');}} className="bg-[#ff7b00] text-white px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-transform inline-flex items-center gap-2"><Plus size={13}/> Solicitar Diagnóstico</button>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col items-center gap-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saúde Geral</p>
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
                      <div><h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide">Projeção de Caixa</h3><p className="text-[10px] text-slate-400 mt-0.5">Entradas vs Saídas — Próximas 6 semanas</p></div>
                      <span className="text-[9px] bg-slate-50 border border-slate-200 text-slate-500 font-bold px-3 py-1.5 rounded-full uppercase tracking-widest">Baseado no diagnóstico</span>
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
                    <div className="p-5 border-b border-slate-50"><div className="flex items-center gap-2"><Cpu size={15} className="text-[#ff7b00]"/><h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide">Alertas do Diagnóstico</h3></div><p className="text-[10px] text-slate-400 mt-1">Baseado nos dados que você enviou</p></div>
                    <div className="p-3 space-y-2 max-h-[460px] overflow-y-auto">
                      {alertsFeed.map((a,i)=>{const I=a.icon;const c=AC[a.type];return(<div key={i} className={`${c.bg} border ${c.border} rounded-xl p-3.5 flex gap-3`}><I size={14} className={`${c.ic} shrink-0 mt-0.5`}/><div><p className="text-[11px] font-semibold text-[#05121b] leading-relaxed">{a.msg}</p></div></div>);})}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── INDICADORES RÁPIDOS ─────────────────────────────────── */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide">Indicadores-Chave</h3>
                  <button onClick={()=>setView('alertas')} className="text-[9px] font-black text-[#137789] hover:text-[#ff7b00] uppercase tracking-widest transition-colors flex items-center gap-1">Análise completa <ChevronRight size={11}/></button>
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
                    <button onClick={()=>setView('bancos')} className="text-[9px] font-black uppercase tracking-widest text-[#137789] hover:text-[#ff7b00] transition-colors">Ver todos →</button>
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
                      <button onClick={()=>setView('contas_pagar')} className="w-full text-[9px] font-black uppercase tracking-widest text-[#137789] hover:text-[#ff7b00] transition-colors py-1">Ver todas →</button>
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
                      <button onClick={()=>setView('contas_receber')} className="w-full text-[9px] font-black uppercase tracking-widest text-[#137789] hover:text-[#ff7b00] transition-colors py-1">Ver todas →</button>
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
                    <button onClick={()=>setView('dividas')} className="w-full text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors py-1">Gerenciar dívidas →</button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── CFO DIGITAL · DIAGNÓSTICO & ALERTAS ───────────────────────── */}
        {view==='alertas'&&(
          <div className="max-w-6xl mx-auto fade-in">
            <header className="mb-8">
              <p className="text-[10px] font-bold text-[#ff7b00] uppercase tracking-widest mb-1">CFO Digital · Análise Completa</p>
              <h1 className="text-2xl font-black text-[#05121b] italic">Diagnóstico & Alertas</h1>
              <p className="text-slate-400 text-sm font-medium mt-1">Todos os indicadores financeiros da sua empresa em um único lugar.</p>
            </header>

            {!metrics ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl mx-auto mb-5 flex items-center justify-center"><Brain size={26} className="text-slate-300"/></div>
                <h2 className="text-lg font-black text-[#05121b] mb-2">Nenhum diagnóstico enviado ainda</h2>
                <p className="text-slate-400 text-sm font-medium mb-6 max-w-sm mx-auto leading-relaxed">Envie seu primeiro diagnóstico para que o CFO Digital calcule todos os indicadores com base nos dados reais da sua empresa.</p>
                <button onClick={()=>{setFormMode(null);setFormStep(0);setView('form');}} className="bg-[#ff7b00] text-white px-8 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-transform inline-flex items-center gap-2"><Plus size={13}/> Solicitar Diagnóstico</button>
              </div>
            ) : (
              <>
                {/* ── SCORE + SEMÁFOROS ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  <div className="bg-[#05121b] rounded-3xl p-8 text-white flex flex-col items-center gap-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Score de Saúde</p>
                    <ScoreRing score={metrics.score}/>
                    <div className="text-center">
                      <p className={`font-black text-sm ${metrics.score>=70?'text-emerald-400':metrics.score>=40?'text-amber-400':'text-red-400'}`}>{metrics.score>=70?'Financeiramente Saudável':metrics.score>=40?'Requer Atenção':'Situação Crítica'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">Baseado no seu último diagnóstico</p>
                    </div>
                    <div className="w-full border-t border-white/10 pt-4 grid grid-cols-2 gap-3">
                      <div className="text-center"><p className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Resultado</p><p className={`text-sm font-black ${metrics.lucro>=0?'text-emerald-400':'text-red-400'}`}>{formatBRL(metrics.lucro)}</p></div>
                      <div className="text-center"><p className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Faturamento</p><p className="text-sm font-black text-white">{formatBRL(metrics.receita)}</p></div>
                    </div>
                  </div>
                  <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                    <SemaforoCard icon={Clock} title="Fôlego de Caixa" value={`${metrics.folegoDias} dias`} subtitle="Operação garantida sem novas vendas" status={metrics.folegoDias>=60?'green':metrics.folegoDias>=30?'yellow':'red'}/>
                    <SemaforoCard icon={Target} title="Ponto de Equilíbrio" value={formatBRL(metrics.pontoEq)} subtitle="Faturamento mínimo necessário/mês" status={metrics.receita>=metrics.pontoEq?'green':metrics.receita>=metrics.pontoEq*0.8?'yellow':'red'}/>
                    <SemaforoCard icon={DollarSign} title="Margem de Contribuição" value={`${metrics.margContrib.toFixed(1)}%`} subtitle="Sobra após custos variáveis" status={metrics.margContrib>=30?'green':metrics.margContrib>=15?'yellow':'red'}/>
                    <SemaforoCard icon={TrendingUp} title="Margem Líquida" value={`${metrics.margLiq.toFixed(1)}%`} subtitle="Por R$100 vendidos" status={metrics.margLiq>=15?'green':metrics.margLiq>=5?'yellow':'red'}/>
                  </div>
                </div>

                {/* ── PROJEÇÃO DE CAIXA ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                  <div className="flex items-center justify-between mb-5">
                    <div><h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide">Projeção de Caixa</h3><p className="text-[10px] text-slate-400 mt-0.5">Entradas vs Saídas — Próximas 6 semanas (baseado no diagnóstico)</p></div>
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

                {/* ── DRE SIMPLIFICADO ── */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                  <h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide mb-5 flex items-center gap-2"><FileText size={14} className="text-[#137789]"/> DRE Simplificado · Mensal</h3>
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
                    <h3 className="font-black text-[#05121b] uppercase text-xs tracking-widest flex items-center gap-2"><Bell size={13} className="text-[#ff7b00]"/> Alertas do CFO Digital</h3>
                    <div className="flex items-center gap-2">
                      {alertsFeed.filter(a=>a.type==='red').length>0&&<span className="text-[9px] bg-red-50 text-red-600 border border-red-100 font-black px-3 py-1 rounded-full uppercase tracking-widest">{alertsFeed.filter(a=>a.type==='red').length} crítico{alertsFeed.filter(a=>a.type==='red').length>1?'s':''}</span>}
                      {alertsFeed.filter(a=>a.type==='yellow').length>0&&<span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100 font-black px-3 py-1 rounded-full uppercase tracking-widest">{alertsFeed.filter(a=>a.type==='yellow').length} atenção</span>}
                    </div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {alertsFeed.map((a,i)=>{const I=a.icon;const c=AC[a.type];const lbl={red:'Crítico',yellow:'Atenção',green:'Oportunidade'}[a.type];return(
                      <div key={i} className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                        <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center shrink-0`}><I size={15} className={c.ic}/></div>
                        <div className="flex-1 min-w-0">
                          <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border mb-1.5 ${c.bg} ${c.border} ${c.ic}`}>{lbl}</span>
                          <p className="text-xs font-semibold text-[#05121b] leading-relaxed">{a.msg}</p>
                        </div>
                      </div>
                    );})}
                  </div>
                </div>

                {/* ── INDICADORES COMPLETOS ── */}
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide">Indicadores Financeiros</h3>
                    <span className="text-[8px] bg-[#05121b] text-white px-2.5 py-1 rounded-full font-black uppercase tracking-widest">Completo</span>
                  </div>

                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><TrendingUp size={10}/> Rentabilidade</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <IndicadorCard titulo="Margem Bruta" valor={`${metrics.margemBruta.toFixed(1)}%`} formula="(Receita − Custos Diretos) ÷ Receita" status={metrics.margemBruta>=40?'green':metrics.margemBruta>=20?'yellow':'red'}/>
                    <IndicadorCard titulo="Margem de Contribuição" valor={`${metrics.margContrib.toFixed(1)}%`} formula="(Receita − Custos Variáveis) ÷ Receita" status={metrics.margContrib>=30?'green':metrics.margContrib>=15?'yellow':'red'} destaque/>
                    <IndicadorCard titulo="Margem Líquida" valor={`${metrics.margLiq.toFixed(1)}%`} formula="Lucro Líquido ÷ Receita" status={metrics.margLiq>=15?'green':metrics.margLiq>=5?'yellow':'red'}/>
                    <IndicadorCard titulo="Ponto de Equilíbrio" valor={formatBRL(metrics.pontoEq)} formula="Custo Fixo ÷ Margem de Contribuição" status={metrics.receita>=metrics.pontoEq?'green':metrics.receita>=metrics.pontoEq*0.85?'yellow':'red'}/>
                  </div>

                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Activity size={10}/> Caixa & Liquidez</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <IndicadorCard titulo="Cash Burn Rate" valor={formatBRL(metrics.burnRate)} formula="Total de custos por mês" status="neutral"/>
                    <IndicadorCard titulo="Runway" valor={metrics.runwayMeses>0?`${metrics.runwayMeses.toFixed(1)} meses`:'—'} formula="Saldo ÷ Burn Rate mensal" status={metrics.runwayMeses>=3?'green':metrics.runwayMeses>=1.5?'yellow':metrics.runwayMeses>0?'red':'neutral'} destaque/>
                    <IndicadorCard titulo="Ticket Médio" valor={metrics.ticketMedio>0?formatBRL(metrics.ticketMedio):'—'} formula="Faturamento ÷ Nº de vendas/mês" status="neutral"/>
                    <IndicadorCard titulo="Prazo Médio Recebimento" valor={metrics.pmr>0?`${metrics.pmr} dias`:'—'} formula="Média de dias até o cliente pagar" status={metrics.pmr>0?(metrics.pmr<=30?'green':metrics.pmr<=60?'yellow':'red'):'neutral'}/>
                  </div>

                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Shield size={10}/> Estrutura de Custos</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <IndicadorCard titulo="Custos Variáveis" valor={formatBRL(metrics.custVar)} formula="CMV + Taxas + Comissões" status="neutral"/>
                    <IndicadorCard titulo="Custos Fixos" valor={formatBRL(metrics.custFix)} formula="Folha + Aluguel + Fixos" status="neutral"/>
                    <IndicadorCard titulo="% Custo sobre Receita" valor={metrics.receita>0?`${(metrics.totalCust/metrics.receita*100).toFixed(1)}%`:'—'} formula="Total custos ÷ Receita" status={metrics.receita>0?(metrics.totalCust/metrics.receita<=0.7?'green':metrics.totalCust/metrics.receita<=0.85?'yellow':'red'):'neutral'} destaque/>
                    <IndicadorCard titulo="Resultado Mensal" valor={formatBRL(metrics.lucro)} formula="Receita − Total de Custos" status={metrics.lucro>0?'green':metrics.lucro===0?'neutral':'red'}/>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── SIMULADOR ─────────────────────────────────────────────────── */}
        {view==='simulador'&&(()=>{
          const sc=SCENARIOS.find(s=>s.id===simType)||SCENARIOS[0];
          const grupos=['Todos','Receita','Custo','Investimento','Dívida'];
          const scFiltrados=simGroup==='Todos'?SCENARIOS:SCENARIOS.filter(s=>s.group===simGroup);
          const canCalc=sc.tipo==='pct'?!!simPct:!!simValue;
          return(
          <div className="max-w-4xl mx-auto fade-in">
            <header className="mb-8">
              <p className="text-[10px] font-bold text-[#137789] uppercase tracking-widest mb-1">IA · Simulador</p>
              <h1 className="text-2xl font-black text-[#05121b] italic">Simulador de Cenários</h1>
              <p className="text-slate-400 text-sm font-medium mt-1">Teste decisões antes de executar. Veja o impacto real nos seus indicadores financeiros.</p>
            </header>

            {!metrics&&(
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3 mb-6">
                <Info size={15} className="text-amber-500 shrink-0 mt-0.5"/>
                <p className="text-[12px] text-amber-700 font-medium leading-relaxed">Envie um diagnóstico financeiro para ver projeções com os dados reais da sua empresa. Sem dados, não há como calcular antes × depois.</p>
              </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 mb-5">
              {/* Grupo filter */}
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                {grupos.map(g=>(
                  <button key={g} onClick={()=>{setSimGroup(g);setSimResult(null);}} className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${simGroup===g?'bg-[#05121b] text-white border-[#05121b]':'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>{g}</button>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{sc.inputLabel}</label>
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
          <div className="max-w-4xl mx-auto fade-in">
            <header className="mb-8"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Configuração</p><h1 className="text-2xl font-black text-[#05121b] italic">Fontes de Dados</h1><p className="text-slate-400 text-sm font-medium mt-1">Escolha como quer trazer os dados da sua empresa.</p></header>
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
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><ArrowRight size={11}/> Abrir formulário</span>
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
          <div className="max-w-5xl mx-auto fade-in">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Central de</p><h1 className="text-2xl font-black text-[#05121b] italic">Minhas Análises</h1></div>
              <button onClick={()=>{setFormMode(null);setFormStep(0);setView('form');}} className="bg-[#ff7b00] text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] shadow-md hover:scale-[1.02] transition-transform self-start sm:self-auto flex items-center gap-2"><Plus size={13}/> Solicitar Nova Análise</button>
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
                  <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-4">Nenhum diagnóstico ainda.</p>
                  <button onClick={()=>{setFormMode(null);setFormStep(0);setView('form');}} className="bg-[#ff7b00] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] transition-transform">Solicitar Agora</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            ── FLUXO DE CAIXA ────────────────────────────────────────── */}
        {view==='fluxo'&&(()=>{
          const filtros=[{id:'diario',l:'Diário'},{id:'semanal',l:'Semanal'},{id:'mensal',l:'Mensal'},{id:'anual',l:'Anual'}];
          const now=new Date();
          const filteredLanc=lancamentos.filter(l=>{
            const d=new Date(l.data+'T00:00:00');
            if(fluxoFiltro==='diario') return d.toDateString()===now.toDateString();
            if(fluxoFiltro==='semanal'){const s=new Date(now);s.setDate(now.getDate()-7);return d>=s;}
            if(fluxoFiltro==='mensal') return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
            if(fluxoFiltro==='anual')  return d.getFullYear()===now.getFullYear();
            return true;
          });
          const totalEnt=filteredLanc.filter(l=>l.tipo==='receita').reduce((a,l)=>a+Number(l.valor),0);
          const totalSai=filteredLanc.filter(l=>l.tipo==='despesa').reduce((a,l)=>a+Number(l.valor),0);
          // Chart data: group by day/week/month depending on filter
          const chartMap={};
          filteredLanc.forEach(l=>{
            const d=new Date(l.data+'T00:00:00');
            let key;
            if(fluxoFiltro==='diario'||fluxoFiltro==='semanal') key=d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
            else if(fluxoFiltro==='mensal') key=d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
            else key=d.toLocaleDateString('pt-BR',{month:'short'});
            if(!chartMap[key]) chartMap[key]={name:key,Entradas:0,Saídas:0};
            if(l.tipo==='receita') chartMap[key].Entradas+=Number(l.valor);
            else chartMap[key].Saídas+=Number(l.valor);
          });
          const chartData=Object.values(chartMap).slice(-12);
          return(
            <div className="max-w-5xl mx-auto fade-in">
              <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Visão financeira</p><h1 className="text-2xl font-black text-[#05121b] italic">Fluxo de Caixa</h1></div>
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                  {filtros.map(f=><button key={f.id} onClick={()=>setFluxoFiltro(f.id)} className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${fluxoFiltro===f.id?'bg-white shadow text-[#05121b]':'text-slate-400 hover:text-[#05121b]'}`}>{f.l}</button>)}
                </div>
              </header>
              {/* KPI row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5"><p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Entradas</p><p className="text-2xl font-black text-emerald-800">{formatBRL(totalEnt)}</p></div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5"><p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Total Saídas</p><p className="text-2xl font-black text-red-800">{formatBRL(totalSai)}</p></div>
                <div className={`${totalEnt-totalSai>=0?'bg-blue-50 border-blue-200':'bg-amber-50 border-amber-200'} border rounded-2xl p-5`}><p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${totalEnt-totalSai>=0?'text-blue-600':'text-amber-600'}`}>Saldo Período</p><p className={`text-2xl font-black ${totalEnt-totalSai>=0?'text-blue-800':'text-amber-800'}`}>{formatBRL(totalEnt-totalSai)}</p></div>
              </div>
              {/* Chart */}
              {chartData.length>0&&(
                <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-6 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Evolução no período</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{top:5,right:5,left:-20,bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                        <XAxis dataKey="name" tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                        <YAxis tickFormatter={v=>`R$${v>=1000?Math.round(v/1000)+'k':v}`} tick={{fontSize:9,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                        <RTooltip formatter={v=>formatBRL(v)} contentStyle={{borderRadius:'10px',border:'none',boxShadow:'0 4px 12px rgba(0,0,0,0.08)',fontSize:'11px',fontWeight:'bold'}}/>
                        <Area type="monotone" dataKey="Entradas" stroke="#22c55e" fill="#22c55e20" strokeWidth={2}/>
                        <Area type="monotone" dataKey="Saídas"   stroke="#ef4444" fill="#ef444420" strokeWidth={2}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              {/* Table */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredLanc.length} lançamentos</p>
                  <div className="flex gap-2">
                    <button onClick={()=>setModalReceita({tipo:'receita',descricao:'',valor:'',data:today,categoria:'',banco_id:''})} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 hover:bg-emerald-700 transition-colors"><Plus size={11}/>Receita</button>
                    <button onClick={()=>setModalDespesa({tipo:'despesa',descricao:'',valor:'',data:today,categoria:'',banco_id:''})} className="bg-red-500 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 hover:bg-red-600 transition-colors"><Plus size={11}/>Despesa</button>
                  </div>
                </div>
                {filteredLanc.length===0?<div className="py-12 text-center text-slate-400 font-bold text-[10px] uppercase tracking-widest">Nenhum lançamento no período</div>:(
                  <div className="divide-y divide-slate-50">
                    {filteredLanc.map(l=>(
                      <div key={l.id} className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${l.tipo==='receita'?'bg-emerald-50':'bg-red-50'}`}>
                            {l.tipo==='receita'?<TrendingUp size={14} className="text-emerald-600"/>:<TrendingDown size={14} className="text-red-500"/>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#05121b] truncate">{l.descricao}</p>
                            <p className="text-[10px] text-slate-400">{l.categoria||'—'} · {fmtDate(l.data)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <p className={`text-sm font-black ${l.tipo==='receita'?'text-emerald-700':'text-red-600'}`}>{l.tipo==='receita'?'+':'-'}{formatBRL(l.valor)}</p>
                          <button onClick={()=>deleteItem('lancamentos',l.id,()=>fetchFinanceiro(user.id))} className="text-slate-200 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════
            ── RECEITAS ──────────────────────────────────────────────── */}
        {view==='receitas'&&(()=>{
          const cats=['Venda de Produto','Venda de Serviço','Mensalidade','Comissão','Juros','Outros'];
          const total=lancamentos.filter(l=>l.tipo==='receita').reduce((a,l)=>a+Number(l.valor),0);
          return(
            <div className="max-w-4xl mx-auto fade-in">
              <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entradas</p><h1 className="text-2xl font-black text-[#05121b] italic">Receitas</h1></div>
                <button onClick={()=>setModalReceita({tipo:'receita',descricao:'',valor:'',data:today,categoria:'',banco_id:''})} className="bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-md"><Plus size={13}/>Nova Receita</button>
              </header>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 flex items-center justify-between">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total de Receitas Registradas</p>
                <p className="text-2xl font-black text-emerald-800">{formatBRL(total)}</p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                {lancamentos.filter(l=>l.tipo==='receita').length===0?<div className="py-16 text-center"><TrendingUp size={28} className="text-slate-200 mx-auto mb-3"/><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Nenhuma receita registrada</p></div>:(
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-100">{['Data','Descrição','Categoria','Banco','Valor',''].map(h=><th key={h} className="px-5 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {lancamentos.filter(l=>l.tipo==='receita').map(l=>(
                        <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 text-[10px] text-slate-400 font-medium whitespace-nowrap">{fmtDate(l.data)}</td>
                          <td className="px-5 py-3 text-xs font-bold text-[#05121b]">{l.descricao}</td>
                          <td className="px-5 py-3 text-[10px] text-slate-400">{l.categoria||'—'}</td>
                          <td className="px-5 py-3 text-[10px] text-slate-400">{bancos.find(b=>b.id===l.banco_id)?.nome||'—'}</td>
                          <td className="px-5 py-3 text-sm font-black text-emerald-700 whitespace-nowrap">+{formatBRL(l.valor)}</td>
                          <td className="px-5 py-3"><button onClick={()=>deleteItem('lancamentos',l.id,()=>fetchFinanceiro(user.id))} className="text-slate-200 hover:text-red-400 transition-colors"><Trash2 size={13}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════
            ── DESPESAS ──────────────────────────────────────────────── */}
        {view==='despesas'&&(()=>{
          const cats=['Cartão de Crédito','Boleto','Fornecedor','Folha de Pagamento','Aluguel','Marketing','Serviços/Software','Estorno','Impostos','Outros'];
          const total=lancamentos.filter(l=>l.tipo==='despesa').reduce((a,l)=>a+Number(l.valor),0);
          return(
            <div className="max-w-4xl mx-auto fade-in">
              <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Saídas</p><h1 className="text-2xl font-black text-[#05121b] italic">Despesas</h1></div>
                <button onClick={()=>setModalDespesa({tipo:'despesa',descricao:'',valor:'',data:today,categoria:'',banco_id:''})} className="bg-red-500 text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-red-600 transition-colors shadow-md"><Plus size={13}/>Nova Despesa</button>
              </header>
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 flex items-center justify-between">
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Total de Despesas Registradas</p>
                <p className="text-2xl font-black text-red-800">{formatBRL(total)}</p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                {lancamentos.filter(l=>l.tipo==='despesa').length===0?<div className="py-16 text-center"><TrendingDown size={28} className="text-slate-200 mx-auto mb-3"/><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Nenhuma despesa registrada</p></div>:(
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-100">{['Data','Descrição','Categoria','Banco','Valor',''].map(h=><th key={h} className="px-5 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {lancamentos.filter(l=>l.tipo==='despesa').map(l=>(
                        <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3 text-[10px] text-slate-400 font-medium whitespace-nowrap">{fmtDate(l.data)}</td>
                          <td className="px-5 py-3 text-xs font-bold text-[#05121b]">{l.descricao}</td>
                          <td className="px-5 py-3 text-[10px] text-slate-400">{l.categoria||'—'}</td>
                          <td className="px-5 py-3 text-[10px] text-slate-400">{bancos.find(b=>b.id===l.banco_id)?.nome||'—'}</td>
                          <td className="px-5 py-3 text-sm font-black text-red-600 whitespace-nowrap">-{formatBRL(l.valor)}</td>
                          <td className="px-5 py-3"><button onClick={()=>deleteItem('lancamentos',l.id,()=>fetchFinanceiro(user.id))} className="text-slate-200 hover:text-red-400 transition-colors"><Trash2 size={13}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════
            ── CONTAS A PAGAR ────────────────────────────────────────── */}
        {view==='contas_pagar'&&(()=>{
          const cats=['Cartão de Crédito','Boleto Bancário','Fornecedor','Aluguel','Folha de Pagamento','Imposto / DAS','Serviço / Assinatura','Empréstimo / Parcela','Outros'];
          const statusMap={pendente:{bg:'bg-amber-50',border:'border-amber-200',txt:'text-amber-700',dot:'bg-amber-500',lbl:'Pendente'},pago:{bg:'bg-emerald-50',border:'border-emerald-200',txt:'text-emerald-700',dot:'bg-emerald-500',lbl:'Pago'},atrasado:{bg:'bg-red-50',border:'border-red-200',txt:'text-red-700',dot:'bg-red-500',lbl:'Atrasado'}};
          const getStatus=(cp)=>{if(cp.status==='pago')return 'pago';if(cp.vencimento<today&&cp.status!=='pago')return 'atrasado';return cp.status||'pendente';};
          const totPendente=contasPagar.filter(c=>getStatus(c)!=='pago').reduce((a,c)=>a+Number(c.valor),0);
          const totAtrasado=contasPagar.filter(c=>getStatus(c)==='atrasado').reduce((a,c)=>a+Number(c.valor),0);
          return(
            <div className="max-w-5xl mx-auto fade-in">
              <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gestão</p><h1 className="text-2xl font-black text-[#05121b] italic">Contas a Pagar</h1></div>
                <button onClick={()=>setModalCP({descricao:'',categoria:'',valor:'',vencimento:'',status:'pendente',banco_id:'',observacao:''})} className="bg-[#05121b] text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-md"><Plus size={13}/>Nova Conta</button>
              </header>
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total a Pagar</p><p className="text-2xl font-black text-[#05121b]">{formatBRL(totPendente)}</p></div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5"><p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">Em Atraso</p><p className="text-2xl font-black text-red-800">{formatBRL(totAtrasado)}</p></div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total de Contas</p><p className="text-2xl font-black text-[#05121b]">{contasPagar.length}</p></div>
              </div>
              {/* Table */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                {contasPagar.length===0?<div className="py-16 text-center"><Receipt size={28} className="text-slate-200 mx-auto mb-3"/><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Nenhuma conta a pagar</p></div>:(
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-100">{['Vencimento','Descrição','Categoria','Banco','Valor','Status',''].map(h=><th key={h} className="px-5 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {contasPagar.map(cp=>{
                        const st=getStatus(cp);
                        const S=statusMap[st]||statusMap.pendente;
                        return(
                          <tr key={cp.id} className={`hover:bg-slate-50 transition-colors ${st==='atrasado'?'bg-red-50/30':''}`}>
                            <td className={`px-5 py-3 text-[10px] font-bold whitespace-nowrap ${st==='atrasado'?'text-red-600':'text-slate-500'}`}>{fmtDate(cp.vencimento)}</td>
                            <td className="px-5 py-3">
                              <p className="text-xs font-bold text-[#05121b]">{cp.descricao}</p>
                              {cp.observacao&&<p className="text-[10px] text-slate-400 mt-0.5">{cp.observacao}</p>}
                            </td>
                            <td className="px-5 py-3 text-[10px] text-slate-400">{cp.categoria||'—'}</td>
                            <td className="px-5 py-3 text-[10px] text-slate-400">{bancos.find(b=>b.id===cp.banco_id)?.nome||'—'}</td>
                            <td className="px-5 py-3 text-sm font-black text-[#05121b] whitespace-nowrap">{formatBRL(cp.valor)}</td>
                            <td className="px-5 py-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${S.bg} ${S.border} ${S.txt}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${S.dot}`}></span>{S.lbl}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <button onClick={()=>setModalCP({...cp})} className="text-slate-300 hover:text-[#137789] transition-colors"><Pencil size={13}/></button>
                                <button onClick={()=>deleteItem('contas_pagar',cp.id,()=>fetchFinanceiro(user.id))} className="text-slate-200 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                              </div>
                            </td>
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
            ── CONTAS A RECEBER ──────────────────────────────────────── */}
        {view==='contas_receber'&&(()=>{
          const statusMap={pendente:{bg:'bg-amber-50',border:'border-amber-200',txt:'text-amber-700',dot:'bg-amber-500',lbl:'Pendente'},recebido:{bg:'bg-emerald-50',border:'border-emerald-200',txt:'text-emerald-700',dot:'bg-emerald-500',lbl:'Recebido'},vencido:{bg:'bg-red-50',border:'border-red-200',txt:'text-red-700',dot:'bg-red-500',lbl:'Vencido'}};
          const getStatus=(cr)=>{if(cr.status==='recebido')return 'recebido';if(cr.vencimento<today&&cr.status!=='recebido')return 'vencido';return cr.status||'pendente';};
          const totPendente=contasReceber.filter(c=>getStatus(c)==='pendente').reduce((a,c)=>a+Number(c.valor),0);
          return(
            <div className="max-w-5xl mx-auto fade-in">
              <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Entradas futuras</p><h1 className="text-2xl font-black text-[#05121b] italic">Contas a Receber</h1></div>
                <button onClick={()=>setModalCR({cliente:'',descricao:'',valor:'',vencimento:'',status:'pendente',banco_id:'',observacao:''})} className="bg-[#137789] text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-[#0e5f6b] transition-colors shadow-md"><Plus size={13}/>Nova Conta</button>
              </header>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 flex items-center justify-between">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">A receber (pendente)</p>
                <p className="text-2xl font-black text-emerald-800">{formatBRL(totPendente)}</p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                {contasReceber.length===0?<div className="py-16 text-center"><Wallet size={28} className="text-slate-200 mx-auto mb-3"/><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Nenhuma conta a receber</p></div>:(
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-100">{['Vencimento','Cliente','Descrição','Banco','Valor','Status',''].map(h=><th key={h} className="px-5 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {contasReceber.map(cr=>{
                        const st=getStatus(cr);
                        const S=statusMap[st]||statusMap.pendente;
                        return(
                          <tr key={cr.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3 text-[10px] font-bold text-slate-500 whitespace-nowrap">{fmtDate(cr.vencimento)}</td>
                            <td className="px-5 py-3 text-xs font-bold text-[#05121b]">{cr.cliente}</td>
                            <td className="px-5 py-3 text-[10px] text-slate-400">{cr.descricao}</td>
                            <td className="px-5 py-3 text-[10px] text-slate-400">{bancos.find(b=>b.id===cr.banco_id)?.nome||'—'}</td>
                            <td className="px-5 py-3 text-sm font-black text-emerald-700 whitespace-nowrap">+{formatBRL(cr.valor)}</td>
                            <td className="px-5 py-3"><span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${S.bg} ${S.border} ${S.txt}`}><span className={`w-1.5 h-1.5 rounded-full ${S.dot}`}></span>{S.lbl}</span></td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <button onClick={()=>setModalCR({...cr})} className="text-slate-300 hover:text-[#137789] transition-colors"><Pencil size={13}/></button>
                                <button onClick={()=>deleteItem('contas_receber',cr.id,()=>fetchFinanceiro(user.id))} className="text-slate-200 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                              </div>
                            </td>
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
          const statusMap={ativa:{bg:'bg-amber-50',border:'border-amber-200',txt:'text-amber-700',lbl:'Ativa'},quitada:{bg:'bg-emerald-50',border:'border-emerald-200',txt:'text-emerald-700',lbl:'Quitada'},em_negociacao:{bg:'bg-blue-50',border:'border-blue-200',txt:'text-blue-700',lbl:'Em Negociação'}};
          const totalAtivas=dividas.filter(d=>d.status==='ativa').reduce((a,d)=>a+Number(d.valor_total),0);
          return(
            <div className="max-w-5xl mx-auto fade-in">
              <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Passivos</p><h1 className="text-2xl font-black text-[#05121b] italic">Dívidas</h1></div>
                <button onClick={()=>setModalDivida({credor:'',descricao:'',valor_total:'',valor_parcela:'',parcelas_total:'',parcelas_pagas:0,proximo_vencimento:'',status:'ativa'})} className="bg-[#05121b] text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-md"><Plus size={13}/>Nova Dívida</button>
              </header>
              {totalAtivas>0&&<div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6 flex items-center justify-between"><p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Total de Dívidas Ativas</p><p className="text-2xl font-black text-red-800">{formatBRL(totalAtivas)}</p></div>}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                {dividas.length===0?<div className="py-16 text-center"><AlertOctagon size={28} className="text-slate-200 mx-auto mb-3"/><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Nenhuma dívida registrada</p></div>:(
                  <table className="w-full">
                    <thead><tr className="border-b border-slate-100">{['Credor','Descrição','Valor Total','Parcela','Progresso','Próx. Venc.','Status',''].map(h=><th key={h} className="px-5 py-3 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {dividas.map(d=>{
                        const S=statusMap[d.status]||statusMap.ativa;
                        const prog=d.parcelas_total>0?Math.round((d.parcelas_pagas/d.parcelas_total)*100):0;
                        return(
                          <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3 text-xs font-black text-[#05121b]">{d.credor}</td>
                            <td className="px-5 py-3 text-[10px] text-slate-400">{d.descricao||'—'}</td>
                            <td className="px-5 py-3 text-sm font-black text-[#05121b] whitespace-nowrap">{formatBRL(d.valor_total)}</td>
                            <td className="px-5 py-3 text-[10px] text-slate-500 whitespace-nowrap">{d.valor_parcela?formatBRL(d.valor_parcela):'—'}</td>
                            <td className="px-5 py-3">
                              {d.parcelas_total>0?(
                                <div>
                                  <div className="flex justify-between text-[9px] text-slate-400 mb-1"><span>{d.parcelas_pagas}/{d.parcelas_total}x</span><span>{prog}%</span></div>
                                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full transition-all" style={{width:`${prog}%`}}></div></div>
                                </div>
                              ):(<span className="text-[10px] text-slate-300">—</span>)}
                            </td>
                            <td className="px-5 py-3 text-[10px] text-slate-400 whitespace-nowrap">{fmtDate(d.proximo_vencimento)}</td>
                            <td className="px-5 py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${S.bg} ${S.border} ${S.txt}`}>{S.lbl}</span></td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <button onClick={()=>setModalDivida({...d})} className="text-slate-300 hover:text-[#137789] transition-colors"><Pencil size={13}/></button>
                                <button onClick={()=>deleteItem('dividas',d.id,()=>fetchFinanceiro(user.id))} className="text-slate-200 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                              </div>
                            </td>
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
            ── BANCOS ────────────────────────────────────────────────── */}
        {view==='bancos'&&(()=>{
          const tipos=['Conta Corrente','Conta Poupança','Conta Digital','Caixa Físico','Outros'];
          const CORES=['#137789','#ff7b00','#22c55e','#8b5cf6','#f59e0b','#ef4444','#0ea5e9','#ec4899'];
          const saldoTotal=bancos.reduce((a,b)=>a+saldoBanco(b.id),0);
          return(
            <div className="max-w-4xl mx-auto fade-in">
              <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gestão</p><h1 className="text-2xl font-black text-[#05121b] italic">Bancos e Contas</h1></div>
                <button onClick={()=>setModalBanco({nome:'',tipo:'Conta Corrente',saldo_inicial:'',color:'#137789'})} className="bg-[#05121b] text-white px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-md"><Plus size={13}/>Adicionar Banco</button>
              </header>
              {/* Saldo total */}
              <div className="bg-[#05121b] rounded-2xl p-6 mb-6 flex items-center justify-between">
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Total</p><p className="text-3xl font-black text-white">{formatBRL(saldoTotal)}</p></div>
                <Landmark size={32} className="text-white/20"/>
              </div>
              {/* Bank cards */}
              {bancos.length===0?<div className="bg-white border border-slate-100 rounded-2xl py-16 text-center shadow-sm"><Landmark size={28} className="text-slate-200 mx-auto mb-3"/><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Nenhum banco cadastrado</p></div>:(
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {bancos.map(b=>{
                    const saldo=saldoBanco(b.id);
                    const ent=lancamentos.filter(l=>l.banco_id===b.id&&l.tipo==='receita').reduce((a,l)=>a+Number(l.valor),0);
                    const sai=lancamentos.filter(l=>l.banco_id===b.id&&l.tipo==='despesa').reduce((a,l)=>a+Number(l.valor),0);
                    return(
                      <div key={b.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md" style={{background:b.cor||'#137789'}}>{b.nome.charAt(0).toUpperCase()}</div>
                            <div><p className="font-black text-sm text-[#05121b]">{b.nome}</p><p className="text-[10px] text-slate-400">{b.tipo}</p></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={()=>setModalBanco({...b})} className="text-slate-300 hover:text-[#137789] transition-colors"><Pencil size={14}/></button>
                            <button onClick={()=>deleteItem('bancos',b.id,()=>fetchFinanceiro(user.id))} className="text-slate-200 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                          </div>
                        </div>
                        <p className={`text-2xl font-black mb-4 ${saldo>=0?'text-[#05121b]':'text-red-600'}`}>{formatBRL(saldo)}</p>
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-50">
                          <div><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Entradas</p><p className="text-sm font-black text-emerald-600">+{formatBRL(ent)}</p></div>
                          <div><p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Saídas</p><p className="text-sm font-black text-red-500">-{formatBRL(sai)}</p></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ══════════════════════════════════════════════════════════════
            ── RELATÓRIOS (download) ─────────────────────────────────── */}
        {view==='relatorios'&&(
          <div className="max-w-4xl mx-auto fade-in">
            <header className="mb-8"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Documentos</p><h1 className="text-2xl font-black text-[#05121b] italic">Relatórios</h1></header>
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
                <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Categoria</label><select value={modalReceita.categoria} onChange={e=>setModalReceita({...modalReceita,categoria:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-emerald-500"><option value="">Selecione...</option>{['Venda de Produto','Venda de Serviço','Mensalidade','Comissão','Juros','Outros'].map(c=><option key={c}>{c}</option>)}</select></div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Banco (opcional)</label><select value={modalReceita.banco_id} onChange={e=>setModalReceita({...modalReceita,banco_id:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-emerald-500"><option value="">— Nenhum —</option>{bancos.map(b=><option key={b.id} value={b.id}>{b.nome}</option>)}</select></div>
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
              <div className="space-y-4">
                <InputField label="Descrição" value={modalDespesa.descricao} onChange={v=>setModalDespesa({...modalDespesa,descricao:v})}/>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Valor" value={modalDespesa.valor} onChange={v=>setModalDespesa({...modalDespesa,valor:v})} maskType="currency"/>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Data</label><input type="date" value={modalDespesa.data} onChange={e=>setModalDespesa({...modalDespesa,data:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"/></div>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Categoria</label><select value={modalDespesa.categoria} onChange={e=>setModalDespesa({...modalDespesa,categoria:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-red-500"><option value="">Selecione...</option>{['Cartão de Crédito','Boleto Bancário','Fornecedor','Folha de Pagamento','Aluguel','Marketing','Serviços/Software','Estorno','Impostos','Outros'].map(c=><option key={c}>{c}</option>)}</select></div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Banco (opcional)</label><select value={modalDespesa.banco_id} onChange={e=>setModalDespesa({...modalDespesa,banco_id:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-red-500"><option value="">— Nenhum —</option>{bancos.map(b=><option key={b.id} value={b.id}>{b.nome}</option>)}</select></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setModalDespesa(null)} className="flex-1 py-3.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50 border border-slate-200 transition-colors">Cancelar</button>
                <button disabled={savingItem||!modalDespesa.descricao||!modalDespesa.valor} onClick={()=>saveItem('lancamentos',{...modalDespesa,valor:parseFloat((modalDespesa.valor||'').replace(/[^\d,]/g,'').replace(',','.'))||0,tipo:'despesa',user_id:user.id},setModalDespesa,()=>fetchFinanceiro(user.id))} className="flex-1 py-3.5 rounded-xl font-black text-xs bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{savingItem?<Loader2 size={13} className="animate-spin"/>:null}Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Conta a Pagar */}
        {modalCP&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={()=>setModalCP(null)}>
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-black text-[#05121b]">{modalCP.id?'Editar':'Nova'} Conta a Pagar</h3><button onClick={()=>setModalCP(null)} className="text-slate-300 hover:text-red-400 transition-colors"><X size={20}/></button></div>
              <div className="space-y-4">
                <InputField label="Descrição" value={modalCP.descricao} onChange={v=>setModalCP({...modalCP,descricao:v})}/>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Valor" value={modalCP.valor} onChange={v=>setModalCP({...modalCP,valor:v})} maskType="currency"/>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Vencimento</label><input type="date" value={modalCP.vencimento} onChange={e=>setModalCP({...modalCP,vencimento:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00] focus:border-[#ff7b00]"/></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Categoria</label><select value={modalCP.categoria} onChange={e=>setModalCP({...modalCP,categoria:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"><option value="">Selecione...</option>{['Cartão de Crédito','Boleto Bancário','Fornecedor','Aluguel','Folha de Pagamento','Imposto / DAS','Serviço / Assinatura','Empréstimo / Parcela','Outros'].map(c=><option key={c}>{c}</option>)}</select></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Status</label><select value={modalCP.status} onChange={e=>setModalCP({...modalCP,status:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"><option value="pendente">Pendente</option><option value="pago">Pago</option><option value="atrasado">Atrasado</option></select></div>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Banco (opcional)</label><select value={modalCP.banco_id} onChange={e=>setModalCP({...modalCP,banco_id:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"><option value="">— Nenhum —</option>{bancos.map(b=><option key={b.id} value={b.id}>{b.nome}</option>)}</select></div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Observação (opcional)</label><textarea value={modalCP.observacao||''} onChange={e=>setModalCP({...modalCP,observacao:e.target.value})} placeholder="Ex: Parcela 3/12, fornecedor X..." className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00] resize-none h-20"/></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setModalCP(null)} className="flex-1 py-3.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50 border border-slate-200 transition-colors">Cancelar</button>
                <button disabled={savingItem||!modalCP.descricao||!modalCP.valor||!modalCP.vencimento} onClick={()=>saveItem('contas_pagar',{...modalCP,valor:parseFloat((modalCP.valor||'').toString().replace(/[^\d,]/g,'').replace(',','.'))||0,user_id:user.id},setModalCP,()=>fetchFinanceiro(user.id))} className="flex-1 py-3.5 rounded-xl font-black text-xs bg-[#05121b] text-white hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{savingItem?<Loader2 size={13} className="animate-spin"/>:null}Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Conta a Receber */}
        {modalCR&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={()=>setModalCR(null)}>
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-black text-[#05121b]">{modalCR.id?'Editar':'Nova'} Conta a Receber</h3><button onClick={()=>setModalCR(null)} className="text-slate-300 hover:text-red-400 transition-colors"><X size={20}/></button></div>
              <div className="space-y-4">
                <InputField label="Cliente" value={modalCR.cliente} onChange={v=>setModalCR({...modalCR,cliente:v})}/>
                <InputField label="Descrição" value={modalCR.descricao} onChange={v=>setModalCR({...modalCR,descricao:v})}/>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Valor" value={modalCR.valor} onChange={v=>setModalCR({...modalCR,valor:v})} maskType="currency"/>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Vencimento</label><input type="date" value={modalCR.vencimento} onChange={e=>setModalCR({...modalCR,vencimento:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#137789] focus:border-[#137789]"/></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Status</label><select value={modalCR.status} onChange={e=>setModalCR({...modalCR,status:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#137789]"><option value="pendente">Pendente</option><option value="recebido">Recebido</option></select></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Banco (opcional)</label><select value={modalCR.banco_id} onChange={e=>setModalCR({...modalCR,banco_id:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#137789]"><option value="">— Nenhum —</option>{bancos.map(b=><option key={b.id} value={b.id}>{b.nome}</option>)}</select></div>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Observação (opcional)</label><textarea value={modalCR.observacao||''} onChange={e=>setModalCR({...modalCR,observacao:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#137789] resize-none h-16"/></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setModalCR(null)} className="flex-1 py-3.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50 border border-slate-200 transition-colors">Cancelar</button>
                <button disabled={savingItem||!modalCR.cliente||!modalCR.descricao||!modalCR.valor||!modalCR.vencimento} onClick={()=>saveItem('contas_receber',{...modalCR,valor:parseFloat((modalCR.valor||'').toString().replace(/[^\d,]/g,'').replace(',','.'))||0,user_id:user.id},setModalCR,()=>fetchFinanceiro(user.id))} className="flex-1 py-3.5 rounded-xl font-black text-xs bg-[#137789] text-white hover:bg-[#0e5f6b] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{savingItem?<Loader2 size={13} className="animate-spin"/>:null}Salvar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Dívida */}
        {modalDivida&&(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={()=>setModalDivida(null)}>
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8" onClick={e=>e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-black text-[#05121b]">{modalDivida.id?'Editar':'Nova'} Dívida</h3><button onClick={()=>setModalDivida(null)} className="text-slate-300 hover:text-red-400 transition-colors"><X size={20}/></button></div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Credor" value={modalDivida.credor} onChange={v=>setModalDivida({...modalDivida,credor:v})}/>
                  <InputField label="Valor Total" value={modalDivida.valor_total} onChange={v=>setModalDivida({...modalDivida,valor_total:v})} maskType="currency"/>
                </div>
                <InputField label="Descrição (opcional)" value={modalDivida.descricao||''} onChange={v=>setModalDivida({...modalDivida,descricao:v})}/>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Valor da Parcela" value={modalDivida.valor_parcela||''} onChange={v=>setModalDivida({...modalDivida,valor_parcela:v})} maskType="currency"/>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Total parcelas</label><input type="number" value={modalDivida.parcelas_total||''} onChange={e=>setModalDivida({...modalDivida,parcelas_total:e.target.value})} className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"/></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Pagas</label><input type="number" value={modalDivida.parcelas_pagas||0} onChange={e=>setModalDivida({...modalDivida,parcelas_pagas:e.target.value})} className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"/></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Próx. Vencimento</label><input type="date" value={modalDivida.proximo_vencimento||''} onChange={e=>setModalDivida({...modalDivida,proximo_vencimento:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"/></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50">Status</label><select value={modalDivida.status} onChange={e=>setModalDivida({...modalDivida,status:e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] text-xs outline-none focus:ring-1 focus:ring-[#ff7b00]"><option value="ativa">Ativa</option><option value="quitada">Quitada</option><option value="em_negociacao">Em Negociação</option></select></div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setModalDivida(null)} className="flex-1 py-3.5 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50 border border-slate-200 transition-colors">Cancelar</button>
                <button disabled={savingItem||!modalDivida.credor||!modalDivida.valor_total} onClick={()=>saveItem('dividas',{...modalDivida,valor_total:parseFloat((modalDivida.valor_total||'').toString().replace(/[^\d,]/g,'').replace(',','.'))||0,valor_parcela:modalDivida.valor_parcela?parseFloat((modalDivida.valor_parcela||'').toString().replace(/[^\d,]/g,'').replace(',','.'))||0:null,parcelas_total:modalDivida.parcelas_total?parseInt(modalDivida.parcelas_total):null,parcelas_pagas:parseInt(modalDivida.parcelas_pagas)||0,user_id:user.id},setModalDivida,()=>fetchFinanceiro(user.id))} className="flex-1 py-3.5 rounded-xl font-black text-xs bg-[#05121b] text-white hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">{savingItem?<Loader2 size={13} className="animate-spin"/>:null}Salvar</button>
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

        {/* ── PERFIL ────────────────────────────────────────────────────── */}
        {view==='profile'&&(
          <div className="max-w-3xl mx-auto fade-in">
            <header className="mb-8"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Configurações</p><h1 className="text-2xl font-black text-[#05121b] italic">Meu Perfil</h1></header>
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
          <div className="max-w-4xl mx-auto fade-in">
            {!formMode?(
              <div className="space-y-10 py-6">
                <header className="text-center"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nova Análise</p><h2 className="text-2xl font-black text-[#05121b] italic mb-2">Como você quer trazer seus dados?</h2><p className="text-slate-400 text-sm">Escolha o método que melhor se adapta à sua realidade</p></header>
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
                    <button onClick={()=>{const last=diagnostics.find(d=>d.internal_status==='completed');if(last?.admin_result_pdf)window.open(last.admin_result_pdf,'_blank');else alert("PDF ainda não disponível para este diagnóstico.");}} className="shrink-0 bg-[#ff7b00] hover:bg-[#e66e00] text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg transition-all hover:scale-[1.02]"><Printer size={13}/> Baixar PDF</button>
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
            <h1 className="text-2xl font-black text-[#05121b] italic mb-3">Diagnóstico Recebido!</h1>
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
              <button onClick={()=>setView('analises')} className="flex-1 flex items-center justify-center gap-2 bg-[#05121b] hover:bg-slate-800 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors"><FolderOpen size={13}/> Minhas Análises</button>
            </div>
          </div>
        )}

        {/* ── VER DADOS ─────────────────────────────────────────────────── */}
        {view==='view_data'&&selectedSubmission&&(
          <div className="max-w-5xl mx-auto fade-in">
            <div className="mb-6 flex items-center justify-between"><button onClick={()=>setView('relatorios')} className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-[#05121b] transition-colors"><ArrowLeft size={13}/> Voltar</button><div className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200 flex items-center gap-1.5"><FileSearch size={11}/> Dados Enviados</div></div>
            <div className="bg-white p-7 md:p-10 rounded-3xl border border-slate-100 shadow-xl mb-12 pointer-events-none opacity-90">
              <header className="mb-8 border-b border-slate-50 pb-6"><h2 className="text-xl font-black text-[#05121b] italic uppercase mb-1">{selectedSubmission.client_name}</h2><p className="text-[#137789] font-bold uppercase text-[10px] tracking-widest">{selectedSubmission.form_type} · {new Date(selectedSubmission.submittedAt).toLocaleDateString('pt-BR')}</p></header>
              {isV1?[0,1,2,3,4].map(s=><FormStepV1 key={s} step={s} formData={formData} setFormData={setFormData} fieldErrors={{}} readOnly={true}/>):[0,1,2,3,4].map(s=><FormStepG key={s} step={s} formData={formData} setFormData={setFormData} fieldErrors={{}} readOnly={true}/>)}
            </div>
          </div>
        )}

        {/* ── RESULTADO ─────────────────────────────────────────────────── */}
        {view==='result'&&selectedSubmission&&(
          <div className="max-w-5xl mx-auto fade-in">
            <button onClick={()=>setView('analises')} className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-[#05121b] transition-colors mb-6"><ArrowLeft size={13}/> Voltar para Análises</button>
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

      </main>
    </div>
  );
};

const rootEl = document.getElementById('root');
const root = createRoot(rootEl);
root.render(<App />);