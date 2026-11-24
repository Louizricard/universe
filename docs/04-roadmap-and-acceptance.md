# Universe — Roadmap de Execução e Contrato de Aceitação

## 1. Plano de Entrega em Fases Funcionais

Cada fase entrega software **100% executável, testado e sem mocks** (nenhum botão morto ou placeholder oculto).

### Fase 0 — Fundação & Chassi da Oficina
- [x] Bootstrap do monorepo **Tauri v2 + React 19 + TypeScript + Vite + Rust + Sidecar Python (`uv`)**.
- [x] Design System **Industrial-Craft** completo (tokens Claro + Escuro, tipografia `Space Grotesk` / `Inter` / `JetBrains Mono`, componentes táteis, **sem áudio**).
- [x] Shell principal: Topbar, Sidebar com highlight fluido deslizante, **Smart Dropzone Universal**, **Command Palette (`Ctrl+K`)**, **Favoritos & Recentes**.
- [x] **Job Scheduler (Rust)** com fila concorrente, cancelamento limpo, telemetria em tempo real, **Bandeja de Lote (Batch)** e **Executor de Pipelines**.
- [x] **Motor `MachineStage`** + biblioteca de primitivas mecânicas SVG/Canvas + suporte a `prefers-reduced-motion`.
- [x] **Gerenciador de Motores & Modelos** (download sob demanda com checksum e progresso) + **Cofre de API Keys** (OS Keyring).

### Fase 1 — Core Produtivo (30 Ferramentas: Prioridade Principal)
1. **Utilitários Digitais (51–60)** — execução ultrarrápida em Rust nativo + 10 animações próprias.
2. **Edição e Otimização de Imagens (21–30)** — Pillow, `resvg`, `pillow-heif`, modelos ONNX sob demanda (`rembg`, `Real-ESRGAN`, `LaMa`) + adaptador de API opcional + 10 animações próprias.
3. **Ferramentas para PDF (11–20)** — `pypdf`, `PyMuPDF`, `Ghostscript`, `Tesseract OCR` + mesa de luz interativa para reorganizar páginas + canvas de assinatura + 10 animações próprias.

### Fase 2 — Mídia & Downloads (20 Ferramentas)
4. **Vídeo e Áudio (41–50)** — `ffmpeg`, timeline interativa de corte, `noisereduce`, `faster-whisper` (local + API opcional) + 10 animações próprias.
5. **Download de Vídeos e Mídias (31–40)** — `yt-dlp` + `gallery-dl` com auto-detecção de plataforma na Smart Dropzone, seletor de qualidade/formato, aviso de direitos autorais e botão de atualização do `yt-dlp` + 10 animações próprias.

### Fase 3 — Documentos & Utilitários Avançados (20 Ferramentas)
6. **Conversão de Arquivos e Documentos (1–10)** — LibreOffice headless, `pdf2docx`, `pdfplumber`, `python-pptx`, `WeasyPrint`, `img2pdf` + 10 animações próprias.
7. **Outras Ferramentas Úteis (61–70)** — GIFs, remoção de EXIF, OCR de imagem, marca-d'água interativa, corte de silêncio, legendas automáticas, `SRT → VTT`, `EPUB → PDF`, `CSV → Excel` + 10 animações próprias.

### Fase 4 — Polimento, Pipelines Avançados & Empacotamento
- [ ] Editor visual completo de Pipelines com presets prontos e receitas salvas.
- [ ] Empacotamento e testes em **Linux** (`.AppImage` / `.deb`), **Windows** (`.msi` / `.exe`) e **macOS** (`.dmg`).
- [ ] Auditoria de performance (60 FPS em animações, memória sob lote de 50+ arquivos) e acessibilidade.

---

## 2. Contrato de Produção e Critérios de Aceitação

Nenhuma ferramenta ou fluxo é considerado concluído sem evidência de execução real nos testes abaixo:

| ID | Área | Cenário Verificável | Critério de Aprovação |
| --- | --- | --- | --- |
| **AC-01** | Primeira renderização | Abrir o Universe em `1440×900` e `1024×680` (Claro e Escuro) | Zero overflow horizontal, contraste ≥ 4.5:1, zero erros no console. |
| **AC-02** | Smart Dropzone | Arrastar `.pdf`, `.png`, `.mp4` e colar URL do YouTube na Home | Detecção correta por MIME/URL e sugestão imediata das ferramentas compatíveis. |
| **AC-03** | Command Palette | Pressionar `Ctrl+K`, buscar por apelido/ação (`"prensar"`, `"qr"`) e navegar só por teclado | Abre a ferramenta correta em < 150ms, foco transferido para a bancada. |
| **AC-04** | Fidelidade de Animação | Executar ferramenta (ex: #13 Comprimir PDF) e observar quadros em `armed`, `running (30%, 70%)` e `success` | Prensa hidráulica desce proporcionalmente ao progresso real, exibe `MB antes → depois` e retorna limpa ao resetar. |
| **AC-05** | Interrupção / Cancelamento | Cancelar job pesado no meio (`running`) | Processo filho encerrado sem zumbis, arquivos temporários removidos, máquina retorna a `armed` em ≤ 300ms. |
| **AC-06** | Processamento em Lote | Arrastar 10 imagens (incluindo 1 arquivo corrompido) para #22 Comprimir Imagem | 9 concluem com sucesso, 1 exibe erro isolado sem travar a fila, botão "Tentar novamente falhos" funciona. |
| **AC-07** | Pipeline | Executar cadeia de 2+ etapas (ex: `PNG → JPG` → `Remover Metadados` → `Criar ZIP`) | Saída de cada etapa alimenta automaticamente a próxima e entrega o artefato final íntegro. |
| **AC-08** | Reduced Motion | Ativar `prefers-reduced-motion: reduce` | Movimento amplo substituído por transição de opacidade + barra técnica de precisão sem perda funcional. |
| **AC-09** | Download de Modelo / Offline | Abrir ferramenta de IA (#21 ou #50) sem modelo baixado | Exibe tamanho do modelo, baixa com barra real e valida checksum; falha de rede exibe erro claro com opção de retry. |
| **AC-10** | Privacidade & Zero Som | Inspecionar tráfego de rede e contexto de áudio durante uso local | Zero chamadas de áudio (Web Audio não instanciado); zero envio externo em ferramentas locais sem API key opt-in. |

## 3. Como Evoluir Este Documento

- Este diretório `docs/` é a **fonte de verdade viva** do projeto.
- Qualquer mudança de motor, novo formato suportado ou ajuste de contrato de IPC deve atualizar o respectivo documento antes ou junto do PR correspondente.
