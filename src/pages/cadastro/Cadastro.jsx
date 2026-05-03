import React, { useState } from 'react'
import { Loader2, AlertTriangle, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const maskCNPJ = (v) => v.replace(/\D/g,'').replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2').replace(/(-\d{2})\d+?$/,'$1')
const maskPhone = (v) => v.replace(/\D/g,'').replace(/^(\d{2})(\d)/g,'($1) $2').replace(/(\d)(\d{4})$/,'$1-$2').substring(0,15)

const produtoLabels = {
  diagnostico: 'Diagnóstico Financeiro',
  credito: 'Crédito Inteligente',
  consultoria: 'Consultoria Empresarial',
  erp: 'ERP Financeiro',
}

const Cadastro = () => {
  const produtoParam = new URLSearchParams(window.location.search).get('produto') || ''

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone, cnpj } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data?.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: name,
          has_consultoria: false,
          has_credito: false,
          has_diagnostico: false,
          has_erp: false,
          produto_origem: produtoParam || null,
        }, { onConflict: 'id' })
      } catch (_) {}
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => { window.location.href = 'hub_cliente.html' }, 2500)
  }

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center mt-[-2vh]">
      <div className="mb-10 flex items-center justify-center">
        <img src="/logo.png" alt="OLUAP" className="h-10 object-contain"
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
        <div className="hidden items-center justify-center gap-3">
          <div className="w-8 h-8 bg-[#ff7b00] rounded-full flex items-center justify-center font-black text-[#0b1117] text-sm">O</div>
          <span className="text-white font-black text-2xl tracking-tighter">OLUAP</span>
        </div>
      </div>

      <div className="w-full bg-white rounded-[2rem] shadow-2xl shadow-black/50 p-8 md:p-12 relative text-[#05121b]">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tighter mb-2 text-[#05121b]">Criar Conta</h2>
          {produtoParam && produtoLabels[produtoParam] ? (
            <p className="text-slate-500 text-sm font-medium">
              Você está acessando: <strong className="text-[#ff7b00]">{produtoLabels[produtoParam]}</strong>
            </p>
          ) : (
            <p className="text-slate-500 text-sm font-medium">Preencha seus dados para acessar o ecossistema OLUAP.</p>
          )}
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 shadow-sm">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider leading-tight">{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4 py-12 bg-slate-50 rounded-3xl border border-slate-100">
            <CheckCircle size={64} className="text-[#ff7b00] mx-auto" />
            <h3 className="text-2xl font-black text-[#05121b] tracking-tighter">Tudo Certo!</h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Preparando seu painel de diagnóstico...</p>
            <Loader2 size={24} className="animate-spin text-[#ff7b00] mx-auto mt-6" />
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="w-full">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">Nome Completo</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João Silva"
                className="w-full bg-slate-50 border border-slate-200 text-[#05121b] px-5 py-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#ff7b00] focus:border-transparent placeholder-slate-400 transition-all font-medium" />
            </div>

            <div className="w-full">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">E-mail Profissional</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com.br"
                className="w-full bg-slate-50 border border-slate-200 text-[#05121b] px-5 py-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#ff7b00] focus:border-transparent placeholder-slate-400 transition-all font-medium" />
            </div>

            <div className="flex flex-col md:flex-row gap-6 w-full">
              <div className="flex-1 w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">Celular / WhatsApp</label>
                <input type="text" required value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength="15"
                  className="w-full bg-slate-50 border border-slate-200 text-[#05121b] px-5 py-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#ff7b00] focus:border-transparent placeholder-slate-400 transition-all font-medium" />
              </div>
              <div className="flex-1 w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">CNPJ da Empresa</label>
                <input type="text" required value={cnpj} onChange={(e) => setCnpj(maskCNPJ(e.target.value))} placeholder="00.000.000/0000-00" maxLength="18"
                  className="w-full bg-slate-50 border border-slate-200 text-[#05121b] px-5 py-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#ff7b00] focus:border-transparent placeholder-slate-400 transition-all font-medium" />
              </div>
            </div>

            <div className="w-full">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">Crie uma Senha Segura</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-50 border border-slate-200 text-[#05121b] pl-5 pr-12 py-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#ff7b00] focus:border-transparent placeholder-slate-400 transition-all font-medium" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#ff7b00] transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-6 w-full">
              <button type="submit" disabled={loading}
                className="bg-[#ff7b00] text-white w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-[#e66a00] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Finalizar Cadastro'}
              </button>
            </div>
          </form>
        )}

        {!success && (
          <div className="mt-8 text-center border-t border-slate-100 pt-6 w-full flex flex-col gap-2">
            <p className="text-xs font-bold text-slate-500">
              Já possui uma conta?{' '}
              <a href="login.html" className="text-[#137789] hover:text-[#ff7b00] transition-colors uppercase tracking-wider ml-1">
                Entrar agora
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cadastro
