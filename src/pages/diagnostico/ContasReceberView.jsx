import React, { useState, useEffect, useRef } from 'react'
import { X, AlertTriangle, Clock, Upload, ChevronLeft, ChevronRight } from 'lucide-react'

const fmtBRL = v => `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = d => d ? `${d.substring(8,10)}/${d.substring(5,7)}/${d.substring(0,4)}` : '—'
const todayStr = new Date().toISOString().split('T')[0]

const STATUS_BADGE = {
  recebido:  { bg: '#EAF3DE', color: '#3B6D11', label: 'Recebido'     },
  aberto:    { bg: '#FAEEDA', color: '#854F0B', label: 'Em aberto'    },
  atrasado:  { bg: '#FCEBEB', color: '#A32D2D', label: 'Inadimplente' },
  parcial:   { bg: '#E6F1FB', color: '#185FA5', label: 'Pago parcial' },
}

const FILTROS = [
  { key: 'todos',    label: 'Todas'         },
  { key: 'aberto',   label: 'Em aberto'     },
  { key: 'atrasado', label: 'Inadimplentes' },
  { key: 'recebido', label: 'Recebidas'     },
]

const DONUT_COLORS = ['#1D9E75','#378ADD','#7F77DD','#BA7517','#D85A30','#137789','#888780']
const MEIOS = ['PIX','Dinheiro','Transferência Bancária','Cartão de Débito','Cartão de Crédito','Cheque','Boleto','Outros']

export default function ContasReceberView({
  contasReceber = [],
  bancos = [],
  onSalvar,
  onEditar,
  onReceber,
  onPagamentoParcial,
  onExcluir,
  onImportClick,
  savingItem = false,
}) {
  const [filtro, setFiltro] = useState('todos')
  const [crMes, setCrMes] = useState(new Date().toISOString().slice(0,7))
  const [crSelected, setCrSelected] = useState(new Set())
  const [modalForm, setModalForm] = useState(null)
  const [modalReceber, setModalReceber] = useState(null)
  const [modalParcial, setModalParcial] = useState(null)

  const lineRef    = useRef(null)
  const donutRef   = useRef(null)
  const lineChart  = useRef(null)
  const donutChart = useRef(null)

  const cobranças = contasReceber.map(cr => {
    const venc = cr.vencimento || ''
    const realStatus = cr.status === 'recebido' ? 'recebido'
      : cr.status === 'parcial' ? 'parcial'
      : venc && venc < todayStr ? 'atrasado'
      : 'aberto'
    const diasAteVencer = venc && realStatus === 'aberto'
      ? Math.ceil((new Date(venc) - new Date(todayStr)) / 86400000)
      : null
    return {
      id:            cr.id,
      desc:          cr.cliente ? `${cr.cliente} — ${cr.descricao}` : cr.descricao,
      cat:           cr.categoria || 'Outros',
      venc,
      dataPagamento: cr.data_pagamento || null,
      met:           cr.meio_pagamento || '',
      valor:         Number(cr.valor) || 0,
      status:        realStatus,
      diasAteVencer,
      _raw:          cr,
    }
  })

  const recebido     = cobranças.filter(c => c.status === 'recebido').reduce((s, c) => s + c.valor, 0)
  const inadimplente = cobranças.filter(c => c.status === 'atrasado').reduce((s, c) => s + c.valor, 0)
  const totalEmitido = cobranças.reduce((s, c) => s + c.valor, 0)
  const atrasados    = cobranças.filter(c => c.status === 'atrasado')
  const d7str        = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split('T')[0] })()
  const vencendoLogo = cobranças.filter(c => c.status === 'aberto' && c.venc >= todayStr && c.venc <= d7str)
  const totalVencer7 = vencendoLogo.reduce((s, c) => s + c.valor, 0)
  const totalAReceber= cobranças.filter(c => c.status !== 'recebido').reduce((s, c) => s + c.valor, 0)
  const qtdAReceber  = cobranças.filter(c => c.status !== 'recebido').length
  const taxaInad     = totalEmitido > 0 ? (inadimplente / totalEmitido * 100).toFixed(1) : '0'
  const pctRecebido  = totalEmitido ? recebido / totalEmitido * 100 : 0
  const pctInad      = totalEmitido ? inadimplente / totalEmitido * 100 : 0
  const pctVencer    = totalEmitido ? totalVencer7 / totalEmitido * 100 : 0

  const filtrados = filtro === 'todos' ? cobranças : cobranças.filter(c => c.status === filtro)

  const lineData = (() => {
    const labels = [], emitido = [], recebidoData = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
      const mes = d.toISOString().slice(0, 7)
      labels.push(d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''))
      emitido.push(cobranças.filter(c => c.venc?.startsWith(mes)).reduce((a, c) => a + c.valor, 0))
      recebidoData.push(cobranças.filter(c => c.venc?.startsWith(mes) && c.status === 'recebido').reduce((a, c) => a + c.valor, 0))
    }
    return { labels, emitido, recebidoData }
  })()

  const catMap = {}
  cobranças.forEach(c => { catMap[c.cat] = (catMap[c.cat] || 0) + c.valor })
  const donutCats = Object.entries(catMap).map(([label, value], i) => ({ label, value, color: DONUT_COLORS[i % DONUT_COLORS.length] }))

  useEffect(() => {
    let alive = true
    const initAll = () => {
      if (!alive || !lineRef.current || !donutRef.current) return
      lineChart.current?.destroy()
      donutChart.current?.destroy()
      const tooltipBRL = { callbacks: { label: ctx => `R$ ${ctx.raw.toLocaleString('pt-BR')}` } }
      lineChart.current = new window.Chart(lineRef.current, {
        type: 'line',
        data: {
          labels: lineData.labels,
          datasets: [
            { label: 'Recebido', data: lineData.recebidoData, borderColor: '#1D9E75', backgroundColor: 'rgba(29,158,117,0.07)', fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2 },
            { label: 'Emitido',  data: lineData.emitido,      borderColor: '#D3D1C7', borderDash: [4,3], fill: false, tension: 0.4, pointRadius: 3, borderWidth: 2 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: tooltipBRL },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: { font: { size: 11 } } },
            y: { grid: { color: 'rgba(128,128,128,0.08)' }, border: { display: false }, ticks: { font: { size: 11 }, callback: v => `R$ ${v/1000}k` } },
          },
        },
      })
      if (donutCats.length > 0) {
        donutChart.current = new window.Chart(donutRef.current, {
          type: 'doughnut',
          data: {
            labels: donutCats.map(d => d.label),
            datasets: [{ data: donutCats.map(d => d.value), backgroundColor: donutCats.map(d => d.color), borderWidth: 0 }],
          },
          options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: false }, tooltip: tooltipBRL } },
        })
      }
    }
    if (window.Chart) initAll()
    else { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'; s.onload = initAll; document.head.appendChild(s) }
    return () => { alive = false; lineChart.current?.destroy(); donutChart.current?.destroy() }
  }, [contasReceber])

  const toggleCrSelect = id => setCrSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const handleBulkDelete = () => {
    if (crSelected.size === 0) return
    if (!confirm(`Excluir ${crSelected.size} cobrança(s)? Essa ação não pode ser desfeita.`)) return
    onExcluir?.(Array.from(crSelected))
    setCrSelected(new Set())
  }

  const card = (bg, border, children) => (
    <div style={{ background: bg, border: `0.5px solid ${border}`, borderRadius: 12, padding: '1rem 1.1rem' }}>{children}</div>
  )
  const ls = c => ({ fontSize: 11, fontWeight: 500, color: c, marginBottom: 4 })
  const vs = c => ({ fontSize: 19, fontWeight: 500, color: c, lineHeight: 1.2 })
  const ss = c => ({ fontSize: 11, color: c, marginTop: 2 })
  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#05121b] bg-white outline-none focus:border-[#137789] transition-colors'

  // Confirmar recebimento total
  const handleConfirmarReceber = () => {
    onReceber?.(
      modalReceber.id,
      modalReceber.meioPagamento,
      modalReceber.dataRecebimento || todayStr,
      modalReceber.bancoId || null,
      modalReceber.cat,
    )
    setModalReceber(null)
  }

  // Confirmar pagamento parcial
  const handleConfirmarParcial = () => {
    onPagamentoParcial?.({
      id:              modalParcial.id,
      valorPago:       parseFloat(modalParcial.valorPago) || 0,
      novaData:        modalParcial.novaData,
      meio:            modalParcial.meio,
      bancoId:         modalParcial.bancoId || null,
      desc:            modalParcial.desc,
      cat:             modalParcial.cat,
      valorTotal:      modalParcial.valorTotal,
      dataRecebimento: modalParcial.dataRecebimento,
    })
    setModalParcial(null)
  }

  return (
    <>
      {/* Modal Nova Cobrança */}
      {modalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setModalForm(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[440px]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-[#05121b]">{modalForm.id ? 'Editar cobrança' : 'Nova cobrança'}</h3>
              <button onClick={() => setModalForm(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-slate-500 mb-1.5 block">Cliente</span>
                <input className={inputCls} placeholder="Ex: Empresa Alpha" value={modalForm.cliente || ''} onChange={e => setModalForm(f => ({ ...f, cliente: e.target.value }))} />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-500 mb-1.5 block">Descrição</span>
                <input className={inputCls} placeholder="Ex: Mensalidade consultoria" value={modalForm.descricao || ''} onChange={e => setModalForm(f => ({ ...f, descricao: e.target.value }))} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block">Valor (R$)</span>
                  <input className={inputCls} type="number" min="0" step="0.01" placeholder="0,00" value={modalForm.valor || ''} onChange={e => setModalForm(f => ({ ...f, valor: e.target.value }))} />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block">Data de Vencimento</span>
                  <input className={inputCls} type="date" value={modalForm.vencimento || todayStr} onChange={e => setModalForm(f => ({ ...f, vencimento: e.target.value }))} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block">Categoria</span>
                  <select className={inputCls} value={modalForm.categoria || 'Outros'} onChange={e => setModalForm(f => ({ ...f, categoria: e.target.value }))}>
                    {['Mensalidade','Prestação de serviço','Consultoria','Licença','Comissão','Projeto','Outros'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block">Status</span>
                  <select className={inputCls} value={modalForm.status || 'pendente'} onChange={e => setModalForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="pendente">Pendente</option>
                    <option value="recebido">Recebido</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-5">
              <button onClick={() => setModalForm(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">Cancelar</button>
              <button disabled={savingItem || !modalForm.descricao || !modalForm.valor || !modalForm.vencimento}
                onClick={() => { onSalvar?.({ ...modalForm, valor: parseFloat(modalForm.valor) || 0 }); setModalForm(null) }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#05121b] hover:bg-[#137789] transition-colors disabled:opacity-50">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Recebimento Total */}
      {modalReceber && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setModalReceber(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[380px]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-[#05121b]">Confirmar recebimento</h3>
              <button onClick={() => setModalReceber(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-slate-500">{modalReceber.desc}</p>
              <p className="text-xl font-black text-[#05121b]">{fmtBRL(modalReceber.valor)}</p>
              <label className="block">
                <span className="text-xs font-medium text-slate-500 mb-1.5 block">Data do recebimento</span>
                <input className={inputCls} type="date" value={modalReceber.dataRecebimento || todayStr} onChange={e => setModalReceber(m => ({ ...m, dataRecebimento: e.target.value }))} />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-500 mb-1.5 block">Forma de recebimento</span>
                <select className={inputCls} value={modalReceber.meioPagamento} onChange={e => setModalReceber(m => ({ ...m, meioPagamento: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {MEIOS.map(m => <option key={m}>{m}</option>)}
                </select>
              </label>
              {modalReceber.meioPagamento && modalReceber.meioPagamento !== 'Dinheiro' && (
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block">Conta bancária creditada</span>
                  <select className={inputCls} value={modalReceber.bancoId || ''} onChange={e => setModalReceber(m => ({ ...m, bancoId: e.target.value }))}>
                    <option value="">— Nenhuma —</option>
                    {bancos.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                  </select>
                </label>
              )}
              <p className="text-[10px] text-slate-400 bg-slate-50 rounded-lg p-2">✓ Será lançado como receita no fluxo de caixa.</p>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setModalReceber(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">Cancelar</button>
              <button disabled={savingItem || !modalReceber.meioPagamento}
                onClick={handleConfirmarReceber}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#137789] hover:bg-[#0e5f6b] transition-colors disabled:opacity-50">
                Confirmar recebimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pagamento Parcial */}
      {modalParcial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setModalParcial(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px]">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-[#05121b]">Pagamento parcial</h3>
              <button onClick={() => setModalParcial(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"><X size={16} /></button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-slate-500">{modalParcial.desc}</p>
              <p className="text-xs text-slate-400">Valor total original: <strong className="text-[#05121b]">{fmtBRL(modalParcial.valorTotal)}</strong></p>
              <label className="block">
                <span className="text-xs font-medium text-slate-500 mb-1.5 block">Valor recebido agora (R$)</span>
                <input className={inputCls} type="number" min="0" max={modalParcial.valorTotal} step="0.01" placeholder="0,00"
                  value={modalParcial.valorPago || ''} onChange={e => setModalParcial(m => ({ ...m, valorPago: e.target.value }))} />
                {modalParcial.valorPago > 0 && (
                  <p className="text-xs text-slate-400 mt-1">Restante: <strong className="text-orange-600">{fmtBRL(Math.max(0, modalParcial.valorTotal - parseFloat(modalParcial.valorPago || 0)))}</strong></p>
                )}
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-500 mb-1.5 block">Data do recebimento</span>
                <input className={inputCls} type="date" value={modalParcial.dataRecebimento || todayStr} onChange={e => setModalParcial(m => ({ ...m, dataRecebimento: e.target.value }))} />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-500 mb-1.5 block">Nova data de vencimento do restante</span>
                <input className={inputCls} type="date" value={modalParcial.novaData || ''} onChange={e => setModalParcial(m => ({ ...m, novaData: e.target.value }))} />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-slate-500 mb-1.5 block">Forma de recebimento</span>
                <select className={inputCls} value={modalParcial.meio || ''} onChange={e => setModalParcial(m => ({ ...m, meio: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {MEIOS.map(m => <option key={m}>{m}</option>)}
                </select>
              </label>
              {modalParcial.meio && modalParcial.meio !== 'Dinheiro' && (
                <label className="block">
                  <span className="text-xs font-medium text-slate-500 mb-1.5 block">Conta bancária creditada</span>
                  <select className={inputCls} value={modalParcial.bancoId || ''} onChange={e => setModalParcial(m => ({ ...m, bancoId: e.target.value }))}>
                    <option value="">— Nenhuma —</option>
                    {bancos.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
                  </select>
                </label>
              )}
              <p className="text-[10px] text-slate-400 bg-slate-50 rounded-lg p-2">✓ O valor recebido será lançado como receita. A cobrança será atualizada com o valor restante.</p>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setModalParcial(null)} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors">Cancelar</button>
              <button disabled={savingItem || !modalParcial.valorPago || !modalParcial.meio || !modalParcial.novaData}
                onClick={handleConfirmarParcial}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#378ADD] hover:bg-[#2563EB] transition-colors disabled:opacity-50">
                Registrar pagamento parcial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page */}
      <div className="max-w-7xl mx-auto w-full fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>Gestão financeira</p>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: '#05121b', margin: 0 }}>Contas a receber</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {(()=>{
              const[y,m]=crMes.split('-');
              const prevM=(()=>{const d=new Date(parseInt(y),parseInt(m)-2);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;})();
              const nextM=(()=>{const d=new Date(parseInt(y),parseInt(m));return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;})();
              const lbl=(()=>{const n=new Date(parseInt(y),parseInt(m)-1).toLocaleString('pt-BR',{month:'long',year:'numeric'});return n.charAt(0).toUpperCase()+n.slice(1);})();
              return(
                <div style={{display:'flex',alignItems:'center',gap:4,background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:10,padding:'4px 8px'}}>
                  <button onClick={()=>setCrMes(prevM)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px 4px',color:'#94a3b8',display:'flex',alignItems:'center'}}><ChevronLeft size={14}/></button>
                  <span style={{fontSize:12,color:'#64748b',minWidth:130,textAlign:'center'}}>{lbl}</span>
                  <button onClick={()=>setCrMes(nextM)} style={{background:'none',border:'none',cursor:'pointer',padding:'2px 4px',color:'#94a3b8',display:'flex',alignItems:'center'}}><ChevronRight size={14}/></button>
                </div>
              );
            })()}
            {onImportClick&&(
              <button onClick={onImportClick} style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:10,padding:'6px 14px',fontSize:12,fontWeight:500,color:'#05121b',cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
                <Upload size={12}/>Importar
              </button>
            )}
            <button onClick={() => setModalForm({ cliente: '', descricao: '', valor: '', vencimento: todayStr, categoria: 'Mensalidade', status: 'pendente' })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#05121b] hover:bg-[#137789] transition-colors">
              + Nova cobrança
            </button>
          </div>
        </div>

        {cobranças.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center">
            <p className="text-slate-300 text-sm font-bold uppercase tracking-widest mb-2">Sem cobranças cadastradas</p>
            <p className="text-slate-400 text-xs">Clique em "Nova cobrança" para começar</p>
          </div>
        ) : (
          <>
            {/* Metric cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
              {card('#EAF3DE','#C0DD97', <><p style={ls('#3B6D11')}>Total a receber</p><p style={vs('#27500A')}>{fmtBRL(totalAReceber)}</p><p style={ss('#3B6D11')}>{qtdAReceber} cobranças</p></>)}
              {card('#FCEBEB','#F7C1C1', <><p style={ls('#993C1D')}>Inadimplentes</p><p style={vs('#791F1F')}>{fmtBRL(inadimplente)}</p><p style={ss('#993C1D')}>{atrasados.length} clientes</p></>)}
              {card('#FAEEDA','#FAC775', <><p style={ls('#854F0B')}>Vencem em 7 dias</p><p style={vs('#633806')}>{fmtBRL(totalVencer7)}</p><p style={ss('#854F0B')}>{vencendoLogo.length} cobranças</p></>)}
              {card('#EAF3DE','#C0DD97', <><p style={ls('#3B6D11')}>Recebido</p><p style={vs('#27500A')}>{fmtBRL(recebido)}</p><p style={ss('#3B6D11')}>{cobranças.filter(c=>c.status==='recebido').length} cobranças</p></>)}
              {card('#E6F1FB','#B5D4F4', <><p style={ls('#185FA5')}>Total emitido</p><p style={vs('#0C447C')}>{fmtBRL(totalEmitido)}</p><p style={{ fontSize:11,color:'#185FA5',marginTop:2 }}>{cobranças.length} cobranças</p></>)}
              <div className="bg-slate-50 border border-slate-200" style={{ borderRadius: 12, padding: '1rem 1.1rem' }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4 }}>Taxa inadimplência</p>
                <p style={{ fontSize: 19, fontWeight: 500, color: '#05121b', lineHeight: 1.2 }}>{taxaInad}%</p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>meta: abaixo de 5%</p>
              </div>
            </div>

            {/* Alertas de vencimento */}
            {(atrasados.length > 0 || vencendoLogo.length > 0) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {atrasados.length > 0 && (
                  <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <AlertTriangle size={16} color="#D85A30" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: '#791F1F', margin: 0 }}>
                      <strong>{atrasados.length} cobranças em atraso</strong> — Total inadimplente: <strong>{fmtBRL(inadimplente)}</strong>
                    </p>
                  </div>
                )}
                {vencendoLogo.length > 0 && (
                  <div style={{ background: '#FAEEDA', border: '0.5px solid #EF9F27', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Clock size={16} color="#BA7517" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: '#633806', margin: 0 }}>
                      <strong>{vencendoLogo.length} cobranças vencem nos próximos 7 dias</strong> — Total: <strong>{fmtBRL(totalVencer7)}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Barra de situação */}
            <div className="bg-white border border-slate-200" style={{ borderRadius: 12, padding: '1rem 1.2rem' }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: '0 0 10px' }}>Situação das cobranças</p>
              <div style={{ display: 'flex', gap: 3, height: 10, borderRadius: 999, overflow: 'hidden', background: '#f1f5f9' }}>
                <div style={{ width: `${pctRecebido}%`, background: '#1D9E75', transition: 'width 0.5s' }} />
                <div style={{ width: `${pctInad}%`,     background: '#D85A30', transition: 'width 0.5s' }} />
                <div style={{ width: `${pctVencer}%`,   background: '#EF9F27', transition: 'width 0.5s' }} />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginTop: 10 }}>
                {[
                  { color: '#1D9E75', label: 'Recebido',     valor: recebido,     pct: pctRecebido },
                  { color: '#D85A30', label: 'Inadimplente', valor: inadimplente, pct: pctInad     },
                  { color: '#EF9F27', label: 'A vencer (7d)',valor: totalVencer7, pct: pctVencer   },
                ].map(({ color, label, valor, pct }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: 11, color: '#64748b' }}>{label} <strong style={{ color: '#05121b' }}>{fmtBRL(valor)}</strong> ({pct.toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
              <div className="bg-white border border-slate-200" style={{ borderRadius: 12, padding: '1rem 1.2rem' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: '0 0 8px' }}>Recebimentos — últimos 6 meses</p>
                <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#1D9E75' }} /><span style={{ fontSize: 11, color: '#64748b' }}>Recebido</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 14, height: 0, borderTop: '2px dashed #D3D1C7' }} /><span style={{ fontSize: 11, color: '#64748b' }}>Emitido</span></div>
                </div>
                <div style={{ position: 'relative', width: '100%', height: 180 }}><canvas ref={lineRef} /></div>
              </div>
              <div className="bg-white border border-slate-200" style={{ borderRadius: 12, padding: '1rem 1.2rem' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: '0 0 12px' }}>Por categoria</p>
                {donutCats.length > 0 ? (
                  <>
                    <div style={{ position: 'relative', width: '100%', height: 150 }}><canvas ref={donutRef} /></div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 10 }}>
                      {donutCats.map(({ color, label, value }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                          <span style={{ fontSize: 11, color: '#64748b' }}>{label} <strong style={{ color: '#05121b' }}>{fmtBRL(value)}</strong></span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#d1d5db', fontSize: 12 }}>Sem dados</p></div>}
              </div>
            </div>
          </>
        )}

        {/* Tabela */}
        <div className="bg-white border border-slate-200" style={{ borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderBottom: '0.5px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: 0 }}>{filtrados.length} cobranças</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {FILTROS.map(({ key, label }) => (
                  <button key={key} onClick={() => setFiltro(key)} style={{ padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700, border: '1px solid', cursor: 'pointer', background: filtro === key ? '#05121b' : 'transparent', color: filtro === key ? '#fff' : '#64748b', borderColor: filtro === key ? '#05121b' : '#e2e8f0' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {crSelected.size > 0 && (
              <button onClick={handleBulkDelete} style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, background: '#FCEBEB', color: '#A32D2D', border: '1px solid #F7C1C1', cursor: 'pointer', fontWeight: 600 }}>
                Excluir {crSelected.size} selecionada(s)
              </button>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', minWidth: 800 }}>
              <colgroup>
                <col style={{ width: '4%' }} /><col style={{ width: '22%' }} /><col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} /><col style={{ width: '10%' }} /><col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} /><col style={{ width: '24%' }} />
              </colgroup>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #e2e8f0', background: '#f8fafc' }}>
                  <th style={{ padding: '10px 12px' }}></th>
                  {['Descrição','Categoria','Vencimento','Data pgto.','Status','Valor','Ações'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 500, color: '#94a3b8', textAlign: h === 'Valor' ? 'right' : 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map(c => {
                  const isAtrasado  = c.status === 'atrasado'
                  const isRecebido  = c.status === 'recebido'
                  const statusBadge = STATUS_BADGE[c.status] || STATUS_BADGE.aberto
                  const valorColor  = isAtrasado ? '#791F1F' : isRecebido ? '#27500A' : '#05121b'
                  const isSelected  = crSelected.has(c.id)
                  const rowBg       = isSelected ? '#f0f9ff' : isAtrasado ? '#fffbfa' : undefined
                  return (
                    <tr key={c.id}
                      style={{ borderBottom: '0.5px solid #f1f5f9', background: rowBg, transition: 'background 0.1s' }}
                      onMouseEnter={e => { if (!isSelected && !isAtrasado) e.currentTarget.style.background = '#f8fafc' }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isAtrasado ? '#fffbfa' : '' }}>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleCrSelect(c.id)} style={{ cursor: 'pointer', accentColor: '#137789' }} />
                      </td>
                      <td style={{ padding: '10px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: '#05121b' }}>{c.desc}</span>
                      </td>
                      <td style={{ padding: '10px 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{c.cat}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div>
                          <span style={{ fontSize: 12, color: isAtrasado ? '#D85A30' : '#64748b', fontWeight: isAtrasado ? 600 : 400 }}>
                            {c.venc ? fmtDate(c.venc) : '—'}
                          </span>
                          {isAtrasado && (
                            <p style={{ fontSize: 10, color: '#A32D2D', margin: 0 }}>
                              {Math.abs(Math.ceil((new Date(c.venc) - new Date(todayStr)) / 86400000))} dias em atraso
                            </p>
                          )}
                          {c.status === 'aberto' && c.diasAteVencer !== null && c.diasAteVencer <= 7 && c.diasAteVencer >= 0 && (
                            <p style={{ fontSize: 10, color: '#BA7517', margin: 0 }}>vence em {c.diasAteVencer}d</p>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 12, color: isRecebido ? '#3B6D11' : '#94a3b8' }}>
                          {c.dataPagamento ? fmtDate(c.dataPagamento) : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: statusBadge.bg, color: statusBadge.color }}>{statusBadge.label}</span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: valorColor }}>{fmtBRL(c.valor)}</span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                          <button onClick={() => onEditar?.(c._raw)}
                            style={{ padding: '3px 8px', borderRadius: 8, fontSize: 11, background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 500 }}>
                            Editar
                          </button>
                          {!isRecebido && (
                            <>
                              <button onClick={() => setModalReceber({ id: c.id, desc: c.desc, valor: c.valor, cat: c.cat, meioPagamento: '', bancoId: '', dataRecebimento: todayStr })}
                                style={{ padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: '#EAF3DE', color: '#3B6D11', border: '0.5px solid #C0DD97', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                Receber
                              </button>
                              <button onClick={() => setModalParcial({ id: c.id, desc: c.desc, valorTotal: c.valor, cat: c.cat, valorPago: '', novaData: '', meio: '', bancoId: '', dataRecebimento: todayStr })}
                                style={{ padding: '3px 8px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: '#E6F1FB', color: '#185FA5', border: '0.5px solid #B5D4F4', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                Parcial
                              </button>
                            </>
                          )}
                        </div>
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
