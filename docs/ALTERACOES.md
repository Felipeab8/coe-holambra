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
| `img/home/hero-claro-1600.webp` | WebP responsivo/temático do redesign, preservado sem recompressão. |
| `img/home/hero-claro-m-800.webp` | WebP responsivo/temático do redesign, preservado sem recompressão. |
| `img/home/hero-claro-m.webp` | WebP responsivo/temático do redesign, preservado sem recompressão. |
| `img/home/hero-claro-s.webp` | WebP responsivo/temático do redesign, preservado sem recompressão. |
| `img/home/hero-claro.webp` | WebP responsivo/temático do redesign, preservado sem recompressão. |
| `img/home/hero-escuro-1600.webp` | WebP responsivo/temático do redesign, preservado sem recompressão. |
| `img/home/hero-escuro-m-800.webp` | WebP responsivo/temático do redesign, preservado sem recompressão. |
| `img/home/hero-escuro-m.webp` | WebP responsivo/temático do redesign, preservado sem recompressão. |
| `img/home/hero-escuro-s.webp` | WebP responsivo/temático do redesign, preservado sem recompressão. |
| `img/home/hero-escuro.webp` | WebP responsivo/temático do redesign, preservado sem recompressão. |
| `img/marca/holambra-logo.png` | Imagem de marca enviada pelo usuário, copiada sem alteração de pixels, cores ou proporções. |
| `img/marca/holambra-moinho.png` | Imagem de marca enviada pelo usuário, copiada sem alteração de pixels, cores ou proporções. |
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

COE/VIAB foram comparados semanticamente e permanecem idênticos. Planilha, CSV, fotos e ícones originais foram preservados. Os dez WebPs do redesign e as duas imagens de marca enviadas pelo usuário estão intactos.

Ficam fora do pacote node_modules, navegadores/perfis de teste, caches, ZIPs intermediários, arquivos temporários e ambientes reais. O HTML e os dois JS gerados são necessários ao painel estático e permanecem versionáveis. Não foi adicionada uma licença de redistribuição não autorizada.
