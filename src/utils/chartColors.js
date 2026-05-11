/**
 * Retorna as cores de gráfico a partir das variáveis CSS do tema ativo.
 * Compatível com recharts (via prop) e Chart.js.
 */
export function getChartColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (name) => s.getPropertyValue(name).trim();
  return {
    green:       v('--chart-green'),
    blue:        v('--chart-blue'),
    red:         v('--chart-red'),
    amber:       v('--chart-amber'),
    purple:      v('--chart-purple'),
    text:        v('--chart-text'),
    grid:        v('--chart-grid'),
    greenFill:   v('--chart-green') + '26',
    blueFill:    v('--chart-blue')  + '26',
    redFill:     v('--chart-red')   + '26',
  };
}

/**
 * Helper para usar em componentes React com isDark como dependência:
 *   const CC = useMemo(() => getChartColors(), [isDark]);
 */
export function getChartColorsForTheme(isDark) {
  return isDark ? {
    green:  '#6FCF97', blue: '#56CCF2', red: '#EB5757',
    amber:  '#F2994A', purple: '#BB87FC',
    text:   '#9B9A96', grid: 'rgba(255,255,255,0.06)',
    greenFill: '#6FCF9726', blueFill: '#56CCF226', redFill: '#EB575726',
  } : {
    green:  '#1D9E75', blue: '#378ADD', red: '#D85A30',
    amber:  '#BA7517', purple: '#7F77DD',
    text:   '#6B6A66', grid: 'rgba(128,128,128,0.08)',
    greenFill: '#1D9E7526', blueFill: '#378ADD26', redFill: '#D85A3026',
  };
}
