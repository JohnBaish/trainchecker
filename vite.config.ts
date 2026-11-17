import { defineConfig, type Connect, type Plugin, type ViteDevServer, type PreviewServer } from 'vite'
import react from '@vitejs/plugin-react'

// On Vercel, api/live.ts and api/week.ts are served as functions. Here, `npm run dev` and
// `vite preview` serve the same two files at the same addresses, so the page can be tried
// against National Rail from a cloud session (the session's proxy adds the key; locally, set
// RDM_LDB_KEY and RDM_HSP_KEY). Not part of the built site.
function functionsHere(): Plugin {
  const handle = (load: (f: string) => Promise<{ GET: (r: Request) => Promise<Response> }>): Connect.NextHandleFunction =>
    async (req, res, next) => {
      const m = /^\/api\/(live|week)(\?|$)/.exec(req.url || '')
      if (!m) return next()
      try {
        const mod = await load(`/api/${m[1]}.ts`)
        const r = await mod.GET(new Request(`http://localhost${req.url}`))
        res.statusCode = r.status
        r.headers.forEach((v, k) => res.setHeader(k, v))
        res.end(Buffer.from(await r.arrayBuffer()))
      } catch (e) {
        res.statusCode = 500
        res.end(String(e))
      }
    }
  return {
    name: 'trainchecker-functions',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(handle((f) => server.ssrLoadModule(f) as never))
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(handle((f) => import(new URL(`.${f}`, import.meta.url).href)))
    },
  }
}

export default defineConfig({
  plugins: [react(), functionsHere()],
})
