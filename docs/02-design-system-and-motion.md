# Universe — Design System e Engenharia de Motion

## 1. Direção Artística: Oficina Tátil / Industrial-Craft (Silenciosa)

O Universe traduz a precisão de instrumentos físicos (Dieter Rams / Braun, Teenage Engineering, Apple Hardware) para uma aplicação desktop de alta velocidade:

- **Materialidade legível**: superfícies foscas com micro-bordas de 1px que definem planos físicos (chassi, bancada, bandeja, cartucho, visor técnico), sem poluição de glassmorphism ou gradientes neon.
- **Hierarquia orientada à tarefa**: o foco central é sempre a **Bancada da Ferramenta** (Dropzone / Preview + Máquina Animada + Controles de Precisão). A animação nunca atrapalha ou atrasa o usuário experiente: ela acontece *enquanto* o processamento real ocorre e comunica estado, progresso e resultado.
- **Silencioso por design**: nenhum efeito sonoro é emitido. Todo feedback tátil é entregue por física de mola, micro-deslocamentos, mudança de peso tipográfico sem *layout shift*, LEDs de estado e transformações mecânicas.

## 2. Sistema de Tokens Visuais

### 2.1 Paleta de Cores (Modo Claro & Modo Escuro)

| Token | Modo Claro (Alumínio / Papel Técnico) | Modo Escuro (Grafite Anodizado) | Uso |
| --- | --- | --- | --- |
| `--bg-chassis` | `#ECEAE4` | `#0F1114` | Fundo base do aplicativo (chassi) |
| `--bg-workbench` | `#F6F5F0` | `#16191E` | Superfície principal da bancada |
| `--bg-module` | `#FFFFFF` | `#1E2229` | Cartuchos, cards de ferramenta, inspetor |
| `--bg-recessed` | `#E3E0D8` | `#0B0D10` | Calhas, dropzone rebaixada, visores técnicos |
| `--border-subtle` | `rgba(20, 22, 26, 0.09)` | `rgba(255, 255, 255, 0.08)` | Divisórias e contornos de módulo |
| `--border-strong` | `rgba(20, 22, 26, 0.20)` | `rgba(255, 255, 255, 0.18)` | Contornos ativos, hover, foco |
| `--text-primary` | `#14161A` | `#F2F4F8` | Títulos, labels principais (contraste > 12:1) |
| `--text-secondary` | `#525760` | `#9CA3AF` | Descrições, metadados (contraste > 6:1) |
| `--text-muted` | `#7A808A` | `#6B7280` | Hints, atalhos de teclado |
| `--accent-signal` | `#FF5500` | `#FF641A` | Ação primária, botão "Executar", LED ativo |
| `--accent-signal-hover` | `#E04A00` | `#FF7833` | Hover da ação primária |
| `--status-ok` | `#15803D` | `#22C55E` | LED verde — concluído / válido |
| `--status-warn` | `#B45309` | `#F59E0B` | LED âmbar — atenção / download de modelo |
| `--status-err` | `#B91C1C` | `#EF4444` | LED vermelho — erro / cancelado |

### 2.2 Cores de Categoria (Indicador Técnico Discreto — LED / Faixa de 3px)

| # | Categoria | Cor Indicadora (Claro / Escuro) |
| --- | --- | --- |
| 1 | Conversão de Documentos | `#2563EB` / `#60A5FA` |
| 2 | Ferramentas para PDF | `#DC2626` / `#F87171` |
| 3 | Edição e Otimização de Imagens | `#9333EA` / `#C084FC` |
| 4 | Download de Vídeos e Mídias | `#EA580C` / `#FB923C` |
| 5 | Vídeo e Áudio | `#0D9488` / `#2DD4BF` |
| 6 | Utilitários Digitais | `#4F46E5` / `#818CF8` |
| 7 | Outras Ferramentas Úteis | `#CA8A04` / `#FACC15` |

### 2.3 Tipografia

- **Display / UI**: `Space Grotesk` (títulos de módulo e cabeçalhos) + `Inter` (labels, controles, corpo).
- **Dados / Telemetria / Atalhos**: `JetBrains Mono` com `font-variant-numeric: tabular-nums` obrigatório em porcentagens, tamanhos de arquivo (`14.2 MB → 2.8 MB`), dimensões (`1920×1080`), tempo restante e contadores.
- **Escala**:
  - `text-xs`: `11px / 16px` (micro-labels de instrumento, tracking `+0.04em`, uppercase)
  - `text-sm`: `13px / 18px` (controles, itens de lista, badges)
  - `text-base`: `14px / 20px` (corpo padrão desktop)
  - `text-lg`: `18px / 24px` (título da ferramenta na bancada, tracking `-0.015em`)
  - `text-xl`: `24px / 30px` (cabeçalho de categoria/home, tracking `-0.025em`)
- **Zero Layout Shift em Hover**: mudanças de ênfase tipográfica usam `text-shadow` sutil ou eixo `wght` preservando largura, evitando trepidação nos itens da barra lateral.

### 2.4 Espaçamento, Raios e Camadas (`z-index`)

- **Grid base**: múltiplos de `4px` (`4, 8, 12, 16, 20, 24, 32`).
- **Raios**: `6px` (botões/inputs), `10px` (cartuchos/cards), `14px` (bancada/dropzone), `999px` (LEDs/pills).
- **Viewport de referência**: `1440×900` (mínimo suportado: `1024×680`, responsivo fluido com sidebar recolhível para modo compacto de `64px`).
- **Mapa de Stacking Contexts**:
  - `z-0`: Chassi e bancada
  - `z-10`: Sidebar, barra superior, bandeja de lote recolhível
  - `z-20`: Popovers de configuração e tooltips técnicos
  - `z-30`: Overlay global de Drag & Drop (Smart Dropzone)
  - `z-40`: Command Palette (`Ctrl+K`) e modais de gerenciador de modelos
  - `z-50`: Toasts de notificação e progresso minimizado

## 3. Arquitetura de Layout do Aplicativo

1. **Topbar Slim (`44px`)**: Logo Universe, gatilho da Command Palette (`Ctrl+K`), indicador de Jobs ativos (pílula expansível com mini-LED pulsante), alternador Claro/Escuro e botão de Configurações/Motores.
2. **Rail / Sidebar Esquerda (`240px` expandida / `64px` compacta)**:
   - Atalhos rápidos: *Início*, *Pipelines*, *Fila de Lote*, *Favoritos*.
   - Lista das 7 categorias com **highlight deslizante** (*Fluid Functionalism* `layoutId` spring) que acompanha o cursor e a seleção ativa sem teleporte.
3. **Bancada Principal (Área Fluida)**:
   - **Na Home**: Smart Dropzone Universal no topo + seção *Favoritos & Recentes* + grid de cartuchos filtrável por categoria com micro-preview animado no hover.
   - **Dentro de uma Ferramenta**: layout em 2 colunas adaptativas:
     - **Esquerda (Palco Principal — 62%)**: `MachineStage` interativo (onde o arquivo entra, a máquina específica anima em sincronia com o job real e o resultado aparece com comparador Antes/Depois quando aplicável).
     - **Direita (Painel de Instrumentos — 38%, min `320px`, max `420px`)**: parâmetros táteis da ferramenta (sliders com detent, segmented controls, switches físicos, seletor de motor Local vs API opcional) + botão primário de execução + ações de saída (*Abrir*, *Mostrar na pasta*, *Encadear em Pipeline*).
4. **Bandeja Inferior de Lote (Batch Drawer)**: sobe suavemente quando há 2+ arquivos ou jobs em andamento.

## 4. Sistema de Motion e Motor `MachineStage`

### 4.1 Constantes Físicas (Springs & Easings)

| Perfil | Parâmetros | Uso |
| --- | --- | --- |
| `spring.snappy` | `stiffness: 520, damping: 36, mass: 0.8` | Botões táteis, switches, highlight da sidebar, detents |
| `spring.mechanical` | `stiffness: 340, damping: 28, mass: 1.1` | Movimento de êmbolos, guilhotinas, engrenagens, cartuchos |
| `spring.heavy` | `stiffness: 220, damping: 26, mass: 1.6` | Impacto da prensa hidráulica, travamento de cofre, abertura de drawer |
| `ease.technical` | `cubic-bezier(0.22, 1, 0.36, 1)` | Barras de telemetria, transições de painel (`180–280ms`) |
| `ease.exit` | `cubic-bezier(0.4, 0, 1, 1)` | Saída limpa de overlays e toasts (`140–180ms`) |

### 4.2 Máquina de Estados do `MachineStage`

Cada uma das 70 ferramentas implementa um componente `MachineStage` padronizado com contrato determinístico:

```ts
export type MachinePhase =
  | 'idle'       // Máquina em repouso, pronta para receber arquivo/texto/URL
  | 'hover'      // Usuário arrastando arquivo sobre a máquina (abertura magnética / trava armada)
  | 'armed'      // Insumo carregado, aguardando clique em Executar (preview posicionado na câmara)
  | 'running'    // Processamento real em andamento; recebe progress (0..1), subStage e metrics
  | 'success'    // Trabalho concluído: ejeção/revelação do arquivo final + selo/métrica (ex: -74%)
  | 'error'      // Falha recuperável: trava de segurança vermelha + mensagem clara + botão Tentar novamente
  | 'cancelled'; // Cancelamento pelo usuário: retorno suave da máquina ao estado armed
```

### 4.3 Arquitetura Híbrida de Renderização das 70 Animações

Para manter **60 FPS constantes** com bundle leve e manutenção viável para 70 ferramentas distintas:

1. **Camada 1 — Componentes Mecânicos Reutilizáveis em SVG de Precisão (`src/machines/primitives/`)**:
   - Primitivas parametrizáveis que compõem as máquinas: êmbolo hidráulico, lâmina/guilhotina, feixe de scanner óptico, rolos alimentadores, carretel de fita, espectro de onda, malha de pixels, tambor de cofre, bandeja de ejeção, manômetro analógico/digital.
2. **Camada 2 — Coreografia Exclusiva por Ferramenta (`src/machines/tools/<tool-id>.tsx`)**:
   - Cada uma das 70 ferramentas possui sua composição e coreografia própria ligada ao progresso real do job (ver catálogo completo em [03-tools-catalog-and-animations.md](./03-tools-catalog-and-animations.md)).
   - Ex.: **#13 Comprimir PDF** desce a prensa hidráulica proporcionalmente ao progresso, achata visualmente a pilha de folhas com deformação elástica (`scaleY`), sobe o ponteiro do manômetro e exibe em tempo real `18.4 MB → 3.1 MB (-83%)`.
3. **Camada 3 — Canvas 2D Opcional**:
   - Reservada apenas para ferramentas que manipulam visualmente pixels/ondas/espectro ao vivo (ex: máscara de remoção de objetos #30, waveform de corte/silêncio #49/#66, comparador de resolução #29).

### 4.4 Acessibilidade, Teclado e `prefers-reduced-motion`

- **Navegação 100% por teclado**: foco visível de alto contraste (`2px solid var(--accent-signal)` com offset `2px`), atalhos `Ctrl+K` (busca), `Ctrl+Enter` (executar), `Esc` (fechar modal / cancelar foco).
- **Interrupções**: cancelar um job em `running` nunca deixa a máquina congelada no meio — ela reverte deterministicamente para `armed` em `240ms`.
- **`prefers-reduced-motion: reduce`**: desativa deslocamentos amplos, shakes e loops contínuos; substitui a animação cinética por transições sutis de opacidade (`120ms`) e um indicador numérico/barra técnica de precisão com o mesmo nível de informação.
