# Relatório final — integração COE Holambra

## Resultado
O projeto principal foi consolidado com a home do redesign integrada às **fontes do gerador**, mantendo o painel estático e sua arquitetura. A entrega inclui código, assets, dados necessários, documentação, testes, lockfile das ferramentas opcionais e workflow de validação. Não houve publicação, push ou criação de repositório remoto.

O diagnóstico e o plano foram apresentados antes da implementação, e estão registrados em `DIAGNOSTICO-E-PLANO.md`. As instruções do LEIA-ME do redesign foram tratadas como referência: não foi feita a substituição direta do HTML final sugerida ali.

## Melhorias implementadas

### Home e identidade
- Herói panorâmico com moinho e silos, variantes claras/escuras e enquadramentos para desktop, tablet e celular.
- Preservados os textos, os quatro números com links, os sete atalhos, a torre SVG, os seis objetivos estratégicos e a citação.
- Contagem de indicadores e TVs ligada ao gerador; novas versões de dados não deixam números fixos desatualizados na home.
- Marca fornecida pelo usuário incorporada sem alteração de pixels: logotipo completo no rodapé e moinho no cabeçalho, na home e no favicon. Removida a rotação de pás do símbolo estilizado para preservar a integridade da marca.
- Fraunces nos títulos da home e Plus Jakarta Sans compartilhada; fallback de sistema.
- Tokens de cor, cabeçalho, navegação, foco e rodapé consistentes entre home e páginas internas.
- Animações respeitam movimento reduzido; números acessíveis ficam estáveis para leitores de tela.

### Funcionalidade e acessibilidade
- Rota com percent-encoding inválido não interrompe a aplicação.
- Filtros sem resultado limpam a ficha anterior; IDs inexistentes exibem estado explícito, inclusive `toString` e `constructor`.
- Lista de KPIs com navegação por setas/Home/End e uma única posição de tabulação.
- Menu móvel fecha com Escape e devolve o foco. Atalhos globais não interceptam controles.
- Link “Pular para o conteúdo” mantém a página atual.
- Tabelas extensas e diagrama de arquitetura podem ser rolados pelo teclado.
- Corrigidos contrastes no diagnóstico, nos objetivos, no roadmap e em abas internas, além da cascata móvel da pirâmide.
- Estados de erro de imagem, de carregamento do videowall e de falha das bibliotecas dos modelos.

### Modelos e dados
- Tema e atividade dos modelos locais integrados ao painel; renderização de cena pausa quando o modelo fica oculto, preservando suas edições em memória.
- Corrigida a espera indefinida do editor de câmeras incorporado. O handshake agora usa o armazenamento local já implementado; salvar e recarregar foi testado.
- Dados locais de câmera validados antes de construir geometria; erros de gravação são informados sem alegar persistência bem-sucedida.
- CSV valida colunas, quantidade de campos, IDs vazios/repetidos e versões numéricas (`1.10` > `1.9`).
- XLSX usa fechamento garantido do arquivo, aceita strings inline, rejeita erros numéricos/cálculo e fórmulas numéricas sem cache. Fórmulas textuais vazias legítimas continuam aceitas.
- Geração valida recursos, rotas, IDs HTML e marcadores antes de substituir as saídas, com troca atômica por arquivo.

### Desempenho, manutenção e segurança
- Uma única variante do herói é solicitada por tema/resolução. A imagem é prioritária na home e adiada em links diretos para páginas internas.
- 109 imagens raster inspecionadas; 67 tags de imagem em fontes internas receberam atributos de dimensões/carregamento/decodificação quando aplicável. Fotos originais e miniaturas existentes foram preservadas.
- Removidas regras exclusivas da home antiga: cerca de 11,8 mil caracteres de CSS sobreposto. Nenhuma dependência de produção nova.
- Hashes SHA-256 nos recursos locais, calculados com quebras de linha normalizadas para reproduzir o build entre Windows e Linux; SRI SHA-384 nas bibliotecas 3D de CDN.
- Destinos e origens das mensagens entre frames restringidos conforme os contratos locais/externos.
- `.gitignore`, `.gitattributes`, `.editorconfig`, README e documentação de manutenção/produção preparados.
- Testes opcionais separados em `devDependencies`, com lockfile; nenhuma instalação de pacotes é necessária para abrir ou gerar o painel.

## Funcionalidades preservadas
As 19 rotas originais e os 416 indicadores permanecem. Os objetos completos de `window.COE` e `window.VIAB` foram comparados semanticamente com os originais: **idênticos**. A planilha, o CSV, as fotos e os ícones não foram reescritos para fabricar dados.

Foram preservados mural tático/estratégico, rodízio e telão, fichas/filtros/download CSV, busca, abas, detalhes, ampliação de fotos, gráficos e simulador, plano mestre, arquitetura 2D/3D, modelo Avaré e seu editor/exportação local de câmeras. Não foi inventada integração com API, banco, sensores ou autenticação.

## Arquivos criados, modificados e removidos
A relação completa está em [ALTERACOES.md](ALTERACOES.md), com justificativas. Os principais novos arquivos são `css/home.css`, `js/home.js`, `js/home-media.js`, `js/modelo-host.js`, dez WebPs, testes, scripts de verificação, configurações de edição/Git/CI e documentação.

Os principais modificados são a fonte da home, o modelo HTML, `etapas.json`, o gerador, o leitor XLSX, os estilos compartilhados, `painel.js`, `arquitetura.js`, os dois modelos 3D e as páginas que receberam metadados de imagem/acessibilidade. `index.html` e os dados JS continuam sendo os artefatos necessários à abertura estática.

**Removido:** `fonte/gerar_paisagem.py`, que só gerava o SVG da paisagem antiga e não tinha consumidor no redesign. Não foram removidas rotas, dados, fotos, diagramas ou funções operacionais do painel. Caches gerados durante testes são excluídos do pacote.

## Validações executadas

| Verificação | Resultado |
| --- | --- |
| Instalação limpa opcional com `pnpm install --frozen-lockfile --ignore-scripts` | Concluída; lockfile aceito |
| Build `python atualizar.py` | Concluído; 19 páginas, 416 indicadores, ondas 300/79/37 |
| Duas gerações e mudança controlada de CSV | Saída determinística; home acompanha 417 indicadores na fixture |
| Testes Python | 13 aprovados |
| Compilação sintática JS local/inline | 11 scripts aprovados |
| Testes reais de navegador | 19 aprovados com Playwright 1.56.1 e Chromium 141 |
| Rotas e links da home | 19 rotas e 13 links verificados |
| Acessibilidade automatizada nas páginas principais | 38 verificações: 19 rotas × 2 temas; zero violações detectadas |
| Responsividade das páginas | 57 verificações: 19 rotas × 360/768/1024 px; sem overflow |
| Home | 12 capturas: 360/390/768/1024/1440/1920 px × claro/escuro; sem overflow |
| Abas e seções abertas em celular | 62 verificações adicionais; zero violações detectadas |
| Protocolos | Navegação por HTTP e `file://` verificada |
| Segurança de dependências | OSV sem avisos para Three.js 0.128.0; audit das dependências de teste sem avisos |

Testes cobrem erros de CSV, cache XLSX ausente, strings inline, entradas inválidas, não sobrescrever saídas em falha, dados preservados, home regenerada, hash inválido, filtros, teclas, menu, busca, simulador, fotos, modelos, câmeras, temas e movimento reduzido.

Falhas foram reproduzidas antes das respectivas correções. A revisão independente encontrou o caso de fórmula sem cache e o ID herdado; ambos receberam regressões. A primeira proteção ampla de cache bloqueou fórmulas textuais vazias do XLSX original; foi refinada por tipo de célula e o build/testes da fonte real voltaram a passar.

Os registros estão em `docs/validacao/`; capturas completas e relatório detalhado da interface acompanham a entrega na pasta `evidencias/`. A primeira varredura também encontrou contrastes em abas móveis e o diagrama sem foco de teclado; foram corrigidos e incluídos nos testes.

## Pendências e limites reais
1. **Serviço externo:** o videowall respondeu, mas seu `logo-holambra.png` retorna HTTP 404. Esse erro aparece no console dos iframes e precisa ser corrigido no repositório do videowall. Os frames não foram substituídos por imagens ou por uma integração fictícia.
2. **Dados corporativos:** os campos “Validar”, as premissas preliminares e dados de exemplo da fonte permanecem. Carregar o iframe não valida a atualidade do dado operacional.
3. **Hospedagem e acesso:** não existe autenticação no código estático. A hospedagem escolhida precisa proteger os arquivos. O pacote contém a planilha e o conteúdo corporativo solicitado; um repositório privado não autoriza exposição pública.
4. **Navegadores e acessibilidade:** a validação executada usa Chromium em Windows, com WebGL por software. Safari/iOS, Firefox, aparelhos físicos, GPU real e testes humanos com leitores de tela não foram certificados. Auditoria automática não equivale a conformidade integral WCAG.
5. **CI:** workflow entregue e revisado, ainda sem execução em um runner do GitHub. Não houve envio ao GitHub para alegar um resultado remoto.
6. **3D:** bibliotecas antigas preservadas com compatibilidade e integridade. Uma atualização futura de Three.js exige migração própria e validação dos modelos; não foi feita sem necessidade técnica.
7. **Câmeras:** armazenamento local por navegador/origem, sem colaboração compartilhada. Exporte CSV antes de trocar domínio/porta ou limpar dados do navegador.

## Como executar e publicar no GitHub
Na pasta consolidada, execute `python atualizar.py` para regenerar e `python -m http.server 8000 --bind 127.0.0.1` para abrir em `http://127.0.0.1:8000`. Também é possível abrir `index.html` diretamente.

Crie um repositório privado vazio e siga os comandos `git init`, `git add`, `git commit`, `git remote add` e `git push` documentados no README. Revise o conteúdo antes do envio. Instruções completas de requisitos, testes, manutenção e produção estão no README e nos demais documentos. A publicação do site deve ocorrer apenas na hospedagem e com o controle de acesso definidos pelo responsável pelo conteúdo.

## Conferência para commit e PR
Na preparação do commit completo para `Felipeab8/coe-holambra`, foi comprovado que a base remota de 149 arquivos era idêntica ao ZIP original. A conferência do snapshot Git detectou hashes dependentes de CRLF/LF; a geração passou a normalizar texto no cálculo de versões de recursos, com um novo teste que reproduziu a falha e passou após a correção. O commit local e os arquivos de publicação são entregues separadamente. A integração GitHub retornou 403 ao tentar gravar; sem publicação remota ou PR criado por essa conexão.
