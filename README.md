# COE Holambra — material de entrega do projeto

Material executivo de entrega do estudo do **Centro Operacional de Excelência da Cooperativa Agroindustrial Holambra**, com piloto na Unidade Avaré. Reúne em oito capítulos objetivos, desafios, 416 indicadores, infraestrutura e arquitetura de dados, estudo de viabilidade, governança, roadmap e as decisões para iniciar a implantação.

## Como o material está organizado

| Capítulo | Conteúdo |
| --- | --- |
| Início | Capa, sumário executivo em seis mensagens, roteiro de leitura e entregáveis do projeto, com arquivos de apoio (.xlsx e .csv). |
| 01 · Objetivos | Objetivos estratégicos, contexto e escuta das áreas. |
| 02 · Desafios | Dores transversais e dores por etapa da cadeia. |
| 03 · Indicadores | Telas do video wall de Avaré e ficha de cada KPI. |
| 04 · Infraestrutura e dados | Diagnóstico, diagnóstico de campo, fichas, piloto Avaré em 3D, **configurador da Sala do COE**, arquitetura As-Is/To-Be (2D e 3D) e sistemas. |
| 05 · Viabilidade | Situação atual, investimento e retorno, solução e contratação, plano e gates. |
| 06 · Governança | Níveis, rituais, decisões e estrutura. |
| 07 · Roadmap | Expansão às sete unidades e jornada de automação. |
| 08 · Decisões | Sete decisões para a Fase 0, próximos passos e informações a complementar com a Holambra. |

O endereço antigo `#viabilidade/decisoes-e-proximos-passos` continua funcionando e abre o capítulo 08.

## Edição: somente na Sala do COE

O material é de leitura. **A única área editável é a maquete 3D da Sala do COE** (Infraestrutura → Sala do COE, ou `sala-coe-3d/index.html#configurar`):

- adicionar itens de um catálogo com 26 tipos: TVs de 55" e 75", TV em pedestal, videowalls 2 × 2 e 3 × 2, painel de LED, tela de apresentação, quadro de gestão, postos, cadeiras, mesas, sofá, poltrona, armário, rack, climatização, impressora, câmera de videoconferência, extintor, paredes, divisórias de vidro, demarcação de área, plantas e painel institucional;
- remover qualquer elemento, inclusive os da proposta original, e restaurá-lo depois;
- arrastar na maquete com grade de 0,10 m a 1,00 m, ajustar posição, elevação, rotação, escala e proporções (largura, altura e profundidade);
- trocar o conteúdo das telas, a cor de itens e as cores da sala; desfazer e refazer; exportar e importar o layout; salvar a imagem da vista.

Cada configuração é salva automaticamente no navegador de quem edita. Para compartilhar, use **Arquivo → Exportar layout** ou publique (abaixo). O guia completo está em [docs/CONFIGURADOR.md](docs/CONFIGURADOR.md).

Não há edição de textos, imagens, fichas de indicadores ou câmeras. O **Piloto Avaré** permanece exatamente como estava, apenas para visualização; as ilustrações são imagens estáticas de apoio.

## Publicar um layout da sala

| Hospedagem | Como compartilhar o layout |
| --- | --- |
| **GitHub Pages** | Na sala, **Arquivo → Baixar edicoes.json (publicação)** → substitua `dados/edicoes.json` no repositório → commit. |
| **Servidor incluído** | Na sala, **Arquivo → Publicar layout para todos**. O servidor grava a revisão no SQLite. |

O GitHub Pages não executa o servidor Python. Sem login, qualquer pessoa com acesso ao endereço do servidor pode publicar; o material contém informações de classificação restrita e deve ficar no público autorizado.

## Executar localmente

Requer **Python 3.11+** para o servidor. Na pasta extraída (PowerShell):

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe servidor.py
```

Abra [http://127.0.0.1:8080](http://127.0.0.1:8080). Banco e dados ficam na pasta irmã `../coe-holambra-data`. Para apenas visualizar:

```powershell
python -m http.server 8777 --bind 127.0.0.1
```

Os modelos 3D carregam Three.js r128 de CDN (com SRI); é preciso acesso à internet. Abrir por `file://` mantém a navegação básica, mas não é recomendado.

## Subir no GitHub

1. Extraia o ZIP e copie o **conteúdo da pasta `coe-holambra`** para a raiz do repositório, incluindo `.github`, `.gitignore` e `.env.example`.
2. Os arquivos removidos nesta entrega (`js/editor.js`, `css/editor.css`, `docs/EDITOR.md`) devem ser apagados também no repositório.
3. Não envie `.venv`, `node_modules`, bancos, `.env` real ou o próprio ZIP.
4. Faça commit e mantenha o Pages apontando para a raiz que contém `index.html`.

## Build e estrutura

```powershell
python atualizar.py
```

O gerador usa apenas a biblioteca padrão e lê `fonte/`, o CSV e o XLSX. Gera `index.html`, `js/indicadores.js`, `js/viabilidade-dados.js` e `dados/indicadores.csv`, e preserva `dados/edicoes.json`.

| Caminho | Responsabilidade |
| --- | --- |
| `fonte/paginas/`, `fonte/modelo.html`, `fonte/etapas.json` | Conteúdo, capítulos e rotas |
| `css/`, `js/painel.js`, `js/home*.js` | Apresentação e navegação |
| `sala-coe-3d/` | Maquete (`modelo.js`) e configurador (`editor.js`) da Sala do COE |
| `arq3d/` | Arquitetura As-Is, proposta inicial e To-Be em 3D, com percursos guiados |
| `holambra-avare-3d/` | Piloto Avaré em 3D (somente visualização) |
| `dados/edicoes.json` | Layout publicado da sala no fluxo estático |
| `servidor.py`, `requirements.txt` | API Flask/SQLite para publicação do layout |
| `Viabilidade/`, `js/viabilidade*` | Estudo de viabilidade e dados derivados |
| `tests/`, `.github/workflows/validar.yml` | Testes e CI |

## Validação

```powershell
.venv\Scripts\python.exe -m unittest discover -s tests -v
node scripts/check-javascript.cjs
pnpm install --frozen-lockfile --ignore-scripts
pnpm exec playwright install chromium
$env:COE_BASE_URL="http://127.0.0.1:8777"; node --test --test-skip-pattern="return simulator" tests/browser.cjs
```

Os testes do configurador (`pnpm run test:editor`) usam o servidor estático em 8777 e, para a publicação, `servidor.py` com `COE_DATA_DIR` de teste e `PORT=8778`. Resultados desta entrega e o histórico das revisões estão em [docs/MANUAL.md](docs/MANUAL.md).
