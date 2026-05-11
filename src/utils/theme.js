/** Aplica o tema salvo ao carregar (chame no topo do app) */
export function initTheme() {
  const saved = localStorage.getItem('oluap_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  return saved;
}

/** Alterna entre claro e escuro, persiste e dispara evento */
export function toggleTheme(current) {
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('oluap_theme', next); } catch {}
  return next;
}

/** Observa mudanças no atributo data-theme e chama callback */
export function onThemeChange(callback) {
  const obs = new MutationObserver(() => {
    callback(document.documentElement.getAttribute('data-theme') || 'light');
  });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => obs.disconnect();
}
