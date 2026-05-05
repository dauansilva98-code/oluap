import React, { useState, useEffect, useRef } from 'react'
import { X, Download } from 'lucide-react'

const fmtBRL = v => `R$ ${Number(v).toLocaleString('pt-BR')}`

// ── Dados mock ────────────────────────────────────────────────────────────────

const BANCOS_INIT = [
  { id: 'itau',    init: 'IT', nome: 'Itaú Empresas',  tipo: 'Corrente',
    info: 'Corrente PJ · Ag. 0041 · CC 28.441-2',
    saldo: 98400, entradas: 52300, saidas: 38100,
    corFundo: '#E6F1FB', corTexto: '#0C447C' },
  { id: 'bb',      init: 'BB', nome: 'Banco do Brasil', tipo: 'Corrente',
    info: 'Corrente PJ · Ag. 1823 · CC 44.892-7',
    saldo: 42840, entradas: 18400, saidas: 12600,
    corFundo: '#EAF3DE', corTexto: '#27500A' },
  { id: 'nubank',  init: 'NU', nome: 'Nubank PJ',       tipo: 'Digital',
    info: 'Digital PJ · Ag. 0001 · CC 7.841.293-4',
    saldo: 28100, entradas: 14020, saidas: 9800,
    corFundo: '#EEEDFE', corTexto: '#26215C' },
  { id: 'sicredi', init: 'SI', nome: 'Sicredi',          tipo: 'Poupança',
    info: 'Poupança PJ · Ag. 0072 · CC 12.304-8',
    saldo: 14200, rendimento: 1240, saidas: 0,
    corFundo: '#FAEEDA', corTexto: '#412402' },
]

const TIPO_BADGE = {
  Corrente:    { bg: '#E6F1FB', color: '#185FA5' },
  Digital:     { bg: '#EEEDFE', color: '#3C3489' },
  Poupança:    { bg: '#FAEEDA', color: '#854F0B' },
  Investimento:{ bg: '#EAF3DE', color: '#3B6D11' },
}

const ESPECIE_MOV_INIT = [
  { id: 1, desc: 'Venda à vista — balcão',  data: '15/05', tipo: 'entrada', valor: 1200 },
  { id: 2, desc: 'Reembolso funcionário',   data: '14/05', tipo: 'saida',   valor: 380  },
  { id: 3, desc: 'Depósito caixa',          data: '12/05', tipo: 'entrada', valor: 3000 },
  { id: 4, desc: 'Pagamento fornecedor',    data: '10/05', tipo: 'saida',   valor: 2420 },
]

const EXTRATO_INIT = [
  { id:  1, desc: 'Mensalidade Alpha',       conta: 'Itaú',    bank: 'itau',    data: '15/05', met: 'PIX',         tipo: 'entrada', valor: 3200,  saldo: 98400 },
  { id:  2, desc: 'Venda à vista – balcão',  conta: 'Espécie', bank: 'especie', data: '15/05', met: 'Dinheiro',    tipo: 'entrada', valor: 1200,  saldo: 3800  },
  { id:  3, desc: 'Folha de pagamento',      conta: 'Itaú',    bank: 'itau',    data: '05/05', met: 'TED',         tipo: 'saida',   valor: 18400, saldo: 95200 },
  { id:  4, desc: 'Fornecedor logística',    conta: 'BB',      bank: 'bb',      data: '15/05', met: 'TED',         tipo: 'saida',   valor: 5400,  saldo: 42840 },
  { id:  5, desc: 'Reembolso funcionário',   conta: 'Espécie', bank: 'especie', data: '14/05', met: 'Dinheiro',    tipo: 'saida',   valor: 380,   saldo: 2600  },
  { id:  6, desc: 'Consultoria Beta',        conta: 'Nubank',  bank: 'nubank',  data: '10/05', met: 'PIX',         tipo: 'entrada', valor: 8500,  saldo: 28100 },
  { id:  7, desc: 'Depósito caixa',          conta: 'Espécie', bank: 'especie', data: '12/05', met: 'Dinheiro',    tipo: 'entrada', valor: 3000,  saldo: 2980  },
  { id:  8, desc: 'AWS cloud',               conta: 'Itaú',    bank: 'itau',    data: '12/05', met: 'Débito auto', tipo: 'saida',   valor: 3100,  saldo: 76800 },
  { id:  9, desc: 'Aluguel escritório',      conta: 'BB',      bank: 'bb',      data: '10/05', met: 'TED',         tipo: 'saida',   valor: 6800,  saldo: 48240 },
  { id: 10, desc: 'Pagamento fornecedor',    conta: 'Espécie', bank: 'especie', data: '10/05', met: 'Dinheiro',    tipo: 'saida',   valor: 2420,  saldo: 560   },
  { id: 11, desc: 'Licença Gamma',           conta: 'Nubank',  bank: 'nubank',  data: '08/05', met: 'PIX',         tipo: 'entrada', valor: 1900,  saldo: 19600 },
  { id: 12, desc: 'Rendimento poupança',     conta: 'Sicredi', bank: 'sicredi', data: '01/05', met: 'Crédito auto',tipo: 'entrada', valor: 1240,  saldo: 14200 },
  { id: 13, desc: 'INSS + FGTS',            conta: 'Itaú',    bank: 'itau',    data: '07/05', met: 'Débito auto', tipo: 'saida',   valor: 4200,  saldo: 79900 },
  { id: 14, desc: 'Google Ads',             conta: 'Nubank',  bank: 'nubank',  data: '18/05', met: 'Cartão',      tipo: 'saida',   valor: 2800,  saldo: 25300 },
  { id: 15, desc: 'Aporte investidor',      conta: 'BB',      bank: 'bb',      data: '16/05', met: 'TED',         tipo: 'entrada', valor: 4920,  saldo: 55240 },
  { id: 16, desc: 'Mensalidade Epsilon',    conta: 'Itaú',    bank: 'itau',    data: '15/05', met: 'PIX',         tipo: 'entrada', valor: 2700,  saldo: 101100},
  { id: 17, desc: 'Contabilidade',          conta: 'BB',      bank: 'bb',      data: '25/05', met: 'PIX',         tipo: 'saida',   valor: 1900,  saldo: 40940 },
  { id: 18, desc: 'Pró-labore sócios',      conta: 'Itaú',    bank: 'itau',    data: '20/05', met: 'TED',         tipo: 'saida',   valor: 8500,  saldo: 92600 },
  { id: 19, desc: 'Treinamento cliente',    conta: 'Nubank',  bank: 'nubank',  data: '22/05', met: 'PIX',         tipo: 'entrada', valor: 6800,  saldo: 35100 },
  { id: 20, desc: 'ISS mensal',             conta: 'BB',      bank: 'bb',      data: '22/05', met: 'Boleto',      tipo: 'saida',   valor: 1380,  saldo: 39560 },
]

const FILTROS_EXTRATO = [
  { key: 'todos',   label: 'Todos'          },
  { key: 'itau',    label: 'Itaú'           },
  { key: 'bb',      label: 'Banco do Brasil'},
  { key: 'nubank',  label: 'Nubank'         },
  { key: 'sicredi', label: 'Sicredi'        },
  { key: 'especie', label: 'Espécie'        },
]

const EMPTY_CONTA = { nome: '', tipo: 'Corrente PJ', agencia: '', numero: '', saldo: '', pix: '' }
const EMPTY_MOV   = { desc: '', valor: '', data: '', cat: 'Venda à vista', obs: '', tipomov: 'entrada' }

// ── Helpers de estilo ─────────────────────────────────────────────────────────

const card = (bg, border, children, extra = {}) => (
  <div style={{ background: bg, border: `0.5px solid ${border}`, borderRadius: 12, padding: '1rem 1.1rem', ...extra }}>
    {children}
  </div>
)

const labelSt = color => ({ fontSize: 11, fontWeight: 500, color, marginBottom: 4 })
const valueSt = color => ({ fontSize: 19, fontWeight: 500, color, lineHeight: 1.2 })
const subSt   = color => ({ fontSize: 11, color, marginTop: 2 })

// ── Componente principal ──────────────────────────────────────────────────────

export default function BancosContas() {
  const [bancos,       setBancos]       = useState(BANCOS_INIT)
  const [especieMov,   setEspecieMov]   = useState(ESPECIE_MOV_INIT)
  const [especieSaldo, setEspecieSaldo] = useState(3800)
  const [extrato,      setExtrato]      = useState(EXTRATO_INIT)
  const [filtroBank,   setFiltroBank]   = useState('todos')
  const [modalConta,   setModalConta]   = useState(false)
  const [modalEspecie, setModalEspecie] = useState(false)
  const [formConta,    setFormConta]    = useState(EMPTY_CONTA)
  const [formMov,      setFormMov]      = useState(EMPTY_MOV)

  const donutRef = useRef(null)
  const lineRef  = useRef(null)
  const donutChart = useRef(null)
  const lineChart  = useRef(null)

  // saldo bancário total (dinâmico conforme bancos cadastrados)
  const saldoBancario = bancos.reduce((s, b) => s + b.saldo, 0)
  const saldoTotal    = saldoBancario + especieSaldo

  const extratoFiltrado = filtroBank === 'todos' ? extrato : extrato.filter(l => l.bank === filtroBank)

  // ── Chart.js ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true

    const buildCharts = () => {
      if (!alive || !donutRef.current || !lineRef.current) return

      donutChart.current?.destroy()
      lineChart.current?.destroy()

      const tickFn    = { font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" }, color: '#94a3b8' }
      const gridY     = 'rgba(128,128,128,0.08)'
      const tooltipBRL = { callbacks: { label: ctx => `R$ ${ctx.raw.toLocaleString('pt-BR')} (${((ctx.raw / ctx.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%)` } }

      // Donut — distribuição do saldo
      donutChart.current = new window.Chart(donutRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Itaú PJ', 'Banco do Brasil', 'Nubank PJ', 'Sicredi', 'Espécie'],
          datasets: [{
            data: [98400, 42840, 28100, 14200, 3800],
            backgroundColor: ['#378ADD', '#1D9E75', '#7F77DD', '#BA7517', '#888780'],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: { legend: { display: false }, tooltip: tooltipBRL },
        },
      })

      // Line — evolução do saldo 6 meses
      lineChart.current = new window.Chart(lineRef.current, {
        type: 'line',
        data: {
          labels: ['Dez', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
          datasets: [
            {
              label: 'Saldo total',
              data: [142000, 151000, 158400, 165200, 172800, 187340],
              borderColor: '#1D9E75',
              backgroundColor: 'rgba(29,158,117,0.07)',
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              borderWidth: 2,
            },
            {
              label: 'Só bancário',
              data: [138500, 147200, 154100, 160800, 168400, 183540],
              borderColor: '#378ADD',
              borderDash: [4, 3],
              fill: false,
              tension: 0.4,
              pointRadius: 3,
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: R$ ${ctx.raw.toLocaleString('pt-BR')}` } },
          },
          scales: {
            x: { grid: { display: false }, border: { display: false }, ticks: tickFn },
            y: {
              grid: { color: gridY }, border: { display: false },
              ticks: { ...tickFn, callback: v => `R$ ${(v / 1000).toFixed(0)}k` },
            },
          },
        },
      })
    }

    if (window.Chart) {
      buildCharts()
    } else {
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
  }, [])

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const salvarConta = () => {
    if (!formConta.nome.trim() || !formConta.agencia || !formConta.numero) return
    const saldoN = parseFloat(formConta.saldo) || 0
    const init   = formConta.nome.substring(0, 2).toUpperCase()
    const tipoKey = formConta.tipo.replace(' PJ', '').replace('Conta ', '')
    setBancos(prev => [...prev, {
      id:       `banco_${Date.now()}`,
      init,
      nome:     formConta.nome,
      tipo:     tipoKey,
      info:     `${formConta.tipo} · Ag. ${formConta.agencia} · CC ${formConta.numero}`,
      saldo:    saldoN,
      entradas: 0,
      saidas:   0,
      corFundo: '#f8fafc',
      corTexto: '#05121b',
    }])
    setModalConta(false)
    setFormConta(EMPTY_CONTA)
  }

  const salvarMov = () => {
    if (!formMov.desc.trim() || !formMov.valor || !formMov.data) return
    const valor = parseFloat(formMov.valor) || 0
    const [yyyy, mm, dd] = formMov.data.split('-')
    const dataFmt = `${dd}/${mm}`
    const novoSaldo = formMov.tipomov === 'entrada' ? especieSaldo + valor : especieSaldo - valor
    setEspecieMov(prev => [{ id: Date.now(), desc: formMov.desc, data: dataFmt, tipo: formMov.tipomov, valor }, ...prev])
    setEspecieSaldo(novoSaldo)
    setModalEspecie(false)
    setFormMov(EMPTY_MOV)
  }

  const fieldConta = k => e => setFormConta(f => ({ ...f, [k]: e.target.value }))
  const fieldMov   = k => e => setFormMov(f => ({ ...f, [k]: e.target.value }))

  const inputCls  = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#05121b] bg-white outline-none focus:border-[#137789] transition-colors'
  const selectCls = inputCls

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Modal Nova Conta ─────────────────────────────────────────────────── */}
      {modalConta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
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
                  <select className={selectCls} value={formConta.tipo} onChange={fieldConta('tipo')}>
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
              <button onClick={salvarConta} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#05121b] hover:bg-[#137789] transition-colors">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Mov. Espécie ───────────────────────────────────────────────── */}
      {modalEspecie && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
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
              {/* Toggle tipo */}
              <div className="grid grid-cols-2 gap-2">
                {['entrada', 'saida'].map(t => (
                  <button
                    key={t}
                    onClick={() => setFormMov(f => ({ ...f, tipomov: t }))}
                    style={{
                      padding: '8px 0',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      border: '1px solid',
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
                <select className={selectCls} value={formMov.cat} onChange={fieldMov('cat')}>
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
              <button onClick={salvarMov} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#05121b] hover:bg-[#137789] transition-colors">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page ─────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto w-full" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── Cabeçalho ── */}
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

        {/* ── Cards de métricas ── */}
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
            <p style={{ fontSize: 19, fontWeight: 500, color: '#05121b', lineHeight: 1.2 }}>{fmtBRL(Math.max(...bancos.map(b => b.saldo)))}</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{bancos.reduce((a, b) => b.saldo > a.saldo ? b : a, bancos[0])?.nome}</p>
          </div>
          {card('#EEEDFE', '#CECBF6',
            <>
              <p style={labelSt('#3C3489')}>Rendimento mês</p>
              <p style={valueSt('#26215C')}>R$ 1.240</p>
              <p style={subSt('#3C3489')}>aplicações</p>
            </>
          )}
          <div className="bg-white border border-slate-200" style={{ borderRadius: 12, padding: '1rem 1.1rem' }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 4 }}>Última atualização</p>
            <p style={{ fontSize: 19, fontWeight: 500, color: '#05121b', lineHeight: 1.2 }}>Hoje</p>
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>17/05/2025 09:14</p>
          </div>
        </div>

        {/* ── Cards de contas bancárias ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {bancos.map(b => {
            const badge = TIPO_BADGE[b.tipo] || { bg: '#f8fafc', color: '#64748b' }
            return (
              <div key={b.id} className="bg-white" style={{ border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '1.1rem 1.25rem' }}>
                {/* Cabeçalho do card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: b.corFundo, color: b.corTexto,
                    fontSize: 12, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {b.init}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.nome}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.info}</p>
                  </div>
                </div>

                {/* Corpo */}
                <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Saldo disponível</p>
                <p style={{ fontSize: 20, fontWeight: 500, color: '#27500A', margin: '0 0 10px' }}>{fmtBRL(b.saldo)}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                  {b.entradas !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: '#94a3b8' }}>Entradas do mês</span>
                      <span style={{ color: '#27500A', fontWeight: 500 }}>+{fmtBRL(b.entradas)}</span>
                    </div>
                  )}
                  {b.rendimento !== undefined && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: '#94a3b8' }}>Rendimento</span>
                      <span style={{ color: '#27500A', fontWeight: 500 }}>+{fmtBRL(b.rendimento)}</span>
                    </div>
                  )}
                  {(b.saidas > 0 || b.entradas !== undefined) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: '#94a3b8' }}>Saídas do mês</span>
                      <span style={{ color: '#791F1F', fontWeight: 500 }}>-{fmtBRL(b.saidas)}</span>
                    </div>
                  )}
                </div>

                {/* Badge tipo */}
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: badge.bg, color: badge.color }}>
                    {b.tipo}
                  </span>
                </div>

                {/* Rodapé */}
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

        {/* ── Card dinheiro em espécie ── */}
        <div className="bg-white" style={{ border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '1.1rem 1.25rem' }}>
          {/* Header espécie */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: 0 }}>Dinheiro em espécie</p>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Caixa físico da empresa</p>
            </div>
            <p style={{ fontSize: 22, fontWeight: 500, color: '#27500A', margin: 0 }}>{fmtBRL(especieSaldo)}</p>
          </div>

          {/* Grid métricas espécie */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Entradas do mês', valor: `+ ${fmtBRL(especieMov.filter(m => m.tipo === 'entrada').reduce((s, m) => s + m.valor, 0))}`, cor: '#27500A' },
              { label: 'Saídas do mês',   valor: `- ${fmtBRL(especieMov.filter(m => m.tipo === 'saida').reduce((s, m) => s + m.valor, 0))}`,   cor: '#791F1F' },
              { label: 'Saldo mínimo',    valor: fmtBRL(1000),  cor: '#05121b' },
            ].map(({ label, valor, cor }) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '.75rem' }}>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 4px' }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 500, color: cor, margin: 0 }}>{valor}</p>
              </div>
            ))}
          </div>

          {/* Movimentações */}
          <div>
            {especieMov.map((m, i) => (
              <div
                key={m.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0',
                  borderBottom: i < especieMov.length - 1 ? '0.5px solid #f1f5f9' : 'none',
                }}
              >
                <span style={{ flex: 1, fontSize: 13, color: '#05121b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.desc}</span>
                <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>{m.data}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: m.tipo === 'entrada' ? '#27500A' : '#791F1F', flexShrink: 0 }}>
                  {m.tipo === 'entrada' ? '+' : '-'} {fmtBRL(m.valor)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Gráficos ── */}
        <div className="grid grid-cols-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* Donut — distribuição do saldo */}
          <div className="bg-white border border-slate-200" style={{ borderRadius: 12, padding: '1rem 1.2rem' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', marginBottom: 12, marginTop: 0 }}>Distribuição do saldo</p>
            <div style={{ position: 'relative', width: '100%', height: 180 }}>
              <canvas ref={donutRef} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 12 }}>
              {[
                { color: '#378ADD', label: 'Itaú PJ',         valor: 98400  },
                { color: '#1D9E75', label: 'Banco do Brasil', valor: 42840  },
                { color: '#7F77DD', label: 'Nubank PJ',       valor: 28100  },
                { color: '#BA7517', label: 'Sicredi',         valor: 14200  },
                { color: '#888780', label: 'Espécie',         valor: 3800   },
              ].map(({ color, label, valor }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{label} <strong style={{ color: '#05121b' }}>{fmtBRL(valor)}</strong></span>
                </div>
              ))}
            </div>
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

        {/* ── Extrato consolidado ── */}
        <div className="bg-white border border-slate-200" style={{ borderRadius: 12, overflow: 'hidden' }}>
          {/* Header extrato */}
          <div style={{ padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderBottom: '0.5px solid #e2e8f0' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#05121b', margin: 0 }}>
              {extratoFiltrado.length} lançamento{extratoFiltrado.length !== 1 ? 's' : ''}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {FILTROS_EXTRATO.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFiltroBank(key)}
                  style={{
                    padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                    border: '0.5px solid', cursor: 'pointer', transition: 'all 0.15s',
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

          {/* Tabela */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
              <colgroup>
                <col style={{ width: '28%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '14%' }} />
              </colgroup>
              <thead>
                <tr style={{ borderBottom: '0.5px solid #e2e8f0', background: '#f8fafc' }}>
                  {['Descrição', 'Conta', 'Data', 'Método', 'Tipo', 'Valor', 'Saldo conta'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', fontSize: 11, fontWeight: 500, color: '#94a3b8',
                      textAlign: h === 'Valor' || h === 'Saldo conta' ? 'right' : 'left',
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
                      <span style={{ fontSize: 12, color: '#64748b' }}>{l.met}</span>
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
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: l.tipo === 'entrada' ? '#27500A' : '#791F1F' }}>
                        {l.tipo === 'entrada' ? '+' : '-'} {fmtBRL(l.valor)}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{fmtBRL(l.saldo)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  )
}
