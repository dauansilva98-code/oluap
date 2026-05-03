import React, { useState, useEffect } from 'react'
import {
  Activity, Database, Briefcase, CreditCard, Lock, ArrowRight, LogOut,
  Loader2, ShieldCheck, Sparkles, CheckCircle, User
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const maskCNPJ = (v) => { if (!v) return ''; return v.replace(/\D/g,'').replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2').replace(/(-\d{2})\d+?$/,'$1') }
const maskPhone = (v) => { if (!v) return ''; return v.replace(/\D/g,'').replace(/^(\d{2})(\d)/g,'($1) $2').replace(/(\d)(\d{4})$/,'$1-$2').substring(0,15) }

const HubCliente = () => {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [userName, setUserName] = useState('')
  const [access, setAccess] = useState({ diagnostico: false, erp: false, consultoria: false, credito: false })
  const [modalInfo, setModalInfo] = useState(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profileData, setProfileData] = useState({ full_name: '', email: '', phone: '', cnpj: '', razao_social: '' })
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')

  useEffect(() => { checkAuthAndAccess() }, [])

  const checkAuthAndAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = 'login.html'; return }

    setUser(session.user)
    const meta = session.user.user_metadata || {}
    const fullName = meta.full_name || 'Cliente'
    setUserName(fullName.split(' ')[0])
    setProfileData({ full_name: meta.full_name || '', email: session.user.email || '', phone: meta.phone || '', cnpj: meta.cnpj || '', razao_social: meta.razao_social || '' })

    try {
      const { data: profile } = await supabase.from('profiles')
        .select('has_diagnostico, has_erp, has_consultoria, has_credito')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setAccess({ diagnostico: profile.has_diagnostico === true, erp: profile.has_erp === true, consultoria: profile.has_consultoria === true, credito: profile.has_credito === true })
      }
    } catch (err) {
      console.error('Erro ao buscar acesso:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    setProfileSuccess('')
    const { error } = await supabase.auth.updateUser({
      data: { full_name: profileData.full_name, phone: profileData.phone, cnpj: profileData.cnpj, razao_social: profileData.razao_social }
    })
    setIsUpdatingProfile(false)
    if (!error) {
      setProfileSuccess('Perfil salvo com sucesso!')
      setUserName((profileData.full_name || 'Cliente').split(' ')[0])
      setTimeout(() => setProfileSuccess(''), 3000)
    }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = 'login.html' }

  const handleContratar = async (prod) => {
    if (prod.isFree) {
      await supabase.from('profiles').update({ [`has_${prod.id}`]: true }).eq('id', user.id)
      setAccess(prev => ({ ...prev, [prod.id]: true }))
      window.location.href = prod.url
    } else {
      window.location.href = `produto-${prod.id}.html`
    }
  }

  const productsInfo = [
    { id: 'diagnostico', title: 'Diagnóstico Financeiro', desc: 'CFO Virtual: indicadores financeiros em tempo real, alertas proativos e simulação de cenários.', icon: Activity, color: 'text-[#ff7b00]', bgLight: 'bg-[#ff7b00]/10', bgBtn: 'bg-[#ff7b00] hover:bg-[#e66e00]', url: 'diagnostico.html', price: 'R$ 289,90/mês', benefits: ['Score de Saúde Financeira', 'Margem, Runway e Ponto de Equilíbrio', 'Simulador de Cenários + PDF'] },
    { id: 'credito', title: 'Crédito Inteligente', desc: 'Antecipação de recebíveis de cartão e duplicatas. Taxas a partir de 2%. Sem burocracia.', icon: CreditCard, color: 'text-emerald-500', bgLight: 'bg-emerald-500/10', bgBtn: 'bg-emerald-600 hover:bg-emerald-700', url: 'credito.html', landingUrl: 'produto-credito.html', isFree: true, price: 'Taxas a partir de 2% · Gratuito para você', benefits: ['Antecipação de Recebíveis', 'Primeira operação até R$ 50k', 'Aprovação em até 24h'] },
    { id: 'consultoria', title: 'Consultoria Empresarial', desc: 'Sócio estratégico nos seus processos, comercial, financeiro e estratégias. Só ganhamos quando você ganha.', icon: Briefcase, color: 'text-blue-500', bgLight: 'bg-blue-500/10', bgBtn: 'bg-blue-600 hover:bg-blue-700', url: 'produto-consultoria.html', isFree: true, price: 'Valor personalizado · Sem custo inicial', benefits: ['Estratégia e Processos', 'Comercial e Financeiro', 'Contrato após alinhamento'] },
    { id: 'erp', title: 'ERP Financeiro', desc: 'Sistema integrado para gestão de caixa, notas fiscais, contas a pagar e receber.', icon: Database, color: 'text-slate-400', bgLight: 'bg-slate-700/30', bgBtn: 'bg-slate-700 hover:bg-slate-600', url: 'produto-erp.html', price: 'Em breve', benefits: ['Fluxo de Caixa', 'Contas a Pagar/Receber', 'Relatórios Automáticos'], emDesenvolvimento: true },
  ]

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-[#ff7b00]" size={40} />
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-8 md:px-12 md:py-10 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => setProfileModalOpen(true)} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors cursor-pointer shadow-lg" title="Editar Meu Perfil">
            <User className="text-white" size={24} />
          </button>
          <div>
            <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-widest mb-0.5">Bem-vindo(a) de volta,</p>
            <h1 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">{userName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <img src="/logo2.png" alt="oluap" className="h-8 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
          <div className="hidden items-center"><ShieldCheck className="text-[#ff7b00]" size={24} /><span className="font-bold text-xl tracking-tighter ml-2">oluap</span></div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500 transition-colors" title="Sair da Conta"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">Seu Ecossistema <span className="text-[#137789] font-bold">oluap</span></h2>
          <p className="text-slate-400 font-medium text-sm md:text-base max-w-xl mx-auto">Selecione a plataforma que deseja acessar. Soluções inativas podem ser ativadas a qualquer momento para impulsionar seu negócio.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {productsInfo.map((prod) => {
            const isActive = access[prod.id]
            const isErp = prod.emDesenvolvimento
            const IconComp = prod.icon
            return (
              <div key={prod.id} className={`relative rounded-3xl p-6 flex flex-col transition-all duration-300 border h-full min-h-[280px] ${isErp ? 'bg-[#05121b]/40 border-dashed border-slate-700/50 opacity-50' : isActive ? 'bg-white/10 border-white/20 shadow-lg hover:-translate-y-1 hover:bg-white/15 cursor-pointer' : 'bg-[#05121b] border-slate-800/80 opacity-80 hover:opacity-100'}`}>
                <div className="absolute top-6 right-6">
                  {isErp ? <div className="bg-slate-800/80 text-slate-500 border border-slate-700/50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Em breve</div>
                    : isActive ? <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><CheckCircle size={10} /> Ativo</div>
                    : <div className="bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm"><Lock size={10} /> Contratar</div>}
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${isErp ? 'bg-slate-800/50' : isActive ? prod.bgLight : 'bg-slate-800'}`}>
                  <IconComp size={24} className={isErp ? 'text-slate-600' : isActive ? prod.color : 'text-slate-500'} />
                </div>
                <h3 className={`text-lg font-black tracking-tight mb-2 ${isErp ? 'text-slate-500' : isActive ? 'text-white' : 'text-slate-300'}`}>{prod.title}</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed flex-1 mb-8">{prod.desc}</p>
                {isErp ? (
                  <div className="w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center bg-slate-800/50 text-slate-600 cursor-default">Em Desenvolvimento</div>
                ) : isActive ? (
                  <button onClick={() => window.location.href = prod.url} className={`w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest text-white flex items-center justify-center gap-2 shadow-md ${prod.bgBtn}`}>
                    <span>Acessar Plataforma</span><ArrowRight size={14} />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setModalInfo(prod)} className="flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">Saber mais</button>
                    <button onClick={() => handleContratar(prod)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-white flex items-center justify-center gap-1 transition-colors ${prod.bgBtn}`}>
                      {prod.isFree ? 'Solicitar' : 'Contratar'} <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>

      {/* MODAL PERFIL */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05121b]/80 backdrop-blur-md px-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-6 md:p-8 text-[#05121b]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black text-[#05121b] tracking-tight">Meu Perfil</h3>
                <button onClick={() => setProfileModalOpen(false)} className="text-slate-400 hover:text-red-500 font-bold text-2xl transition-colors">&times;</button>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-6">Mantenha seus dados atualizados aqui.</p>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Nome Completo</label><input type="text" value={profileData.full_name} onChange={e => setProfileData({...profileData, full_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] outline-none focus:ring-1 focus:ring-[#137789] focus:border-[#137789] text-xs transition-all" /></div>
                <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">E-mail de Acesso</label><input type="email" value={profileData.email} readOnly className="w-full bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-slate-400 outline-none text-xs cursor-not-allowed" /></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Celular / WhatsApp</label><input type="text" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: maskPhone(e.target.value)})} maxLength={15} placeholder="(00) 00000-0000" className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] outline-none focus:ring-1 focus:ring-[#137789] focus:border-[#137789] text-xs transition-all" /></div>
                  <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">CNPJ</label><input type="text" value={profileData.cnpj} onChange={e => setProfileData({...profileData, cnpj: maskCNPJ(e.target.value)})} maxLength={18} placeholder="00.000.000/0000-00" className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] outline-none focus:ring-1 focus:ring-[#137789] focus:border-[#137789] text-xs transition-all" /></div>
                </div>
                <div><label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Razão Social</label><input type="text" value={profileData.razao_social} onChange={e => setProfileData({...profileData, razao_social: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl font-medium text-[#05121b] outline-none focus:ring-1 focus:ring-[#137789] focus:border-[#137789] text-xs transition-all" /></div>
                <div className="pt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600">{profileSuccess}</span>
                  <button type="submit" disabled={isUpdatingProfile} className="bg-[#137789] hover:bg-[#0f5c6b] text-white px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md hover:scale-[1.02]">
                    {isUpdatingProfile ? <Loader2 size={14} className="animate-spin" /> : 'Salvar Dados'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SABER MAIS */}
      {modalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#05121b]/80 backdrop-blur-md px-4" onClick={() => setModalInfo(null)}>
          <div className="bg-[#0b1f2d] border border-white/10 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${modalInfo.bgLight}`}><modalInfo.icon size={26} className={modalInfo.color} /></div>
                <button onClick={() => setModalInfo(null)} className="text-slate-500 hover:text-white transition-colors text-2xl font-bold leading-none">&times;</button>
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mb-2">{modalInfo.title}</h3>
              <p className="text-slate-400 font-medium text-sm leading-relaxed mb-6">{modalInfo.desc}</p>
              <div className="space-y-2 mb-6">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">O que está incluso:</p>
                {modalInfo.benefits.map((ben, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/8 p-3 rounded-xl">
                    <CheckCircle size={14} className={modalInfo.color} />
                    <span className="text-sm font-bold text-slate-300">{ben}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex justify-between items-center mb-6">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Condição</span>
                <span className={`text-sm font-black ${modalInfo.color}`}>{modalInfo.price}</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setModalInfo(null)} className="flex-1 py-3.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors">Fechar</button>
                <a href={modalInfo.landingUrl || modalInfo.url} className="flex-1 py-3.5 rounded-xl text-xs font-black text-white uppercase tracking-widest flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 transition-colors">
                  Ver página completa <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HubCliente
