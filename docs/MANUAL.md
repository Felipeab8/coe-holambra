# Manual consolidado COE Holambra

> Histórico das entregas. Para a estrutura atual e a publicação, consulte o [README](../README.md) e o [guia do configurador da sala](CONFIGURADOR.md).

## Revisão de 07/11/2026 — material de entrega executiva

**Pedido.** Restringir a edição à Sala do COE e torná-la totalmente configurável; manter o Piloto Avaré como está, sem controles de edição; tornar as ilustrações estáticas; evoluir a visão atual do COE em 3D; revisar o material como entrega executiva.

**Edição restrita à Sala do COE.**
- Removido o editor global do material (botão de lápis, painel de textos, imagens, links e fichas de KPI, prévia, histórico e publicação de conteúdo): `js/editor.js` e `css/editor.css` deixaram de existir.
- Piloto Avaré: removidos apenas o modo de edição de câmeras, a inclusão/arraste de câmeras e a exportação CSV. Geometria, posições, câmeras, telas do COE, cartões e comportamento de visualização permanecem idênticos; a observação de cada câmera continua no cartão, como antes.
- Sala do COE virou configurador completo: catálogo de 26 tipos (telas, videowalls, painéis de LED, mobiliário, infraestrutura, paredes, divisórias, demarcações), remoção de qualquer elemento da proposta com restauração, arraste na maquete com grade, rotação, escala e proporções, conteúdo de telas e cores, desfazer/refazer, rascunho automático no navegador, exportação/importação de layout e publicação. Paredes, divisórias de vidro e extintor da proposta passaram a ser elementos editáveis.
- Servidor: validação do layout ampliada para os novos tipos e campos (`sx`, `sy`, `sz`, `screen`, `color`, `removed`).

**Ilustrações.** Perspectivas da sala, arquitetura-alvo e scanner 3D são figuras estáticas, sem ampliação, edição ou troca. As fotos e fichas documentais mantêm a ampliação.

**Visão atual (As-Is) em 3D.** Enquadramento próprio por visão, com a história completa da unidade: campo, CCO, lacuna e COE. Componentes que não existem hoje aparecem tracejados e clicáveis (rede OT, historiador, COE), anéis indicam painéis isolados e integrados, e o elo rompido até o COE é explícito. Painel "Situação atual" com indicadores calculados do próprio modelo (12 painéis, 11 isolados, 1 integrado, 0 historiador). Percursos guiados de seis passos para a situação atual e para o To-Be, com modo automático. Iluminação de recorte, halo no piso, vinheta, pessoas estilizadas para escala, transições suaves, duplo clique para aproximar, destaque ao passar o mouse, teclas 1–3 e rótulos sem sobreposição. Corrigido um defeito anterior: as esferas de fluxo de dados ficavam paradas na origem e agora percorrem as conexões.

**Revisão executiva.**
- Capa com identificação da entrega, sumário executivo em seis mensagens com dados do próprio material, roteiro de oito capítulos e lista de entregáveis com arquivos de apoio (.xlsx e .csv).
- Novo capítulo 08, **Decisões e próximos passos**, encerrando o material; o endereço antigo redireciona.
- Placeholders entre colchetes removidos das páginas e consolidados em "Informações a complementar com a Holambra", com uma nota discreta em cada página de origem. A pendência de priorização no roadmap contradizia as 16 iniciativas priorizadas em Plano e gates e passou a apontar para elas.
- Títulos de ação em Desafios, Diagnóstico e Fichas; migalha com número do capítulo e sem repetição; fichas antes do modelo 3D no capítulo de infraestrutura; "painel" substituído por "material" nos textos de interface; o último botão de navegação volta ao início.
- Na página da sala, texto e recursos do configurador e atalho para abri-lo em nova janela.

**Validação executada.** Build aprovado (19 páginas, 9 seções, 416 indicadores); 36 testes Python; 26 regressões Chromium; 4 testes do configurador, incluindo publicação no servidor com segundo visitante e conflito; sintaxe de 13 scripts; varreduras axe sem violações nas áreas alteradas, em 390 e 1440 px, temas claro e escuro. Captura antes/depois do Piloto Avaré confirma a mesma visualização. Detalhes em `validacao.json`, chave `entrega_executiva_2026_11_07`.

**Arquivos.** Removidos: `js/editor.js`, `css/editor.css`, `docs/EDITOR.md`. Criado: `docs/CONFIGURADOR.md`. Modificados: fontes de página e estrutura de capítulos, `fonte/modelo.html`, CSS e scripts de navegação/home, `sala-coe-3d/*`, `arq3d/index.html`, `holambra-avare-3d/index.html` (somente o bloco de edição de câmeras), `servidor.py`, testes, README e este manual. Planilha, CSV de origem, imagens, marca e dados de viabilidade não foram alterados.


## Entrega final — restauração aprovada e sala 3D

**Escopo final confirmado.** O usuário pediu preservar o projeto aprovado, reverter os dois blocos mostrados nas capturas e acrescentar a sala em 3D. A referência à prefeitura foi esclarecida: o modelo representa a **Cooperativa Holambra**, mantendo seu contexto operacional. Não foram incluídas áreas municipais ou brasões de prefeitura.

**Alterações delimitadas.**

1. Os sete cartões de navegação foram recuperados da versão refinada, com a mesma marcação de ícones e os arquivos originais Holambra. A abertura executiva, imagens de dia/noite, título e subtítulo permanecem intactos. Aplicados apenas bordas, espaçamentos e alinhamentos discretos.
2. Os desafios voltaram aos quadros compactos e às abas da versão anterior. As sete dores, sete etapas, descrições, ilustrações e criticidades originais foram restauradas. Os blocos repetitivos de complementação da versão rejeitada foram retirados desse trecho. Nenhum dado operacional foi recalculado.
3. A página Sala do COE recebeu o modelo 3D e a perspectiva de acabamento. Todo o conteúdo anterior dessa página permanece abaixo do novo bloco, sem revisões de estudo, valores ou dimensionamento.

**Nova modelagem.** Three.js r128 e OrbitControls r128, nas mesmas versões usadas pelo piloto, com carregamento via CDN e SRI. São seis vistas de câmera e sete áreas selecionáveis, fachada azul/vermelha/branca com marca Holambra, vidro, acesso coberto, jardim, totem, estacionamento, iluminação diurna/noturna, postos duplos, coordenação central, videowall de oito telas, monitores auxiliares, computadores, telefones, rádios, cadeiras, sala de reunião/decisão, recepção e sala técnica com racks. Cobertura removível, rótulos, zoom, exportação PNG, tema sincronizado e pausa fora da página. As medidas e quantidades são decisões de composição da maquete conceitual, não novas premissas aprovadas do estudo.

**Acabamento fotorealista.** `sala-coe-3d/perspectivas.webp` reúne exterior e interior, gerados pela ferramenta integrada de imagem a partir de capturas do próprio modelo. O comando solicitou preservar o edifício retangular térreo, a disposição do mobiliário, o videowall 4 × 2 e a identidade azul/vermelha/branca da cooperativa, aprimorando materiais, vegetação, reflexos e iluminação. Não foi utilizado CLI/API com credenciais. A imagem é identificada na interface como ilustração conceitual com IA, sem substituir o modelo 3D. O arquivo WebP tem 1672 × 941 pixels e 370.372 bytes.

**Preservação verificada.** 131 arquivos protegidos permaneceram byte a byte iguais, incluindo dados/CSV, fotos, SVGs da marca e ícones, planilha, scripts existentes, modelos Avaré/arquitetura e configuração de rotas. Não foram feitos os refinos globais de navegação inicialmente cogitados, pois o pedido final restringiu o escopo. As demais fontes de páginas ficaram intactas. A viabilidade permaneceu acessível, sem edição ou análise.

**Arquivos.** Criados apenas `sala-coe-3d/index.html`, `sala-coe-3d/modelo.js` e `sala-coe-3d/perspectivas.webp`. Modificadas as três fontes de páginas envolvidas, estilos restritos a esses blocos, HTML gerado, testes, verificação de sintaxe e documentação/capturas. Nenhum arquivo removido e nenhuma dependência acrescentada. A lista exata está em `validacao.json`, chave `entrega_final.preservacao`. Total de 176 arquivos no projeto entregue.

**Verificação final executada.** Build, 13 testes Python, 26 testes Chromium e sintaxe de 12 scripts aprovados. Navegação das 19 rotas, estados de falha, busca, modelos existentes, seis vistas da nova sala, seleção de áreas, exportação, galeria, tema e pausa verificados. Auditoria editorial: 28 visitas e 40 vistas expandidas (68 varreduras axe), 42 combinações de rota/resolução e 12 capturas da abertura. Auditoria adicional do novo modelo: 36 varreduras. Nenhuma violação automática, erro JavaScript de página ou recurso local ausente no resultado final. O teste específico do simulador continuou excluído. Os testes Python verificam software e preservação de dados, não conclusões de viabilidade.

**Limitações e publicação.** Usar HTTP local para as texturas e internet para as bibliotecas 3D. Os dados das telas novas são demonstrativos. O estudo de arquitetura, o dimensionamento executivo e a validação com usuários reais permanecem fora desta entrega. A logo do videowall externo ainda requer correção no repositório `videowall-coe`; nenhum arquivo ou publicação remota foi alterado. O ZIP contém o projeto completo, pronto para copiar para a raiz do clone, preservando `.git`. Instruções de execução, commit e PR no README. Não foi feito commit ou push por esta tarefa.

Os registros seguintes documentam versões anteriores; descrições dos onze cartões e dos desafios verticais pertencem à versão depois revertida pelo usuário.

---

## Histórico — revisão executiva anterior

**Referências e diagnóstico.** A revisão usa o pedido da conversa e `revisao html.docx` como referência editorial. A arquitetura permanece HTML/CSS/JavaScript nativo, com gerador Python e roteamento por hash. A abertura repetia objetivos, usava números sem contexto executivo e os desafios dependiam de alternância entre abas. O documento continha também solicitações sobre viabilidade; elas não foram executadas, conforme a instrução expressa de preservar essa seção intacta e acessível.

**Plano aplicado.** Reaproveitar identidade, imagens, fontes, logos e componentes; adaptar abertura e objetivos; converter os desafios para fluxo vertical; preparar campos pendentes sem inventar dados; preservar as rotas; testar os comportamentos e consolidar a entrega em um ZIP. O menu por seções foi mantido provisoriamente porque o material contém 19 páginas, consultas de indicadores e visualizações interativas. A decisão final continua marcada como `[DEFINIR APÓS TESTE DE USABILIDADE]`.

**Conteúdo e experiência.**

- Abertura com “Centro Operacional de Excelência”, subtítulo e apresentação solicitados, sem números de entrevistas, indicadores, unidades ou TVs. Índice com os 11 temas e destinos funcionais.
- Seis objetivos em uma única seção canônica. A escuta das áreas, as entrevistas, os depoimentos e o diagrama conceitual foram preservados na página de objetivos. Os contadores decorativos e seu código foram retirados.
- Sete dores transversais com redação mais curta e sete etapas da cadeia em sequência vertical. Os problemas e criticidades do levantamento foram preservados; não foram recalculados. Impactos, indicadores e soluções sem vínculo confirmado têm campos sinalizados.
- Complementos para indicadores, soluções/integrações, governança, priorização, marcos e dados finais. Nenhum campo pendente foi tratado como definição aprovada. Os blocos recolhíveis fora da viabilidade iniciam abertos.
- Azul, vermelho e branco preservados, com hierarquia e espaçamento adaptados. Os campos pendentes receberam correção de contraste, confirmada na nova auditoria.
- Terminologia do material padronizada. No CSV, apenas o termo “site” em observações sobre o videowall foi substituído por “painel”. Os demais campos dos 416 registros permaneceram iguais. Identificadores internos de código e o conteúdo congelado de viabilidade não foram renomeados.

**Preservação.** As 19 rotas, filtros, busca, tema, fotos, arquitetura, modelos 3D, videowall, navegação por teclado e integração com o gerador permanecem. As imagens de dia/noite e a logo transparente continuam as mesmas da versão refinada. Não há dependência nova. São 173 arquivos no pacote; nenhum arquivo de produção foi criado ou removido nesta revisão. O CSS dos antigos blocos da abertura foi reduzido e a documentação continua concentrada neste manual e no README.

**Arquivos modificados.** A lista completa, comparada à versão `coe-holambra-refinado`, está em `docs/validacao.json`, chave `revisao_executiva.preservacao.modificados`. Abrange as fontes editoriais, o modelo e títulos das rotas, dois estilos, navegação, textos da arquitetura, observações do CSV e suas saídas geradas, testes, README, manual, evidências e duas capturas. Arquivos criados: nenhum. Arquivos removidos: nenhum; somente código de contagem e estilos de seções consolidadas foram retirados.

**Validação executada.** Build concluído; 13 testes Python; 23 testes Chromium; sintaxe de 11 scripts. O teste específico de cenários do simulador permaneceu no projeto, mas foi excluído desta revisão. Os testes de leitura da planilha apenas verificam contratos de software, sem análise de premissas, cálculos ou viabilidade. Auditoria editorial: 28 visitas (14 páginas × dois temas), 38 vistas expandidas, 42 combinações de rota/resolução e 12 capturas da abertura. Zero violações axe, overflow, imagens locais quebradas, IDs duplicados ou erros JavaScript de página no resultado final. O teste funcional de navegação confirmou acesso às 19 rotas. O conteúdo do ZIP foi extraído e reconstruído para verificar integridade e reprodução do build.

**Limites e pendências.**

- Realizar teste de usabilidade com leitores reais para confirmar a navegação. Nenhum teste com usuários foi alegado ou simulado.
- Validar e preencher os marcadores visíveis, especialmente vínculos problema → impacto → KPI → solução, papéis, metas, prioridades e prazos.
- O videowall externo retorna 404 para `https://felipeab8.github.io/videowall-coe/logo-holambra.png`. A logo local está íntegra; alterar o projeto principal não corrige um arquivo de outra origem. O erro permanece documentado para correção no repositório externo. Requisições externas abortadas durante mudanças de rota também foram registradas.
- Não foi feito estudo de viabilidade, alteração de autenticação, integração com sistemas corporativos, publicação remota, commit ou pull request. O README orienta execução local e envio do conjunto completo ao GitHub.

As seções seguintes são registros históricos de versões anteriores. Datas, resultados e descrições nelas não representam nova validação nesta revisão.

---

## Histórico — refinamento profissional da interface
Hierarquia de títulos e largura de leitura ajustadas, cartões com raios coerentes, bordas e sombras mais discretas, navegação e tabelas mais legíveis. Movimentos decorativos retirados de blocos sem ação; links/botões mantêm feedback sutil e foco visível. Cores semânticas dos dados preservadas. Textos, fotos, CSV, planilha, rotas, modelos e lógica funcional não foram alterados. Sem arquivos ou dependências adicionais. Os resultados desta revisão estão na chave refinamento de validacao.json.


## Histórico — revisão de identidade em 6/11/2026
Esta versão usa azul, vermelho e branco. Corrigida a cobertura da imagem até em monitores 4K/ultrawide. Os estilos são incorporados automaticamente ao index.html pelo gerador para evitar CSS desatualizado. As fontes CSS continuam organizadas para manutenção.

A home usa somente hero-claro.webp e hero-escuro.webp: a mesma cena em duas iluminações, com enquadramento responsivo por CSS. Eliminadas oito variantes redundantes. Os registros abaixo preservam o histórico; menções a dez variantes e folhas externas descrevem versões anteriores.

Instalação: extraia o ZIP em uma pasta vazia e copie seu conteúdo para o repositório, preservando a pasta .git. Publique o conjunto completo, incluindo index.html. Execute python atualizar.py depois de editar fontes. Para visualizar: python -m http.server 8000 --bind 127.0.0.1.

Os registros brutos de validações anteriores foram consolidados em validacao.json. Os resultados desta versão estão na chave atual. Fotos, planilhas, dados e as 19 rotas foram preservados.


---

## Registro: ALTERACOES.md

# Inventário das alterações

Comparação com o ZIP principal: **42 criados, 24 modificados e 1 removido(s)**. 124 arquivos originais permaneceram byte a byte iguais. Caches de testes não fazem parte da entrega.

## Criados

| Arquivo | Justificativa |
| --- | --- |
| `.editorconfig` | Padronização de edição e versionamento ou exclusão de arquivos de trabalho/credenciais. |
| `.gitattributes` | Padronização de edição e versionamento ou exclusão de arquivos de trabalho/credenciais. |
| `.github/workflows/validar.yml` | CI de build, dados, sintaxe e navegador; sem implantação automática. |
| `css/home.css` | Redesign, remoção de CSS exclusivo da home antiga, identidade, responsividade e acessibilidade. |
| `docs/ALTERACOES.md` | Documentação do diagnóstico, alterações, manutenção, segurança e resultados. |
| `docs/DIAGNOSTICO-E-PLANO.md` | Documentação do diagnóstico, alterações, manutenção, segurança e resultados. |
| `docs/MANUTENCAO.md` | Documentação do diagnóstico, alterações, manutenção, segurança e resultados. |
| `docs/RELATORIO-FINAL.md` | Documentação do diagnóstico, alterações, manutenção, segurança e resultados. |
| `docs/SEGURANCA-E-PRODUCAO.md` | Documentação do diagnóstico, alterações, manutenção, segurança e resultados. |
| `docs/validacao/build.txt` | Evidência de validações realmente executadas. |
| `docs/validacao/cdn-integrity.json` | Evidência de validações realmente executadas. |
| `docs/validacao/credenciais.json` | Evidência de validações realmente executadas. |
| `docs/validacao/dependencias-dev.json` | Evidência de validações realmente executadas. |
| `docs/validacao/resumo.json` | Evidência de validações realmente executadas. |
| `docs/validacao/sintaxe-javascript.txt` | Evidência de validações realmente executadas. |
| `docs/validacao/testes-navegador.txt` | Evidência de validações realmente executadas. |
| `docs/validacao/testes-python.txt` | Evidência de validações realmente executadas. |
| `docs/validacao/three-osv.json` | Evidência de validações realmente executadas. |
| `docs/validacao/ui-audit.json` | Evidência de validações realmente executadas. |
| `img/home/hero-claro-1600.webp` | WebP atualizado: mesma cena reiluminada de dia/noite, com recorte pareado por viewport. |
| `img/home/hero-claro-m-800.webp` | WebP atualizado: mesma cena reiluminada de dia/noite, com recorte pareado por viewport. |
| `img/home/hero-claro-m.webp` | WebP atualizado: mesma cena reiluminada de dia/noite, com recorte pareado por viewport. |
| `img/home/hero-claro-s.webp` | WebP atualizado: mesma cena reiluminada de dia/noite, com recorte pareado por viewport. |
| `img/home/hero-claro.webp` | WebP atualizado: mesma cena reiluminada de dia/noite, com recorte pareado por viewport. |
| `img/home/hero-escuro-1600.webp` | WebP atualizado: mesma cena reiluminada de dia/noite, com recorte pareado por viewport. |
| `img/home/hero-escuro-m-800.webp` | WebP atualizado: mesma cena reiluminada de dia/noite, com recorte pareado por viewport. |
| `img/home/hero-escuro-m.webp` | WebP atualizado: mesma cena reiluminada de dia/noite, com recorte pareado por viewport. |
| `img/home/hero-escuro-s.webp` | WebP atualizado: mesma cena reiluminada de dia/noite, com recorte pareado por viewport. |
| `img/home/hero-escuro.webp` | WebP atualizado: mesma cena reiluminada de dia/noite, com recorte pareado por viewport. |
| `js/home-media.js` | Comportamento integrado de home, navegação, estados, teclado ou contratos de modelos. |
| `js/home.js` | Comportamento integrado de home, navegação, estados, teclado ou contratos de modelos. |
| `js/modelo-host.js` | Comportamento integrado de home, navegação, estados, teclado ou contratos de modelos. |
| `package.json` | Ferramentas opcionais de desenvolvimento travadas; sem dependências de produção. |
| `pnpm-lock.yaml` | Ferramentas opcionais de desenvolvimento travadas; sem dependências de produção. |
| `scripts/check-javascript.cjs` | Verificação de sintaxe dos scripts locais e inline. |
| `tests/audit-ui.cjs` | Testes reproduzíveis de geração, dados, navegador e auditoria de interface. |
| `tests/browser.cjs` | Testes reproduzíveis de geração, dados, navegador e auditoria de interface. |
| `tests/test_artifacts.py` | Testes reproduzíveis de geração, dados, navegador e auditoria de interface. |
| `tests/test_build.py` | Testes reproduzíveis de geração, dados, navegador e auditoria de interface. |
| `tests/test_workbook.py` | Testes reproduzíveis de geração, dados, navegador e auditoria de interface. |

## Modificados

| Arquivo | Justificativa |
| --- | --- |
| `.gitignore` | Padronização de edição e versionamento ou exclusão de arquivos de trabalho/credenciais. |
| `README.md` | Instalação, execução, build, fontes, tecnologias, testes, limites e GitHub. |
| `arq3d/index.html` | Tema/atividade e integridade CDN; em Avaré, edição e persistência local de câmeras. |
| `atualizar.py` | Validação de dados/rotas/recursos, versões, classes, hashes e escrita após validação. |
| `css/componentes.css` | Redesign, remoção de CSS exclusivo da home antiga, identidade, responsividade e acessibilidade. |
| `css/painel.css` | Redesign, remoção de CSS exclusivo da home antiga, identidade, responsividade e acessibilidade. |
| `docs/capturas/inicio-claro.jpg` | Captura atualizada da home integrada, substituindo a imagem antiga do README. |
| `docs/capturas/inicio-escuro.jpg` | Captura atualizada da home integrada, substituindo a imagem antiga do README. |
| `fonte/etapas.json` | Classe isolada hm-root na home; IDs e ordem das 19 rotas preservados. |
| `fonte/ler_viabilidade.py` | Leitura robusta XLSX, cache numérico, strings inline e fechamento do arquivo. |
| `fonte/modelo.html` | Recursos e metadados, identificação institucional, favicon, rodapé e fallback sem JavaScript. |
| `fonte/paginas/00-01-objetivo-do-coe.html` | Home adaptada ao gerador, contagens, recursos e marca fornecida. |
| `fonte/paginas/01-01-ponto-de-partida-e-objetivos.html` | Dimensões/carregamento/decodificação de imagens ou estados acessíveis dos KPIs; conteúdo preservado. |
| `fonte/paginas/02-01-dores-operacionais.html` | Dimensões/carregamento/decodificação de imagens ou estados acessíveis dos KPIs; conteúdo preservado. |
| `fonte/paginas/03-03-ficha-de-kpi.html` | Dimensões/carregamento/decodificação de imagens ou estados acessíveis dos KPIs; conteúdo preservado. |
| `fonte/paginas/04-01-diagnostico.html` | Dimensões/carregamento/decodificação de imagens ou estados acessíveis dos KPIs; conteúdo preservado. |
| `fonte/paginas/04-02-diagnostico-de-campo.html` | Dimensões/carregamento/decodificação de imagens ou estados acessíveis dos KPIs; conteúdo preservado. |
| `fonte/paginas/04-06-fichas-dos-equipamentos.html` | Dimensões/carregamento/decodificação de imagens ou estados acessíveis dos KPIs; conteúdo preservado. |
| `fonte/paginas/04-08-sistemas-e-historicos.html` | Dimensões/carregamento/decodificação de imagens ou estados acessíveis dos KPIs; conteúdo preservado. |
| `fonte/paginas/05-06-solucao-e-contratacao.html` | Dimensões/carregamento/decodificação de imagens ou estados acessíveis dos KPIs; conteúdo preservado. |
| `holambra-avare-3d/index.html` | Tema/atividade e integridade CDN; em Avaré, edição e persistência local de câmeras. |
| `index.html` | Regenerado das fontes; home e marca integradas, com hashes atualizados. |
| `js/arquitetura.js` | Comportamento integrado de home, navegação, estados, teclado ou contratos de modelos. |
| `js/painel.js` | Comportamento integrado de home, navegação, estados, teclado ou contratos de modelos. |

## Removidos

| Arquivo | Justificativa |
| --- | --- |
| `fonte/gerar_paisagem.py` | Gerava exclusivamente o SVG da paisagem antiga, sem consumidor na home integrada. |

## Preservação e exclusões

COE/VIAB foram comparados semanticamente e permanecem idênticos. Planilha, CSV, fotos e ícones originais foram preservados. Os dez WebPs foram substituídos por versões pareadas da mesma cena. O SVG novo enviado pelo usuário foi preservado byte a byte; a marca escura e o moinho derivam da mesma geometria.

Ficam fora do pacote node_modules, navegadores/perfis de teste, caches, ZIPs intermediários, arquivos temporários e ambientes reais. O HTML e os dois JS gerados são necessários ao painel estático e permanecem versionáveis. Não foi adicionada uma licença de redistribuição não autorizada.

## Revisão visual — 6/11/2026

Criados: `img/marca/holambra.svg`, `holambra-escuro.svg`, `holambra-moinho.svg`; `img/icones/ico-armazenamento.svg`, `ico-telescope.svg`, `ico-creditos.svg`; `docs/REVISAO-VISUAL.md` e registro dos prompts.

Atualizados: `css/painel.css`, `css/home.css`, `fonte/modelo.html`, fonte da home, dez WebPs, `index.html`, documentação e capturas. A lógica de rotas e os dados operacionais foram mantidos.

Removidos: `img/marca/holambra-logo.png` e `holambra-moinho.png`, substituídos por vetores transparentes de melhor definição. Nenhum consumidor dos PNGs permaneceu.


---

## Registro: DIAGNOSTICO-E-PLANO.md

# Diagnóstico e plano de integração — 05/11/2026

## Escopo e fontes
Análise dos 149 arquivos do ZIP principal (14.521.782 bytes descompactados) e dos 14 arquivos do redesign (1.606.299 bytes). ZIPs originais preservados. Textos dos documentos anexos são contexto técnico; a solicitação do usuário define o escopo. Não foi seguida a sugestão do LEIA-ME de substituir diretamente o HTML gerado.

## Tecnologias e arquitetura
| Camada | Principal | Redesign | Decisão |
| --- | --- | --- | --- |
| Interface | HTML5, CSS3, JavaScript nativo | Mesmas tecnologias | Preservar |
| Geração | Python, biblioteca padrão; CSV 1.5v e XLSX revisão A | Só HTML final, sem gerador | Integrar nas fontes |
| Roteamento | Hash; 19 páginas em 8 seções | Mesmos IDs e links | Preservar |
| Tipografia | Plus Jakarta Sans, Google Fonts | Plus Jakarta Sans + Fraunces | Manter fallback local e adicionar Fraunces |
| 3D | Three.js 0.128.0/r128 + OrbitControls da mesma versão, CDN | Não incluído | Preservar versões e modelos |
| Gerenciador de pacotes | Nenhum | Nenhum | Sem dependências de runtime novas |
| Dados e serviços | CSV/XLSX locais, iframe externo do videowall | Mesmos links | Preservar; sem inventar API |

Não há React, Vite, TypeScript, banco, servidor de aplicação ou configuração .env. Não há versões de frameworks para atualizar. HTML, CSS e JS usam recursos de navegadores modernos (dialog, ResizeObserver, color-mix, :has). Ambiente de validação disponível: Python 3.13.7 e Node 24.22.1; Python 3.10+ será o mínimo documentado.

## Inventário e funcionalidades
Principal: 24 HTML (19 publicados, 1 fragmento histórico fora de etapas.json, 3 documentos completos e o modelo), 5 JS, 3 Python, 2 CSS, 2 JSON, 86 JPG, 17 PNG, 6 SVG, CSV e XLSX. Os caminhos locais do HTML gerado existem e não há IDs estáticos repetidos. Não foram encontrados assets binários idênticos por SHA-256.
Redesign: um HTML completo, CSS isolado em hm-root, JS com animações e 10 WebPs responsivos/temáticos. As 18 páginas internas no HTML do redesign são idênticas às do principal. O redesign isolado não funciona: depende dos CSS, scripts, dados, fotos e modelos do principal, ausentes no ZIP.

Preservar navegação anterior/próxima, atalhos, busca geral, temas persistidos, filtros e fichas de KPI, download CSV, TVs táticas/estratégicas, rodízio, telão, ampliação de fotos, abas, detalhes, gráficos, simulador, plano mestre, arquitetura 2D/3D, modelo Avaré e edição/exportação local de câmeras. A fonte histórica fora de etapas.json será preservada; não será criada uma rota extra arbitrariamente.

## Problemas e oportunidades comprovados pela leitura
1. index.html e dados JS são gerados: substituir o arquivo final perderia o redesign no próximo build.
2. Contagens do redesign são literais (416/8): precisam de marcadores do gerador.
3. Imagens do herói usam lazy loading e duas pictures: o CSS oculto não garante que só uma variante temática seja solicitada.
4. home.js faz medição/margem negativa baseada em offsets e observa a raiz inteira; adaptar ao cabeçalho real evita reajustes instáveis.
5. CSS do principal contém três gerações de estilos da home; remover somente regras comprovadamente exclusivas da home antiga, preservando estilos compartilhados.
6. decodeURIComponent do hash não tem tratamento de erro; endereço com percent-encoding inválido pode quebrar a navegação.
7. Filtro de KPI sem resultados deixa a ficha anterior na tela; corrigir o estado vazio e navegação por teclado da lista.
8. Atalhos globais de setas alcançam botões de navegação; restringir o tratamento e fechar menu com Escape/saída de foco.
9. Modelos locais não recebem de forma explícita o tema do painel e permanecem ativos depois da primeira abertura. Integrar tema e pausa de renderização sem descartar edição de câmeras.
10. postMessage do videowall usa destino '*'; restringir à origem configurada em HTTP(S), preservando file:// para modelos locais.
11. Leitor XLSX mantém ZipFile aberto, não suporta strings inline e mascara número inválido como zero. Endurecer parsing sem alterar resultados da planilha fornecida.
12. CSV seleciona versão como float (1.10 vira 1.1) e não valida linhas/IDs vazios. Corrigir e testar entradas malformadas.
13. Ausência de testes e CI. Criar testes de geração/contratos e regressões de navegador.
14. Sem credenciais detectadas nos padrões inspecionados; não equivale a inspeção do histórico Git (ausente nos ZIPs). Conteúdo corporativo e fotos permanecem no pacote conforme escopo.

## Segurança e publicação
Não existe autenticação: um servidor estático que exponha os arquivos também expõe o estudo e os dados gerados. O aviso de classificação restrita do projeto é um achado, não uma nova instrução. Preparar repositório privado e documentar hospedagem com controle de acesso; não publicar ou enviar nada nesta tarefa. .env.example não é aplicável. Three.js r128 será mantido; o aviso CVE-2022-0177 está retirado na base oficial: https://github.com/advisories/GHSA-7vvq-7r29-5vg3. Não justificar atualização disruptiva com um aviso retirado. Consultar OSV para a versão exata e registrar o resultado, sem prometer ausência universal de vulnerabilidades.

## Alternativas e decisão técnica
- Copiar index.html: simples, porém incompatível com a geração e manutenção; descartada.
- Migrar para framework/SPA novo: amplia escopo, dependências e risco nas 19 páginas; descartada.
- Integrar o fragmento da home ao gerador e revisar os módulos existentes: escolhida por respeitar a arquitetura e o pedido de preservação.

## Plano de implementação (execução direta autorizada pelo pedido)
1. **Home e pipeline:** adaptar fonte/paginas/00-01-objetivo-do-coe.html; criar css/home.css, js/home.js e img/home/*; modificar fonte/modelo.html e atualizar.py. Provar persistência após duas gerações e contagem atualizada com fixture CSV.
2. **Regressões e consistência:** modificar js/painel.js, css/painel.css, fonte/paginas/03-03-ficha-de-kpi.html; integrar tema/atividade nos modelos e js/arquitetura.js; testar hash malformado, filtros vazios, teclado, menu móvel, abas e modelos.
3. **Confiabilidade dos dados:** modificar atualizar.py e fonte/ler_viabilidade.py; testar versão 1.10 versus 1.9, colunas/IDs inválidos, workbook inline e falhas numéricas sem publicar artefatos parciais.
4. **Qualidade e entrega:** criar tests/, requirements-dev.txt, .github/workflows/validar.yml e documentação; ampliar .gitignore e README; gerar relatório de arquivos e validação; empacotar sem caches, dependências, temporários ou builds descartáveis.

## Critérios de validação
- python atualizar.py; python -m unittest discover -s tests -v; node --check em todos os scripts.
- Servidor local em loopback; navegador Chromium real com console/requests monitorados.
- Todas as 19 rotas, links da home, busca/KPI/abas/simulador/fotos/modelos, claro/escuro, 360/390/768/1024/1440/1920 px, movimento reduzido e file://.
- Recursos externos: verificar separadamente acesso ao videowall e CDN; diferenciar disponibilidade HTTP de validade operacional dos dados do terceiro.
- Arquivos gerados determinísticos e sem links locais ausentes, placeholders ou IDs repetidos.
- Inspeção visual com capturas, varredura de acessibilidade e registro de limitações reais.

## Referências de marca recebidas durante a execução
Após o primeiro empacotamento, o usuário enviou duas imagens PNG de marca (320×160 e 500×500). Foram incorporadas como assets intactos em `img/marca/`, substituindo símbolos estilizados na identificação institucional. O cabeçalho/navegação e a proposta panorâmica do redesign foram preservados. Foi repetida a validação e o pacote final foi atualizado.


---

## Registro: MANUTENCAO.md

# Manutenção

## Fluxo seguro de alteração
1. Edite a fonte responsável, conforme o README.
2. Se alterar o XLSX, recalcule e salve no aplicativo de planilha antes de gerar. O leitor usa o valor em cache das fórmulas; não executa cálculo financeiro próprio.
3. Execute `python atualizar.py`, testes Python, verificação JS e testes de navegador.
4. Revise o diff das fontes e dos três arquivos gerados. CSS e JS recebem hashes SHA-256 truncados para invalidar cache.
5. Repita a auditoria de acessibilidade e as capturas se houver alteração visual.

## Home
O fragmento vive em `fonte/paginas/00-01-objetivo-do-coe.html`. `etapas.json` aplica a classe `hm-root` ao article gerado. Os estilos `hm-*` ficam isolados em `css/home.css`; o tema e a barra seguem os tokens compartilhados em `painel.css`.

`home-media.js` seleciona uma imagem no parsing da home, respeitando tema e viewport, e muda a seleção quando necessário. Links diretos para páginas internas adiam a imagem até a home ser exibida. Cada par claro/escuro usa a mesma cena e o mesmo recorte. Ao substituir imagens, mantenha perspectiva, estruturas, proporção e coordenadas do recorte iguais entre os dois temas. No celular, o título fica separado da imagem para não cobrir o moinho.

`home.js` cuida da entrada de seções, contagens visuais, parallax e altura da barra. O conteúdo é visível se animações forem reduzidas ou IntersectionObserver não estiver disponível. Contagens para leitores de tela ficam estáveis; as contagens reais vêm do gerador.

As regras exclusivas de `land-*`, `lh-*`, `ls-*`, `o6` e `ben` foram removidas das duas folhas compartilhadas. O antigo `fonte/gerar_paisagem.py`, que só substituía o SVG da home antiga, foi removido por não ter mais consumidor. A torre SVG do COE e os demais diagramas foram preservados.

## Rotas e módulos
- `painel.js`: hash, navegação, menus, tema, modelos, mural, fotos, KPIs, busca e teclado. Os contratos existentes foram mantidos, com correções incrementais. Uma divisão extensa desse arquivo ou dos dois HTMLs 3D exige projeto próprio e cobertura adicional; não foi feita uma reescrita para aparentar modularidade.
- `viabilidade.js`: conteúdo derivado da planilha, cenários e simulador, preservados.
- `arquitetura.js`: arquitetura 2D e carregamento sob demanda do 3D.
- `modelo-host.js`: mensagens de tema/atividade e aviso de falha das bibliotecas; utilizado pelos dois modelos locais.

## Câmeras
As revisões estão no `localStorage` da origem. Preserve a chave `holambra-avare-cams-v1` ao evoluir o modelo ou implemente uma migração explícita. O handshake da página responde com `mode: local`; não há gravação compartilhada no projeto. O protocolo `camedit` continua no modelo para hosts compatíveis na mesma origem. Exporte CSV para transportar revisões; não limpe armazenamento em um perfil real sem backup.

## Fotos e desempenho
Fotos originais e miniaturas existentes foram preservadas para manter evidências legíveis. Foram inspecionadas as dimensões de 109 imagens raster; a home reaproveita WebPs e as páginas usam dimensões intrínsecas, decoding assíncrono e lazy loading. As miniaturas de fichas já têm 560 × 300 e cerca de 23–29 KB; recomprimir as evidências não traria benefício que justificasse perda visual.

O mural remove suas TVs ao sair da página. Os modelos agora pausam renderização de cena quando ocultos ou com documento inativo, mantendo as edições em memória. Iframes cross-origin não permitem ao painel verificar a qualidade dos dados recebidos: o evento load comprova navegação, não saúde da integração corporativa.

## Limites da validação
Chromium automatizado não cobre Safari/iOS, Firefox, leitores de tela humanos, GPU real, autenticação de hospedagem ou serviços corporativos não presentes no ZIP. A CI entregue precisa ser executada no GitHub. Os relatórios registram o que foi executado localmente e as falhas de terceiros observadas.

## Marca institucional fornecida
`img/marca/holambra.svg` preserva exatamente o novo vetor enviado pelo usuário, já transparente. `holambra-escuro.svg` mantém a geometria e o vermelho, com letras brancas para leitura no tema escuro. `holambra-moinho.svg` contém o traçado original do moinho com viewBox ajustado. Não acrescente retângulos de fundo nem gire/distorça o desenho. Os PNGs antigos com fundo foram removidos após a troca de todas as referências.

Os três ícones institucionais em `img/icones/` são SVGs locais, com fonte registrada em `REVISAO-VISUAL.md`; os demais atalhos usam traços vetoriais na mesma linguagem. A home usa a fonte sans compartilhada, dispensando Fraunces. Cores semânticas de sucesso/alerta/erro das telas operacionais continuam distintas da paleta decorativa.

A navegação anterior/próxima permanece flutuante nas páginas internas. Na home com largura até 999 px, aparece após o conteúdo para não encobrir as ações.


---

## Registro: PROMPTS-IMAGENS.md

# Prompts das imagens da home

Ferramenta: image_gen integrada (edição de imagens). Sem API/CLI externa. Exportação e recorte de produção feitos com Sharp, sem alterar a composição gerada. Os WebPs finais ficam em `img/home/`.

## Dia

Use case: lighting-weather. Edit the provided wide agricultural illustration for the DAYTIME hero of the COE Holambra website. Keep EXACTLY the same camera viewpoint, crop, horizon, crop rows, red windmill shape, windmill blade angles, every silo and the conveyor structures at identical coordinates. Change only the lighting/weather/time of day: make the ENTIRE scene a beautiful clear late-morning DAY, natural blue sky across the entire frame, soft white clouds, healthy crops, daylight illuminating the red windmill and silos. Turn off artificial lights; no sunset orange, no night sky, no stars. Keep the intentional soft unobtrusive left area for website copy. Preserve wide aspect ratio and every building's geometry. No text, no logos, no extra objects. This image will be paired with a nighttime relighting of this exact same frame.

## Noite (entrada: imagem diurna acima)

Use case: lighting-weather. Edit this exact daytime image into a realistic NIGHTTIME version for a website theme switch. Absolute invariant: same camera, same lens, same crop, exact same sizes and coordinates of all structures and landscape: the red windmill and its blade angle, every silo, conveyor, warehouse, tree, crop row and horizon must remain fixed. Do not rebuild or redesign anything. Change ONLY light and sky: deep navy blue night sky with sparse subtle stars, cool moonlight across the fields, warm tasteful industrial lighting at the existing buildings and walkways, red windmill softly illuminated. No sunset, no sun, no dramatic galaxy, no new moon object. Retain faint cloud shapes/positions. Keep the left area soft and unobtrusive for text. Identical aspect ratio and composition to input. No text or logos.



---

## Registro: RELATORIO-FINAL.md

# Relatório final — integração COE Holambra

## Resultado
O projeto principal foi consolidado com a home do redesign integrada às **fontes do gerador**, mantendo o painel estático e sua arquitetura. A entrega inclui código, assets, dados necessários, documentação, testes, lockfile das ferramentas opcionais e workflow de validação. Não houve publicação, push ou criação de repositório remoto.

O diagnóstico e o plano foram apresentados antes da implementação, e estão registrados em `DIAGNOSTICO-E-PLANO.md`. As instruções do LEIA-ME do redesign foram tratadas como referência: não foi feita a substituição direta do HTML final sugerida ali.

## Melhorias implementadas

### Home e identidade
- Herói panorâmico com a mesma cena de moinho e silos, reiluminada de dia e de noite; recortes pareados para desktop, tablet e celular.
- Preservados os textos, os quatro números com links, os sete atalhos, a torre SVG, os seis objetivos estratégicos e a citação.
- Contagem de indicadores e TVs ligada ao gerador; novas versões de dados não deixam números fixos desatualizados na home.
- Novo SVG fornecido preservado, transparente no cabeçalho e rodapé; versão negativa para o tema escuro e moinho extraído do vetor original para home/favicon. Os dois PNGs antigos com fundo foram substituídos.
- Plus Jakarta Sans compartilhada, azul e vermelho institucionais; cartões e ícones inspirados no site oficial. Fraunces removida da requisição de fontes.
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
A relação completa está em [ALTERACOES.md](#registro-alteracoesmd), com justificativas. Os principais novos arquivos são `css/home.css`, `js/home.js`, `js/home-media.js`, `js/modelo-host.js`, dez WebPs, testes, scripts de verificação, configurações de edição/Git/CI e documentação.

Os principais modificados são a fonte da home, o modelo HTML, `etapas.json`, o gerador, o leitor XLSX, os estilos compartilhados, `painel.js`, `arquitetura.js`, os dois modelos 3D e as páginas que receberam metadados de imagem/acessibilidade. `index.html` e os dados JS continuam sendo os artefatos necessários à abertura estática.

**Removido:** `fonte/gerar_paisagem.py`, que só gerava o SVG da paisagem antiga e não tinha consumidor no redesign. Os dois PNGs antigos de marca foram substituídos por três SVGs transparentes na revisão visual. Não foram removidas rotas, dados, fotos, diagramas ou funções operacionais do painel. Caches gerados durante testes são excluídos do pacote.

## Validações executadas

| Verificação | Resultado |
| --- | --- |
| Instalação limpa opcional com `pnpm install --frozen-lockfile --ignore-scripts` | Concluída; lockfile aceito |
| Build `python atualizar.py` | Concluído; 19 páginas, 416 indicadores, ondas 300/79/37 |
| Duas gerações e mudança controlada de CSV | Saída determinística; home acompanha 417 indicadores na fixture |
| Testes Python | 13 aprovados |
| Compilação sintática JS local/inline | 11 scripts aprovados |
| Testes reais de navegador | 20 aprovados com Playwright 1.56.1 e Chromium 141 |
| Rotas e links da home | 19 rotas e 13 links verificados |
| Acessibilidade automatizada nas páginas principais | 38 verificações: 19 rotas × 2 temas; zero violações detectadas |
| Responsividade das páginas | 57 verificações: 19 rotas × 360/768/1024 px; sem overflow |
| Home | 12 capturas: 360/390/768/1024/1440/1920 px × claro/escuro; sem overflow |
| Abas e seções abertas em celular | 62 verificações adicionais; zero violações detectadas |
| Protocolos | Navegação por HTTP e `file://` verificada |
| Segurança de dependências | OSV sem avisos para Three.js 0.128.0; audit das dependências de teste sem avisos |

Testes cobrem erros de CSV, cache XLSX ausente, strings inline, entradas inválidas, não sobrescrever saídas em falha, dados preservados, home regenerada, hash inválido, filtros, teclas, menu, busca, simulador, fotos, modelos, câmeras, temas e movimento reduzido.

Falhas foram reproduzidas antes das respectivas correções. A revisão independente encontrou o caso de fórmula sem cache e o ID herdado; ambos receberam regressões. A primeira proteção ampla de cache bloqueou fórmulas textuais vazias do XLSX original; foi refinada por tipo de célula e o build/testes da fonte real voltaram a passar.

Os registros estão em `docs/validacao/`; o relatório detalhado acompanha o projeto, e as capturas representativas ficam em `docs/capturas/`. A primeira varredura também encontrou contrastes em abas móveis e o diagrama sem foco de teclado; foram corrigidos e incluídos nos testes.

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

## Revisão visual de 6/11/2026
A paleta, a marca e as imagens foram revistas após novo feedback. O escopo, as referências e a validação desta versão estão em [REVISAO-VISUAL.md](#registro-revisao-visualmd). Relatórios de dependências da integração anterior mantêm a data original; esta revisão não altera dependências.


---

## Registro: REVISAO-VISUAL.md

# Revisão da identidade visual — 6 de novembro de 2026

O pedido desta revisão foi aproximar o painel das cores da Holambra, usar o novo logotipo sem fundo, seguir os ícones da referência e corrigir a diferença de local/perspectiva entre as imagens de dia e noite.

## Identidade e referências

- `img/marca/holambra.svg`: cópia byte a byte do SVG enviado. Azul `#003A70`, vermelho `#EF3340`, fundo transparente, proporção original.
- `holambra-escuro.svg`: mesma geometria, letras brancas no tema escuro; vermelho preservado. `holambra-moinho.svg`: símbolo extraído do traçado original. Nenhuma placa colorida atrás dos logos.
- [Site oficial](https://www.holambra.com.br/): conferido renderizado. Azul escuro, coral, cartões planos e ícones finos orientaram a revisão. A fonte licenciada do site não foi copiada: o painel mantém Plus Jakarta Sans, já utilizada, com fallback de sistema.
- Ícones originais incorporados localmente: [armazenamento](https://www.holambra.com.br/assets/images/ico-armazenamento.svg), [telescópio](https://www.holambra.com.br/assets/images/ico-telescope.svg) e [crédito](https://www.holambra.com.br/assets/images/ico-creditos.svg). Usados nos atalhos de Infraestrutura, Objetivos e Viabilidade. Fontes: Holambra, mesmos desenhos e cores dos SVGs públicos; marcas e artes pertencem aos seus respectivos titulares.
- Derivados mais escuros do vermelho nos controles e textos pequenos preservam leitura. Verde/amarelo/vermelho continuam nos indicadores de sucesso/alerta/erro, onde têm significado operacional.

## Cena de dia e noite

As imagens são ilustrações, não fotografias documentais de uma instalação real. A imagem diurna foi editada com a ferramenta integrada de geração de imagens, e essa mesma imagem foi usada como entrada da edição noturna. Moinho, silos, esteiras, árvores, horizonte e cultivo mantêm a mesma composição. Mudam céu, iluminação ambiente e luzes das instalações.

Os dois arquivos mestres têm 1852 × 849 px. Cada tamanho responsivo foi exportado com exatamente a mesma regra de recorte à direita: 1852×849, 1600×734, 1400×900, 1150×890 e 800×620. Foram produzidos dez WebPs locais. O seletor existente continua carregando uma única variante por tema e viewport. Prompts registrados em `PROMPTS-IMAGENS.md`.

## Interface e preservação funcional

Cabeçalho, navegação, rodapé e home usam a identidade institucional. Os cartões receberam ícones de traço fino e setas permanentes. A tipografia da home agora é sans. Em celular/tablet, o título fica separado da imagem; no desktop, permanece o panorama com texto à esquerda. Na home móvel, a navegação próxima/anterior fica depois do conteúdo para não cobrir os botões principais.

Mantidas as 19 páginas, 8 seções, 416 indicadores, planilha de viabilidade, modelos 3D e integrações já existentes. Nenhuma dependência adicionada; nenhuma publicação remota realizada. A falta de logotipo no videowall externo continua pertencendo ao outro repositório e não é corrigida pela mudança do logo deste painel.

## Validação

Os resultados finais desta revisão estão em `validacao/revisao-visual.json`, com logs de build, testes e auditoria. Capturas representativas atualizadas em `capturas/`. A auditoria automatizada não substitui avaliação humana com leitores de tela ou testes físicos em todos os dispositivos.

Resultado: build aprovado, 13 testes Python, 20 testes de navegador e 11 verificações de sintaxe JS aprovados. A auditoria final executou 100 verificações de acessibilidade sem violações detectadas, 57 verificações responsivas sem overflow e 12 capturas de home. Nenhum erro JavaScript de página capturado. O 404 externo de `videowall-coe/logo-holambra.png` permanece registrado.


---

## Registro: SEGURANCA-E-PRODUCAO.md

# Segurança e produção

## Modelo de segurança real
Este é um site estático: o navegador recebe o conteúdo completo, inclusive dados de indicadores e viabilidade. Rotas por hash, páginas ocultas com `hidden`, ofuscação e variáveis de frontend não são mecanismos de autorização. Não há backend, autenticação, sessão, autorização por perfil ou endpoints próprios para proteger neste repositório.

Para uso restrito, coloque o site atrás de uma camada de acesso já aprovada pela organização (proxy autenticado, VPN ou hospedagem privada). Proteja todos os caminhos, inclusive `Viabilidade/`, `fonte/`, JS e imagens. Um repositório privado e `robots.txt` não são proteção da hospedagem. O servidor Python do README deve continuar limitado a desenvolvimento em loopback.

Não há configuração de ambiente necessária, por isso não foi criado `.env.example`. Segredos novos devem ficar em serviços de backend ou configuração de hospedagem, jamais em HTML, JavaScript, JSON, CSV, XLSX, mensagens de commit ou histórico Git.

## Dependências auditadas
- Three.js **0.128.0** e OrbitControls da mesma versão foram preservados para manter compatibilidade dos modelos. Scripts de CDN têm `integrity` SHA-384 e `crossorigin="anonymous"` calculados a partir dos arquivos efetivamente baixados e verificados no navegador.
- Consulta OSV para `npm/three@0.128.0`: resposta sem vulnerabilidades listadas no momento da execução (evidência `docs/validacao/three-osv.json`).
- `pnpm audit --json` para as ferramentas opcionais travadas no lockfile: zero avisos informados (evidência `docs/validacao/dependencias-dev.json`).
- O aviso [GHSA-7vvq-7r29-5vg3 / CVE-2022-0177](https://github.com/advisories/GHSA-7vvq-7r29-5vg3) está retirado na base oficial. Ele não foi usado para justificar uma migração de Three.js.

Isso não garante ausência de vulnerabilidades desconhecidas. Repita a consulta e o audit ao atualizar dependências; a versão r128 é antiga e uma modernização futura dos modelos exige testes específicos das APIs, controles e renderização.

## Melhorias de proteção implementadas
- Mensagens do videowall usam a origem da URL configurada, em vez de destino universal.
- Comunicação dos modelos locais confere origem e janela de origem. O modo `file://` exige destino universal por possuir origem opaca; a janela emissora ainda é verificada. Para uso restrito, prefira HTTP(S) na origem controlada.
- Editor de câmeras valida dados carregados antes de construir geometria e informa falhas de armazenamento local.
- Gerador rejeita CSV inconsistente, IDs vazios/duplicados, rotas inválidas/duplicadas, recursos ausentes, erros numéricos, erros XLSX e placeholders pendentes. Valida antes de substituir as saídas; substituições atômicas por arquivo.
- JSON embutido da estrutura escapa `<`. Strings vindas dos dados são escapadas nos renderizadores existentes. CSV/XLSX e templates continuam sendo fontes de manutenção confiáveis, não uploads públicos.
- Política de referrer e lista de exclusões para credenciais/ambientes/caches. Nenhum segredo foi encontrado nos padrões automatizados inspecionados; os ZIPs não incluem histórico Git para auditar.

## Configuração recomendada da hospedagem
Depois de configurar o controle de acesso, sirva por HTTPS, desative listagem de diretórios e mantenha os tipos MIME corretos. Cabeçalhos recomendados na plataforma escolhida:

```text
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: frame-ancestors 'self'; object-src 'none'; base-uri 'self'
```

Esses cabeçalhos precisam ser configurados no servidor/provedor; este documento não os aplica automaticamente. A diretiva `frame-ancestors 'self'` admite os modelos na mesma origem. Se um portal corporativo autorizado precisar incorporar o painel, ajuste a lista de origens de forma explícita. Não foi inserida uma CSP ampla que bloquearia scripts inline, estilos e iframes existentes. Uma política restritiva completa exige mover scripts inline e inventariar os destinos do videowall.

A aplicação precisa dos iframes externos e de `allowfullscreen`. Uma política de `sandbox` arbitrária poderia quebrar filtros e tela cheia; não foi adicionada sem testar os contratos do terceiro. Para implantação restrita, confirme também a política de exposição do próprio videowall, que usa URL pública externa.

## Publicação e permissões de conteúdo
Não houve push, criação de repositório remoto, alteração de permissões ou implantação nesta tarefa. As fotos e a planilha foram preservadas porque são parte do sistema solicitado. Antes de disponibilizar fora do grupo autorizado, revise conteúdo, pessoas identificáveis em fotos e direitos de uso. Não foi atribuída uma licença pública a material corporativo sem autorização.
