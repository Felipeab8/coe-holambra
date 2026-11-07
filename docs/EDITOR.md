# Modo editor — entrega de 07/11/2026

## Implementação e preservação

- Alternância entre exibição e edição sem login, com painel contextual para textos, imagens, descrições alternativas, links e campos descritivos de indicadores.
- Imagens diurna e noturna editáveis separadamente; as duas imagens aprovadas permanecem como padrão.
- Sala com 21 conjuntos originais selecionáveis: áreas, videowall, telas auxiliares, recepção, reunião, racks e climatização. Posição, altura, rotação, escala, visibilidade, nome, descrição e itens editáveis; duplicação e adição de postos, cadeiras, telas, racks, mesas e plantas; cores de parede, piso e detalhes.
- Câmeras do piloto conectadas à mesma prévia e publicação.
- Servidor SQLite, histórico de 100 revisões, controle de conflitos e upload de PNG/JPEG/WebP convertido para WebP.
- GitHub Pages suportado pelo arquivo único `dados/edicoes.json`, exportável/importável.

Nenhum fragmento das 19 páginas foi reescrito nesta etapa. Logos, ícones, imagens aprovadas, CSV de origem, XLSX, lógica de viabilidade e modelos de arquitetura permanecem como referência original. Não foram removidos arquivos nem funcionalidades. O download do CSV passou a usar uma cópia gerada em `dados/`, para não expor a pasta de fontes pelo servidor.

O conteúdo-base continua no repositório. As edições são substituições identificadas por página, texto original e ocorrência; trechos alterados por um desenvolvedor não são reaplicados arbitrariamente em outro lugar. Revise/exporte as edições antes de mudanças amplas no HTML. IDs de equipamentos e indicadores são estáveis.

Valores calculados, rotas, fórmulas e código permanecem nas fontes. O editor altera conteúdo editorial e campos descritivos das fichas, sem modificar vínculos estruturais ou resultados de cálculo. A edição de equipamentos é da nova sala; Avaré mantém seu editor de câmeras. Não é um editor CAD.

## Prévia e publicação

Aplicar à prévia e Salvar câmera não publicam. Publicar envia um snapshot com a revisão de origem. Se outra pessoa publicou antes, o servidor responde com conflito e mantém sua prévia. Baixe uma cópia, recarregue e reconcilie as alterações; não há mesclagem simultânea automática. Mudanças feitas durante uma publicação ficam como novas alterações pendentes.

Visitantes em exibição, sem prévia pendente, consultam revisões a cada 15 segundos. Reabrir/recarregar também recebe a versão publicada. A sala standalone recebe a publicação ao abrir/recarregar. Modo exibição no navegador do autor pode continuar mostrando sua prévia para conferência.

## Hospedagem do servidor

O serviço hospeda **aplicação e API no mesmo domínio**. Não há CORS para gravar em outro domínio enquanto se navega pelo GitHub Pages. Use Python 3.11+ ou o Dockerfile incluído, com HTTPS no proxy/hospedagem e volume persistente.

| Variável | Uso |
| --- | --- |
| `HOST` | `127.0.0.1` local; `0.0.0.0` no contêiner/serviço |
| `PORT` | Porta interna, padrão `8080` |
| `COE_DATA_DIR` | Diretório persistente fora do código; padrão `../coe-holambra-data` |
| `COE_PUBLIC_ORIGIN` | Origem pública completa, como `https://coe.exemplo.com`, sem caminho |

`.env.example` documenta variáveis; o servidor **não lê `.env` automaticamente**. Configure-as no serviço. Ao escutar na rede, `COE_PUBLIC_ORIGIN` é obrigatório. O proxy deve preservar `Host` e encaminhar o domínio à porta do serviço. O runtime usa [Waitress, documentado pelo Flask](https://flask.palletsprojects.com/en/stable/deploying/waitress/).

Exemplo Docker para teste local:

```sh
docker build -t coe-holambra .
docker volume create coe-dados
docker run --rm -p 8080:8080 -e COE_PUBLIC_ORIGIN=http://localhost:8080 -v coe-dados:/data coe-holambra
```

Em produção, configure a origem HTTPS real e o volume persistente. O Dockerfile não foi construído neste ambiente, onde Docker não está instalado. Python/Waitress foi executado e testado diretamente.

No primeiro início, o banco importa `dados/edicoes.json`. Um banco existente nunca é sobrescrito pelo arquivo do repositório. Para substituir o conteúdo nesse caso, importe o JSON no editor e publique.

## Dados e backup

- Sem autenticação por solicitação do usuário: qualquer pessoa com acesso pode publicar. Nenhuma credencial de GitHub no frontend.
- Escritas exigem origem igual à aplicação e header próprio. Isso reduz requisições acidentais de outros endereços; não é autorização individual.
- Textos sem HTML executável; URLs locais seguras ou HTTPS. Uploads rejeitam SVG/HTML e são verificados/recodificados, sem metadados da origem.
- Limites: imagem até 5 MB e 20 milhões de pixels; 500 imagens/100 MiB de uploads; snapshot até 3 MiB; 300 objetos editados/adicionados; 100 revisões. A quota não remove imagens referenciadas por versões antigas automaticamente.
- Banco `editor.sqlite3` e `uploads/` ficam em `COE_DATA_DIR`. O servidor não expõe Python, configuração, banco ou pasta `fonte`.
- Backup completo: pare o serviço e copie **todo `COE_DATA_DIR`**, ou use backup transacional SQLite e copie os uploads. Teste a restauração separadamente. O JSON baixado contém edições, **não os arquivos das imagens enviadas**.
- No Pages, adicione imagens ao repositório, por exemplo `img/`, e informe seus caminhos. Exportar JSON com URLs `uploads/` não transfere essas imagens ao GitHub automaticamente.

## Verificações reais

| Verificação local | Resultado |
| --- | --- |
| Instalação e `pip check` | Aprovados em Python 3.13.7 |
| Build | Aprovado; 19 páginas e 416 indicadores |
| Python | 35 aprovados: 22 API/persistência/segurança + 13 gerador e leitura |
| Regressões Chromium | 26 aprovadas: rotas, navegação, busca, imagens, modelos e câmeras |
| Editor Chromium | 11 aprovados: duas sessões, conflito, resposta lenta, histórico, texto seguro, links inválidos, KPIs, Pages/JSON, sala, upload e câmeras |
| JavaScript | 14 scripts locais/inline com sintaxe verificada |
| Acessibilidade do editor | 12 varreduras axe: conteúdo/sala × 320/768/1440 px × claro/escuro; sem violações encontradas ou overflow |
| Dependências Python | `pip-audit` sem vulnerabilidades conhecidas na consulta de 07/11/2026 |

As verificações automáticas não substituem teste de usabilidade nem certificam acessibilidade integral. Dois navegadores/contextos e servidor local real foram usados. Não houve publicação em hospedagem pública. Testes do gerador/XLSX verificam leitura e preservação, sem analisar viabilidade. O teste de simulador financeiro foi excluído da execução de navegador.

Problemas corrigidos: resposta lenta substituindo uma prévia recém-alterada; atualização automática podendo substituir a prévia; câmeras restritas ao navegador; link da sala no editor; controles do cabeçalho apertados em celular. Testes passaram a aguardar corretamente publicações e mensagens entre frames.

Pendências externas: configurar hospedagem com volume para usar Publicar; validar deploy/backup no provedor escolhido; corrigir `logo-holambra.png` no videowall externo, de outro repositório. As informações de negócio pendentes permanecem para complementação do cliente.

## Inventário dos arquivos

Criados: `.dockerignore`, `.env.example`, `Dockerfile`, `css/editor.css`, `dados/edicoes.json`, `dados/indicadores.csv`, `docs/EDITOR.md`, `js/editor.js`, `requirements.txt`, `sala-coe-3d/editor.js`, `servidor.py`, `tests/editor-browser.cjs`, `tests/test_editor_server.py`.

Modificados: `.github/workflows/validar.yml`, `.gitignore`, `README.md`, `atualizar.py`, `docs/MANUAL.md`, `docs/validacao.json`, `fonte/modelo.html`, `holambra-avare-3d/index.html`, `index.html`, `js/home-media.js`, `js/painel.js`, `package.json`, `sala-coe-3d/index.html`, `sala-coe-3d/modelo.js`, `scripts/check-javascript.cjs`, `tests/browser.cjs`.

Removidos: nenhum. 58 arquivos de conteúdo, identidade, dados e viabilidade comparados por SHA-256, sem alterações.
