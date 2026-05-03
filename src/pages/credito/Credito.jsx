import React, { useState, useEffect } from 'react'
import {
  User, LogOut, Loader2, CheckCircle, Clock, XCircle,
  AlertTriangle, ArrowRight, ExternalLink, Shield,
  ChevronRight, ChevronLeft, FileCheck, Search, Rocket, Mail,
  Send, Sun, Moon, TrendingUp, Zap, Camera, Menu
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const maskCNPJ = (v) => { if (!v) return ''; return v.replace(/\D/g,'').replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2').replace(/(-\d{2})\d+?$/,'$1') }
const maskPhone = (v) => { if (!v) return ''; return v.replace(/\D/g,'').replace(/^(\d{2})(\d)/g,'($1) $2').replace(/(\d)(\d{4})$/,'$1-$2').substring(0,15) }

const PARCEIRO_URL = 'https://parceiro.flipdigital.com.br/in/oluap'

const CNPJ_STATUS_MAP = {
  aguardando: { label: 'Aguardando Solicitação', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400', desc: 'Clique em "Solicitar Análise" para enviar seus dados ao nosso parceiro financeiro.' },
  em_analise: { label: 'Em Análise', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', desc: 'Nosso time está analisando seu CNPJ. Isso pode levar até 24 horas úteis.' },
  aprovado:   { label: 'Aprovado', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', desc: 'Parabéns! Seu CNPJ foi aprovado. Você pode simular uma operação de até R$ 50.000 agora mesmo.' },
  reprovado:  { label: 'Não Aprovado', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', desc: 'Infelizmente seu CNPJ não foi aprovado nesta análise. Entre em contato com nossa equipe.' },
}

const MENU_ITEMS = [
  { id: 'analises', label: 'Análise',  Icon: Search },
  { id: 'operacao', label: 'Operação', Icon: Rocket },
  { id: 'perfil',   label: 'Perfil',   Icon: User },
]

const Credito = () => {
  const [loading, setLoading]               = useState(true)
  const [user, setUser]                     = useState(null)
  const [profile, setProfile]               = useState(null)
  const [activeMenu, setActiveMenu]         = useState('analises')
  const [sidebarOpen, setSidebarOpen]       = useState(true)
  const [mobileOpen, setMobileOpen]         = useState(false)
  const [profileData, setProfileData]       = useState({ full_name: '', email: '', phone: '', cnpj: '', razao_social: '' })
  const [savingProfile, setSavingProfile]   = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [sendingAnalise, setSendingAnalise] = useState(false)
  const [analiseEnviada, setAnaliseEnviada] = useState(false)
  const [isDark, setIsDark]                 = useState(() => { try { return localStorage.getItem('oluap_credito_theme') === 'dark' } catch { return false } })
  const [profileDropdown, setProfileDropdown] = useState(false)
  const [avatarUrl, setAvatarUrl]             = useState('')

  useEffect(() => {
    try { localStorage.setItem('oluap_credito_theme', isDark ? 'dark' : 'light') } catch {}
    document.body.className = `min-h-screen ${isDark ? 'bg-[#0d1117]' : 'bg-[#f5f5f0]'}`
  }, [isDark])

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = 'login.html'; return }

    setUser(session.user)
    const meta = session.user.user_metadata || {}
    setProfileData({ full_name: meta.full_name || '', email: session.user.email || '', phone: meta.phone || '', cnpj: meta.cnpj || '', razao_social: meta.razao_social || '' })
    setAvatarUrl(meta.avatar_url || '')

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setProfile(prof || {})
    setLoading(false)
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setProfileSuccess('')
    const { error } = await supabase.auth.updateUser({ data: { full_name: profileData.full_name, phone: profileData.phone, cnpj: profileData.cnpj, razao_social: profileData.razao_social } })
    setSavingProfile(false)
    if (!error) { setProfileSuccess('Dados salvos com sucesso!'); setTimeout(() => setProfileSuccess(''), 3000) }
  }

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = async () => {
        const canvas = document.createElement('canvas')
        const size = 160
        canvas.width = size; canvas.height = size
        const ctx = canvas.getContext('2d')
        const min = Math.min(img.width, img.height)
        const sx = (img.width - min) / 2; const sy = (img.height - min) / 2
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setAvatarUrl(dataUrl)
        await supabase.auth.updateUser({ data: { avatar_url: dataUrl } })
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const solicitarAnalise = async () => {
    setSendingAnalise(true)
    try {
      await supabase.from('profiles').update({ credito_cnpj_status: 'em_analise' }).eq('id', user.id)
      setProfile(prev => ({ ...prev, credito_cnpj_status: 'em_analise' }))
      setAnaliseEnviada(true)
      setTimeout(() => setAnaliseEnviada(false), 8000)
    } catch {}
    setSendingAnalise(false)
  }

  const logout = async () => { await supabase.auth.signOut(); window.location.href = 'login.html' }
  const navTo = (id) => { setActiveMenu(id); setMobileOpen(false) }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f5f5f0]"><Loader2 className="animate-spin text-[#137789]" size={36} /></div>

  const firstName  = (profileData.full_name || 'Cliente').split(' ')[0]
  const cnpjStatus = profile?.credito_cnpj_status || 'aguardando'
  const opStatus   = profile?.credito_operacao_status || null
  const statusInfo = CNPJ_STATUS_MAP[cnpjStatus] || CNPJ_STATUS_MAP.aguardando
  const isCanceled = opStatus === 'cancelada'

  const timelineSteps = [
    { id: 'preenchimento', label: 'Preenchimento de Dados', desc: 'Dados enviados para análise junto ao nosso parceiro financeiro.' },
    { id: 'analise', label: cnpjStatus === 'reprovado' ? 'Não Aprovado' : 'Aprovado', desc: cnpjStatus === 'reprovado' ? 'Seu CNPJ não foi aprovado nesta análise. Em 90 dias realizamos uma nova avaliação.' : cnpjStatus === 'em_analise' ? 'Aguardando o resultado da análise. Isso pode levar até 24 horas úteis.' : 'CNPJ aprovado! Anexe suas notas fiscais e simule sua operação.' },
    { id: 'criada', label: 'Operação Criada', desc: 'Operação formalizada e em processamento.' },
    { id: 'paga', label: 'Operação Paga', desc: 'Valor creditado diretamente na sua conta bancária.' },
  ]

  const getStepState = (stepId) => {
    if (stepId === 'preenchimento') return cnpjStatus !== 'aguardando' ? 'done' : 'pending'
    if (stepId === 'analise') {
      if (cnpjStatus === 'em_analise') return 'current'
      if (cnpjStatus === 'aprovado')   return 'done'
      if (cnpjStatus === 'reprovado')  return 'reprovado'
      return 'pending'
    }
    if (cnpjStatus === 'reprovado') return 'hidden'
    if (stepId === 'criada') { if (opStatus === 'paga') return 'done'; if (opStatus === 'criada') return 'current'; return 'pending' }
    if (stepId === 'paga') return opStatus === 'paga' ? 'done' : 'pending'
    return 'pending'
  }

  return (
    <div className={`min-h-screen bg-[#f5f5f0] flex text-[#05121b] overflow-x-hidden${isDark ? ' dk' : ''}`}>
      {mobileOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`bg-white h-screen border-r border-slate-100 py-5 flex flex-col fixed left-0 top-0 z-40 shadow-sm transition-all duration-300 ${sidebarOpen ? 'w-56 px-4' : 'w-16 px-2'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex absolute -right-3 top-8 bg-white border border-slate-200 p-1.5 rounded-full shadow-sm text-slate-400 hover:text-[#ff7b00] z-50 items-center justify-center transition-all hover:scale-110">
          <ChevronLeft size={13} style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }} />
        </button>
        <div className={`flex items-center ${sidebarOpen ? 'justify-start px-1' : 'justify-center'} mb-6 mt-1`}>
          {sidebarOpen ? <img src="/logo2.png" alt="OLUAP" className="h-7 object-contain" onError={e => { e.target.style.display='none' }} /> : <img src="/icone.png" alt="OLUAP" className="w-7 h-7 object-contain" onError={e => { e.target.style.display='none' }} />}
        </div>
        {sidebarOpen && <div className="px-1 mb-4"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#137789] animate-pulse"></div><span className="text-[9px] font-black text-[#137789] uppercase tracking-widest">Crédito Inteligente</span></div></div>}
        <nav className="flex-1 space-y-1 mt-1">
          {MENU_ITEMS.map(({ id, label, Icon }) => {
            const active = activeMenu === id
            return (
              <button key={id} onClick={() => navTo(id)} title={!sidebarOpen ? label : ''}
                className={`w-full flex items-center ${sidebarOpen ? 'justify-start gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl font-bold text-[11px] transition-all ${active ? 'bg-[#05121b] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-[#05121b]'}`}>
                <Icon size={sidebarOpen ? 15 : 20} className="shrink-0" />
                {sidebarOpen && <span className="truncate">{label}</span>}
              </button>
            )
          })}
        </nav>
        <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-slate-100">
          <button onClick={() => window.location.href = 'hub_cliente.html'} title={!sidebarOpen ? 'Hub' : ''} className={`w-full flex items-center ${sidebarOpen ? 'justify-start gap-3 px-3' : 'justify-center px-0'} py-2.5 text-slate-400 font-bold text-[11px] hover:text-[#137789] hover:bg-slate-50 rounded-xl transition-colors`}>
            <ArrowRight size={sidebarOpen ? 15 : 20} className="shrink-0 rotate-180" />{sidebarOpen && <span>Voltar ao Hub</span>}
          </button>
          <button onClick={logout} title={!sidebarOpen ? 'Sair' : ''} className={`w-full flex items-center ${sidebarOpen ? 'justify-start gap-3 px-3' : 'justify-center px-0'} py-2.5 text-slate-400 font-bold text-[11px] hover:text-red-500 hover:bg-slate-50 rounded-xl transition-colors`}>
            <LogOut size={sidebarOpen ? 15 : 20} className="shrink-0" />{sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-56' : 'lg:ml-16'} min-h-screen flex flex-col`}>
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-2.5 flex items-center justify-between shadow-sm">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-slate-50 transition-colors"><Menu size={20} className="text-[#05121b]" /></button>
          <span className="lg:hidden text-sm font-black text-[#05121b]">{MENU_ITEMS.find(m => m.id === activeMenu)?.label}</span>
          <div className="hidden lg:block flex-1" />
          <div className="relative">
            <button onClick={() => setProfileDropdown(v => !v)} className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-full pl-1 pr-3 py-1 shadow-sm hover:shadow-md transition-all">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#137789]/10 border border-[#137789]/20 flex items-center justify-center shrink-0">
                {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="avatar" /> : <span className="text-xs font-black text-[#137789]">{firstName[0]}</span>}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-black text-[#05121b] leading-tight">{firstName}</p>
                <p className="text-[10px] text-slate-400 leading-none">{profileData.email}</p>
              </div>
            </button>
            {profileDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileDropdown(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <button onClick={() => { navTo('perfil'); setProfileDropdown(false) }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-xs font-bold text-[#05121b] transition-colors"><User size={14} /> Meu Perfil</button>
                  <div className="border-t border-slate-100" />
                  <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-xs font-bold text-red-500 transition-colors"><LogOut size={14} /> Sair</button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8">
          {/* ANÁLISE */}
          {activeMenu === 'analises' && (
            <div className="max-w-2xl mx-auto fade-in">
              <header className="mb-8">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Crédito Inteligente</p>
                <h1 className="text-2xl font-black text-[#05121b] italic">Análise do CNPJ</h1>
              </header>
              {analiseEnviada && (
                <div className="slide-down mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0"><CheckCircle size={16} className="text-white" /></div>
                  <div><p className="font-black text-emerald-800 text-sm">Análise enviada com sucesso!</p><p className="text-[11px] text-emerald-600 mt-0.5">Nossa equipe vai retornar em alguns minutos com o resultado.</p></div>
                </div>
              )}
              <div className={`${statusInfo.bg} border ${statusInfo.border} rounded-2xl p-7 mb-6 shadow-sm`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${statusInfo.bg} border ${statusInfo.border}`}>
                    {cnpjStatus === 'aguardando' && <Clock size={22} className={statusInfo.color} />}
                    {cnpjStatus === 'em_analise' && <Search size={22} className={`${statusInfo.color} animate-pulse`} />}
                    {cnpjStatus === 'aprovado'   && <CheckCircle size={22} className={statusInfo.color} />}
                    {cnpjStatus === 'reprovado'  && <XCircle size={22} className={statusInfo.color} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${statusInfo.dot} ${cnpjStatus === 'em_analise' ? 'animate-pulse' : ''}`}></div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{statusInfo.desc}</p>
                    {profileData.cnpj && <p className="text-[11px] text-slate-400 mt-2">CNPJ: <span className="text-[#05121b] font-bold">{profileData.cnpj}</span></p>}
                  </div>
                </div>
                {cnpjStatus === 'aguardando' && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <button onClick={solicitarAnalise} disabled={sendingAnalise} className="inline-flex items-center gap-2.5 bg-[#05121b] hover:bg-[#137789] text-white px-7 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-md disabled:opacity-60">
                      {sendingAnalise ? <><Loader2 size={14} className="animate-spin" /> Enviando...</> : <><Send size={14} /> Solicitar Análise</>}
                    </button>
                  </div>
                )}
                {cnpjStatus === 'aprovado' && (
                  <div className="mt-6 pt-6 border-t border-emerald-200">
                    {opStatus === 'paga' ? (
                      <div className="bg-white border border-emerald-100 rounded-xl p-5 flex items-start gap-3">
                        <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0"><CheckCircle size={15} className="text-white" /></div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-emerald-700 mb-1">Primeira operação concluída!</p>
                          <p className="text-[11px] text-slate-500 leading-relaxed mb-3">Para novas operações, acesse a plataforma do nosso parceiro.</p>
                          <a href={PARCEIRO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-md"><ExternalLink size={13} /> Acessar Plataforma do Parceiro</a>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white border border-emerald-100 rounded-xl p-4 mb-5 flex items-start gap-3"><Zap size={14} className="text-[#ff7b00] shrink-0 mt-0.5" /><p className="text-[11px] text-slate-600 leading-relaxed">Seu CNPJ está aprovado! Simule uma operação de antecipação de recebíveis <strong className="text-[#05121b]">sem cadastro</strong>, até <strong className="text-[#05121b]">R$ 50.000</strong>.</p></div>
                        <a href={PARCEIRO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-lg shadow-emerald-600/20"><TrendingUp size={14} /> Simular Operação até R$ 50k <ExternalLink size={13} /></a>
                      </>
                    )}
                  </div>
                )}
                {cnpjStatus === 'reprovado' && (
                  <div className="mt-6 pt-6 border-t border-red-200">
                    <p className="text-xs text-slate-500 mb-3">Fale com nossa equipe para entender os próximos passos:</p>
                    <a href="mailto:contato@oluap.com.br" className="inline-flex items-center gap-2 text-sm font-black text-red-600 hover:text-red-700 transition-colors"><Mail size={14} /> contato@oluap.com.br</a>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[{ Icon: FileCheck, title: 'Nota Fiscal', desc: 'Tenha a nota fiscal de produto ou serviço com valor a receber.' }, { Icon: Clock, title: 'Prazo', desc: 'Análise feita em até 24 horas pelo nosso time.' }, { Icon: Shield, title: 'Segurança', desc: 'Dados compartilhados apenas com parceiro autorizado.' }].map(({ Icon, title, desc }) => (
                  <div key={title} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm"><Icon size={17} className="text-[#137789] mb-3" /><p className="text-xs font-black text-[#05121b] mb-1">{title}</p><p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p></div>
                ))}
              </div>
            </div>
          )}

          {/* OPERAÇÃO */}
          {activeMenu === 'operacao' && (
            <div className="max-w-2xl mx-auto fade-in">
              <header className="mb-8"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Crédito Inteligente</p><h1 className="text-2xl font-black text-[#05121b] italic">Acompanhar Operação</h1></header>
              {cnpjStatus === 'aguardando' ? (
                <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center shadow-sm">
                  <Rocket size={36} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-base font-black text-slate-500 mb-2">Nenhuma operação iniciada</p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">Após a aprovação do CNPJ e o envio das notas fiscais, sua operação aparecerá aqui.</p>
                  <button onClick={() => setActiveMenu('analises')} className="mt-6 inline-flex items-center gap-2 text-xs font-black text-[#137789] hover:text-[#05121b] transition-colors">Verificar análise do CNPJ <ChevronRight size={13} /></button>
                </div>
              ) : isCanceled ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-7 flex items-start gap-4 shadow-sm">
                  <XCircle size={22} className="text-red-500 shrink-0 mt-0.5" />
                  <div><p className="text-sm font-black text-red-700 mb-1">Operação Cancelada</p><p className="text-xs text-slate-500 leading-relaxed">Esta operação foi cancelada. Entre em contato para mais informações.</p><a href="mailto:contato@oluap.com.br" className="inline-flex items-center gap-2 mt-3 text-xs font-black text-red-600 hover:text-red-700 transition-colors"><Mail size={13} /> contato@oluap.com.br</a></div>
                </div>
              ) : (
                <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-8">Linha do tempo</p>
                  <div>
                    {(cnpjStatus === 'reprovado' ? timelineSteps.slice(0,2) : timelineSteps).map((step, idx, arr) => {
                      const state = getStepState(step.id); const last = idx === arr.length - 1
                      const done = state === 'done'; const current = state === 'current'; const isReprovado = state === 'reprovado'; const pending = state === 'pending'
                      const lineColor = done ? '#137789' : isReprovado ? '#fca5a5' : '#e2e8f0'
                      return (
                        <div key={step.id} className="flex items-start gap-5">
                          <div className="flex flex-col items-center">
                            <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${done ? 'bg-[#137789] border-[#137789]' : current ? 'bg-white border-[#137789]' : isReprovado ? 'bg-red-500 border-red-500' : 'bg-white border-slate-200'}`}>
                              {done && <CheckCircle size={17} className="text-white" />}
                              {current && <div className="w-3 h-3 rounded-full bg-[#137789] animate-pulse" />}
                              {isReprovado && <XCircle size={17} className="text-white" />}
                              {pending && <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />}
                            </div>
                            {!last && <div className="w-0.5 h-12 mt-1" style={{ backgroundColor: lineColor }} />}
                          </div>
                          <div className={`flex-1 ${last ? 'pb-0' : 'pb-2'}`}>
                            <p className={`text-sm font-black mb-0.5 flex items-center gap-2 ${done ? 'text-[#137789]' : current ? 'text-[#05121b]' : isReprovado ? 'text-red-600' : 'text-slate-300'}`}>
                              {step.label}
                              {current && <span className="text-[8px] bg-[#137789]/10 text-[#137789] border border-[#137789]/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Atual</span>}
                            </p>
                            <p className={`text-xs leading-relaxed ${isReprovado ? 'text-red-400' : pending ? 'text-slate-300' : 'text-slate-500'}`}>{step.desc}</p>
                            {step.id === 'analise' && done && !opStatus && (
                              <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                                <Zap size={13} className="text-[#ff7b00] shrink-0 mt-0.5" />
                                <p className="text-[11px] text-slate-600 leading-relaxed">Anexe suas notas fiscais e simule uma operação na plataforma do parceiro. <a href={PARCEIRO_URL} target="_blank" rel="noopener noreferrer" className="font-black text-[#137789] hover:underline inline-flex items-center gap-0.5">Acessar <ExternalLink size={10} /></a></p>
                              </div>
                            )}
                            {step.id === 'analise' && isReprovado && <p className="mt-1.5 text-[11px] text-red-400 font-bold">Nova análise disponível em 90 dias.</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {opStatus === 'paga' && (
                    <div className="mt-7 pt-6 border-t border-slate-100">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
                        <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0"><CheckCircle size={20} className="text-white" /></div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-emerald-700 mb-1">Operação Concluída!</p>
                          <p className="text-[11px] text-slate-600 leading-relaxed mb-4">O valor foi creditado na sua conta. Para realizar novas operações, acesse a plataforma do nosso parceiro.</p>
                          <a href={PARCEIRO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-md shadow-emerald-600/20"><ExternalLink size={13} /> Acessar Plataforma do Parceiro</a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PERFIL */}
          {activeMenu === 'perfil' && (
            <div className="max-w-2xl mx-auto fade-in">
              <header className="mb-8"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Configurações</p><h1 className="text-2xl font-black text-[#05121b] italic">Meu Perfil</h1></header>
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm mb-5 flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-[#137789]/10 border-2 border-[#137789]/20 flex items-center justify-center">
                    {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="avatar" /> : <span className="text-2xl font-black text-[#137789]">{firstName[0]}</span>}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#137789] hover:bg-[#05121b] rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors">
                    <Camera size={13} className="text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">Clique no ícone para alterar a foto</p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-7 shadow-sm mb-5">
                <form onSubmit={saveProfile} className="space-y-5">
                  <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Nome Completo</label><input type="text" value={profileData.full_name} onChange={e => setProfileData({...profileData, full_name: e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium text-[#05121b] outline-none focus:border-[#137789] focus:ring-1 focus:ring-[#137789]/20 transition-all" /></div>
                  <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">E-mail</label><input type="email" value={profileData.email} readOnly className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl text-sm text-slate-400 cursor-not-allowed outline-none" /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Celular / WhatsApp</label><input type="text" value={profileData.phone} maxLength={15} placeholder="(00) 00000-0000" onChange={e => setProfileData({...profileData, phone: maskPhone(e.target.value)})} className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium text-[#05121b] outline-none focus:border-[#137789] focus:ring-1 focus:ring-[#137789]/20 transition-all placeholder-slate-300" /></div>
                    <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">CNPJ</label><input type="text" value={profileData.cnpj} maxLength={18} placeholder="00.000.000/0000-00" onChange={e => setProfileData({...profileData, cnpj: maskCNPJ(e.target.value)})} className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium text-[#05121b] outline-none focus:border-[#137789] focus:ring-1 focus:ring-[#137789]/20 transition-all placeholder-slate-300" /></div>
                  </div>
                  <div><label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Razão Social</label><input type="text" value={profileData.razao_social} placeholder="Nome da empresa" onChange={e => setProfileData({...profileData, razao_social: e.target.value})} className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium text-[#05121b] outline-none focus:border-[#137789] focus:ring-1 focus:ring-[#137789]/20 transition-all placeholder-slate-300" /></div>
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600">{profileSuccess}</span>
                    <button type="submit" disabled={savingProfile} className="bg-[#137789] hover:bg-[#05121b] text-white px-7 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-60 shadow-sm">
                      {savingProfile ? <Loader2 size={13} className="animate-spin" /> : 'Salvar Dados'}
                    </button>
                  </div>
                </form>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-black text-[#05121b] text-sm uppercase tracking-wide mb-5 flex items-center gap-2">
                  <span className="text-base">{isDark ? '🌙' : '☀️'}</span> Aparência
                </h3>
                <div className="flex items-center justify-between gap-4">
                  <div><p className="font-bold text-[#05121b] text-sm">{isDark ? 'Modo Escuro' : 'Modo Claro'}</p><p className="text-[10px] text-slate-400 mt-0.5">Alterna entre tema claro e escuro.</p></div>
                  <button onClick={() => setIsDark(v => !v)} className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none ${isDark ? 'bg-[#137789]' : 'bg-slate-200'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-300 flex items-center justify-center text-[10px] ${isDark ? 'translate-x-7' : 'translate-x-0'}`}>{isDark ? '🌙' : '☀️'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Credito
