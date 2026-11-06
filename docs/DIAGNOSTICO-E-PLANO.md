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
