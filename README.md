# clinic.ficusmed.com

Site público da **Ficus Clinic**: a página inicial, a política de privacidade e os termos de
serviço. Estático, sem build e sem dependência, publicado por GitHub Pages.

- `index.html`: a inicial. Só a marca: o figo em relevo, o lockup Ficus Clinic e, no rodapé,
  a identificação da empresa, o contato e os links dos dois documentos
- `inicio.css`, `inicio.js`: o visual e o relevo da inicial, que não servem a mais nada
- `privacidade.html`, `termos.html`: os documentos, com o próprio `estilo.css`
- `fontes/`, `img/`: fontes e logos da FicusMed, sem alteração, e a imagem de
  compartilhamento, gerada da própria inicial
- `CNAME`: domínio personalizado do GitHub Pages

## O que não muda

**Os três caminhos**: `/`, `/privacidade.html` e `/termos.html`. Outros serviços apontam
para eles pelo endereço exato, e renomear um arquivo quebra esses links. O link da política
fica no rodapé da inicial.

**O conteúdo dos documentos descreve o sistema como ele funciona.** Se o comportamento
mudar, o texto muda junto, com nova data de vigência: documento que descreve o que não
acontece mais é documento falso.

## A inicial

Uma parede figueira e, sobre ela, o figo construído em relevo, como peças de porcelana
marfim; o cursor é a lâmpada. Ao abrir, as peças sobem da base ao ápice e o módulo de ouro
chega por último e assenta. No celular, o dedo arrasta a luz.

- **A geometria mora uma vez só**, no `<svg class="figo">` do `index.html`, que é a capa
  oficial FIG. 17 da FicusMed sem mudança. O `inicio.js` lê de lá as células e o tom de cada
  uma, e tira a posição e a escala da caixa que o CSS deu ao SVG. Mexer na composição é mexer
  no CSS.
- **Sem WebGL, sem JavaScript ou com erro**, esse SVG fica no lugar. Com
  `prefers-reduced-motion`, não há chegada nem movimento automático.
- **Custo:** o shader desenha até cerca de 3,5 milhões de pixels, só calcula relevo e sombra
  na região do figo, e a qualidade desce sozinha se o quadro ficar lento. Parado, não
  desenha.
- **Cache:** o navegador guarda os arquivos por alguns minutos. Mudou o `inicio.css` ou o
  `inicio.js`, suba o `?v=` deles no `index.html`.
- **Um ouro só**, o módulo do ápice, além do próprio logo. Paleta, tipografia e matriz são as
  do guia de design da FicusMed.

As fontes são variáveis: um arquivo cobre todos os pesos, e por isso cada `@font-face`
declara faixa (`font-weight: 100 900`), nunca um peso fixo.

## Contato

`contato@ficusmed.com`. TAKAKAZU SERVICOS MEDICOS LTDA, CNPJ 59.926.926/0001-55.

Texto público sem travessão.
