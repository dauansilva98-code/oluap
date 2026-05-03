import React, { useState } from 'react'
import { CheckCircle, Clock, Upload, X } from 'lucide-react'
import { formatBRL, FILE_EMOJI } from '../utils'

export const StepBar = ({steps,currentStep,isV1}) => {
  const ac = isV1 ? '#137789' : '#ff7b00'
  return (
    <div className="mb-8">
      <div className="flex items-center gap-0 mb-4">
        {steps.map((s,i)=>{
          const done=i<currentStep, active=i===currentStep
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
          )
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
  )
}

export const StatusBadge = ({internalStatus}) => {
  if(internalStatus==='completed') return(
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle size={11}/><span className="text-[9px] font-black uppercase tracking-widest">Concluído</span>
    </div>
  )
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
  )
}

export const SemaforoCard = ({icon:Icon,title,value,subtitle,status}) => {
  const C = {
    green:{bg:'bg-emerald-50',border:'border-emerald-200',dot:'bg-emerald-500',txt:'text-emerald-700',val:'text-emerald-800'},
    yellow:{bg:'bg-amber-50',border:'border-amber-200',dot:'bg-amber-500',txt:'text-amber-700',val:'text-amber-800'},
    red:{bg:'bg-red-50',border:'border-red-200',dot:'bg-red-500',txt:'text-red-700',val:'text-red-800'},
  }[status]||{bg:'bg-emerald-50',border:'border-emerald-200',dot:'bg-emerald-500',txt:'text-emerald-700',val:'text-emerald-800'}
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
  )
}

export const ScoreRing = ({score}) => {
  const r=40, circ=2*Math.PI*r, offset=circ-(score/100)*circ
  const color = score>=70?'#22c55e':score>=40?'#f59e0b':'#ef4444'
  return(
    <svg width="96" height="96" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8"/>
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 50 50)"
        style={{transition:'stroke-dashoffset 1.2s ease-out'}}/>
      <text x="50" y="50" textAnchor="middle" dy="0.35em" fontSize="19" fontWeight="900" fill={color}>{score}</text>
    </svg>
  )
}

export const IndicadorCard = ({titulo,valor,formula,status,destaque=false}) => {
  const C = {
    green:   {bg:'bg-emerald-50',border:'border-emerald-200',val:'text-emerald-800',badge:'bg-emerald-100 text-emerald-700 border-emerald-200'},
    yellow:  {bg:'bg-amber-50',  border:'border-amber-200',  val:'text-amber-800',  badge:'bg-amber-100 text-amber-700 border-amber-200'},
    red:     {bg:'bg-red-50',    border:'border-red-200',    val:'text-red-800',    badge:'bg-red-100 text-red-700 border-red-200'},
    neutral: {bg:'bg-white',     border:'border-slate-100',  val:'text-[#05121b]',  badge:'bg-slate-100 text-slate-500 border-slate-200'},
  }[status]||{bg:'bg-white',border:'border-slate-100',val:'text-[#05121b]',badge:'bg-slate-100 text-slate-500 border-slate-200'}
  const dot = {green:'bg-emerald-500',yellow:'bg-amber-500',red:'bg-red-500',neutral:'bg-slate-300'}[status]||'bg-slate-300'
  return (
    <div className={`${C.bg} border ${C.border} rounded-2xl p-5 flex flex-col gap-2 ${destaque?'ring-2 ring-offset-1 ring-[#137789]/20':''}`}>
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{titulo}</p>
        <div className={`w-2 h-2 rounded-full ${dot} pulse-dot`}></div>
      </div>
      <p className={`text-2xl font-black ${C.val} leading-none`}>{valor}</p>
      {formula&&<p className="text-[9px] text-slate-400 font-medium leading-relaxed">{formula}</p>}
    </div>
  )
}

export const SimComparativo = ({label,before,after,formato,lowerIsBetter=false}) => {
  const melhorou = lowerIsBetter ? after <= before : after >= before
  const diff = Math.abs(after-before)
  const fmt = v => formato==='brl' ? formatBRL(v) : formato==='meses' ? `${Math.max(0,v).toFixed(1)}m` : `${v.toFixed(1)}%`
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
  )
}

export const MultiFileDropzone = () => {
  const [files,setFiles] = useState([])
  const add = e => {
    const newFiles = Array.from(e.target.files)
    setFiles(prev=>{
      const exist=new Set(prev.map(f=>f.name))
      return [...prev,...newFiles.filter(f=>!exist.has(f.name))]
    })
  }
  const remove = name => setFiles(prev=>prev.filter(f=>f.name!==name))
  const fmtSize = b => b<1048576?`${(b/1024).toFixed(0)} KB`:`${(b/1048576).toFixed(1)} MB`
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
  )
}
