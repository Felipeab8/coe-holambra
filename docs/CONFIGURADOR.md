# Configurador da Sala do COE

A maquete da Sala do COE é o **único ambiente editável** do material. O restante — páginas, ilustrações, fichas de indicadores, Piloto Avaré e arquitetura 3D — é de leitura.

## Abrir

- No material: **Infraestrutura → Sala do COE**, clique na maquete e depois em **Configurar sala**.
- Em tela inteira: botão **Configurar em nova janela** na mesma página, ou o endereço `sala-coe-3d/index.html#configurar`.

Ao entrar no modo configuração, a vista muda para o interior e aparecem: o **catálogo** à esquerda, o painel do **item selecionado** à direita e a **barra de configuração** na parte inferior. A vista **Planta** é a mais prática para reorganizar o espaço.

## O que é possível fazer

| Ação | Como |
| --- | --- |
| Adicionar | Clique em um item do catálogo; ele acompanha o cursor até um clique no piso. Em toque, entra no centro da vista. A busca filtra os 26 tipos. |
| Selecionar | Clique na maquete ou escolha em **Elemento da sala**. |
| Mover | Arraste na maquete (a câmera fica parada durante o arraste) ou informe X, Z e elevação. A grade ajusta em 0,10 m, 0,25 m, 0,50 m ou 1,00 m, ou fica livre. |
| Girar | Botões ⟲90, −15, +15, ⟳90, campo de graus ou teclas Q/E. |
| Escalar | Controle deslizante ou campo de 0,2× a 3×; **Proporções** ajusta largura, altura e profundidade separadamente (0,2× a 5×), por exemplo para alongar uma parede. |
| Telas e cores | TVs, videowalls e painéis escolhem o conteúdo demonstrativo; paredes, demarcações, quadro, sofá, poltrona, armário e painel institucional aceitam cor. **Cores da sala** muda paredes, piso e detalhes. |
| Remover e restaurar | **Remover** vale para qualquer elemento, inclusive os da proposta. Os originais removidos ficam em **Elementos removidos** e podem ser restaurados. **Desfazer ajustes** devolve um original à posição da proposta. |
| Histórico | Desfazer e refazer (até 150 passos). **Restaurar original** volta à maquete da proposta, com confirmação em dois cliques e possibilidade de desfazer. |
| Arquivo | Exportar e importar layout (.json), salvar a imagem da vista, publicar e voltar à versão publicada. |

Atalhos com um elemento selecionado: setas movem um passo da grade (Shift: 4×), Page Up/Down ajustam a elevação, Q/E giram 15° (Shift: 90°), `[` e `]` mudam a escala, Ctrl+D duplica, Delete remove, F enquadra, Esc cancela a inclusão ou limpa a seleção. Ctrl+Z e Ctrl+Y desfazem e refazem.

Ao trocar de elemento com um campo ainda em foco, o valor digitado é aplicado ao elemento que estava selecionado quando o campo foi editado.

## Onde a configuração fica salva

1. **Rascunho local**: toda alteração é gravada automaticamente no navegador (`localStorage`). Ao reabrir a sala, o rascunho é restaurado e um selo indica "Layout em rascunho neste navegador". **Arquivo → Voltar à versão publicada** descarta o rascunho.
2. **Arquivo de layout**: **Exportar layout** gera `layout-sala-coe-AAAA-MM-DD.json` (`schema: "coe-sala-layout"`). **Importar layout** aceita esse arquivo, um `edicoes.json` completo ou o objeto `room` puro.
3. **Versão publicada**, vista por todos:
   - **GitHub Pages**: **Baixar edicoes.json (publicação)** e substituir `dados/edicoes.json` no repositório.
   - **Servidor incluído**: **Publicar layout para todos**. Se outra pessoa publicou antes, o servidor recusa (conflito) e a sua configuração continua salva; exporte-a, recarregue e importe para comparar.

## Formato do layout

```json
{
  "objects": { "area-1": { "x": -7, "z": -4.25, "rotation": 15 }, "extintor": { "removed": true } },
  "added": [ { "id": "equipment-…", "kind": "tv75", "x": -2, "y": 0, "z": -7.7, "rotation": 0, "scale": 1,
               "sx": 1, "sy": 1, "sz": 1, "screen": 3, "visible": true, "name": "TV 75\" de parede" } ],
  "appearance": { "wallColor": "#dce2e5", "floorColor": "#ffffff", "accentColor": "#003a70" }
}
```

`objects` guarda ajustes dos 26 elementos da proposta (áreas, videowall, paredes, divisórias, racks, telas, climatização, recepção, extintor); `added` guarda os itens incluídos. Limites: 300 elementos editados ou adicionados; posição de −50 a 50 m; elevação de −20 a 20 m; escala de 0,2 a 3; proporções de 0,2 a 5; conteúdo de tela de 0 a 7; cores `#RRGGBB`. Os mesmos limites são validados no navegador e no servidor.

A maquete é conceitual: não substitui projeto executivo, dimensionamento aprovado ou integração com sistemas em tempo real.

## Hospedagem do servidor

O serviço hospeda **aplicação e API no mesmo domínio**. Use Python 3.11+ ou o Dockerfile incluído, com HTTPS no proxy e volume persistente.

| Variável | Uso |
| --- | --- |
| `HOST` | `127.0.0.1` local; `0.0.0.0` no contêiner/serviço |
| `PORT` | Porta interna, padrão `8080` |
| `COE_DATA_DIR` | Diretório persistente fora do código; padrão `../coe-holambra-data` |
| `COE_PUBLIC_ORIGIN` | Origem pública completa, como `https://coe.exemplo.com`, sem caminho |

O servidor não lê `.env` automaticamente; configure as variáveis no serviço. Ao escutar na rede, `COE_PUBLIC_ORIGIN` é obrigatório.

```sh
docker build -t coe-holambra .
docker volume create coe-dados
docker run --rm -p 8080:8080 -e COE_PUBLIC_ORIGIN=http://localhost:8080 -v coe-dados:/data coe-holambra
```

No primeiro início, o banco importa `dados/edicoes.json`; um banco existente nunca é sobrescrito pelo arquivo do repositório. A API mantém o formato anterior (`content`, `cameras`, `room`) por compatibilidade; o material usa apenas `room`.

## Dados e backup

- Sem autenticação: qualquer pessoa com acesso ao endereço do servidor pode publicar. Escritas exigem a mesma origem da aplicação e um cabeçalho próprio, o que reduz requisições acidentais, mas não é autorização individual.
- Banco `editor.sqlite3` em `COE_DATA_DIR`, com histórico de 100 revisões. O servidor não expõe Python, configuração, banco ou a pasta `fonte`.
- Backup: pare o serviço e copie todo `COE_DATA_DIR`, ou use backup transacional SQLite. Teste a restauração separadamente.
