import React, { useState, useEffect } from 'react'
import { Plus, X, ChevronDown } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip as RTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts'
import { supabase } from '../../lib/supabase'

// Project color palette
const C = {
  teal:   '#137789',
  orange: '#ff7b00',
  dark:   '#05121b',
  green:  '#34d399',
  red:    '#f87171',
  purple: '#a78bfa',
  amber:  '#fbbf24',
}

const DONUT_DATA = [
  { label: 'Assinatura',  value: 38400, color: C.teal   },
  { label: 'Consultoria', value: 18200, color: C.green  },
  { label: 'Serviço',     value: 14800, color: C.orange },
  { label: 'Licença',     value:  8300, color: C.purple },
  { label: 'Comissão',    value:  4620, color: C.red    },
]

const LINE_DATA = [
  { month: 'Dez', total: 58200, recorrente: 44000 },
  { month: 'Jan', total: 62400, recorrente: 47500 },
  { month: 'Fev', total: 67100, recorrente: 51000 },
  { month: 'Mar', total: 71800, recorrente: 54200 },
  { month: 'Abr', total: 75000, recorrente: 57000 },
  { month: 'Mai', total: 84320, recorrente: 61500 },
]

const INITIAL_LANCAMENTOS = [
  { id: 1, desc: 'Mensalidade – Empresa Alpha',       cat: 'Assinatura',  tipo: 'recorrente', venc: '2025-05-05', status: 'recebido', valor: 3200 },
  { id: 2, desc: 'Consultoria estratégica – Beta S.A.', cat: 'Consultoria', tipo: 'servico',    venc: '2025-05-08', status: 'recebido', valor: 8500 },
  { id: 3, desc: 'Licença de software – Gamma',       cat: 'Licença',     tipo: 'recorrente', venc: '2025-05-10', status: 'recebido', valor: 1900 },
  { id: 4, desc: 'Projeto pontual – Delta',            cat: 'Serviço',     tipo: 'avulso',     venc: '2025-05-12', status: 'pendente', valor: 5400 },
  { id: 5, desc: 'Mensalidade – Epsilon',              cat: 'Assinatura',  tipo: 'recorrente', venc: '2025-05-15', status: 'recebido', valor: 2700 },
  { id: 6, desc: 'Comissão – parceiro Zeta',           cat: 'Comissão',    tipo: 'avulso',     venc: '2025-05-18', status: 'pendente', valor: 1350 },
  { id: 7, desc: 'Mensalidade – Eta Corp',             cat: 'Assinatura',  tipo: 'recorrente', venc: '2025-05-20', status: 'atrasado', valor: 3200 },
  { id: 8, desc: 'Treinamento customizado',            cat: 'Serviço',     tipo: 'servico',    venc: '2025-05-22', status: 'recebido', valor: 6800 },
]

const MESES = [
  'Janeiro 2025','Fevereiro 2025','Março 2025','Abril 2025','Maio 2025',
  'Junho 2025','Julho 2025','Agosto 2025','Setembro 2025','Outubro 2025',
  'Novembro 2025','Dezembro 2025',
]

const CATEGORIAS = [
  'Assinatura / Mensalidade','Prestação de serviço','Venda de produto',
  'Consultoria','Comissão','Royalties / Licença','Outra',
]

const fmtBRL = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = d => d.split('-').reverse().join('/')

const TIPO_STYLE  = { recorrente: 'bg-cyan-50 text-cyan-700 border-cyan-200',    servico: 'bg-emerald-50 text-emerald-700 border-emerald-200', avulso: 'bg-amber-50 text-amber-700 border-amber-200' }
const TIPO_LABEL  = { recorrente: 'Recorrente', servico: 'Serviço', avulso: 'Avulso' }
const STATUS_STYLE = { recebido: 'bg-emerald-50 text-emerald-700 border-emerald-200', pendente: 'bg-amber-50 text-amber-700 border-amber-200', atrasado: 'bg-red-50 text-red-600 border-red-200' }
const STATUS_LABEL = { recebido: 'Recebido', pendente: 'Pendente', atrasado: 'Atrasado' }

const METRICS = [
  { label: 'Total do mês',         value: 'R$ 84.320', delta: '↑ 12,4% vs anterior', pos: true  },
  { label: 'Receita recorrente',   value: 'R$ 61.500', delta: '↑ 8,1% vs anterior',  pos: true  },
  { label: 'Receita avulsa',       value: 'R$ 22.820', delta: '↓ 3,2% vs anterior',  pos: false },
  { label: 'Inadimplência',        value: 'R$ 4.100',  delta: '↑ 1,1% vs anterior',  pos: false },
]

const FILTROS = [
  { key: 'todos',      label: 'Todos'      },
  { key: 'recorrente', label: 'Recorrente' },
  { key: 'servico',    label: 'Serviço'    },
  { key: 'avulso',     label: 'Avulso'     },
]

const DonutTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-[#05121b]">{payload[0].name}</p>
      <p className="text-xs text-slate-500 mt-0.5">{fmtBRL(payload[0].value)}</p>
    </div>
  )
}

const LineTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-[#05121b] mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
          {p.dataKey === 'total' ? 'Total' : 'Recorrente'}: {fmtBRL(p.value)}
        </p>
      ))}
    </div>
  )
}

const EMPTY_FORM = { desc: '', cat: 'Assinatura / Mensalidade', valor: '', venc: '', tipo: 'recorrente' }

export default function Receitas() {
  const [loading, setLoading]         = useState(true)
  const [periodo, setPeriodo]         = useState('Maio 2025')
  const [filtro, setFiltro]           = useState('todos')
  const [lancamentos, setLancamentos] = useState(INITIAL_LANCAMENTOS)
  const [modal, setModal]             = useState(false)
  const [form, setForm]               = useState(EMPTY_FORM)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/login.html'; return }
      setLoading(false)
    })
  }, [])

  const filtrados = filtro === 'todos' ? lancamentos : lancamentos.filter(l => l.tipo === filtro)

  const salvar = () => {
    if (!form.desc.trim() || !form.valor || !form.venc) return
    setLancamentos(prev => [{
      id: Date.now(),
      desc:   form.desc,
      cat:    form.cat,
      tipo:   form.tipo,
      venc:   form.venc,
      status: 'pendente',
      valor:  parseFloat(form.valor),
    }, ...prev])
    setModal(false)
    setForm(EMPTY_FORM)
  }

  const field = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  if (loading) return (
    <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
      <div className="w-7 h-7 border-2 border-[#137789] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f5f5f0]">

      {/* ── Modal ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setModal(false) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-[#05121b]">Novo lançamento de receita</h3>
              <button onClick={() => setModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-50">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 mb-1.5 block">Descrição</span>
                <input
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#05121b] outline-none focus:border-[#137789] transition-colors"
                  placeholder="Ex: Mensalidade cliente ABC"
                  value={form.desc}
                  onChange={field('desc')}
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 mb-1.5 block">Categoria</span>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#05121b] bg-white outline-none focus:border-[#137789] transition-colors"
                  value={form.cat}
                  onChange={field('cat')}
                >
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 mb-1.5 block">Valor (R$)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#05121b] outline-none focus:border-[#137789] transition-colors"
                    placeholder="0,00"
                    value={form.valor}
                    onChange={field('valor')}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-slate-500 mb-1.5 block">Vencimento</span>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#05121b] outline-none focus:border-[#137789] transition-colors"
                    value={form.venc}
                    onChange={field('venc')}
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs font-semibold text-slate-500 mb-1.5 block">Tipo</span>
                <select
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#05121b] bg-white outline-none focus:border-[#137789] transition-colors"
                  value={form.tipo}
                  onChange={field('tipo')}
                >
                  <option value="recorrente">Recorrente</option>
                  <option value="avulso">Avulso</option>
                  <option value="servico">Serviço</option>
                </select>
              </label>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setModal(false)}
                  className="flex-1 border border-slate-200 text-slate-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvar}
                  className="flex-1 bg-[#05121b] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#0c2133] transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Page content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 font-medium">Gestão Financeira</p>
            <h1 className="text-xl font-medium text-[#05121b] mt-0.5">Receitas</h1>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <select
                value={periodo}
                onChange={e => setPeriodo(e.target.value)}
                className="appearance-none border border-slate-200 bg-white rounded-xl px-4 py-2 pr-8 text-sm font-medium text-[#05121b] outline-none focus:border-[#137789] cursor-pointer transition-colors"
              >
                {MESES.map(m => <option key={m}>{m}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            <button
              onClick={() => setModal(true)}
              className="flex items-center gap-1.5 bg-[#05121b] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#0c2133] transition-colors"
            >
              <Plus size={14} />
              Lançar receita
            </button>
          </div>
        </div>

        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          {METRICS.map((m, i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4">
              <p className="text-xs text-slate-500 font-medium mb-2">{m.label}</p>
              <p className="text-[22px] font-medium text-[#05121b] leading-tight">{m.value}</p>
              <p className="text-xs font-semibold mt-1.5" style={{ color: m.pos ? C.green : C.red }}>
                {m.delta}
              </p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>

          {/* Donut — receita por categoria */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[#05121b] mb-3">Receita por categoria</h3>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={DONUT_DATA}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius="60%"
                  outerRadius="85%"
                  strokeWidth={0}
                  paddingAngle={0}
                >
                  {DONUT_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <RTooltip content={<DonutTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 space-y-2">
              {DONUT_DATA.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-slate-600">{d.label}</span>
                  </div>
                  <span className="font-medium text-[#05121b]">{fmtBRL(d.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Line — evolução mensal */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#05121b]">Evolução mensal</h3>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-5 h-0.5 rounded" style={{ background: C.teal }} />
                  Total
                </span>
                <span className="flex items-center gap-1.5">
                  <svg width="20" height="4" viewBox="0 0 20 4">
                    <line x1="0" y1="2" x2="20" y2="2" stroke={C.green} strokeWidth="2" strokeDasharray="4 2" />
                  </svg>
                  Recorrente
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={LINE_DATA} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `R$ ${Math.round(v / 1000)}k`}
                  width={52}
                />
                <RTooltip content={<LineTooltip />} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={C.teal}
                  strokeWidth={2}
                  dot={{ r: 3, fill: C.teal, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  tension={0.4}
                />
                <Line
                  type="monotone"
                  dataKey="recorrente"
                  stroke={C.green}
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ r: 3, fill: C.green, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  tension={0.4}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-[#05121b]">Lançamentos</h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              {FILTROS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFiltro(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    filtro === f.key
                      ? 'bg-[#05121b] text-white border-[#05121b]'
                      : 'bg-transparent text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Descrição</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Categoria</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Tipo</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Vencimento</th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((l, idx) => (
                  <tr
                    key={l.id}
                    className={`hover:bg-slate-50 transition-colors ${idx < filtrados.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <td className="px-5 py-3.5 font-medium text-[#05121b] text-sm">{l.desc}</td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">{l.cat}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${TIPO_STYLE[l.tipo]}`}>
                        {TIPO_LABEL[l.tipo]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs">{fmtDate(l.venc)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLE[l.status]}`}>
                        {STATUS_LABEL[l.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium text-[#05121b]">{fmtBRL(l.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
