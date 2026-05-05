import React, { useState, useEffect, useRef } from 'react'
import { X, Download } from 'lucide-react'

// Reference "today" for aging & 7-day window (demo date = May 17 2025)
const TODAY = new Date(2025, 4, 17)

function parseVenc(ddmm) {
  const [d, m] = ddmm.split('/').map(Number)
  return new Date(2025, m - 1, d)
}
function daysAgo(date) { return Math.floor((TODAY - date) / 86400000) }
function daysUntil(date) { return Math.floor((date - TODAY) / 86400000) }
function computeAging(list) {
  const overdue = list.filter(c => c.status === 'atrasado')
  const ate15  = overdue.filter(c => daysAgo(parseVenc(c.venc)) <= 15).reduce((s, c) => s + c.valor, 0)
  const d16_30 = overdue.filter(c => { const d = daysAgo(parseVenc(c.venc)); return d > 15 && d <= 30 }).reduce((s, c) => s + c.valor, 0)
  const d31_60 = overdue.filter(c => { const d = daysAgo(parseVenc(c.venc)); return d > 30 && d <= 60 }).reduce((s, c) => s + c.valor, 0)
  return [ate15, d16_30, d31_60]
}
const fmtBRL = v => `R$ ${Number(v).toLocaleString('pt-BR')}`

const INITIAL_COBRANÇAS = [
  { id: 1,  desc: 'Empresa Delta — mensalidade',   cat: 'Mensalidade', venc: '02/05', met: 'Boleto', tipo: 'recorrente', status: 'atrasado', valor: 3600 },
  { id: 2,  desc: 'Gamma Tech — licença',           cat: 'Licença',     venc: '05/05', met: 'PIX',    tipo: 'recorrente', status: 'atrasado', valor: 2480 },
  { id: 3,  desc: 'Fornecedor Zeta — projeto',      cat: 'Projeto',     venc: '08/05', met: 'TED',    tipo: 'avulso',     status: 'atrasado', valor: 3400 },
  { id: 4,  desc: 'Alpha Ltda — mensalidade',       cat: 'Mensalidade', venc: '10/05', met: 'PIX',    tipo: 'recorrente', status: 'recebido', valor: 3200 },
  { id: 5,  desc: 'Beta Corp — consultoria',        cat: 'Consultoria', venc: '10/05', met: 'TED',    tipo: 'avulso',     status: 'recebido', valor: 8500 },
  { id: 6,  desc: 'Epsilon — mensalidade',          cat: 'Mensalidade', venc: '12/05', met: 'PIX',    tipo: 'recorrente', status: 'recebido', valor: 2700 },
  { id: 7,  desc: 'Eta Industries — serviço',       cat: 'Serviço',     venc: '15/05', met: 'Boleto', tipo: 'avulso',     status: 'recebido', valor: 6800 },
  { id: 8,  desc: 'Iota Corp — licença',            cat: 'Licença',     venc: '15/05', met: 'PIX',    tipo: 'recorrente', status: 'recebido', valor: 1900 },
  { id: 9,  desc: 'Kappa Tech — mensalidade',       cat: 'Mensalidade', venc: '15/05', met: 'PIX',    tipo: 'recorrente', status: 'recebido', valor: 4200 },
  { id: 10, desc: 'Lambda — comissão',              cat: 'Comissão',    venc: '16/05', met: 'PIX',    tipo: 'avulso',     status: 'recebido', valor: 1350 },
  { id: 11, desc: 'Alpha Ltda — mensalidade',       cat: 'Mensalidade', venc: '18/05', met: 'PIX',    tipo: 'recorrente', status: 'aberto',   valor: 3200 },
  { id: 12, desc: 'Beta Corp — projeto',            cat: 'Projeto',     venc: '19/05', met: 'Boleto', tipo: 'avulso',     status: 'aberto',   valor: 4800 },
  { id: 13, desc: 'Epsilon — mensalidade',          cat: 'Mensalidade', venc: '21/05', met: 'PIX',    tipo: 'recorrente', status: 'aberto',   valor: 2700 },
  { id: 14, desc: 'Eta Industries — retainer',      cat: 'Serviço',     venc: '22/05', met: 'TED',    tipo: 'recorrente', status: 'agendado', valor: 3500 },
  { id: 15, desc: 'Nu Corp — treinamento',          cat: 'Serviço',     venc: '25/05', met: 'PIX',    tipo: 'avulso',     status: 'agendado', valor: 5200 },
  { id: 16, desc: 'Xi Ltda — mensalidade',          cat: 'Mensalidade', venc: '28/05', met: 'PIX',    tipo: 'recorrente', status: 'agendado', valor: 2800 },
]

const EMPTY_FORM = { desc: '', cat: 'Mensalidade', tipo: 'recorrente', valor: '', venc: '', met: 'PIX', recorrencia: 'Única', status: 'aberto' }

const TOP_CLIENTES = [
  { init: 'BC', nome: 'Beta Corp',          cat: 'Consultoria', valor: 8500 },
  { init: 'NC', nome: 'Nu Corp',            cat: 'Serviço',     valor: 5200 },
  { init: 'BB', nome: 'Beta Corp — projeto',cat: 'Projeto',     valor: 4800 },
  { init: 'KT', nome: 'Kappa Tech',         cat: 'Mensalidade', valor: 4200 },
  { init: 'EI', nome: 'Eta Industries',     cat: 'Serviço',     valor: 3500 },
]
const MAX_TOP = 8500

const TIPO_BADGE = {
  recorrente: { bg: '#E6F1FB', color: '#185FA5', border: '#B5D4F4', label: 'Recorrente' },
  avulso:     { bg: '#EEEDFE', color: '#3C3489', border: '#C5C1FA', label: 'Avulso'     },
  parcelado:  { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775', label: 'Parcelado'  },
}
const STATUS_BADGE = {
  recebido: { bg: '#EAF3DE', color: '#3B6D11', label: 'Recebido'     },
  aberto:   { bg: '#FAEEDA', color: '#854F0B', label: 'Em aberto'    },
  atrasado: { bg: '#FCEBEB', color: '#A32D2D', label: 'Inadimplente' },
  agendado: { bg: '#E6F1FB', color: '#185FA5', label: 'Agendado'     },
}

const FILTROS = [
  { key: 'todos',    label: 'Todas'        },
  { key: 'aberto',   label: 'Em aberto'    },
  { key: 'atrasado', label: 'Inadimplentes'},
  { key: 'recebido', label: 'Recebidas'    },
  { key: 'agendado', label: 'Agendadas'    },
]

export default function ContasReceberView() {
  const [cobranças, setCobranças] = useState(INITIAL_COBRANÇAS)
  const [filtro,    setFiltro]    = useState('todos')
  const [periodo,   setPeriodo]   = useState('Maio 2025')
  const [modal,     setModal]     = useState(false)
  const [form,      setForm]      = useState(EMPTY_FORM)

  const lineRef    = useRef(null)
  const donutRef   = useRef(null)
  const agingRef   = useRef(null)
  const lineChart  = useRef(null)
  const donutChart = useRef(null)
  const agingChart = useRef(null)

  // ── Computed metrics ────────────────────────────────────────────────────────
  const recebido     = cobranças.filter(c => c.status === 'recebido').reduce((s, c) => s + c.valor, 0)
  const inadimplente = cobranças.filter(c => c.status === 'atrasado').reduce((s, c) => s + c.valor, 0)
  const totalEmitido = cobranças.reduce((s, c) => s + c.valor, 0)
  const atrasados    = cobranças.filter(c => c.status === 'atrasado')
  const vencendoLogo = cobranças.filter(c => {
    if (c.status !== 'aberto' && c.status !== 'agendado') return false
    const d = daysUntil(parseVenc(c.venc))
    return d >= 0 && d <= 7
  })
  const totalVencer7  = vencendoLogo.reduce((s, c) => s + c.valor, 0)
  const totalAReceber = cobranças.filter(c => c.status !== 'recebido').reduce((s, c) => s + c.valor, 0)
  const qtdAReceber   = cobranças.filter(c => c.status !== 'recebido').length
  const taxaInad      = totalEmitido > 0 ? (inadimplente / totalEmitido * 100).toFixed(1) : '0'

  const pctRecebido = totalEmitido ? recebido / totalEmitido * 100 : 0
  const pctInad     = totalEmitido ? inadimplente / totalEmitido * 100 : 0
  const pctVencer   = totalEmitido ? totalVencer7 / totalEmitido * 100 : 0
  const pctAberto   = Math.max(0, 100 - pctRecebido - pctInad - pctVencer)

  const filtrados = filtro === 'todos' ? cobranças : cobranças.filter(c => c.status === filtro)

  // ── Chart.js ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true

    const initAll = () => {
      if (!alive) return
      if (!lineRef.current || !donutRef.current || !agingRef.current) return

      lineChart.current?.destroy()
      donutChart.current?.destroy()
      agingChart.current?.destroy()

      const gridY      = 'rgba(128,128,128,0.08)'
      const tickFn     = { font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" } }
      const tooltipBRL = { callbacks: { label: ctx => `R$ ${ctx.raw.toLocaleString('pt-BR')}` } }

      lineChart.current = new window.Chart(lineRef.current, {
        type: 'line',
        data: {
          labels: ['Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
          datasets: [
            {
              label: 'Recebido',
              data: [48200, 52400, 55100, 58800, 55000, 61840],
              borderColor: '#1D9E75',
              backgroundColor: 'rgba(29,158,117,0.07)',
              fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2,
            },
            {
              label: 'Emitido',
              data: [52000, 56000, 58000, 62000, 60000, 100760],
              borderColor: '#D3D1C7',
              borderDash: [4, 3],
              fill: false, tension: 0.4, pointRadius: 3, borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: tooltipBRL },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: tickFn },
            y: { grid: { color: gridY }, border: { display: false }, ticks: { ...tickFn, callback: v => `R$ ${v / 1000}k` } },
          },
        },
      })

      donutChart.current = new window.Chart(donutRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Mensalidade', 'Serviço', 'Consultoria', 'Licença', 'Outros'],
          datasets: [{ data: [28400, 17500, 9800, 5100, 2700], backgroundColor: ['#1D9E75', '#378ADD', '#7F77DD', '#BA7517', '#888780'], borderWidth: 0 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: { legend: { display: false }, tooltip: tooltipBRL },
        },
      })

      agingChart.current = new window.Chart(agingRef.current, {
        type: 'bar',
        data: {
          labels: ['Até 15 dias', '16–30 dias', '31–60 dias'],
          datasets: [{ data: computeAging(INITIAL_COBRANÇAS), backgroundColor: ['#EF9F27', '#D85A30', '#A32D2D'], borderRadius: 4, borderWidth: 0 }],
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: tooltipBRL },
          scales: {
            x: { grid: { color: gridY }, border: { display: false }, ticks: { ...tickFn, callback: v => `R$ ${v / 1000}k` } },
            y: { grid: { display: false }, border: { display: false }, ticks: tickFn },
          },
        },
      })
    }

    if (window.Chart) {
      initAll()
    } else {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
      s.onload = initAll
      document.head.appendChild(s)
    }

    return () => {
      alive = false
      lineChart.current?.destroy()
      donutChart.current?.destroy()
      agingChart.current?.destroy()
    }
  }, [])

  useEffect(() => {
    if (!agingChart.current) return
    agingChart.current.data.datasets[0].data = computeAging(cobranças)
    agingChart.current.update()
  }, [cobranças])

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleReceber = id => {
    setCobranças(prev => prev.map(c => c.id === id ? { ...c, status: 'recebido' } : c))
  }

  const handleSalvar = () => {
    if (!form.desc.trim() || !form.valor || !form.venc) return
    const [yyyy, mm, dd] = form.venc.split('-')
    setCobranças(prev => [{
      id: Date.now(),
      desc: form.desc, cat: form.cat, venc: `${dd}/${mm}`,
      met: form.met, tipo: form.tipo, status: form.status,
      valor: parseFloat(form.valor),
    }, ...prev])
    setModal(false)
    setForm(EMPTY_FORM)
  }

  const field = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  // ── Style helpers ────────────────────────────────────────────────────────────
  const card = (bg, border, children) => (
    <div style={{ background: bg, border: `0.5px solid ${border}`, borderRadius: 12, padding: '1rem 1.1rem' }}>
      {children}
    </div>
  )
  const ls = color => ({ fontSize: 11, fontWeight: 500, color, marginBottom: 4 })
  const vs = color => ({ fontSize: 19, fontWeight: 500, color, lineHeight: 1.2 })
  const ss = color => ({ fontSize: 11, color, marginTop: 2 })

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#05121b] bg-white outline-none focus:border-[#137789] transition-colors'

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Modal ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-[#05121b]">Nova cobrança</h3>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-slate-500 mb-1.5 block">Cliente / descrição</span>
                <input className={inputCls} placeholder="Ex: Mensalidade cliente Alpha" value={form.desc} onChange={field('desc')} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block">Categoria</span>
                  <select className={inputCls} value={form.cat} onChange={field('cat')}>
                    {['Mensalidade','Prestação de serviço','Consultoria','Licença','Comissão','Projeto','Outros'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block">Tipo</span>
                  <select className={inputCls} value={form.tipo} onChange={field('tipo')}>
                    <option value="recorrente">Recorrente</option>
                    <option value="avulso">Avulso</option>
                    <option value="parcelado">Parcelado</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block">Valor (R$)</span>
                  <input className={inputCls} type="number" min="0" step="0.01" placeholder="0,00" value={form.valor} onChange={field('valor')} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block">Vencimento</span>
                  <input className={inputCls} type="date" value={form.venc} onChange={field('venc')} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block">Método de recebimento</span>
                  <select className={inputCls} value={form.met} onChange={field('met')}>
                    {['PIX','Boleto','TED','Cartão'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block">Recorrência</span>
                  <select className={inputCls} value={form.recorrencia} onChange={field('recorrencia')}>
                    {['Única','Mensal','Trimestral','Anual'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-medium text-slate-500 mb-1.5 block">Status</span>
                <select className={inputCls} value={form.status} onChange={field('status')}>
                  <option value="aberto">Em aberto</option>
                  <option value="agendado">Agendado</option>
                  <option value="recebido">Recebido</option>
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-5">
              <button onClick={() => setModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">Cancelar</button>
              <button onClick={handleSalvar} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#05121b] hover:bg-[#137789] transition-colors">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page ── */}
      <div className="max-w-7xl mx-auto w-full fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Gestão financeira</p>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: '#05121b', margin: 0 }}>Contas a receber</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select value={periodo} onChange={e => setPeriodo(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#05121b] bg-white outline-none focus:border-[#137789] transition-colors">
              {['Maio 2025','Junho 2025','Julho 2025'].map(p => <option key={p}>{p}</option>)}
            </select>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors">
              <Download size={14} /> Exportar
            </button>
            <button onClick={() => setModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#05121b] hover:bg-[#137789] transition-colors">
              + Nova cobrança
            </button>
          </div>
        </div>

        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {card('#EAF3DE','#C0DD97', <><p style={ls('#3B6D11')}>Total a receber</p><p style={vs('#27500A')}>{fmtBRL(totalAReceber)}</p><p style={ss('#3B6D11')}>{qtdAReceber} cobranças</p></>)}
          {card('#FCEBEB','#F7C1C1', <><p style={ls('#993C1D')}>Inadimplentes</p><p style={vs('#791F1F')}>{fmtBRL(inadimplente)}</p><p style={ss('#993C1D')}>{atrasados.length} clientes</p></>)}
          {card('#FAEEDA','#FAC775', <><p style={ls('#854F0B')}>Vencem em 7 dias</p><p style={vs('#633806')}>{fmtBRL(totalVencer7)}</p><p style={ss('#854F0B')}>{vencendoLogo.length} cobranças</p></>)}
          {card('#EAF3DE','#C0DD97', <><p style={ls('#3B6D11')}>Recebido no mês</p><p style={vs('#27500A')}>{fmtBRL(recebido)}</p><p style={ss('#3B6D11')}>↑ 12,4% vs abril</p></>)}
          {card('#E6F1FB','#B5D4F4', <><p style={ls('#185FA5')}>Total emitido</p><p style={vs('#0C447C')}>{fmtBRL(totalEmitido)}</p><p style={{ fontSize: 11, color: '#185FA5', marginTop: 2 }}>mês atual</p></>)}
          <div className="bg-slate-50 border border-slate-200" style={{ borderRadius: 12, padding: '1rem 1.1rem' }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4 }}>Taxa inadimplência</p>
            <p style={{ fontSize: 19, fontWeight: 500, color: '#05121b', lineHeight: 1.2 }}>{taxaInad}%</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>meta: abaixo de 5%</p>
          </div>
        </div>

        {/* Alertas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {atrasados.length > 0 && (
            <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#D85A30', marginTop: 5, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#791F1F', lineHeight: 1.6, margin: 0 }}>
                <strong>{atrasados.length} clientes inadimplentes:</strong>{' '}
                {atrasados.map((c, i) => <span key={c.id}>{c.desc.split(' — ')[0]} {fmtBRL(c.valor)} (venc. {c.venc}){i < atrasados.length - 1 ? ', ' : ''}</span>)}.{' '}
                Total: <strong>{fmtBRL(inadimplente)}</strong>.
              </p>
            </div>
          )}
          {vencendoLogo.length > 0 && (
            <div style={{ background: '#FAEEDA', border: '0.5px solid #EF9F27', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#BA7517', marginTop: 5, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#633806', lineHeight: 1.6, margin: 0 }}>
                <strong>{vencendoLogo.length} cobranças vencem em 7 dias:</strong>{' '}
                {vencendoLogo.map((c, i) => <span key={c.id}>{c.desc.split(' — ')[0]} {fmtBRL(c.valor)} ({c.venc}){i < vencendoLogo.length - 1 ? ', ' : ''}</span>)}.{' '}
                Total: <strong>{fmtBRL(totalVencer7)}</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Barra de situação */}
        <div className="bg-white border border-slate-200" style={{ borderRadius: 12, padding: '1rem 1.2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: 0 }}>Situação das cobranças</p>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{fmtBRL(totalEmitido)} emitidos no mês</p>
          </div>
          <div style={{ display: 'flex', gap: 3, height: 10, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${pctRecebido}%`, background: '#1D9E75' }} />
            <div style={{ width: `${pctInad}%`,     background: '#D85A30' }} />
            <div style={{ width: `${pctVencer}%`,   background: '#EF9F27' }} />
            <div style={{ width: `${pctAberto}%`,   background: '#378ADD' }} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginTop: 12 }}>
            {[
              { color: '#1D9E75', label: 'Recebido',     valor: recebido,     pct: pctRecebido },
              { color: '#D85A30', label: 'Inadimplente', valor: inadimplente, pct: pctInad     },
              { color: '#EF9F27', label: 'A vencer',     valor: totalVencer7, pct: pctVencer   },
              { color: '#378ADD', label: 'Em aberto',    valor: Math.max(0, totalEmitido - recebido - inadimplente - totalVencer7), pct: pctAberto },
            ].map(({ color, label, valor, pct }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {label} <strong style={{ color: '#05121b' }}>{fmtBRL(valor)}</strong> ({pct.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gráficos — linha superior */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
          <div className="bg-white border border-slate-200" style={{ borderRadius: 12, padding: '1rem 1.2rem' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: '0 0 8px' }}>Recebimentos — últimos 6 meses</p>
            <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#1D9E75' }} />
                <span style={{ fontSize: 11, color: '#64748b' }}>Recebido</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 0, borderTop: '2px dashed #D3D1C7' }} />
                <span style={{ fontSize: 11, color: '#64748b' }}>Emitido</span>
              </div>
            </div>
            <div style={{ position: 'relative', width: '100%', height: 200 }}>
              <canvas ref={lineRef} />
            </div>
          </div>

          <div className="bg-white border border-slate-200" style={{ borderRadius: 12, padding: '1rem 1.2rem' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: '0 0 14px' }}>Top clientes — maio</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {TOP_CLIENTES.map(({ init, nome, cat, valor }) => (
                <div key={nome} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E6F1FB', color: '#0C447C', fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{init}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</p>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#27500A', margin: 0, flexShrink: 0, marginLeft: 8 }}>{fmtBRL(valor)}</p>
                    </div>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: '1px 0 4px' }}>{cat}</p>
                    <div style={{ height: 4, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${valor / MAX_TOP * 100}%`, background: '#1D9E75', borderRadius: 999 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gráficos — linha inferior */}
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
          <div className="bg-white border border-slate-200" style={{ borderRadius: 12, padding: '1rem 1.2rem' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: '0 0 12px' }}>Recebimentos por categoria</p>
            <div style={{ position: 'relative', width: '100%', height: 180 }}>
              <canvas ref={donutRef} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 12 }}>
              {[
                { color: '#1D9E75', label: 'Mensalidade', valor: 28400 },
                { color: '#378ADD', label: 'Serviço',     valor: 17500 },
                { color: '#7F77DD', label: 'Consultoria', valor: 9800  },
                { color: '#BA7517', label: 'Licença',     valor: 5100  },
                { color: '#888780', label: 'Outros',      valor: 2700  },
              ].map(({ color, label, valor }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{label} <strong style={{ color: '#05121b' }}>{fmtBRL(valor)}</strong></span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200" style={{ borderRadius: 12, padding: '1rem 1.2rem' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: '0 0 12px' }}>Aging — dias em atraso</p>
            <div style={{ position: 'relative', width: '100%', height: 200 }}>
              <canvas ref={agingRef} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 10 }}>
              {[{ color: '#EF9F27', label: 'Até 15 dias' }, { color: '#D85A30', label: '16–30 dias' }, { color: '#A32D2D', label: '31–60 dias' }].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white border border-slate-200" style={{ borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderBottom: '0.5px solid #e2e8f0' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: 0 }}>
              {filtrados.length} {filtrados.length === 1 ? 'cobrança' : 'cobranças'}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FILTROS.map(({ key, label }) => (
                <button key={key} onClick={() => setFiltro(key)} style={{ padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 500, border: '0.5px solid', cursor: 'pointer', transition: 'all 0.15s', background: filtro === key ? '#05121b' : '#f8fafc', color: filtro === key ? '#fff' : '#64748b', borderColor: filtro === key ? '#05121b' : '#e2e8f0' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
              <colgroup>
                <col style={{ width: '24%' }} /><col style={{ width: '13%' }} /><col style={{ width: '10%' }} />
                <col style={{ width: '9%' }} /><col style={{ width: '11%' }} /><col style={{ width: '11%' }} />
                <col style={{ width: '13%' }} /><col style={{ width: '9%' }} />
              </colgroup>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #e2e8f0', background: '#f8fafc' }}>
                  {['Cliente / descrição','Categoria','Vencimento','Método','Tipo','Status','Valor','Ação'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 500, color: '#94a3b8', textAlign: h === 'Valor' ? 'right' : 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => {
                  const isAtrasado  = c.status === 'atrasado'
                  const isRecebido  = c.status === 'recebido'
                  const showReceber = c.status === 'aberto' || c.status === 'atrasado'
                  const tipoBadge   = TIPO_BADGE[c.tipo]     || TIPO_BADGE.avulso
                  const statusBadge = STATUS_BADGE[c.status] || STATUS_BADGE.aberto
                  const valorColor  = isAtrasado ? '#791F1F' : isRecebido ? '#27500A' : '#05121b'
                  return (
                    <tr key={c.id} style={{ borderBottom: '0.5px solid #f1f5f9', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '10px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#05121b' }}>{c.desc}</span>
                      </td>
                      <td style={{ padding: '10px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{c.cat}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12, color: isAtrasado ? '#D85A30' : '#05121b', fontWeight: isAtrasado ? 500 : 400 }}>{c.venc}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{c.met}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: tipoBadge.bg, color: tipoBadge.color, border: `0.5px solid ${tipoBadge.border}` }}>{tipoBadge.label}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: statusBadge.bg, color: statusBadge.color }}>{statusBadge.label}</span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: valorColor }}>{fmtBRL(c.valor)}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        {showReceber && (
                          <button onClick={() => handleReceber(c.id)}
                            style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: '#E6F1FB', color: '#185FA5', border: '0.5px solid #B5D4F4', cursor: 'pointer', whiteSpace: 'nowrap' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            Receber
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filtrados.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '32px 12px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>Nenhuma cobrança encontrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
