import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { X, Upload, Pencil, Trash2 } from 'lucide-react'

const fmtBRL = v => `R$ ${Number(v || 0).toLocaleString('pt-BR')}`

const TIPO_BADGE = {
  Corrente:     { bg: 'var(--color-info-bg)',    color: 'var(--color-info-text)'    },
  'Corrente PJ':{ bg: 'var(--color-info-bg)',    color: 'var(--color-info-text)'    },
  Digital:      { bg: 'var(--color-purple-bg)',  color: 'var(--color-purple-text)'  },
  'Digital PJ': { bg: 'var(--color-purple-bg)',  color: 'var(--color-purple-text)'  },
  Poupança:     { bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' },
  'Poupança PJ':{ bg: 'var(--color-warning-bg)', color: 'var(--color-warning-text)' },
  Investimento: { bg: 'var(--color-success-bg)', color: 'var(--color-success-text)' },
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

const calcSaldo = (bancoId, lancs, saldoInicial) => {
  const ent = lancs.filter(l => l.banco_id === bancoId && l.tipo === 'receita').reduce((a, l) => a + Number(l.valor), 0)
  const sai = lancs.filter(l => l.banco_id === bancoId && l.tipo === 'despesa').reduce((a, l) => a + Number(l.valor), 0)
  return Number(saldoInicial || 0) + ent - sai
}

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

export default function BancosContas({
  bancos = [],
  lancamentos = [],
  userId,
  onSaveBanco,
  onDeleteBanco,
  onSaveLancamento,
  onDeleteLancamentos,
  onImportClick,
  savingItem = false,
  saldoInicialDinheiro = 0,
  onSaveSaldoInicialDinheiro,
}) {
  const [filtroBank,          setFiltroBank]          = useState('todos')
  const [modalConta,          setModalConta]          = useState(false)
  const [modalEspecie,        setModalEspecie]        = useState(false)
  const [modalEditMov,        setModalEditMov]        = useState(null)
  const [formConta,           setFormConta]           = useState(EMPTY_CONTA)
  const [formMov,             setFormMov]             = useState(EMPTY_MOV)
  const [selectedLancs,       setSelectedLancs]       = useState(new Set())
  const [modalSaldoDinheiro,  setModalSaldoDinheiro]  = useState(false)
  const [saldoDinheiroInput,  setSaldoDinheiroInput]  = useState('')
  const [savingSaldoDinheiro, setSavingSaldoDinheiro] = useState(false)

  const donutRef   = useRef(null)
  const lineRef    = useRef(null)
  const donutChart = useRef(null)
  const lineChart  = useRef(null)

  const today = new Date().toISOString().slice(0, 10)

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

  const especieSaldo = saldoInicialDinheiro + especieMov.reduce((a, m) => m.tipo === 'entrada' ? a + m.valor : a - m.valor, 0)
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
        data: l.data || '',
        dataFmt: l.data ? `${l.data.slice(8, 10)}/${l.data.slice(5, 7)}` : '—',
        met: l.meio_pagamento || '—',
        tipo: l.tipo === 'receita' ? 'entrada' : 'saida',
        valor: Number(l.valor),
        categoria: l.categoria || '—',
        rawBancoId: l.banco_id || null,
        rawTipo: l.tipo,
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

  const allSelected = extratoFiltrado.length > 0 && extratoFiltrado.every(l => selectedLancs.has(l.id))
  const toggleSelectAll = () => {
    if (allSelected) setSelectedLancs(s => { const n = new Set(s); extratoFiltrado.forEach(l => n.delete(l.id)); return n })
    else setSelectedLancs(s => { const n = new Set(s); extratoFiltrado.forEach(l => n.add(l.id)); return n })
  }
  const toggleSelectLanc = id => setSelectedLancs(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

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
          datasets: [{ data: hasDonutData ? donutValues : [1], backgroundColor: hasDonutData ? donutColors : ['#e2e8f0'], borderWidth: 0 }],
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '68%',
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => hasDonutData ? `R$ ${ctx.raw.toLocaleString('pt-BR')} (${((ctx.raw / ctx.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%)` : 'Sem dados' } },
          },
        },
      })
      lineChart.current = new window.Chart(lineRef.current, {
        type: 'line',
        data: {
          labels: lineData.labels,
          datasets: [
            { label: 'Saldo total', data: lineData.totalData, borderColor: '#1D9E75', backgroundColor: 'rgba(29,158,117,0.07)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 },
            { label: 'Só bancário', data: lineData.bancarioData, borderColor: '#378ADD', borderDash: [4, 3], fill: false, tension: 0.4, pointRadius: 3, borderWidth: 2 },
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
    return () => { alive = false; donutChart.current?.destroy(); lineChart.current?.destroy() }
  }, [bancos, lancamentos])

  const openEditBanco = (b) => {
    setFormConta({
      id:     b.id,
      nome:   b.nome || '',
      tipo:   b.tipo || 'Corrente PJ',
      agencia: b.agencia || '',
      numero: b.numero || '',
      saldo:  b.saldo_inicial ?? '',
      pix:    b.pix || '',
    })
    setModalConta(true)
  }

  const openNewBanco = () => {
    setFormConta(EMPTY_CONTA)
    setModalConta(true)
  }

  const salvarConta = async () => {
    if (!formConta.nome.trim()) return
    await onSaveBanco?.({
      ...(formConta.id ? { id: formConta.id } : {}),
      nome:          formConta.nome,
      tipo:          formConta.tipo,
      agencia:       formConta.agencia,
      numero:        formConta.numero,
      saldo_inicial: parseFloat(formConta.saldo) || 0,
      pix:           formConta.pix,
    })
    setModalConta(false)
    setFormConta(EMPTY_CONTA)
  }

  const deleteBanco = async (id, nome) => {
    if (!window.confirm(`Excluir o banco "${nome}"? Os lançamentos vinculados não serão excluídos.`)) return
    await onDeleteBanco?.(id)
  }

  const openNewMov = () => {
    setFormMov({ ...EMPTY_MOV, data: today })
    setModalEspecie(true)
  }

  const openEditMov = (l) => {
    setModalEditMov({
      id:      l.id,
      desc:    l.desc,
      valor:   String(l.valor),
      data:    l.data,
      cat:     l.categoria,
      tipomov: l.tipo === 'entrada' ? 'entrada' : 'saida',
      obs:     '',
    })
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

  const salvarEditMov = async () => {
    if (!modalEditMov?.desc?.trim() || !modalEditMov.valor || !modalEditMov.data) return
    await onSaveLancamento?.({
      id:             modalEditMov.id,
      descricao:      modalEditMov.desc,
      valor:          parseFloat(modalEditMov.valor) || 0,
      data:           modalEditMov.data,
      categoria:      modalEditMov.cat,
      tipo:           modalEditMov.tipomov === 'entrada' ? 'receita' : 'despesa',
      meio_pagamento: 'Dinheiro',
      banco_id:       null,
    })
    setModalEditMov(null)
  }

  const deleteLancs = async (ids) => {
    const arr = Array.from(ids)
    if (!window.confirm(`Excluir ${arr.length} lançamento${arr.length > 1 ? 's' : ''}?`)) return
    await onDeleteLancamentos?.(arr)
    setSelectedLancs(s => { const n = new Set(s); arr.forEach(id => n.delete(id)); return n })
  }

  const fieldConta = k => e => setFormConta(f => ({ ...f, [k]: e.target.value }))
  const fieldMov   = k => e => setFormMov(f => ({ ...f, [k]: e.target.value }))
  const fieldEditMov = k => e => setModalEditMov(m => ({ ...m, [k]: e.target.value }))
  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#05121b] bg-white outline-none focus:border-[#137789] transition-colors'

  const movModalContent = (fields, setFields, onSave, onClose, title) => (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px]">
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-[#05121b]">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"><X size={16} /></button>
      </div>
      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {['entrada', 'saida'].map(t => (
            <button key={t} onClick={() => setFields(f => ({ ...f, tipomov: t }))} style={{
              padding: '8px 0', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', border: '1px solid',
              background:   fields.tipomov === t ? (t === 'entrada' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)') : 'var(--color-bg-card)',
              color:        fields.tipomov === t ? (t === 'entrada' ? 'var(--color-success-text)' : 'var(--color-danger-text)') : 'var(--color-text-muted)',
              borderColor:  fields.tipomov === t ? (t === 'entrada' ? 'var(--color-success-border)' : 'var(--color-danger-border)') : 'var(--color-border-light)',
            }}>
              {t === 'entrada' ? '+ Entrada' : '− Saída'}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="text-xs font-medium text-slate-500 mb-1.5 block">Descrição</span>
          <input className={inputCls} placeholder="Ex: Venda à vista balcão" value={fields.desc} onChange={e => setFields(f => ({ ...f, desc: e.target.value }))} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">Valor (R$)</span>
            <input className={inputCls} type="number" min="0" step="0.01" placeholder="0,00" value={fields.valor} onChange={e => setFields(f => ({ ...f, valor: e.target.value }))} />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">Data</span>
            <input className={inputCls} type="date" value={fields.data} onChange={e => setFields(f => ({ ...f, data: e.target.value }))} />
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-medium text-slate-500 mb-1.5 block">Categoria</span>
          <select className={inputCls} value={fields.cat} onChange={e => setFields(f => ({ ...f, cat: e.target.value }))}>
            {['Venda à vista', 'Reembolso', 'Depósito', 'Pagamento fornecedor', 'Sangria', 'Outros'].map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-3 px-6 pb-5">
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">Cancelar</button>
        <button onClick={onSave} disabled={savingItem} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#05121b] hover:bg-[#137789] transition-colors disabled:opacity-50">
          {savingItem ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )

  const modalContaEl = modalConta ? ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) { setModalConta(false); setFormConta(EMPTY_CONTA) } }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-[#05121b]">{formConta.id ? 'Editar conta bancária' : 'Nova conta bancária'}</h3>
          <button onClick={() => { setModalConta(false); setFormConta(EMPTY_CONTA) }} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"><X size={16} /></button>
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
          <button onClick={() => { setModalConta(false); setFormConta(EMPTY_CONTA) }} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">Cancelar</button>
          <button onClick={salvarConta} disabled={savingItem} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#05121b] hover:bg-[#137789] transition-colors disabled:opacity-50">
            {savingItem ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  const modalEspecieEl = modalEspecie ? ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) setModalEspecie(false) }}>
      {movModalContent(formMov, setFormMov, salvarMov, () => setModalEspecie(false), 'Movimentação em espécie')}
    </div>,
    document.body
  ) : null

  const modalEditMovEl = modalEditMov ? ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) setModalEditMov(null) }}>
      {movModalContent(modalEditMov, setModalEditMov, salvarEditMov, () => setModalEditMov(null), 'Editar lançamento')}
    </div>,
    document.body
  ) : null

  const modalSaldoDinheiroEl = modalSaldoDinheiro ? ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) setModalSaldoDinheiro(false) }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[380px]">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 20 }}>💵</span>
            <h3 className="text-sm font-semibold text-[#05121b]">Saldo inicial — Dinheiro em espécie</h3>
          </div>
          <button onClick={() => setModalSaldoDinheiro(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"><X size={16} /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <p className="text-xs text-slate-500 leading-relaxed">Informe o valor em espécie que você já tinha antes de começar a registrar os lançamentos. Esse valor será somado às movimentações.</p>
          <label className="block">
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">Saldo inicial (R$)</span>
            <input className={inputCls} type="number" min="0" step="0.01" placeholder="0,00"
              value={saldoDinheiroInput}
              onChange={e => setSaldoDinheiroInput(e.target.value)}
            />
          </label>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={() => setModalSaldoDinheiro(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">Cancelar</button>
          <button disabled={savingSaldoDinheiro} onClick={async () => {
            setSavingSaldoDinheiro(true)
            const val = parseFloat(saldoDinheiroInput) || 0
            if (onSaveSaldoInicialDinheiro) await onSaveSaldoInicialDinheiro(val)
            setSavingSaldoDinheiro(false)
            setModalSaldoDinheiro(false)
          }} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50" style={{ background: 'var(--color-warning-dot)' }}>
            {savingSaldoDinheiro ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      {modalContaEl}
      {modalEspecieEl}
      {modalEditMovEl}
      {modalSaldoDinheiroEl}

      <div className="max-w-7xl mx-auto w-full" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 2 }}>Gestão financeira</p>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>Bancos e contas</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={onImportClick} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors">
              <Upload size={14} /> Importar
            </button>
            <button onClick={openNewMov} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 transition-colors">
              + Mov. espécie
            </button>
            <button onClick={openNewBanco} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#05121b] hover:bg-[#137789] transition-colors">
              + Nova conta
            </button>
          </div>
        </div>

        {bancos.length === 0 && lancamentos.length === 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
            <p className="text-slate-400 text-sm mb-1">Nenhum banco cadastrado ainda.</p>
            <p className="text-slate-400 text-sm">Clique em <strong className="text-[#05121b]">+ Nova conta</strong> para começar.</p>
          </div>
        )}

        {/* Cards de métricas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
          {card('var(--color-success-bg)', 'var(--color-success-border)', <><p style={labelSt('var(--color-success-text)')}>Saldo total consolidado</p><p style={valueSt('var(--color-success-text)')}>{fmtBRL(saldoTotal)}</p><p style={subSt('var(--color-success-text)')}>todas as contas</p></>)}
          {card('var(--color-info-bg)', 'var(--color-info-border)', <><p style={labelSt('var(--color-info-text)')}>Saldo bancário</p><p style={valueSt('var(--color-info-text)')}>{fmtBRL(saldoBancario)}</p><p style={subSt('var(--color-info-text)')}>{bancos.length} conta{bancos.length !== 1 ? 's' : ''} ativa{bancos.length !== 1 ? 's' : ''}</p></>)}
          {card('var(--color-warning-bg)', 'var(--color-warning-border)', <><p style={labelSt('var(--color-warning-text)')}>Dinheiro em espécie</p><p style={valueSt('var(--color-warning-text)')}>{fmtBRL(especieSaldo)}</p><p style={subSt('var(--color-warning-text)')}>caixa físico</p></>)}
          {card('var(--color-purple-bg)', 'var(--color-purple-border)', <><p style={labelSt('var(--color-purple-text)')}>Entradas do mês</p><p style={valueSt('var(--color-purple-text)')}>{fmtBRL(entradasMes)}</p><p style={subSt('var(--color-purple-text)')}>receitas registradas</p></>)}
          <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)', borderRadius: 12, padding: '1rem 1.1rem' }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Última atualização</p>
            <p style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>Hoje</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Cards de contas bancárias */}
        {bancosComSaldo.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
            {bancosComSaldo.map(b => {
              const badge = TIPO_BADGE[b.tipo] || { bg: 'var(--color-bg-card-alt)', color: 'var(--color-text-secondary)' }
              const entradas = lancamentos.filter(l => l.banco_id === b.id && l.tipo === 'receita' && l.data?.startsWith(mesAtual)).reduce((a, l) => a + Number(l.valor), 0)
              const saidas   = lancamentos.filter(l => l.banco_id === b.id && l.tipo === 'despesa' && l.data?.startsWith(mesAtual)).reduce((a, l) => a + Number(l.valor), 0)
              return (
                <div key={b.id} style={{ background: 'var(--color-bg-card)', border: '0.5px solid var(--color-border-light)', borderRadius: 12, padding: '1.1rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: b.color + '20', color: b.color, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {b.init}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.nome}</p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>{b.tipo || 'Corrente'}{b.agencia ? ` · Ag. ${b.agencia}` : ''}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => openEditBanco(b)} title="Editar" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#94a3b8', borderRadius: 6, display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.color='#137789'} onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}>
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteBanco(b.id, b.nome)} title="Excluir" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#94a3b8', borderRadius: 6, display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.color='#dc2626'} onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2 }}>Saldo disponível</p>
                  <p style={{ fontSize: 20, fontWeight: 500, color: b.saldoCalc >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)', margin: '0 0 10px' }}>{fmtBRL(b.saldoCalc)}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Entradas do mês</span>
                      <span style={{ color: 'var(--color-success-text)', fontWeight: 500 }}>+{fmtBRL(entradas)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Saídas do mês</span>
                      <span style={{ color: 'var(--color-danger-text)', fontWeight: 500 }}>-{fmtBRL(saidas)}</span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: badge.bg, color: badge.color }}>
                      {b.tipo || 'Corrente'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Card dinheiro em espécie */}
        <div style={{ background: 'var(--color-bg-card)', border: '0.5px solid var(--color-border-light)', borderRadius: 12, padding: '1.1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>Dinheiro em espécie</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '2px 0 0' }}>Caixa físico da empresa</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <p style={{ fontSize: 22, fontWeight: 500, color: especieSaldo >= 0 ? 'var(--color-success-text)' : 'var(--color-danger-text)', margin: 0 }}>{fmtBRL(especieSaldo)}</p>
              {onSaveSaldoInicialDinheiro && (
                <>
                  <button title="Editar saldo inicial" onClick={() => { setSaldoDinheiroInput(saldoInicialDinheiro > 0 ? String(saldoInicialDinheiro) : ''); setModalSaldoDinheiro(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, lineHeight: 0 }}><Pencil size={15} /></button>
                  {saldoInicialDinheiro > 0 && (
                    <button title="Zerar saldo inicial" onClick={async () => { if(window.confirm('Zerar o saldo inicial do dinheiro em espécie?')){ await onSaveSaldoInicialDinheiro(0); } }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, lineHeight: 0 }}><Trash2 size={15} /></button>
                  )}
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Entradas do mês', valor: `+ ${fmtBRL(especieMov.filter(m => m.tipo === 'entrada' && lancamentos.find(l => l.id === m.id)?.data?.startsWith(mesAtual)).reduce((s, m) => s + m.valor, 0))}`, cor: 'var(--color-success-text)' },
              { label: 'Saídas do mês',   valor: `- ${fmtBRL(especieMov.filter(m => m.tipo === 'saida'   && lancamentos.find(l => l.id === m.id)?.data?.startsWith(mesAtual)).reduce((s, m) => s + m.valor, 0))}`, cor: 'var(--color-danger-text)' },
              { label: 'Total movimentos', valor: `${especieMov.length}`, cor: 'var(--color-text-primary)' },
            ].map(({ label, valor, cor }) => (
              <div key={label} style={{ background: 'var(--color-bg-card-alt)', borderRadius: 8, padding: '.75rem' }}>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: '0 0 4px' }}>{label}</p>
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
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: i < Math.min(especieMov.length, 10) - 1 ? '0.5px solid var(--color-border-subtle)' : 'none' }}>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.desc}</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0 }}>{m.data}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: m.tipo === 'entrada' ? 'var(--color-success-text)' : 'var(--color-danger-text)', flexShrink: 0 }}>
                    {m.tipo === 'entrada' ? '+' : '-'} {fmtBRL(m.valor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Gráficos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)', borderRadius: 12, padding: '1rem 1.2rem' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 12, marginTop: 0 }}>Distribuição do saldo</p>
            <div style={{ position: 'relative', width: '100%', height: 180 }}>
              <canvas ref={donutRef} />
            </div>
            {hasDonutData ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 12 }}>
                {bancosComSaldo.map((b, i) => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: BANK_COLORS[i % BANK_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{b.nome} <strong style={{ color: 'var(--color-text-primary)' }}>{fmtBRL(b.saldoCalc)}</strong></span>
                  </div>
                ))}
                {especieSaldo > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: '#888780', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Espécie <strong style={{ color: 'var(--color-text-primary)' }}>{fmtBRL(especieSaldo)}</strong></span>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>Cadastre bancos para visualizar a distribuição</p>
            )}
          </div>
          <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)', borderRadius: 12, padding: '1rem 1.2rem' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 10, marginTop: 0 }}>Evolução do saldo — 6 meses</p>
            <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: '#1D9E75' }} />
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Saldo total</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 0, borderTop: '2px dashed #378ADD' }} />
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Só bancário</span>
              </div>
            </div>
            <div style={{ position: 'relative', width: '100%', height: 200 }}>
              <canvas ref={lineRef} />
            </div>
          </div>
        </div>

        {/* Extrato consolidado */}
        <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-light)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderBottom: '0.5px solid var(--color-border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>
                {extratoFiltrado.length} lançamento{extratoFiltrado.length !== 1 ? 's' : ''}
              </p>
              {selectedLancs.size > 0 && (
                <button onClick={() => deleteLancs(selectedLancs)} style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8,
                  fontSize: 11, fontWeight: 600, border: '1px solid #fecaca',
                  background: '#fef2f2', color: '#dc2626', cursor: 'pointer',
                }}>
                  <Trash2 size={12} /> Excluir {selectedLancs.size}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {filtros.map(({ key, label }) => (
                <button key={key} onClick={() => setFiltroBank(key)} style={{
                  padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 500, border: '0.5px solid', cursor: 'pointer', transition: 'all 0.15s',
                  background:  filtroBank === key ? 'var(--color-bg-elevated)' : 'var(--color-bg-card-alt)',
                  color:       filtroBank === key ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                  borderColor: filtroBank === key ? 'var(--color-bg-elevated)' : 'var(--color-border-light)',
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {extratoFiltrado.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>Nenhum lançamento encontrado.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid var(--color-border-light)', background: 'var(--color-bg-card-alt)' }}>
                    <th style={{ width: 40, padding: '10px 12px' }}>
                      <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} style={{ cursor: 'pointer', accentColor: '#137789' }} />
                    </th>
                    {['Descrição', 'Conta', 'Data', 'Categoria', 'Tipo', 'Método', 'Valor', ''].map(h => (
                      <th key={h} style={{
                        padding: '10px 12px', fontSize: 11, fontWeight: 500, color: 'var(--color-text-muted)',
                        textAlign: h === 'Valor' ? 'right' : 'left',
                        whiteSpace: 'nowrap',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {extratoFiltrado.map(l => {
                    const isSel = selectedLancs.has(l.id)
                    return (
                      <tr key={l.id} style={{ borderBottom: '0.5px solid var(--color-border-subtle)', background: isSel ? 'var(--color-row-selected)' : '', transition: 'background 0.1s' }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--color-bg-card-alt)' }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = '' }}>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <input type="checkbox" checked={isSel} onChange={() => toggleSelectLanc(l.id)} style={{ cursor: 'pointer', accentColor: '#137789' }} />
                        </td>
                        <td style={{ padding: '10px 12px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>{l.desc}</span>
                        </td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{l.conta}</span>
                        </td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{l.dataFmt}</span>
                        </td>
                        <td style={{ padding: '10px 12px', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{l.categoria}</span>
                        </td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: l.tipo === 'entrada' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', color: l.tipo === 'entrada' ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                            {l.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{l.met}</span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: l.tipo === 'entrada' ? 'var(--color-success-text)' : 'var(--color-danger-text)' }}>
                            {l.tipo === 'entrada' ? '+' : '-'} {fmtBRL(l.valor)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 8px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => openEditMov(l)} title="Editar" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#94a3b8', borderRadius: 6, display: 'flex', alignItems: 'center' }}
                              onMouseEnter={e => e.currentTarget.style.color='#137789'} onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}>
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => deleteLancs(new Set([l.id]))} title="Excluir" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#94a3b8', borderRadius: 6, display: 'flex', alignItems: 'center' }}
                              onMouseEnter={e => e.currentTarget.style.color='#dc2626'} onMouseLeave={e => e.currentTarget.style.color='#94a3b8'}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  )
}
