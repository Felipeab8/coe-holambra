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
