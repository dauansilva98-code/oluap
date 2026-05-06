import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { X, Download } from 'lucide-react'

const fmtBRL = v => `R$ ${Number(v || 0).toLocaleString('pt-BR')}`

const TIPO_BADGE = {
  Corrente:     { bg: '#E6F1FB', color: '#185FA5' },
  'Corrente PJ':{ bg: '#E6F1FB', color: '#185FA5' },
  Digital:      { bg: '#EEEDFE', color: '#3C3489' },
  'Digital PJ': { bg: '#EEEDFE', color: '#3C3489' },
  Poupança:     { bg: '#FAEEDA', color: '#854F0B' },
  'Poupança PJ':{ bg: '#FAEEDA', color: '#854F0B' },
  Investimento: { bg: '#EAF3DE', color: '#3B6D11' },
}

const BANK_COLORS = ['#378ADD','#1D9E75','#7F77DD','#BA7517','#D85A30','#137789','#E8734A','#888780']

const EMPTY_CONTA = { nome: '', tipo: 'Corrente PJ', agencia: '', numero: '', saldo: '', pix: '' }
const EMPTY_MOV   = { desc: '', valor: '', data: '', cat: 'Venda à vista', obs: '', tipomov: 'entrada' }

const card = (bg, border, children, extra = {}) => (
  <div style={{ background: bg, border: `0.5px solid ${border}`, borderRadius: 12, padding: '1rem 1.1rem', ...extra }}>
    {children}
  </div>
)
const labelSt = color => ({ fontSize: 11, fontWeight: 500, color, marginBottom: 4 })
const valueSt = color => ({ fontSize: 19, fontWeight: 500, color, lineHeight: 1.2 })
const subSt   = color => ({ fontSize: 11, color, marginTop: 2 })

// Calcula saldo real de um banco a partir dos lançamentos
const calcSaldo = (bancoId, lancs, saldoInicial) => {
  const ent = lancs.filter(l => l.banco_id === bancoId && l.tipo === 'receita').reduce((a, l) => a + Number(l.valor), 0)
  const sai = lancs.filter(l => l.banco_id === bancoId && l.tipo === 'despesa').reduce((a, l) => a + Number(l.valor), 0)
  return Number(saldoInicial || 0) + ent - sai
}

// Evolução do saldo nos últimos 6 meses
const computeLineData = (bancos, lancamentos) => {
  const labels = [], totalData = [], bancarioData = []
  const totalInicial = bancos.reduce((a, b) => a + Number(b.saldo_inicial || 0), 0)
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
    const mes = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    labels.push(label)
    const upTo = lancamentos.filter(l => l.data && l.data.slice(0, 7) <= mes)
    const net = upTo.reduce((a, l) => l.tipo === 'receita' ? a + Number(l.valor) : a - Number(l.valor), 0)
    const dinNet = upTo.filter(l => l.meio_pagamento === 'Dinheiro').reduce((a, l) => l.tipo === 'receita' ? a + Number(l.valor) : a - Number(l.valor), 0)
    totalData.push(Math.round(totalInicial + net))
    bancarioData.push(Math.round(totalInicial + net - dinNet))
  }
  return { labels, totalData, bancarioData }
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function BancosContas({
  bancos = [],
  lancamentos = [],
  userId,
  onSaveBanco,
  onSaveLancamento,
  savingItem = false,
}) {
  const [filtroBank,   setFiltroBank]   = useState('todos')
  const [modalConta,   setModalConta]   = useState(false)
  const [modalEspecie, setModalEspecie] = useState(false)
  const [formConta,    setFormConta]    = useState(EMPTY_CONTA)
  const [formMov,      setFormMov]      = useState(EMPTY_MOV)

  const donutRef   = useRef(null)
  const lineRef    = useRef(null)
  const donutChart = useRef(null)
  const lineChart  = useRef(null)

  // ── Dados derivados ───────────────────────────────────────────────────────
  const bancosComSaldo = bancos.map((b, i) => ({
    ...b,
    saldoCalc: calcSaldo(b.id, lancamentos, b.saldo_inicial),
    color: BANK_COLORS[i % BANK_COLORS.length],
    init: (b.nome || '').substring(0, 2).toUpperCase(),
  }))

  const mesAtual = new Date().toISOString().slice(0, 7)

  const especieLancs = lancamentos.filter(l => l.meio_pagamento === 'Dinheiro' || (!l.banco_id && l.meio_pagamento === 'Dinheiro'))
  const especieMov = [...especieLancs]
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''))
    .map(l => ({
      id: l.id,
      desc: l.descricao || '—',
      data: l.data ? `${l.data.slice(8, 10)}/${l.data.slice(5, 7)}` : '—',
      tipo: l.tipo === 'receita' ? 'entrada' : 'saida',
      valor: Number(l.valor),
    }))

  const especieSaldo = especieMov.reduce((a, m) => m.tipo === 'entrada' ? a + m.valor : a - m.valor, 0)
  const saldoBancario = bancosComSaldo.reduce((a, b) => a + b.saldoCalc, 0)
  const saldoTotal    = saldoBancario + especieSaldo

  const entradasMes = lancamentos
    .filter(l => l.tipo === 'receita' && l.data?.startsWith(mesAtual))
    .reduce((a, l) => a + Number(l.valor), 0)

  const maiorBanco = bancosComSaldo.length > 0
    ? bancosComSaldo.reduce((a, b) => b.saldoCalc > a.saldoCalc ? b : a)
    : null

  const extrato = [...lancamentos]
    .sort((a, b) => (b.data || '').localeCompare(a.data || ''))
    .map(l => {
      const banco = bancos.find(b => b.id === l.banco_id)
      const isDinheiro = l.meio_pagamento === 'Dinheiro'
      return {
        id: l.id,
        desc: l.descricao || '—',
        conta: isDinheiro ? 'Espécie' : (banco?.nome || '—'),
        bank: isDinheiro ? 'especie' : (l.banco_id || 'outros'),
        data: l.data ? `${l.data.slice(8, 10)}/${l.data.slice(5, 7)}` : '—',
        met: l.meio_pagamento || '—',
        tipo: l.tipo === 'receita' ? 'entrada' : 'saida',
        valor: Number(l.valor),
        categoria: l.categoria || '—',
      }
    })

  const filtros = [
    { key: 'todos', label: 'Todos' },
    ...bancos.map(b => ({ key: b.id, label: b.nome })),
    { key: 'especie', label: 'Espécie' },
  ]

  const extratoFiltrado = filtroBank === 'todos' ? extrato
    : filtroBank === 'especie' ? extrato.filter(l => l.bank === 'especie')
    : extrato.filter(l => l.bank === filtroBank)

  // ── Chart data ────────────────────────────────────────────────────────────
  const donutLabels = [
    ...bancosComSaldo.map(b => b.nome),
    ...(especieSaldo > 0 ? ['Espécie'] : []),
  ]
  const donutValues = [
    ...bancosComSaldo.map(b => Math.max(0, b.saldoCalc)),
    ...(especieSaldo > 0 ? [especieSaldo] : []),
  ]
  const donutColors = [
    ...bancosComSaldo.map((_, i) => BANK_COLORS[i % BANK_COLORS.length]),
    '#888780',
  ]
  const hasDonutData = donutValues.some(v => v > 0)

  const lineData = computeLineData(bancos, lancamentos)

  // ── Charts ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true

    const buildCharts = () => {
      if (!alive || !donutRef.current || !lineRef.current) return
      donutChart.current?.destroy()
      lineChart.current?.destroy()

      const tickFn = { font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" }, color: '#94a3b8' }
      const gridY  = 'rgba(128,128,128,0.08)'

      donutChart.current = new window.Chart(donutRef.current, {
        type: 'doughnut',
        data: {
          labels: hasDonutData ? donutLabels : ['Sem dados'],
          datasets: [{
            data: hasDonutData ? donutValues : [1],
            backgroundColor: hasDonutData ? donutColors : ['#e2e8f0'],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => hasDonutData
                  ? `R$ ${ctx.raw.toLocaleString('pt-BR')} (${((ctx.raw / ctx.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%)`
                  : 'Sem dados',
              },
            },
          },
        },
      })

      lineChart.current = new window.Chart(lineRef.current, {
        type: 'line',
        data: {
          labels: lineData.labels,
          datasets: [
            {
              label: 'Saldo total',
              data: lineData.totalData,
              borderColor: '#1D9E75', backgroundColor: 'rgba(29,158,117,0.07)',
              fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2,
            },
            {
              label: 'Só bancário',
              data: lineData.bancarioData,
              borderColor: '#378ADD', borderDash: [4, 3],
              fill: false, tension: 0.4, pointRadius: 3, borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: R$ ${ctx.raw.toLocaleString('pt-BR')}` } },
          },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: tickFn },
            y: { grid: { color: gridY }, border: { display: false }, ticks: { ...tickFn, callback: v => `R$ ${(v / 1000).toFixed(0)}k` } },
          },
        },
      })
    }

    if (window.Chart) buildCharts()
    else {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
      s.onload = buildCharts
      document.head.appendChild(s)
    }

    return () => {
      alive = false
      donutChart.current?.destroy()
      lineChart.current?.destroy()
    }
  }, [bancos, lancamentos])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const salvarConta = async () => {
    if (!formConta.nome.trim()) return
    await onSaveBanco?.({
      nome:          formConta.nome,
      tipo:          formConta.tipo.replace(' PJ', '').replace('Conta ', ''),
      agencia:       formConta.agencia,
      numero:        formConta.numero,
      saldo_inicial: parseFloat(formConta.saldo) || 0,
      pix:           formConta.pix,
    })
    setModalConta(false)
    setFormConta(EMPTY_CONTA)
  }

  const salvarMov = async () => {
    if (!formMov.desc.trim() || !formMov.valor || !formMov.data) return
    await onSaveLancamento?.({
      descricao:      formMov.desc,
      valor:          parseFloat(formMov.valor) || 0,
      data:           formMov.data,
      categoria:      formMov.cat,
      tipo:           formMov.tipomov === 'entrada' ? 'receita' : 'despesa',
      meio_pagamento: 'Dinheiro',
      banco_id:       null,
    })
    setModalEspecie(false)
    setFormMov(EMPTY_MOV)
  }

  const fieldConta = k => e => setFormConta(f => ({ ...f, [k]: e.target.value }))
  const fieldMov   = k => e => setFormMov(f => ({ ...f, [k]: e.target.value }))
  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#05121b] bg-white outline-none focus:border-[#137789] transition-colors'

  // ── Modais via Portal (escapa qualquer stacking context) ──────────────────
  const modalContaEl = modalConta ? ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) setModalConta(false) }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-[#05121b]">Nova conta bancária</h3>
          <button onClick={() => setModalConta(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">Nome do banco</span>
            <input className={inputCls} placeholder="Ex: Bradesco Empresas" value={formConta.nome} onChange={fieldConta('nome')} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-500 mb-1.5 block">Tipo de conta</span>
              <select className={inputCls} value={formConta.tipo} onChange={fieldConta('tipo')}>
                {['Corrente PJ', 'Poupança PJ', 'Digital PJ', 'Investimento'].map(t => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500 mb-1.5 block">Agência</span>
              <input className={inputCls} placeholder="0000" value={formConta.agencia} onChange={fieldConta('agencia')} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-500 mb-1.5 block">Número da conta</span>
              <input className={inputCls} placeholder="00000-0" value={formConta.numero} onChange={fieldConta('numero')} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500 mb-1.5 block">Saldo inicial (R$)</span>
              <input className={inputCls} type="number" min="0" step="0.01" placeholder="0,00" value={formConta.saldo} onChange={fieldConta('saldo')} />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">Chave PIX (opcional)</span>
            <input className={inputCls} placeholder="CNPJ, e-mail ou telefone" value={formConta.pix} onChange={fieldConta('pix')} />
          </label>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={() => setModalConta(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={salvarConta} disabled={savingItem} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#05121b] hover:bg-[#137789] transition-colors disabled:opacity-50">
            {savingItem ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  const modalEspecieEl = modalEspecie ? ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) setModalEspecie(false) }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-[#05121b]">Movimentação em espécie</h3>
          <button onClick={() => setModalEspecie(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {['entrada', 'saida'].map(t => (
              <button
                key={t}
                onClick={() => setFormMov(f => ({ ...f, tipomov: t }))}
                style={{
                  padding: '8px 0', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', border: '1px solid',
                  background:   formMov.tipomov === t ? (t === 'entrada' ? '#EAF3DE' : '#FCEBEB') : '#fff',
                  color:        formMov.tipomov === t ? (t === 'entrada' ? '#3B6D11' : '#A32D2D') : '#94a3b8',
                  borderColor:  formMov.tipomov === t ? (t === 'entrada' ? '#9FE1CB' : '#F7C1C1') : '#e2e8f0',
                }}
              >
                {t === 'entrada' ? '+ Entrada' : '− Saída'}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">Descrição</span>
            <input className={inputCls} placeholder="Ex: Venda à vista balcão" value={formMov.desc} onChange={fieldMov('desc')} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-500 mb-1.5 block">Valor (R$)</span>
              <input className={inputCls} type="number" min="0" step="0.01" placeholder="0,00" value={formMov.valor} onChange={fieldMov('valor')} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-500 mb-1.5 block">Data</span>
              <input className={inputCls} type="date" value={formMov.data} onChange={fieldMov('data')} />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">Categoria</span>
            <select className={inputCls} value={formMov.cat} onChange={fieldMov('cat')}>
              {['Venda à vista', 'Reembolso', 'Depósito', 'Pagamento fornecedor', 'Sangria', 'Outros'].map(c => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">Observação (opcional)</span>
            <input className={inputCls} placeholder="Observação" value={formMov.obs} onChange={fieldMov('obs')} />
          </label>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={() => setModalEspecie(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={salvarMov} disabled={savingItem} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#05121b] hover:bg-[#137789] transition-colors disabled:opacity-50">
            {savingItem ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {modalContaEl}
      {modalEspecieEl}

      <div className="max-w-7xl mx-auto w-full" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Gestão financeira</p>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: '#05121b', margin: 0 }}>Bancos e contas</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors">
              <Download size={14} /> Exportar
            </button>
            <button
              onClick={() => setModalEspecie(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors"
            >
              + Mov. espécie
            </button>
            <button
              onClick={() => setModalConta(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#05121b] hover:bg-[#137789] transition-colors"
            >
              + Nova conta
            </button>
          </div>
        </div>

        {/* Estado vazio */}
        {bancos.length === 0 && lancamentos.length === 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-sm mb-1">Nenhum banco cadastrado ainda.</p>
            <p className="text-slate-400 text-sm">Clique em <strong className="text-[#05121b]">+ Nova conta</strong> para começar.</p>
          </div>
        )}

        {/* Cards de métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {card('#EAF3DE', '#C0DD97',
            <>
              <p style={labelSt('#3B6D11')}>Saldo total consolidado</p>
              <p style={valueSt('#27500A')}>{fmtBRL(saldoTotal)}</p>
              <p style={subSt('#3B6D11')}>todas as contas</p>
            </>
          )}
          {card('#E6F1FB', '#B5D4F4',
            <>
              <p style={labelSt('#185FA5')}>Saldo bancário</p>
              <p style={valueSt('#0C447C')}>{fmtBRL(saldoBancario)}</p>
              <p style={subSt('#185FA5')}>{bancos.length} conta{bancos.length !== 1 ? 's' : ''} ativa{bancos.length !== 1 ? 's' : ''}</p>
            </>
          )}
          {card('#FAEEDA', '#FAC775',
            <>
              <p style={labelSt('#854F0B')}>Dinheiro em espécie</p>
              <p style={valueSt('#633806')}>{fmtBRL(especieSaldo)}</p>
              <p style={subSt('#854F0B')}>caixa físico</p>
            </>
          )}
          <div className="bg-white border border-slate-200" style={{ borderRadius: 12, padding: '1rem 1.1rem' }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4 }}>Maior saldo</p>
            <p style={{ fontSize: 19, fontWeight: 500, color: '#05121b', lineHeight: 1.2 }}>{fmtBRL(maiorBanco?.saldoCalc || 0)}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{maiorBanco?.nome || '—'}</p>
          </div>
          {card('#EEEDFE', '#CECBF6',
            <>
              <p style={labelSt('#3C3489')}>Entradas do mês</p>
              <p style={valueSt('#26215C')}>{fmtBRL(entradasMes)}</p>
              <p style={subSt('#3C3489')}>receitas registradas</p>
            </>
          )}
          <div className="bg-white border border-slate-200" style={{ borderRadius: 12, padding: '1rem 1.1rem' }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4 }}>Última atualização</p>
            <p style={{ fontSize: 19, fontWeight: 500, color: '#05121b', lineHeight: 1.2 }}>Hoje</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Cards de contas bancárias */}
        {bancosComSaldo.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {bancosComSaldo.map(b => {
              const tipoKey = b.tipo?.replace(' PJ', '') || b.tipo || 'Corrente'
              const badge = TIPO_BADGE[b.tipo] || TIPO_BADGE[tipoKey] || { bg: '#f8fafc', color: '#64748b' }
              const entradas = lancamentos.filter(l => l.banco_id === b.id && l.tipo === 'receita' && l.data?.startsWith(mesAtual)).reduce((a, l) => a + Number(l.valor), 0)
              const saidas   = lancamentos.filter(l => l.banco_id === b.id && l.tipo === 'despesa' && l.data?.startsWith(mesAtual)).reduce((a, l) => a + Number(l.valor), 0)
              return (
                <div key={b.id} className="bg-white" style={{ border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '1.1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: b.color + '20', color: b.color,
                      fontSize: 12, fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {b.init}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.nome}</p>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{b.tipo || 'Corrente'}{b.agencia ? ` · Ag. ${b.agencia}` : ''}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Saldo disponível</p>
                  <p style={{ fontSize: 20, fontWeight: 500, color: b.saldoCalc >= 0 ? '#27500A' : '#791F1F', margin: '0 0 10px' }}>{fmtBRL(b.saldoCalc)}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: '#94a3b8' }}>Entradas do mês</span>
                      <span style={{ color: '#27500A', fontWeight: 500 }}>+{fmtBRL(entradas)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: '#94a3b8' }}>Saídas do mês</span>
                      <span style={{ color: '#791F1F', fontWeight: 500 }}>-{fmtBRL(saidas)}</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: badge.bg, color: badge.color }}>
                      {b.tipo || 'Corrente'}
                    </span>
                  </div>
                  <div style={{ borderTop: '0.5px solid #e2e8f0', paddingTop: 10, display: 'flex', gap: 6 }}>
                    {['Extrato', 'Transferir'].map(lbl => (
                      <button key={lbl} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, border: '0.5px solid #e2e8f0', background: 'transparent', color: '#64748b', cursor: 'pointer' }}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Card dinheiro em espécie */}
        <div className="bg-white" style={{ border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '1.1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: 0 }}>Dinheiro em espécie</p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Caixa físico da empresa</p>
            </div>
            <p style={{ fontSize: 22, fontWeight: 500, color: especieSaldo >= 0 ? '#27500A' : '#791F1F', margin: 0 }}>{fmtBRL(especieSaldo)}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Entradas do mês', valor: `+ ${fmtBRL(especieMov.filter(m => m.tipo === 'entrada' && lancamentos.find(l => l.id === m.id)?.data?.startsWith(mesAtual)).reduce((s, m) => s + m.valor, 0))}`, cor: '#27500A' },
              { label: 'Saídas do mês',   valor: `- ${fmtBRL(especieMov.filter(m => m.tipo === 'saida'   && lancamentos.find(l => l.id === m.id)?.data?.startsWith(mesAtual)).reduce((s, m) => s + m.valor, 0))}`,   cor: '#791F1F' },
              { label: 'Total movimentos', valor: `${especieMov.length}`,  cor: '#05121b' },
            ].map(({ label, valor, cor }) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '.75rem' }}>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: cor, margin: 0 }}>{valor}</p>
              </div>
            ))}
          </div>

          {especieMov.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>
              Nenhuma movimentação em espécie. Clique em <strong>+ Mov. espécie</strong> para registrar.
            </p>
          ) : (
            <div>
              {especieMov.slice(0, 10).map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < Math.min(especieMov.length, 10) - 1 ? '0.5px solid #f1f5f9' : 'none' }}>
                  <span style={{ flex: 1, fontSize: 13, color: '#05121b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.desc}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{m.data}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: m.tipo === 'entrada' ? '#27500A' : '#791F1F', flexShrink: 0 }}>
                    {m.tipo === 'entrada' ? '+' : '-'} {fmtBRL(m.valor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gráficos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Donut — distribuição do saldo */}
          <div className="bg-white border border-slate-200" style={{ borderRadius: 12, padding: '1rem 1.2rem' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', marginBottom: 12, marginTop: 0 }}>Distribuição do saldo</p>
            <div style={{ position: 'relative', width: '100%', height: 180 }}>
              <canvas ref={donutRef} />
            </div>
            {hasDonutData ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 12 }}>
                {bancosComSaldo.map((b, i) => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: BANK_COLORS[i % BANK_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#64748b' }}>{b.nome} <strong style={{ color: '#05121b' }}>{fmtBRL(b.saldoCalc)}</strong></span>
                  </div>
                ))}
                {especieSaldo > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: '#888780', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#64748b' }}>Espécie <strong style={{ color: '#05121b' }}>{fmtBRL(especieSaldo)}</strong></span>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>Cadastre bancos para visualizar a distribuição</p>
            )}
          </div>

          {/* Linha — evolução 6 meses */}
          <div className="bg-white border border-slate-200" style={{ borderRadius: 12, padding: '1rem 1.2rem' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', marginBottom: 10, marginTop: 0 }}>Evolução do saldo — 6 meses</p>
            <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#1D9E75' }} />
                <span style={{ fontSize: 11, color: '#64748b' }}>Saldo total</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 0, borderTop: '2px dashed #378ADD' }} />
                <span style={{ fontSize: 11, color: '#64748b' }}>Só bancário</span>
              </div>
            </div>
            <div style={{ position: 'relative', width: '100%', height: 200 }}>
              <canvas ref={lineRef} />
            </div>
          </div>
        </div>

        {/* Extrato consolidado */}
        <div className="bg-white border border-slate-200" style={{ borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderBottom: '0.5px solid #e2e8f0' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: 0 }}>
              {extratoFiltrado.length} lançamento{extratoFiltrado.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {filtros.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFiltroBank(key)}
                  style={{
                    padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 500, border: '0.5px solid', cursor: 'pointer', transition: 'all 0.15s',
                    background:   filtroBank === key ? '#05121b' : '#f8fafc',
                    color:        filtroBank === key ? '#fff'    : '#64748b',
                    borderColor:  filtroBank === key ? '#05121b' : '#e2e8f0',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {extratoFiltrado.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Nenhum lançamento encontrado. Registre receitas e despesas para ver o extrato.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                <colgroup>
                  <col style={{ width: '30%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '12%' }} />
                </colgroup>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid #e2e8f0', background: '#f8fafc' }}>
                    {['Descrição', 'Conta', 'Data', 'Categoria', 'Tipo', 'Método', 'Valor'].map(h => (
                      <th key={h} style={{
                        padding: '10px 12px', fontSize: 11, fontWeight: 500, color: '#94a3b8',
                        textAlign: h === 'Valor' ? 'right' : 'left',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {extratoFiltrado.map(l => (
                    <tr
                      key={l.id}
                      style={{ borderBottom: '0.5px solid #f1f5f9', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ padding: '10px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#05121b' }}>{l.desc}</span>
                      </td>
                      <td style={{ padding: '10px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{l.conta}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{l.data}</span>
                      </td>
                      <td style={{ padding: '10px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{l.categoria}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999,
                          background: l.tipo === 'entrada' ? '#EAF3DE' : '#FCEBEB',
                          color:      l.tipo === 'entrada' ? '#3B6D11' : '#A32D2D',
                        }}>
                          {l.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>{l.met}</span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: l.tipo === 'entrada' ? '#27500A' : '#791F1F' }}>
                          {l.tipo === 'entrada' ? '+' : '-'} {fmtBRL(l.valor)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
