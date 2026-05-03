import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        static:                resolve(__dirname, 'src/static-main.js'),
        index:                 resolve(__dirname, 'index.html'),
        login:                 resolve(__dirname, 'login.html'),
        cadastro:              resolve(__dirname, 'cadastro.html'),
        admin:                 resolve(__dirname, 'admin.html'),
        diagnostico:           resolve(__dirname, 'diagnostico.html'),
        hub_cliente:           resolve(__dirname, 'hub_cliente.html'),
        credito:               resolve(__dirname, 'credito.html'),
        'produto-consultoria': resolve(__dirname, 'produto-consultoria.html'),
        'produto-erp':         resolve(__dirname, 'produto-erp.html'),
        'produto-diagnostico': resolve(__dirname, 'produto-diagnostico.html'),
        'produto-credito':     resolve(__dirname, 'produto-credito.html'),
      },
    },
  },
})
