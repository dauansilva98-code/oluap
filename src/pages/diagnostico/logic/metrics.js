import { formatBRL } from '../utils'
import {
  AlertOctagon, AlertTriangle, TrendingUp, CheckCircle, Target,
  Receipt, Wallet, CalendarDays
} from 'lucide-react'

export const pc = v => parseFloat((v||'').replace(/\D/g,'')) / 100 || 0

export const calcMetrics = (diag) => {
  if (!diag?.data) return null
  const d = diag.data
  const v1 = diag.form_type === 'Estruturado'
  const receita    = pc(v1 ? d.v1_fatMedio      : d.g_faturamento)
  const custDir    = pc(v1 ? d.v1_custosDiretos  : d.g_custosDiretos)
  const taxaRec    = pc(v1 ? d.v1_taxaRecebimento: d.g_taxaMaquininha)
  const comissoes  = pc(v1 ? d.v1_comissoes      : '0')
  const custVar    = custDir + taxaRec + comissoes
  const folha      = pc(v1 ? d.v1_folha          : d.g_gastoFunc)
  const prolabore  = pc(v1 ? d.v1_prolabore       : d.g_prolabore)
  const mkt        = pc(v1 ? d.v1_mkt             : '0')
  const aluguel    = pc(v1 ? d.v1_estrutura       : d.g_aluguel)
  const outrasFixas= pc(v1 ? d.v1_outrasFixas     : d.g_outrosFixos)
  const pesoDivida = pc(v1 ? d.v1_pesoDivida      : '0')
  const custFix    = folha + prolabore + mkt + aluguel + outrasFixas + pesoDivida
  const saldo      = pc(v1 ? d.v1_saldo           : '0')
  const numVendas  = v1 ? (parseFloat((d.v1_numVendas||'').replace(/\D/g,'')) || 0) : 0
  const pmr        = v1 ? (parseFloat(d.v1_prazoRec) || 0) : 0
  const pmp        = v1 ? (parseFloat(d.v1_prazoPag) || 0) : 0
  const totalCust     = custVar + custFix
  const lucro         = receita - totalCust
  const margemBruta   = receita > 0 ? ((receita - custDir) / receita) * 100 : 0
  const margContrib   = receita > 0 ? ((receita - custVar) / receita) * 100 : 0
  const margLiq       = receita > 0 ? (lucro / receita) * 100 : 0
  const pontoEq       = margContrib > 0 ? custFix / (margContrib / 100) : 0
  const burnRate      = lucro < 0 ? Math.abs(lucro) : totalCust
  const runwayMeses   = burnRate > 0 && saldo > 0 ? saldo / burnRate : 0
  const folegoDias    = Math.round(runwayMeses * 30)
  const ticketMedio   = numVendas > 0 ? receita / numVendas : 0
  let score = 50
  if (margLiq >= 15) score += 20; else if (margLiq >= 5) score += 10; else if (margLiq >= 0) score -= 5; else score -= 25
  if (folegoDias >= 90) score += 15; else if (folegoDias >= 45) score += 5; else if (folegoDias >= 20) score -= 5; else if (folegoDias > 0) score -= 15
  if (receita > 0 && pontoEq <= receita) score += 10; else if (receita > 0) score -= 10
  if (margemBruta >= 40) score += 5; else if (margemBruta < 15) score -= 5
  score = Math.max(10, Math.min(100, Math.round(score)))
  return { receita, custDir, custVar, custFix, totalCust, lucro, saldo, margemBruta, margContrib, margLiq, pontoEq, burnRate, runwayMeses, folegoDias, ticketMedio, pmr, pmp, score }
}

export const genCashFlowData = (m) => {
  if (!m || !m.receita) return []
  const rSem = m.receita / 4
  const cSem = m.totalCust / 4
  const ve = [0.9,1.1,0.85,1.15,0.95,1.2]
  const vs = [0.95,1.0,1.05,0.9,1.1,0.95]
  return ['Sem 1','Sem 2','Sem 3','Sem 4','Sem 5','Sem 6'].map((name,i)=>({
    name, Entradas: Math.round(rSem*ve[i]), Saidas: Math.round(cSem*vs[i])
  }))
}

export const genAlerts = (m) => {
  if (!m) return []
  const alerts = []
  if (m.margLiq < 0)
    alerts.push({type:'red',icon:AlertOctagon,msg:`Empresa operando com prejuízo de ${formatBRL(Math.abs(m.lucro))}/mês. Os custos superam o faturamento.`,time:'agora'})
  else if (m.margLiq < 5)
    alerts.push({type:'yellow',icon:AlertTriangle,msg:`Margem líquida de ${m.margLiq.toFixed(1)}% está baixa.`,time:'agora'})
  if (m.folegoDias > 0 && m.folegoDias < 30)
    alerts.push({type:'red',icon:AlertOctagon,msg:`Fôlego de caixa crítico: apenas ${m.folegoDias} dias.`,time:'agora'})
  else if (m.folegoDias >= 30 && m.folegoDias < 60)
    alerts.push({type:'yellow',icon:AlertTriangle,msg:`Fôlego de caixa de ${m.folegoDias} dias. Recomendamos ao menos 60 dias.`,time:'agora'})
  if (m.receita > 0 && m.pontoEq > m.receita)
    alerts.push({type:'yellow',icon:AlertTriangle,msg:`Ponto de equilíbrio (${formatBRL(m.pontoEq)}/mês) está acima do faturamento.`,time:'agora'})
  if (m.margLiq >= 15)
    alerts.push({type:'green',icon:TrendingUp,msg:`Margem líquida saudável de ${m.margLiq.toFixed(1)}%.`,time:'agora'})
  if (m.folegoDias >= 60)
    alerts.push({type:'green',icon:CheckCircle,msg:`Fôlego de caixa saudável: ${m.folegoDias} dias.`,time:'agora'})
  if (alerts.length === 0)
    alerts.push({type:'green',icon:CheckCircle,msg:'Indicadores dentro do esperado.',time:'agora'})
  return alerts
}

export const calcLiveMetrics = (lancamentos, bancos, dividas) => {
  if (!lancamentos || lancamentos.length === 0) return null
  const mesAtual = new Date().toISOString().slice(0,7)
  let src = lancamentos.filter(l => l.data && l.data.startsWith(mesAtual))
  let divisor = 1
  if (src.length === 0) {
    src = lancamentos
    divisor = Math.max(1, new Set(lancamentos.map(l=>l.data?.slice(0,7)).filter(Boolean)).size)
  }
  const receita = src.filter(l=>l.tipo==='receita').reduce((a,l)=>a+Number(l.valor),0) / divisor
  const allDesp = src.filter(l=>l.tipo==='despesa')
  const despTotal = allDesp.reduce((a,l)=>a+Number(l.valor),0) / divisor
  if (receita===0 && despTotal===0) return null
  const cogsCats = new Set(['Fornecedor','Cartão de Crédito'])
  const custDir = allDesp.filter(l=>cogsCats.has(l.categoria)).reduce((a,l)=>a+Number(l.valor),0) / divisor
  const custFix = despTotal - custDir
  const custVar = custDir
  const totalCust = custVar + custFix
  const lucro = receita - totalCust
  const margemBruta = receita>0 ? ((receita-custDir)/receita)*100 : 0
  const margContrib = receita>0 ? ((receita-custVar)/receita)*100 : 0
  const margLiq = receita>0 ? (lucro/receita)*100 : 0
  const pontoEq = margContrib>0 ? custFix/(margContrib/100) : 0
  const burnRate = totalCust
  const saldo = bancos.reduce((a,b)=>{
    const ent=lancamentos.filter(l=>l.banco_id===b.id&&l.tipo==='receita').reduce((s,l)=>s+Number(l.valor),0)
    const sai=lancamentos.filter(l=>l.banco_id===b.id&&l.tipo==='despesa').reduce((s,l)=>s+Number(l.valor),0)
    return a+Number(b.saldo_inicial)+ent-sai
  },0)
  const runwayMeses = burnRate>0&&saldo>0 ? saldo/burnRate : 0
  const folegoDias = Math.round(runwayMeses*30)
  let score=50
  if(margLiq>=15)score+=20; else if(margLiq>=5)score+=10; else if(margLiq<0)score-=25
  if(folegoDias>=90)score+=15; else if(folegoDias>=45)score+=5; else if(folegoDias>0&&folegoDias<20)score-=15
  if(receita>0&&pontoEq<=receita)score+=10; else if(receita>0)score-=10
  if(margemBruta>=40)score+=5; else if(margemBruta<15)score-=5
  score=Math.max(10,Math.min(100,Math.round(score)))
  return {receita,custDir,custVar,custFix,totalCust,lucro,saldo,margemBruta,margContrib,margLiq,pontoEq,burnRate,runwayMeses,folegoDias,ticketMedio:0,pmr:0,pmp:0,score}
}

export const genLiveCashFlowData = (lancamentos) => {
  const result=[]
  for(let i=5;i>=0;i--){
    const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i)
    const mes=d.toISOString().slice(0,7)
    const label=d.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'})
    const ent=lancamentos.filter(l=>l.data&&l.data.startsWith(mes)&&l.tipo==='receita').reduce((a,l)=>a+Number(l.valor),0)
    const sai=lancamentos.filter(l=>l.data&&l.data.startsWith(mes)&&l.tipo==='despesa').reduce((a,l)=>a+Number(l.valor),0)
    result.push({name:label,Entradas:ent,Saidas:sai})
  }
  return result
}

export const genLiveAlerts = (m, contasPagar, contasReceber, dividas, today) => {
  if(!m) return []
  const alerts = []
  if(m.margLiq < 0)
    alerts.push({cat:'Resultado',type:'red',icon:AlertOctagon,titulo:'Prejuízo operacional',
      msg:`A empresa está gastando mais do que fatura. Prejuízo de ${formatBRL(Math.abs(m.lucro))}/mês. Sem ação imediata, o caixa se esgota em ${m.folegoDias>0?m.folegoDias+' dias':'breve'}.`})
  if(m.folegoDias > 0 && m.folegoDias < 15)
    alerts.push({cat:'Caixa',type:'red',icon:AlertOctagon,titulo:'Caixa em estado crítico',
      msg:`Apenas ${m.folegoDias} dias de fôlego sem novas receitas.`})
  if(m.burnRate > 0 && m.receita > 0 && m.burnRate >= m.receita)
    alerts.push({cat:'Custos',type:'red',icon:AlertOctagon,titulo:'Burn rate supera a receita',
      msg:`Os custos (${formatBRL(m.burnRate)}/mês) são iguais ou maiores que o faturamento (${formatBRL(m.receita)}/mês).`})
  const atPag = contasPagar.filter(cp=>cp.vencimento<today&&cp.status!=='pago')
  if(atPag.length>0){
    const tot=atPag.reduce((a,cp)=>a+Number(cp.valor),0)
    const mais=atPag.sort((a,b)=>b.valor-a.valor)[0]
    alerts.push({cat:'Contas a Pagar',type:'red',icon:Receipt,titulo:`${atPag.length} conta${atPag.length>1?'s':''} vencida${atPag.length>1?'s':''}`,
      msg:`${formatBRL(tot)} em atraso. Maior: "${mais?.descricao||'—'}" (${formatBRL(mais?.valor||0)}).`})
  }
  const divAtivas = dividas.filter(d=>d.status==='ativa')
  const totalDividas = divAtivas.reduce((a,d)=>a+Number(d.valor_total||0),0)
  const parcelasMes = divAtivas.reduce((a,d)=>a+Number(d.valor_parcela||0),0)
  if(m.receita>0 && totalDividas > m.receita*12)
    alerts.push({cat:'Endividamento',type:'red',icon:AlertOctagon,titulo:'Endividamento crítico',
      msg:`Dívidas totais (${formatBRL(totalDividas)}) representam mais de 12 meses de faturamento.`})
  if(m.margLiq >= 0 && m.margLiq < 5)
    alerts.push({cat:'Resultado',type:'yellow',icon:AlertTriangle,titulo:'Margem líquida muito baixa',
      msg:`${m.margLiq.toFixed(1)}% de margem líquida — por cada R$100 faturados, sobram apenas R$${m.margLiq.toFixed(0)}.`})
  if(m.folegoDias >= 15 && m.folegoDias < 30)
    alerts.push({cat:'Caixa',type:'yellow',icon:AlertTriangle,titulo:'Fôlego de caixa baixo',
      msg:`${m.folegoDias} dias de operação garantidos. Abaixo do mínimo recomendado (60 dias).`})
  else if(m.folegoDias >= 30 && m.folegoDias < 60)
    alerts.push({cat:'Caixa',type:'yellow',icon:AlertTriangle,titulo:'Reserva operacional insuficiente',
      msg:`Fôlego de ${m.folegoDias} dias. Recomenda-se ao menos 60 dias.`})
  if(m.receita>0 && m.pontoEq > m.receita)
    alerts.push({cat:'Ponto de Equilíbrio',type:'yellow',icon:AlertTriangle,titulo:'Faturamento abaixo do PE',
      msg:`O ponto de equilíbrio é ${formatBRL(m.pontoEq)}/mês, mas o faturamento é ${formatBRL(m.receita)}/mês.`})
  if(m.margContrib > 0 && m.margContrib < 20)
    alerts.push({cat:'Margem de Contribuição',type:'yellow',icon:AlertTriangle,titulo:'Margem de contribuição crítica',
      msg:`${m.margContrib.toFixed(1)}% de margem de contribuição. Revise precificação ou negocie custos diretos.`})
  if(m.receita>0 && m.totalCust/m.receita > 0.85)
    alerts.push({cat:'Eficiência',type:'yellow',icon:AlertTriangle,titulo:'Estrutura de custos pesada',
      msg:`${(m.totalCust/m.receita*100).toFixed(1)}% da receita comprometida com custos.`})
  const atRec = contasReceber.filter(cr=>cr.vencimento<today&&cr.status!=='recebido')
  const totRec = contasReceber.filter(cr=>cr.status!=='recebido').reduce((a,cr)=>a+Number(cr.valor),0)
  if(atRec.length>0){
    const totAtRec=atRec.reduce((a,cr)=>a+Number(cr.valor),0)
    const pctInad=totRec>0?totAtRec/totRec*100:0
    alerts.push({cat:'Inadimplência',type:'yellow',icon:Wallet,titulo:`${atRec.length} recebível${atRec.length>1?'s':''} em atraso`,
      msg:`${formatBRL(totAtRec)} a cobrar (${pctInad.toFixed(0)}% dos recebíveis pendentes).`})
  }
  const d7 = new Date(today); d7.setDate(d7.getDate()+7)
  const d7s = d7.toISOString().split('T')[0]
  const vencendoBreve = contasPagar.filter(cp=>cp.vencimento>=today&&cp.vencimento<=d7s&&cp.status!=='pago')
  if(vencendoBreve.length>0){
    const tot7=vencendoBreve.reduce((a,cp)=>a+Number(cp.valor),0)
    alerts.push({cat:'Contas a Pagar',type:'yellow',icon:CalendarDays,titulo:`${vencendoBreve.length} conta${vencendoBreve.length>1?'s':''} vencendo em 7 dias`,
      msg:`${formatBRL(tot7)} com vencimento nos próximos 7 dias.`})
  }
  if(divAtivas.length>0 && parcelasMes>0 && m.receita>0 && parcelasMes/m.receita>0.3)
    alerts.push({cat:'Endividamento',type:'yellow',icon:AlertOctagon,titulo:'Parcelas comprometem a receita',
      msg:`As parcelas de dívidas somam ${formatBRL(parcelasMes)}/mês — ${(parcelasMes/m.receita*100).toFixed(0)}% do faturamento.`})
  if(m.custFix>0 && m.receita>0 && m.custFix/m.receita>0.5)
    alerts.push({cat:'Custos Fixos',type:'yellow',icon:AlertTriangle,titulo:'Custos fixos elevados',
      msg:`Custos fixos representam ${(m.custFix/m.receita*100).toFixed(1)}% do faturamento.`})
  if(m.margLiq >= 15)
    alerts.push({cat:'Resultado',type:'green',icon:TrendingUp,titulo:'Margem líquida saudável',
      msg:`${m.margLiq.toFixed(1)}% de margem líquida. A empresa gera ${formatBRL(m.lucro)}/mês de resultado positivo.`})
  else if(m.margLiq >= 5 && m.margLiq < 15)
    alerts.push({cat:'Resultado',type:'green',icon:TrendingUp,titulo:'Resultado positivo',
      msg:`Margem líquida de ${m.margLiq.toFixed(1)}%. Resultado positivo de ${formatBRL(m.lucro)}/mês.`})
  if(m.folegoDias >= 90)
    alerts.push({cat:'Caixa',type:'green',icon:CheckCircle,titulo:'Caixa bem capitalizado',
      msg:`${m.folegoDias} dias de fôlego operacional — boa reserva de segurança.`})
  else if(m.folegoDias >= 60)
    alerts.push({cat:'Caixa',type:'green',icon:CheckCircle,titulo:'Fôlego de caixa adequado',
      msg:`${m.folegoDias} dias de operação garantidos sem novas receitas.`})
  if(m.receita>0 && m.pontoEq>0 && m.receita >= m.pontoEq*1.2)
    alerts.push({cat:'Ponto de Equilíbrio',type:'green',icon:Target,titulo:'Operando acima do ponto de equilíbrio',
      msg:`Faturamento (${formatBRL(m.receita)}) está ${(m.receita/m.pontoEq*100-100).toFixed(0)}% acima do PE (${formatBRL(m.pontoEq)}).`})
  if(m.margContrib >= 40)
    alerts.push({cat:'Margem de Contribuição',type:'green',icon:TrendingUp,titulo:'Margem de contribuição forte',
      msg:`${m.margContrib.toFixed(1)}% de margem de contribuição.`})
  if(atPag.length===0 && contasPagar.length>0)
    alerts.push({cat:'Contas a Pagar',type:'green',icon:CheckCircle,titulo:'Contas a pagar em dia',
      msg:'Nenhuma conta em atraso.'})
  if(alerts.length===0)
    alerts.push({cat:'Geral',type:'green',icon:CheckCircle,titulo:'Indicadores equilibrados',
      msg:'Todos os indicadores estão dentro do esperado.'})
  const order = {red:0,yellow:1,green:2}
  return alerts.sort((a,b)=>order[a.type]-order[b.type])
}
