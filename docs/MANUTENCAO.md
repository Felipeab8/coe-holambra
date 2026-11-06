# Manutenção

## Fluxo seguro de alteração
1. Edite a fonte responsável, conforme o README.
2. Se alterar o XLSX, recalcule e salve no aplicativo de planilha antes de gerar. O leitor usa o valor em cache das fórmulas; não executa cálculo financeiro próprio.
3. Execute `python atualizar.py`, testes Python, verificação JS e testes de navegador.
4. Revise o diff das fontes e dos três arquivos gerados. CSS e JS recebem hashes SHA-256 truncados para invalidar cache.
5. Repita a auditoria de acessibilidade e as capturas se houver alteração visual.

## Home
O fragmento vive em `fonte/paginas/00-01-objetivo-do-coe.html`. `etapas.json` aplica a classe `hm-root` ao article gerado. Os estilos `hm-*` ficam isolados em `css/home.css`; o tema e a barra seguem os tokens compartilhados em `painel.css`.

`home-media.js` seleciona uma imagem no parsing da home, respeitando tema e viewport, e muda a seleção quando necessário. Links diretos para páginas internas adiam a imagem até a home ser exibida. As variantes originais têm enquadramentos diferentes; trocar todos os arquivos por uma única miniatura prejudicaria o layout.

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
`img/marca/holambra-logo.png` e `holambra-moinho.png` são cópias exatas das duas imagens enviadas pelo usuário. Preserve cores, proporções e fundos fornecidos. A marca completa aparece sobre superfície branca no rodapé, e o moinho é usado como símbolo compacto; não há recoloração por tema. O moinho SVG estilizado da home foi substituído por essa referência e sua animação de pás foi retirada para não girar/distorcer a marca. A ilustração do herói continua como cena decorativa.
