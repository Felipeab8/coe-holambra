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
