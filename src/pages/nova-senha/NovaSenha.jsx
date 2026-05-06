import React, { useState, useEffect } from 'react'
import { Loader2, AlertTriangle, Eye, EyeOff, CheckCircle, Lock } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const NovaSenha = () => {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionOk, setSessionOk] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    // O Supabase processa o token do link de recuperação automaticamente
    // e dispara o evento PASSWORD_RECOVERY via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionOk(true)
      }
      setCheckingSession(false)
    })

    // Fallback: verificar se já há sessão ativa (token já processado)
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        setSessionOk(true)
      }
      setCheckingSession(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem. Tente novamente.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Não foi possível redefinir a senha. O link pode ter expirado. Solicite um novo.')
    } else {
      setSuccess(true)
      setTimeout(() => { window.location.href = 'login.html' }, 3000)
    }

    setLoading(false)
  }

  if (checkingSession) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center mt-[-5vh]">
        <Loader2 size={32} className="animate-spin text-[#ff7b00]" />
        <p className="text-white text-sm mt-4 font-medium">Verificando link...</p>
      </div>
    )
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

        {success ? (
          <div className="text-center space-y-5 py-8">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={36} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-black text-[#05121b] tracking-tighter">Senha redefinida!</h3>
            <p className="text-sm text-slate-500 font-medium">
              Sua nova senha foi salva com sucesso. Redirecionando para o login...
            </p>
            <Loader2 size={20} className="animate-spin text-[#ff7b00] mx-auto mt-4" />
          </div>
        ) : !sessionOk ? (
          <div className="text-center space-y-5 py-8">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
            <h3 className="text-xl font-black text-[#05121b] tracking-tighter">Link inválido ou expirado</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
              Este link de recuperação é inválido ou já expirou. Solicite um novo link de recuperação.
            </p>
            <a
              href="recuperar-senha.html"
              className="inline-block bg-[#ff7b00] text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#e66a00] transition-colors mt-2"
            >
              Solicitar novo link
            </a>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock size={22} className="text-[#ff7b00]" />
              </div>
              <h2 className="text-2xl font-black tracking-tighter mb-2 text-[#05121b]">Nova Senha</h2>
              <p className="text-slate-500 text-sm font-medium">
                Escolha uma senha forte para sua conta OLUAP.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 shadow-sm">
                <AlertTriangle size={16} className="shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider leading-tight">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-50 border border-slate-200 text-[#05121b] pl-5 pr-12 py-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#ff7b00] focus:border-transparent placeholder-slate-400 transition-all font-medium"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#ff7b00] transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full bg-slate-50 border border-slate-200 text-[#05121b] pl-5 pr-12 py-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#ff7b00] focus:border-transparent placeholder-slate-400 transition-all font-medium"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#ff7b00] transition-colors">
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirm && password !== confirm && (
                  <p className="text-xs text-red-500 font-medium mt-1.5 ml-2">As senhas não coincidem</p>
                )}
                {confirm && password === confirm && confirm.length >= 6 && (
                  <p className="text-xs text-green-600 font-medium mt-1.5 ml-2">✓ Senhas coincidem</p>
                )}
              </div>

              <div className="pt-3 w-full">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#ff7b00] text-white w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-[#e66a00] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Salvar Nova Senha'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

export default NovaSenha
