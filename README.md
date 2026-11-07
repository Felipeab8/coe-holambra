# COE Holambra — material e modo editor

Material do **Centro Operacional de Excelência da Cooperativa Agroindustrial Holambra**, com piloto na Unidade Avaré. Mantém as 19 páginas, 416 indicadores, identidade visual, ícones originais, modelos 3D, governança, roadmap e estudo de viabilidade da versão aprovada.

Esta versão acrescenta **Modo exibição / Modo editor, sem login**. Edite textos, imagens, destinos de links, campos descritivos das fichas de indicadores, câmeras do piloto e a distribuição de equipamentos na sala 3D. A apresentação original permanece como base; as edições são armazenadas separadamente.

## Dois modos de publicação

| Hospedagem | Como compartilhar alterações |
| --- | --- |
| **GitHub Pages** | Edite no navegador → **Baixar cópia das alterações** → substitua `dados/edicoes.json` no repositório → commit. A publicação do Pages disponibiliza a versão aos demais visitantes. |
| **Servidor incluído** | Edite no navegador → **Publicar**. O servidor grava a revisão no SQLite e disponibiliza conteúdo, sala e câmeras para os demais visitantes. |

**O GitHub Pages não executa o servidor Python.** Apenas enviar este projeto ao GitHub não ativa a gravação online. Na hospedagem estática, Publicar fica desabilitado e o editor explica como baixar o JSON. Não há promessa de salvamento compartilhado no armazenamento local do navegador.

Sem login significa que **qualquer pessoa com acesso ao endereço pode publicar** quando o servidor está ativo. Não existe distinção entre administrador e visitante. O material contém informações corporativas restritas; mantenha a distribuição no público autorizado.

## Usar o editor

1. Abra o material por HTTP e clique no lápis **Modo editor**, no cabeçalho.
2. Selecione um texto/imagem ou procure um campo no painel lateral. Altere o valor e clique em **Aplicar à prévia**.
3. Use o menu normal para mudar de página. **Conteúdo** recolhe ou reabre as propriedades.
4. Em **Infraestrutura → Sala do COE**, ative a interação com o modelo. Use Interior ou Planta e selecione um conjunto para mover, girar, redimensionar, renomear, ocultar ou duplicar. Também é possível adicionar equipamentos e ajustar as cores da sala.
5. No piloto Avaré, abra a aba **Câmeras**. Salvar câmera aplica à mesma prévia do material.
6. **Modo exibição** permite conferir a apresentação. **Publicar** compartilha a prévia no servidor; no Pages, baixe o JSON e faça o commit.

Há Desfazer, Descartar, importação/exportação JSON e histórico das últimas 100 revisões do servidor. Restaurar uma revisão carrega uma prévia: só se torna pública depois de Publicar. Conflitos não sobrescrevem a versão mais recente silenciosamente.

As contas financeiras e os identificadores estruturais continuam nas fontes originais; o editor não altera fórmulas, rotas nem código executável. A sala é uma modelagem conceitual de equipamentos, não um editor CAD. As telas 3D são demonstrativas, sem dados corporativos ao vivo.

## Executar com salvamento compartilhado local

Requer **Python 3.11+** para o servidor e processamento de imagens. Validado com Python 3.13.7. Na pasta extraída, usando PowerShell:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe servidor.py
```

Abra [http://127.0.0.1:8080](http://127.0.0.1:8080). Encerre com `Ctrl+C`. Banco e uploads ficam na pasta irmã `../coe-holambra-data`, fora do código. Duas abas/navegadores nesse endereço compartilham as publicações.

Para apenas visualizar ou testar o funcionamento estático:

```powershell
python -m http.server 8777 --bind 127.0.0.1
```

Abra [http://127.0.0.1:8777](http://127.0.0.1:8777). Esse comando não disponibiliza a API. Abrir com `file://` mantém a navegação básica, mas não é recomendado para editor, texturas e leitura do JSON.

## Subir o ZIP no GitHub

1. Extraia o ZIP em uma pasta vazia.
2. Copie o **conteúdo da pasta `coe-holambra`** para a raiz do repositório, substituindo os arquivos correspondentes. Inclua `.github`, `.gitignore` e `.env.example`.
3. Não envie `.venv`, `node_modules`, bancos, uploads do servidor, `.env` real ou o próprio ZIP.
4. Faça commit e mantenha o Pages apontando para a raiz que contém `index.html`.
5. Para publicar futuras edições pelo Pages, substitua **`dados/edicoes.json`** pelo arquivo baixado no editor e faça novo commit. Adicione imagens novas ao repositório e informe o caminho, por exemplo `img/minha-imagem.webp`.

Para publicar diretamente pelo botão, hospede também o serviço Python com disco persistente. Instruções, backup e limites estão em [docs/EDITOR.md](docs/EDITOR.md). Nenhum commit, pull request ou deploy remoto foi realizado por esta entrega.

## Build e estrutura

```powershell
python atualizar.py
```

O gerador continua usando a biblioteca padrão (Python 3.10+) e lê `fonte/`, CSV e XLSX. Gera `index.html`, `js/indicadores.js`, `js/viabilidade-dados.js` e a cópia pública `dados/indicadores.csv`. Versione esses arquivos. O build preserva `dados/edicoes.json`.

| Caminho | Responsabilidade |
| --- | --- |
| `fonte/paginas/`, `fonte/modelo.html`, `fonte/etapas.json` | Conteúdo-base, estrutura e rotas |
| `css/`, `js/painel.js`, `js/home*.js` | Apresentação, navegação e recursos existentes |
| `js/editor.js`, `css/editor.css` | Edição, prévia, publicação e histórico |
| `sala-coe-3d/` | Modelo e editor da sala, mantendo Three.js r128 |
| `holambra-avare-3d/`, `arq3d/` | Piloto e arquitetura existentes |
| `dados/edicoes.json` | Edições pelo fluxo estático e importação inicial do servidor |
| `servidor.py`, `requirements.txt` | API Flask, SQLite, imagens Pillow e servidor Waitress |
| `Viabilidade/`, `js/viabilidade*` | Estudo original, preservado e fora desta revisão |
| `tests/`, `.github/workflows/validar.yml` | Testes locais e configuração de CI |

HTML/CSS/JavaScript nativos, sem troca de framework ou novas dependências frontend de produção. Three.js e OrbitControls **0.128.0**, com SRI; fontes externas com fallback. Node 20+, pnpm 11.25.0, Playwright 1.56.1 e axe 4.11.0 são opcionais para testes. O servidor usa versões fixadas em `requirements.txt`.

## Validação

```powershell
.venv\Scripts\python.exe -m unittest discover -s tests -v
node scripts/check-javascript.cjs
pnpm install --frozen-lockfile --ignore-scripts
pnpm exec playwright install chromium
```

Com o servidor estático em 8777:

```powershell
$env:COE_BASE_URL="http://127.0.0.1:8777"
node --test --test-skip-pattern="return simulator" tests/browser.cjs
```

Os testes do editor **publicam e restauram dados**: use um banco de teste separado. Em outro terminal, execute `servidor.py` com `COE_DATA_DIR` apontando para uma pasta de teste e `PORT=8778`, e então:

```powershell
pnpm run test:editor
```

`COE_EDITOR_URL` e `COE_STATIC_URL` substituem os endereços padrão 8778 e 8777. Resultado desta entrega: **35 testes Python, 26 regressões de navegador e 11 testes do editor aprovados**. Incluem duas sessões, conflitos, histórico, imagens, câmeras e sala 3D. Consulte [o relatório](docs/EDITOR.md). O CI foi preparado, mas não executado no GitHub.

O histórico das revisões anteriores permanece em [docs/MANUAL.md](docs/MANUAL.md). O 404 do logotipo do videowall externo depende do repositório separado `videowall-coe`; não é um recurso servido por este projeto.
