# Universe — Catálogo das 70 Ferramentas e Coreografia de Animações

Cada uma das 70 ferramentas possui:
- **Motor Local Padrão** (gratuito e offline, exceto downloads web e encurtador de links).
- **API Opcional** (quando aplicável, ativável por chave do usuário nas configurações).
- **Animação Mecânica/Tátil Própria** no `MachineStage`, sincronizada com o progresso real (`armed → running → success`).
- Suporte explícito a **Lote (`Batch`)** e **Encadeamento (`Pipe`)**.

---

## Categoria 1 — Conversão de Arquivos e Documentos (1–10)

| # | Ferramenta | Motor Local | Batch / Pipe | Animação Própria (`MachineStage`) |
| --- | --- | --- | --- | --- |
| 1 | **Word → PDF** | LibreOffice headless (`soffice`) | Batch · Pipe | **Prensa de Encadernação**: folha `.docx` entra pelos rolos, recebe capa vermelha PDF e carimbo selado em relevo. |
| 2 | **PDF → Word** | `pdf2docx` (Python) | Batch · Pipe | **Desencadernador Óptico**: documento PDF abre a lombada, linhas de texto se soltam em blocos editáveis com cursor piscante. |
| 3 | **Excel → PDF** | LibreOffice headless | Batch · Pipe | **Plotter de Planilha**: grade de células desliza sob cabeçote de impressão, fixando margens e gerando páginas numeradas. |
| 4 | **PDF → Excel** | `pdfplumber` + `openpyxl` | Batch · Pipe | **Scanner de Grade**: feixe horizontal detecta colunas no PDF e projeta os dados encaixando célula por célula na planilha verde. |
| 5 | **PowerPoint → PDF** | LibreOffice headless | Batch · Pipe | **Projetor de Slides**: cartucho de slides avança quadro a quadro e empilha cada lâmina em um caderno PDF compacto. |
| 6 | **PDF → PowerPoint** | `PyMuPDF` + `python-pptx` | Batch · Pipe | **Mesa de Montagem**: páginas PDF se separam em quadros widescreen 16:9 encaixando em um carrossel de apresentação. |
| 7 | **JPG/PNG → PDF** | `img2pdf` / `Pillow` | Batch · Pipe | **Álbum de Contato**: fotos caem magneticamente sobre folhas brancas, alinham-se às margens e são grampeadas em um PDF. |
| 8 | **PDF → JPG/PNG** | `PyMuPDF` (`fitz`) | Batch · Pipe | **Extrator Fotográfico**: cada página do PDF desliza para fora como uma foto instantânea saindo da fenda da câmera. |
| 9 | **HTML → PDF** | Chromium headless / WeasyPrint | Batch · Pipe | **Renderizador de Código**: tags HTML passam por um prisma que cristaliza o layout renderizado em páginas A4. |
| 10 | **TXT → PDF** | `reportlab` / `WeasyPrint` | Batch · Pipe | **Máquina de Escrever Mecânica**: fita de texto puro é tipografada em ritmo cadenciado sobre uma folha limpa com margens. |

---

## Categoria 2 — Ferramentas para PDF (11–20)

| # | Ferramenta | Motor Local | Batch / Pipe | Animação Própria (`MachineStage`) |
| --- | --- | --- | --- | --- |
| 11 | **Juntar vários PDFs** | `pypdf` / `PyMuPDF` | Pipe | **Encadernadora de Trilho**: vários cadernos deslizando em trilhos convergentes, alinhando-se e recebendo um grampo metálico único. |
| 12 | **Dividir PDF** | `pypdf` | Pipe | **Guilhotina de Precisão**: linha laser marca os pontos de corte; a lâmina desce com mola mecânica separando os blocos de páginas. |
| 13 | **Comprimir PDF** | `Ghostscript` / `PyMuPDF` | Batch · Pipe | **Prensa Hidráulica**: êmbolo metálico desce comprimindo a pilha de folhas com manômetro de pressão e contador `MB → KB`. |
| 14 | **Remover páginas de PDF** | `pypdf` | Pipe | **Bandeja de Descarte**: páginas selecionadas sobem do maço, giram e são ejetadas para a calha lateral enquanto as restantes se fecham. |
| 15 | **Reorganizar páginas de PDF** | `pypdf` | Pipe | **Mesa de Luz Interativa**: miniaturas reais das páginas com drag-and-drop magnético com mola e renumeração automática ao soltar. |
| 16 | **Girar páginas de PDF** | `pypdf` | Batch · Pipe | **Plataforma Giratória**: disco calibrado em 90°/180°/270° com trava mecânica (detent) girando a folha com inércia física. |
| 17 | **Adicionar assinatura a PDF** | `PyMuPDF` + Canvas assinatura | Pipe | **Carimbo / Caneta-Tinteiro**: traço da assinatura do usuário desce sobre a área escolhida e sela com pressão suave na página. |
| 18 | **Proteger PDF com senha** | `pypdf` (AES-256) | Batch · Pipe | **Trava de Cofre**: disco de combinação gira até travar o cadeado blindado sobre o documento com LED verde de criptografia. |
| 19 | **Remover senha de PDF** | `pypdf` (com senha autorizada) | Batch · Pipe | **Chave de Desbloqueio**: pinos internos do cilindro alinham-se ao validar a senha, o arco do cadeado abre e libera o arquivo. |
| 20 | **Extrair texto de PDF escaneado (OCR)** | `Tesseract OCR` + `PyMuPDF` *(API opcional)* | Batch · Pipe | **Scanner de Mesa Óptico**: barra luminosa varre cada página de cima a baixo iluminando palavras reconhecidas que migram para o bloco de texto. |

---

## Categoria 3 — Edição e Otimização de Imagens (21–30)

| # | Ferramenta | Motor Local | Batch / Pipe | Animação Própria (`MachineStage`) |
| --- | --- | --- | --- | --- |
| 21 | **Remover fundo de imagem** | `rembg` (ONNX U2Net/BiRefNet) *(API opcional)* | Batch · Pipe | **Mesa de Recorte Óptico**: contorno do sujeito brilha em linha pontilhada, o fundo se dissolve em grade quadriculada transparente e o sujeito flutua com sombra suave. |
| 22 | **Comprimir imagem** | `Pillow` / `oxipng` / `mozjpeg` / `libwebp` | Batch · Pipe | **Prensa de Rolos Calibrada**: imagem passa por dois rolos de precisão saindo mais leve com comparador deslizante Antes/Depois e economia em `%`. |
| 23 | **Redimensionar imagem** | `Pillow` (Lanczos) | Batch · Pipe | **Moldura Pantográfica**: alças de medição nos 4 cantos contraem/expandem com régua de pixels (`W × H`) em tempo real. |
| 24 | **Converter PNG → JPG** | `Pillow` | Batch · Pipe | **Câmara de Revelação**: fundo transparente recebe chapa de cor sólida e passa por filtro quente virando etiqueta `.JPG`. |
| 25 | **Converter JPG → PNG** | `Pillow` | Batch · Pipe | **Descompactador Lossless**: imagem entra no prisma sem perdas e sai encapsulada em cartucho `.PNG` com suporte a canal alfa. |
| 26 | **Converter HEIC → JPG** | `pillow-heif` | Batch · Pipe | **Decodificador Apple-Bridge**: cápsula `.HEIC` destrava o contêiner HEVC e revela a foto universal `.JPG`. |
| 27 | **Converter WEBP → PNG** | `Pillow` | Batch · Pipe | **Conversor Web-to-Studio**: badge `.WEBP` gira em flip 3D mecânico revelando a saída `.PNG` pronta para edição. |
| 28 | **Converter SVG → PNG** | `resvg` (Rust) / `cairosvg` | Batch · Pipe | **Rasterizador Vetorial**: curvas Bézier com pontos de âncora acendem e solidificam em uma grade de pixels na resolução escolhida (`1x/2x/4x`). |
| 29 | **Aumentar resolução com IA** | `Real-ESRGAN` (ONNX/ncnn) *(API opcional)* | Batch · Pipe | **Lupa de Super-Resolução**: lente circular percorre a imagem transformando blocos borrados em detalhes nítidos (`2× / 4×`) com slider comparador. |
| 30 | **Remover objetos de fotos** | `LaMa` Inpainting (ONNX) *(API opcional)* | Pipe | **Pincel de Reconstrução**: usuário pinta a máscara sobre o objeto no Canvas; ondas de síntese preenchem a área reconstruindo o fundo ao redor. |

---

## Categoria 4 — Download de Vídeos e Mídias (31–40)

> *Aviso integrado na UI: downloads estão sujeitos às permissões, aos direitos autorais e às regras de cada plataforma.*

| # | Ferramenta | Motor Local | Batch / Pipe | Animação Própria (`MachineStage`) |
| --- | --- | --- | --- | --- |
| 31 | **Baixar vídeos do YouTube** | `yt-dlp` + `ffmpeg` | Batch · Pipe | **Carretel de Captura Cinema**: URL encaixa no leitor, thumbnail aparece no monitor e bobinas giram em sincronia com Mbps e progresso. |
| 32 | **Baixar Shorts do YouTube** | `yt-dlp` + `ffmpeg` | Batch · Pipe | **Cassete Vertical 9:16**: visor vertical trava no clipe curto e puxa os frames em alta velocidade para o cartucho MP4. |
| 33 | **Baixar Reels do Instagram** | `yt-dlp` | Batch · Pipe | **Fita de Carretel Vertical**: quadro 9:16 recebe o fluxo de vídeo com anel de progresso de obturador fotográfico. |
| 34 | **Baixar fotos do Instagram** | `gallery-dl` / `yt-dlp` | Batch · Pipe | **Bandeja de Contato Polaroid**: cada foto do post/carrossel desliza para fora em sequência empilhada. |
| 35 | **Baixar vídeos do TikTok** | `yt-dlp` | Batch · Pipe | **Sincronizador de Clipe**: claquete digital fecha ao iniciar e barra de onda rítmica acompanha o download até a ejeção. |
| 36 | **Baixar vídeos do Pinterest** | `yt-dlp` | Batch · Pipe | **Extrator de Pin em Movimento**: pino metálico solta o cartão do mural e transfere o vídeo para a bandeja local. |
| 37 | **Baixar imagens do Pinterest** | `gallery-dl` | Batch · Pipe | **Desafixador de Mural**: tachinha industrial desencaixa a imagem em resolução original e a deposita no arquivo local. |
| 38 | **Baixar vídeos do X (Twitter)** | `yt-dlp` | Batch · Pipe | **Receptor de Transmissão**: antena/osciloscópio capta o stream do post e decodifica o MP4 na bandeja. |
| 39 | **Baixar vídeos do Facebook** | `yt-dlp` | Batch · Pipe | **Decodificador de Feed**: rolo de filme puxa o stream HD com indicador de bitrate e resolução detectada. |
| 40 | **Baixar vídeos do Reddit** | `yt-dlp` + `ffmpeg` (mux áudio+vídeo) | Batch · Pipe | **Muxer de Duas Pistas**: duas fitas separadas (vídeo + áudio) correm em paralelo e se fundem em um único rolo sincronizado. |

---

## Categoria 5 — Vídeo e Áudio (41–50)

| # | Ferramenta | Motor Local | Batch / Pipe | Animação Própria (`MachineStage`) |
| --- | --- | --- | --- | --- |
| 41 | **Converter MP4 → MP3** | `ffmpeg` | Batch · Pipe | **Separador de Pista Sonora**: película de vídeo passa por cabeçote magnético que extrai a forma de onda sonora para um disco `.MP3`. |
| 42 | **Converter MOV → MP4** | `ffmpeg` | Batch · Pipe | **Transcodificador de Bobina**: rolo `.MOV` desenrola através de engrenagem central e rebobina no formato universal `.MP4`. |
| 43 | **Converter WEBM → MP4** | `ffmpeg` | Batch · Pipe | **Câmara de Remux**: fluxo web passa por prisma de encapsulamento com medidor de frames por segundo (`fps`). |
| 44 | **Comprimir vídeos** | `ffmpeg` (H.264/H.265/CRF) | Batch · Pipe | **Prensa Hidráulica de Película**: êmbolo comprime o rolo de vídeo acompanhando a redução estimada de tamanho em tempo real. |
| 45 | **Cortar vídeos** | `ffmpeg` + Timeline interativa | Pipe | **Mesa de Moviola / Tesoura de Edição**: timeline interativa com alças magnéticas *In/Out*; lâmina corta os extremos descartados. |
| 46 | **Juntar vários vídeos** | `ffmpeg` (concat) | Pipe | **Emendadora de Filme (Splicer)**: clipes alinham-se na trilha, fita de emenda prensa as junções criando um rolo contínuo. |
| 47 | **Extrair áudio de vídeo** | `ffmpeg` | Batch · Pipe | **Divisor de Canal A/V**: bloco de vídeo se separa verticalmente — a imagem sobe e fica translúcida enquanto a pista de áudio desce nítida. |
| 48 | **Converter WAV → MP3** | `ffmpeg` | Batch · Pipe | **Compressor de Onda**: forma de onda densa sem compressão passa por filtro de bitrate saindo compacta com indicador `kbps`. |
| 49 | **Remover ruído de áudio** | `noisereduce` / `ffmpeg afftdn` / RNNoise *(API opcional)* | Batch · Pipe | **Filtro de Espectro em Tempo Real**: ruído de fundo (chiado irregular em cinza) é varrido e apagado enquanto a voz limpa permanece nítida. |
| 50 | **Transcrever áudio para texto** | `faster-whisper` (modelos sob demanda) *(API opcional)* | Batch · Pipe | **Fita de Ditafone → Teletipo**: cabeça de leitura percorre a waveform e imprime linhas de texto com timestamps em tempo real. |

---

## Categoria 6 — Utilitários Digitais (51–60)

| # | Ferramenta | Motor Local | Batch / Pipe | Animação Própria (`MachineStage`) |
| --- | --- | --- | --- | --- |
| 51 | **Gerar QR Code** | Rust (`qrcode`) | Batch · Pipe | **Matriz de Pinos Mecânicos**: módulos do QR Code se ativam em onda diagonal (*stagger*) formando o padrão pronto para SVG/PNG. |
| 52 | **Ler QR Code de imagem** | Rust (`rqrr`) / OpenCV | Batch · Pipe | **Mira Óptica a Laser**: retículo de foco localiza os 3 cantos do QR na imagem, trava em verde e revela o link/texto decodificado. |
| 53 | **Encurtar links** | HTTP cliente (is.gd / TinyURL / CleanURI — configurável) | Batch · Pipe | **Compactor de Trilho**: URL longa desliza por duas mandíbulas laterais que a encolhem fisicamente até o link curto copiável. |
| 54 | **Gerar senhas fortes** | Rust (`rand` CSPRNG) | — | **Tambor Mecânico de Cofre**: roletes giram com inércia travando cada caractere, acompanhados por barra analógica de entropia (bits). |
| 55 | **Contar palavras e caracteres** | Rust nativo (tempo real) | Pipe | **Odômetro Mecânico**: contadores de palavras, caracteres, frases e tempo de leitura giram em cilindros numéricos (`tabular-nums`) ao digitar. |
| 56 | **Comparar diferenças entre textos** | Rust (`similar` diff) | — | **Comparador Óptico de Duas Lâminas**: dois documentos deslizam lado a lado e faixas de inserção/remoção acendem com linhas conectoras. |
| 57 | **Converter JSON → CSV** | Rust (`serde_json` + `csv`) | Batch · Pipe | **Achatador de Árvore**: nós hierárquicos de JSON se desdobram e encaixam em colunas tabulares organizadas. |
| 58 | **Formatar JSON** | Rust (`serde_json`) | Batch · Pipe | **Alinhador Tipográfico**: texto minificado expande-se com mola em níveis indentados com LED de validação sintática (verde/vermelho). |
| 59 | **Converter ZIP → outros formatos** | Rust (`zip`, `tar`, `flate2`, `zstd`, `sevenz`) | Batch · Pipe | **Estação de Reempacotamento**: caixa `.ZIP` abre as abas, transfere os itens pela esteira e lacra no novo contêiner (`.tar.gz`, `.7z`, `.zst`). |
| 60 | **Criar ZIP de vários arquivos** | Rust (`zip`) | Pipe | **Empacotadora com Zíper Metálico**: arquivos caem na caixa, o zíper fecha de ponta a ponta e o pacote compacto exibe a taxa de redução. |

---

## Categoria 7 — Outras Ferramentas Úteis (61–70)

| # | Ferramenta | Motor Local | Batch / Pipe | Animação Própria (`MachineStage`) |
| --- | --- | --- | --- | --- |
| 61 | **Converter vídeo em GIF** | `ffmpeg` (palettegen/paletteuse) | Batch · Pipe | **Flipbook Mecânico**: frames selecionados do vídeo são recortados e folheados em loop contínuo na bancada. |
| 62 | **Criar GIF a partir de imagens** | `Pillow` / `ffmpeg` | Pipe | **Carrossel de Quadros**: imagens arrastadas alinham-se em fita com controle deslizante de FPS e preview animado ao vivo. |
| 63 | **Remover metadados de fotos** | `Pillow` / `piexif` / `exiftool` | Batch · Pipe | **Desmagnetizador EXIF**: etiquetas de GPS, câmera e data se destacam da foto e são pulverizadas, deixando a imagem com selo "Limpa". |
| 64 | **Converter imagem em texto (OCR)** | `Tesseract OCR` *(API opcional)* | Batch · Pipe | **Leitor Óptico de Caracteres**: linha de varredura destaca bounding boxes sobre a foto e transfere o texto extraído para o editor ao lado. |
| 65 | **Adicionar marca-d'água em imagens** | `Pillow` | Batch · Pipe | **Carimbadora de Precisão**: prensa aplica o texto ou logo com controle interativo de posição, ângulo, escala e opacidade em tempo real. |
| 66 | **Remover silêncio de gravações** | `ffmpeg silencedetect` + `pydub` | Batch · Pipe | **Tesoura de Waveform**: trechos silenciosos ficam marcados em âmbar, são recortados e os blocos de voz deslizam para se unir sem lacunas. |
| 67 | **Gerar legendas automáticas** | `faster-whisper` + `ffmpeg` *(API opcional)* | Batch · Pipe | **Sincronizador de Legendas**: áudio vira blocos de texto cronometrados que se encaixam sob o player de vídeo (exporta `.SRT`/`.VTT` ou *burn-in*). |
| 68 | **Converter legenda SRT → VTT** | Rust nativo | Batch · Pipe | **Tradutor de Timecode**: vírgulas de timestamp (`00:01:02,500`) giram mecanicamente para pontos (`00:01:02.500`) com cabeçalho `WEBVTT`. |
| 69 | **Converter EPUB → PDF** | `ebooklib` + `WeasyPrint` / Calibre | Batch · Pipe | **Prensa Editorial**: capítulos do e-book se paginam em folhas A4/A5 encadernadas com índice preservado. |
| 70 | **Converter CSV → Excel** | `openpyxl` / Rust `rust_xlsxwriter` | Batch · Pipe | **Construtor de Planilha**: linhas separadas por vírgula se expandem em colunas formatadas com cabeçalho estilizado em `.XLSX`. |
