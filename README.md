# Universe

Aplicativo desktop universal **Oficina Tátil / Industrial-Craft** (Tauri v2 + React 19 + TypeScript + Rust + Sidecar Python) reunindo **70 ferramentas reais** locais — sem paywalls, sem anúncios, sem efeitos sonoros, com Modo Claro e Modo Escuro e animações mecânicas individuais para cada ferramenta.

## Documentação

- [Visão de Produto e Arquitetura](docs/01-product-and-architecture.md)
- [Design System e Engenharia de Motion](docs/02-design-system-and-motion.md)
- [Catálogo das 70 Ferramentas e Animações](docs/03-tools-catalog-and-animations.md)
- [Roadmap e Contrato de Aceitação](docs/04-roadmap-and-acceptance.md)

## Como rodar em desenvolvimento

### Pré-requisitos (Linux / Ubuntu 24.04)
- Node.js 22+ e `pnpm`
- Rust (`cargo` / `rustc`)
- Python 3.12+ e `uv`
- Bibliotecas de sistema Tauri v2: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `librsvg2-dev`, `libssl-dev`, `libayatana-appindicator3-dev`, `libxdo-dev`, `pkg-config`, `patchelf`, `libdbus-1-dev`

### Comandos
```bash
# Instalar dependências frontend
pnpm install

# Rodar interface web em modo desenvolvimento (Vite)
pnpm dev

# Rodar aplicativo desktop completo (Tauri v2)
pnpm tauri:dev

# Rodar suítes de testes (Frontend + Worker Python + Core Rust)
pnpm test
```
