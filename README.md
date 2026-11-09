# COE Holambra — material de entrega do projeto

Material executivo de entrega do estudo do **Centro Operacional de Excelência da Cooperativa Agroindustrial Holambra**, com piloto na Unidade Avaré. Reúne em sete capítulos objetivos, desafios, 416 indicadores, infraestrutura e arquitetura de dados, estudo de viabilidade, governança e roadmap.

## Como o material está organizado

| Capítulo | Conteúdo |
| --- | --- |
| Início | Capa e atalhos para os sete capítulos. |
| 01 · Objetivos | Objetivos estratégicos, contexto e escuta das áreas. |
| 02 · Desafios | Dores transversais e dores por etapa da cadeia. |
| 03 · Indicadores | Telas do video wall de Avaré e ficha de cada KPI, com a miniatura da parte do card de que ele trata. |
| 04 · Infraestrutura e dados | Diagnóstico, diagnóstico de campo, fichas, piloto Avaré em 3D, **configurador da Sala do COE**, arquitetura As-Is/To-Be (2D e 3D) e sistemas, cada um com o investimento correspondente da planilha de viabilidade. |
| 05 · Viabilidade | Situação atual, investimento e retorno (com o **catálogo de custos** item a item), solução e contratação. |
| 06 · Governança | Níveis, rituais, decisões e estrutura. |
| 07 · Roadmap | Plano e gates (roadmap de 12 meses, priorização e plano mestre), expansão às sete unidades e jornada de automação. |

O endereço antigo `#viabilidade/plano-e-gates` continua funcionando e abre a página no capítulo 07.

## Miniaturas da Ficha de KPI

Cada um dos 416 indicadores tem a sua miniatura: só a parte do card do videowall de que ele trata, com o título do card em cima e nada ao redor (por exemplo, AVR-REC-A01 mostra "Caminhões na fila · Com tag 12, milho 8, sorgo 4", sem o bloco "Sem tag"). A legenda diz o indicador, o card e a tela; quando o indicador só aparece num balão ou ainda não está no videowall, uma nota explica. Clicar abre a tela; com o material e o videowall no mesmo domínio (os dois no GitHub Pages da mesma conta), a mesma parte fica contornada dentro da tela. A Visão geral leva ao mural.

O recorte de cada indicador está em `fonte/miniaturas-kpi.json` (seletor dentro do card, coluna de tabela, rótulos que entram junto). As imagens ficam em `img/kpi/` e são geradas a partir do videowall publicado. Quando o visual de algum card mudar:

```powershell
pnpm exec playwright install chromium   # uma vez
node scripts/miniaturas-kpi.cjs          # ou informe outro endereço do videowall
python atualizar.py
```

Para refazer só alguns indicadores: `$env:MINIATURAS_SO="AVR-REC-A,AVR-CLA"; node scripts/miniaturas-kpi.cjs`.

## Custos ligados à planilha de viabilidade

Os valores de investimento vêm da planilha `Viabilidade/COE_Holambra_Estudo_Viabilidade.xlsx` (aba 04_Business_Case), lida pelo gerador. `fonte/custos-vinculos.json` diz em que página do material cada um dos 83 itens é tratado; nenhum valor é digitado nas páginas.

- Nas páginas da infraestrutura, cada equipamento, frente ou área da sala mostra os itens do estudo com quantidade, preço unitário, total, faixa, início, cenários e origem do valor.
- Em Viabilidade → Investimento e retorno → **Catálogo de custos**, os itens podem ser filtrados por camada, cenário, origem e busca; cada linha leva de volta à página da infraestrutura, e a planilha pode ser baixada.
- Ao trocar a planilha, rode `python atualizar.py`. O gerador interrompe a publicação se um item ficar sem vínculo, aparecer em dois blocos, se a soma não fechar com o total do catálogo ou com a tabela de cenários, ou se as abas 02 e 04 divergirem. Item novo na planilha: inclua o ID em um bloco do JSON.

## Edição: somente na Sala do COE

O material é de leitura. **A única área editável é a maquete 3D da Sala do COE** (Infraestrutura → Sala do COE, ou `sala-coe-3d/index.html#configurar`):

- adicionar itens de um catálogo com 26 tipos: TVs de 55" e 75", TV em pedestal, videowalls 2 × 2 e 3 × 2, painel de LED, tela de apresentação, quadro de gestão, postos, cadeiras, mesas, sofá, poltrona, armário, rack, climatização, impressora, câmera de videoconferência, extintor, paredes, divisórias de vidro, demarcação de área, plantas e painel institucional;
- remover qualquer elemento, inclusive os da proposta original, e restaurá-lo depois;
- arrastar na maquete com grade de 0,10 m a 1,00 m, ajustar posição, elevação, rotação, escala e proporções (largura, altura e profundidade);
- trocar o conteúdo das telas, a cor de itens e as cores da sala; desfazer e refazer; exportar e importar o layout; salvar a imagem da vista.

Na exibição, o painel de áreas fica recolhido (botão **Áreas**), **Apresentar** percorre as vistas e **Caminhar** permite andar pela sala em primeira pessoa. No configurador, telas e painéis se fixam na parede mais próxima, Shift+clique inclui vários itens e uma barra sobre o item selecionado oferece girar, duplicar e remover.

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

O gerador usa apenas a biblioteca padrão e lê `fonte/` (incluindo `custos-vinculos.json`), o CSV e o XLSX. Gera `index.html`, `js/indicadores.js`, `js/viabilidade-dados.js` e `dados/indicadores.csv`, e preserva `dados/edicoes.json`.

| Caminho | Responsabilidade |
| --- | --- |
| `fonte/paginas/`, `fonte/modelo.html`, `fonte/etapas.json` | Conteúdo, capítulos e rotas |
| `fonte/custos-vinculos.json`, `js/custos.js` | Vínculo de cada item de custo da planilha com a página que o trata |
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
