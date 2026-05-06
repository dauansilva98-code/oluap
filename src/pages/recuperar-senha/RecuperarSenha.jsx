import React, { useState } from 'react'
import { Loader2, AlertTriangle, Mail, CheckCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const RecuperarSenha = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const redirectTo = `${window.location.origin}/nova-senha.html`

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (error) {
      setError('Não foi possível enviar o e-mail. Verifique o endereço e tente novamente.')
    } else {
      setEnviado(true)
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

        {enviado ? (
          <div className="text-center space-y-5 py-8">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={36} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-black text-[#05121b] tracking-tighter">E-mail enviado!</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
              Enviamos um link de recuperação para <strong className="text-[#05121b]">{email}</strong>.
              Verifique sua caixa de entrada e spam.
            </p>
            <p className="text-xs text-slate-400">
              O link expira em <strong>1 hora</strong>.
            </p>
            <a
              href="login.html"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#137789] hover:text-[#ff7b00] transition-colors uppercase tracking-wider mt-4"
            >
              <ArrowLeft size={14} /> Voltar para o login
            </a>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail size={22} className="text-[#ff7b00]" />
              </div>
              <h2 className="text-2xl font-black tracking-tighter mb-2 text-[#05121b]">Recuperar Senha</h2>
              <p className="text-slate-500 text-sm font-medium">
                Informe seu e-mail cadastrado. Enviaremos um link para você criar uma nova senha.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 shadow-sm">
                <AlertTriangle size={16} className="shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider leading-tight">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="w-full">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2 mb-2 block">
                  Seu E-mail Cadastrado
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com.br"
                  className="w-full bg-slate-50 border border-slate-200 text-[#05121b] px-5 py-4 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#ff7b00] focus:border-transparent placeholder-slate-400 transition-all font-medium"
                />
              </div>

              <div className="pt-2 w-full">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#ff7b00] text-white w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:bg-[#e66a00] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Enviar Link de Recuperação'}
                </button>
              </div>
            </form>

            <div className="mt-8 text-center border-t border-slate-100 pt-6">
              <a
                href="login.html"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#05121b] transition-colors uppercase tracking-wider"
              >
                <ArrowLeft size={14} /> Voltar para o login
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default RecuperarSenha
