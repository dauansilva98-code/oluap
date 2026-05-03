export const formatBRL = v => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0)

export const formatCurrency = value => {
  if (!value) return ''
  const n = value.replace(/\D/g,'')
  if (!n) return ''
  return `R$ ${new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2}).format(parseFloat(n)/100)}`
}

export const maskCNPJ = v => {
  if (!v) return ''
  return v.replace(/\D/g,'').replace(/^(\d{2})(\d)/,'$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/,'$1.$2.$3').replace(/\.(\d{3})(\d)/,'.$1/$2').replace(/(\d{4})(\d)/,'$1-$2').replace(/(-\d{2})\d+?$/,'$1')
}

export const maskPhone = v => {
  if (!v) return ''
  return v.replace(/\D/g,'').replace(/^(\d{2})(\d)/g,'($1) $2').replace(/(\d)(\d{4})$/,'$1-$2').substring(0,15)
}

export const isValidEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
export const isValidCNPJ = c => c.replace(/\D/g,'').length === 14

export const FILE_EMOJI = name => {
  const e = name.split('.').pop().toLowerCase()
  return e==='pdf'?'📄':['xlsx','xls','csv'].includes(e)?'📊':e==='ofx'?'🏦':'📎'
}

export const parseChartData = text => {
  if (!text) return null
  const lines = text.split('\n').map(l=>l.trim())
  const data = {estruturaResultado:[],despesasOperacionais:[],estruturaFinanceira:[],indicadores:[]}
  let sec = ''
  lines.forEach(line => {
    if (line.includes('Estrutura de Resultado')) sec='estruturaResultado'
    else if (line.includes('Despesas Operacionais')) sec='despesasOperacionais'
    else if (line.includes('Estrutura Financeira')) sec='estruturaFinanceira'
    else if (line.includes('Indicadores')) sec='indicadores'
    else if (line.includes(':') && sec) {
      const [key,valStr] = line.split(':')
      if (key&&valStr) {
        const value = parseFloat(valStr.replace(/R\$/g,'').replace(/%/g,'').trim().replace(/\./g,'').replace(',','.'))
        if (!isNaN(value)) data[sec].push({name:key.trim(),value})
      }
    }
  })
  return data
}
