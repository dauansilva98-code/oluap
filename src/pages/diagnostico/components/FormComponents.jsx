import React, { useState } from 'react'
import { AlertCircle, Upload, X } from 'lucide-react'
import { formatCurrency, maskCNPJ, maskPhone, FILE_EMOJI } from '../utils'

export const InputField = ({label,value,onChange,placeholder,maskType='text',error,optional=false,subLabel,readOnly=false,type='text',icon:Icon,fieldId}) => {
  const handleChange = e => {
    const r = e.target.value
    if (maskType==='currency') onChange(formatCurrency(r))
    else if (maskType==='cnpj') onChange(maskCNPJ(r))
    else if (maskType==='phone') onChange(maskPhone(r))
    else onChange(r)
  }
  return (
    <div className="space-y-1.5 w-full text-left min-w-0" id={fieldId?`field-${fieldId}`:undefined}>
      <label className={`text-[10px] font-bold uppercase tracking-wider px-1 ${error?'text-red-500':'text-[#05121b]/50'}`}>
        {label} {optional&&<span className="lowercase font-normal italic opacity-60">(opcional)</span>}
      </label>
      {subLabel&&<p className="text-[10px] text-slate-400 px-1 leading-relaxed">{subLabel}</p>}
      <div className="relative">
        {Icon&&<Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300"/>}
        <input type={type} value={value||''} onChange={handleChange} readOnly={readOnly}
          placeholder={placeholder||(maskType==='currency'?'R$ 0,00':maskType==='cnpj'?'00.000.000/0000-00':maskType==='phone'?'(00) 00000-0000':'')}
          maxLength={maskType==='cnpj'?18:maskType==='phone'?15:undefined}
          className={`w-full bg-white border ${Icon?'pl-10':'px-4'} pr-4 py-2.5 rounded-xl font-medium text-[#05121b] transition-all outline-none text-xs min-w-0 ${error?'border-red-500 ring-2 ring-red-500/20 error-pulse':readOnly?'border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed':'border-slate-200 focus:ring-1 focus:ring-[#ff7b00] focus:border-[#ff7b00]'}`}
        />
      </div>
      {error&&<p className="text-[10px] text-red-500 font-bold px-1 flex items-center gap-1"><AlertCircle size={10}/> Campo obrigatório</p>}
    </div>
  )
}

export const RadioGroup = ({label,value,options,onChange,error,subLabel,readOnly=false,fieldId}) => (
  <div className="space-y-2 text-left" id={fieldId?`field-${fieldId}`:undefined}>
    <label className={`text-[10px] font-bold uppercase tracking-wider px-1 ${error?'text-red-500':'text-[#05121b]/50'}`}>{label}</label>
    {subLabel&&<p className="text-[10px] text-slate-400 px-1 leading-relaxed">{subLabel}</p>}
    <div className="flex flex-wrap gap-2">
      {options.map(opt=>(
        <button key={opt} onClick={()=>!readOnly&&onChange(opt)} disabled={readOnly}
          className={`px-4 py-2 rounded-xl font-bold text-[10px] border transition-all ${value===opt?'bg-[#ff7b00] text-white border-[#ff7b00] shadow-md':'bg-white text-[#05121b]/60 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
          {opt}
        </button>
      ))}
    </div>
    {error&&<p className="text-[10px] text-red-500 font-bold px-1 flex items-center gap-1"><AlertCircle size={10}/> Selecione uma opção</p>}
  </div>
)

export const TextAreaField = ({label,value,onChange,placeholder,error,subLabel,readOnly=false,optional=false,fieldId}) => (
  <div className="space-y-1.5 w-full text-left" id={fieldId?`field-${fieldId}`:undefined}>
    <label className={`text-[10px] font-bold uppercase tracking-wider px-1 ${error?'text-red-500':'text-[#05121b]/50'}`}>
      {label} {optional&&<span className="lowercase font-normal italic opacity-60">(opcional)</span>}
    </label>
    {subLabel&&<p className="text-[10px] text-slate-400 px-1 leading-relaxed">{subLabel}</p>}
    <textarea value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly}
      className={`w-full bg-white border px-4 py-3 rounded-xl font-medium text-[#05121b] outline-none resize-none text-xs h-24 transition-all ${error?'border-red-500 ring-2 ring-red-500/20 error-pulse':readOnly?'border-slate-100 bg-slate-50 text-slate-500 cursor-not-allowed':'border-slate-200 focus:ring-1 focus:ring-[#ff7b00] focus:border-[#ff7b00]'}`}/>
    {error&&<p className="text-[10px] text-red-500 font-bold px-1 flex items-center gap-1"><AlertCircle size={10}/> Campo obrigatório</p>}
  </div>
)

export const FileUploadField = ({onFilesSelected,readOnly}) => {
  const [files,setFiles] = useState([])
  const add = e => {
    const newNames = Array.from(e.target.files).map(f=>f.name)
    setFiles(prev=>{
      const exist=new Set(prev)
      const merged=[...prev,...newNames.filter(n=>!exist.has(n))]
      if(onFilesSelected) onFilesSelected(merged.join(', '))
      return merged
    })
  }
  const remove = name => setFiles(prev=>{
    const next=prev.filter(f=>f!==name)
    if(onFilesSelected) onFilesSelected(next.join(', '))
    return next
  })
  if(readOnly) return null
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-wider text-[#05121b]/50 px-1">Anexar Arquivos (Opcional)</label>
      <label className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center cursor-pointer hover:bg-slate-50 hover:border-[#137789]/40 transition-all group relative">
        <input type="file" multiple accept=".pdf,.xlsx,.xls,.csv,.ofx,.doc,.docx,.jpg,.png" onChange={add} className="absolute inset-0 opacity-0 cursor-pointer"/>
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
          <Upload size={17} className="text-slate-400 group-hover:text-[#137789]"/>
        </div>
        <p className="text-xs font-bold text-[#05121b] mb-0.5 uppercase tracking-wide">Clique para selecionar</p>
        <p className="text-[10px] text-slate-400 text-center">PDF, Excel, CSV, OFX, Imagens · vários arquivos</p>
        {files.length>0&&<span className="mt-2 bg-[#137789] text-white text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest">{files.length} arquivo{files.length>1?'s':''}</span>}
      </label>
      {files.length>0&&(
        <div className="space-y-1.5">
          {files.map((f,i)=>(
            <div key={i} className="flex items-center gap-2.5 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl">
              <span className="text-base leading-none">{FILE_EMOJI(f)}</span>
              <span className="text-[10px] font-bold text-[#05121b] truncate flex-1">{f}</span>
              <button type="button" onClick={()=>remove(f)} className="text-slate-300 hover:text-red-400 transition-colors shrink-0"><X size={13}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
