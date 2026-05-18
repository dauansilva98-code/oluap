import React, { useState, useEffect } from 'react'
import { Check, ArrowLeft, Loader2, Zap, Star, Crown, ShieldCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'

// ── Links de pagamento — substitua pelos links do Stripe/gateway ──────────────
const PAYMENT_LINKS = {
  essencial:     '', // ex: 'https://buy.stripe.com/xxx'
  profissional:  '', // ex: 'https://buy.stripe.com/yyy'
  premium:       '', // ex: 'https://buy.stripe.com/zzz'
}

// WhatsApp de contato (fallback enquanto links de pagamento não estão configurados)
const WHATSAPP = '5511999999999' // substitua pelo número real

const planos = [
  {
    id: 'essencial',
    icon: Zap,
    nome: 'Essencial',
    subtitulo: 'Para MEI e pequenas empresas',
    preco: 99.90,
    destaque: false,
    cor: '#137789',
    corBg: 'rgba(19,119,137,0.12)',
    corBorder: 'rgba(19,119,137,0.35)',
    features: [
      'Fluxo de caixa',
      'Receitas e despesas',
      'Contas a pagar / receber',
      'Dashboard financeiro básico',
      'Relatórios simples',
      'Exportação Excel',
    ],
  },
  {
    id: 'profissional',
    icon: Star,
    nome: 'Profissional',
    subtitulo: 'Mais escolhido',
    preco: 199.90,
    destaque: true,
    cor: '#ff7b00',
    corBg: 'rgba(255,123,0,0.12)',
    corBorder: 'rgba(255,123,0,0.45)',
    features: [
      'Tudo do Essencial',
      'CFO Digital',
      'Indicadores financeiros avançados',
      'Score de saúde financeira',
      'Alertas inteligentes de risco',
      'Simulador de cenários',
      'Diagnóstico financeiro completo',
    ],
  },
  {
    id: 'premium',
    icon: Crown,
    nome: 'Premium / Growth',
    subtitulo: 'Para empresas estruturadas',
    preco: 599,
    destaque: false,
    cor: '#7F77DD',
    corBg: 'rgba(127,119,221,0.12)',
    corBorder: 'rgba(127,119,221,0.35)',
    features: [
      'Tudo do Profissional',
      'Multiusuários',
      'Multi contas bancárias',
      'DRE gerencial completo',
      'Metas financeiras',
      'Consultoria mensal opcional',
      'IA financeira avançada',
      'Relatórios executivos PDF',
    ],
  },
]

const PlanosDiagnostico = () => {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [planoSelecionado, setPlanoSelecionado] = useState(null)
  const [processando, setProcessando] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = 'login.html'; return }
      setUser(session.user)
      setLoading(false)
    })
  }, [])

  const handleAssinar = async (plano) => {
    if (!user) return
    setPlanoSelecionado(plano.id)
    setProcessando(true)

    const payLink = PAYMENT_LINKS[plano.id]

    if (payLink) {
      // Redireciona para o link de pagamento com o user_id como parâmetro
      window.location.href = `${payLink}?client_reference_id=${user.id}&prefilled_email=${encodeURIComponent(user.email)}`
    } else {
      // Fallback: WhatsApp com mensagem pré-preenchida
      const msg = encodeURIComponent(
        `Olá! Tenho interesse no Diagnóstico Financeiro OLUAP — Plano ${plano.nome} (R$ ${plano.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês). Meu e-mail de cadastro é: ${user.email}`
      )
      window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank')
      setProcessando(false)
      setPlanoSelecionado(null)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-[#ff7b00]" size={40} />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-6 py-6 max-w-6xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={() => window.location.href = 'hub_cliente.html'}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} /> Voltar ao Hub
        </button>
        <div className="flex items-center gap-2">
          <img src="/logo2.png" alt="OLUAP" className="h-7 object-contain"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
          <div className="hidden items-center gap-2">
            <ShieldCheck className="text-[#ff7b00]" size={18} />
            <span className="font-bold text-base tracking-tight">oluap</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center px-6 pt-8 pb-12 max-w-3xl mx-auto w-full">
        <span className="inline-block bg-[#ff7b00]/15 text-[#ff7b00] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-[#ff7b00]/30 mb-5">
          Diagnóstico Financeiro
        </span>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4 leading-tight">
          Escolha o plano ideal<br />para o seu negócio
        </h1>
        <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-xl mx-auto">
          CFO Digital, indicadores em tempo real e alertas proativos. Escolha o plano que melhor se encaixa no momento da sua empresa.
        </p>
      </section>

      {/* Cards */}
      <section className="flex-1 px-4 pb-16 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {planos.map((plano) => {
            const IconComp = plano.icon
            const isProcessando = processando && planoSelecionado === plano.id
            return (
              <div
                key={plano.id}
                style={{
                  background: plano.destaque
                    ? 'linear-gradient(145deg, #0e1e2b 0%, #0b1820 100%)'
                    : '#05121b',
                  border: `1px solid ${plano.corBorder}`,
                  borderRadius: 24,
                  padding: 28,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: plano.destaque ? `0 0 40px ${plano.corBg}, 0 8px 32px rgba(0,0,0,0.4)` : '0 4px 24px rgba(0,0,0,0.3)',
                  transform: plano.destaque ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all .2s',
                }}
              >
                {/* Badge destaque */}
                {plano.destaque && (
                  <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: plano.cor, color: '#fff', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', padding: '5px 16px', borderRadius: 99, whiteSpace: 'nowrap', boxShadow: `0 2px 12px ${plano.corBg}` }}>
                    Mais escolhido
                  </div>
                )}

                {/* Icon + nome */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: plano.corBg, border: `1px solid ${plano.corBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconComp size={20} style={{ color: plano.cor }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>{plano.nome}</p>
                    <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, fontWeight: 500 }}>{plano.subtitulo}</p>
                  </div>
                </div>

                {/* Preço */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>R$</span>
                    <span style={{ fontSize: 38, fontWeight: 900, color: plano.cor, letterSpacing: '-1.5px', lineHeight: 1 }}>
                      {plano.preco % 1 === 0 ? plano.preco.toFixed(0) : plano.preco.toFixed(2).replace('.', ',')}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8' }}>/mês</span>
                  </div>
                  <p style={{ fontSize: 10, color: '#64748b', marginTop: 4, fontWeight: 500 }}>Sem fidelidade • Cancele quando quiser</p>
                </div>

                {/* Features */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {plano.features.map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: plano.corBg, border: `1px solid ${plano.corBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Check size={10} style={{ color: plano.cor, strokeWidth: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 500 }}>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Botão */}
                <button
                  onClick={() => handleAssinar(plano)}
                  disabled={processando}
                  style={{
                    width: '100%',
                    padding: '14px 0',
                    borderRadius: 12,
                    border: 'none',
                    cursor: processando ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    background: plano.destaque ? plano.cor : 'transparent',
                    color: plano.destaque ? '#fff' : plano.cor,
                    borderWidth: plano.destaque ? 0 : 1.5,
                    borderStyle: 'solid',
                    borderColor: plano.cor,
                    opacity: processando && planoSelecionado !== plano.id ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all .15s',
                    boxShadow: plano.destaque ? `0 4px 16px ${plano.corBg}` : 'none',
                  }}
                >
                  {isProcessando
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Processando...</>
                    : `Assinar ${plano.nome}`}
                </button>
              </div>
            )
          })}
        </div>

        {/* Rodapé de segurança */}
        <div style={{ textAlign: 'center', marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {['Pagamento 100% seguro', 'Sem fidelidade', 'Cancele quando quiser', 'Suporte incluso'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={11} style={{ color: '#1D9E75', strokeWidth: 3 }} />
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: '#475569', marginTop: 8, fontWeight: 400 }}>
            Dúvidas? Fale conosco pelo WhatsApp antes de assinar.
          </p>
        </div>
      </section>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

export default PlanosDiagnostico
