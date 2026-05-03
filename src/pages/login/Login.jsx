import React, { useState, useEffect } from 'react'
import { Loader2, AlertTriangle, Eye, EyeOff, LogIn, CheckSquare, Square } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem('oluap_remembered_email')
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha incorretos. Verifique e tente novamente.')
    } else {
      if (rememberMe) {
        localStorage.setItem('oluap_remembered_email', email)
      } else {
        localStorage.removeItem('oluap_remembered_email')
      }
      window.location.href = 'hub_cliente.html'
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center mt-[-5vh]">
      <div className="mb-10 flex items-center justify-center">
        <img src="/logo.png" alt="OLUAP" className="h-10 object-contain"
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
        <div className="hidden items-center justify-center gap-3">
          <div className="w-8 h-8 bg-[#ff7b00] rounded-full flex items-center justify-center font-black text-[#0b1117] text-sm">O</div>
          <span className="text-white font-black text-2xl tracking-tighter">OLUAP</span>
        </div>
      </div>

      <div className="w-full bg-white rounded-[2rem] shadow-2xl shadow-black/50 p-8 md:p-10 relative text-[#05121b]">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tighter mb-2 text-[#05121b]">Acessar Painel</h2>
          <p className="text-slate-500 text-sm font-medium">Faça login para acompanhar seus diagnósticos.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 shadow-sm">
            <AlertTriangle size={16} className="shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider leading-tight">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="w-full">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">Seu E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="contato@empresa.com.br"
              className="w-full bg-slate-50 border border-slate-200 text-[#05121b] px-5 py-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#ff7b00] focus:border-transparent placeholder-slate-400 transition-all font-medium" />
          </div>

          <div className="w-full">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">Sua Senha</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} required value={password}
                onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 text-[#05121b] pl-5 pr-12 py-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#ff7b00] focus:border-transparent placeholder-slate-400 transition-all font-medium" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#ff7b00] transition-colors">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 px-2">
            <button type="button" onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#05121b] transition-colors">
              {rememberMe ? <CheckSquare size={16} className="text-[#ff7b00]" /> : <Square size={16} />}
              Lembrar meu e-mail
            </button>
            <button type="button"
              className="text-xs font-bold text-[#137789] hover:text-[#ff7b00] transition-colors uppercase tracking-wider"
              onClick={() => alert('Para redefinir a senha, entre em contato com o suporte OLUAP.')}>
              Esqueceu a senha?
            </button>
          </div>

          <div className="pt-6 w-full">
            <button type="submit" disabled={loading}
              className="bg-[#ff7b00] text-white w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-[#e66a00] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-70">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <><LogIn size={18} /> Entrar na Plataforma</>}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-6 w-full flex flex-col gap-2">
          <p className="text-xs font-bold text-slate-500">
            Ainda não tem conta?{' '}
            <a href="cadastro.html" className="text-[#ff7b00] hover:text-[#05121b] transition-colors uppercase tracking-wider ml-1">
              Criar conta grátis
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
