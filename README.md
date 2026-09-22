# clinic.ficusmed.com

Site público da **Ficus Clinic**. Existe também por um motivo de infraestrutura: o Google
exige página inicial, política de privacidade e termos públicos, num domínio autorizado e
verificado, para que o app OAuth do Clinic fique publicado. E é o status "Testando" que faz o
token de atualização do Google Drive expirar a cada 7 dias.

Estático, sem build e sem dependência. Publicado por GitHub Pages no domínio
`clinic.ficusmed.com`.

- `index.html`: a inicial. Só a marca: o figo em relevo, o lockup Ficus Clinic e, no rodapé,
  razão social, CNPJ, contato e os links da política e dos termos
- `inicio.css`, `inicio.js`: o visual e o relevo da inicial, que não servem a mais nada
- `privacidade.html`: política de privacidade (obrigatória para a publicação no Google)
- `termos.html`: termos de serviço
- `estilo.css`: o visual das duas páginas de documento
- `fontes/`, `img/`: fontes e logos copiados do kit da FicusMed, sem alteração, e a imagem
  de compartilhamento `img/ficus-clinic-og.jpg`, gerada da própria inicial
- `CNAME`: domínio personalizado do GitHub Pages

**Os três caminhos não mudam.** A tela de consentimento do Google aponta para `/`,
`/privacidade.html` e `/termos.html`; trocar um nome de arquivo derruba o link dela. E **o
link da política fica no rodapé da inicial**: o Google pede que a página inicial de um app
publicado leve à política de privacidade.

**Se um dia o app for verificado pelo Google, a inicial precisa mudar.** Desde 22/09/2026 ela
não explica nada, por decisão do fundador, e mostra "Ficus Clinic". A verificação pede que a
inicial descreva o que o app faz com os dados e use o mesmo nome da tela de consentimento
("Clinic"). Hoje o app está publicado sem verificação, que não é exigida nem recomendada
(`infra/CONTAS-GOOGLE.md` §7, no workspace), e nada disso vale.

O conteúdo da política e dos termos descreve o comportamento real do sistema. Se o Clinic
mudar o que faz com o Drive (outro escopo, outro destino, outro terceiro recebendo dado),
**a política muda junto**, senão ela vira mentira publicada.

## A inicial

Uma parede figueira e, sobre ela, o figo construído em relevo, como peças de porcelana
marfim; o cursor é a lâmpada. A luz acende o bisel das peças, projeta a sombra delas na
parede e inclina de leve o ponto de vista. Ao abrir, as peças sobem da base ao ápice e o
módulo de ouro chega por último, solto e girado, e assenta no ápice. No celular, o dedo
arrasta a luz e, parada, ela passeia devagar.

- **A geometria mora uma vez só**, no `<svg class="figo">` do `index.html`: as células são
  as da capa oficial FIG. 17 (`capa-02-figueira`) da FicusMed, sem mudança. O `inicio.js`
  lê de lá as células e o tom de cada uma, e tira a posição e a escala da caixa que o CSS
  deu ao SVG. Mexer na composição é mexer no CSS.
- **Sem WebGL, sem JavaScript ou com erro**, esse SVG fica no lugar: o figo completo em
  marfim quatro luzes, como na capa oficial. Com `prefers-reduced-motion`, não há chegada,
  inclinação nem passeio; a luz ainda responde ao cursor.
- **Custo:** o shader desenha até ~3,5 milhões de pixels (um monitor 5K não precisa de
  14 milhões para uma parede), só calcula relevo e sombra na região do figo, e a qualidade
  desce sozinha se o quadro ficar lento. Parado, não desenha. Medido num Apple M4: 60 quadros
  por segundo com o cursor em movimento, a 2366×1479.
- **O lockup** é o da FicusMed com o descritor trocado, como na agenda: símbolo 114, vão 20,
  texto 72, "Ficus" em Archivo 800 e "Clinic" em Archivo 400 ouro. Conferido sobrepondo-o
  ao `horizontal-dark.svg` oficial: o símbolo cai no mesmo pixel.
- **Cache:** o GitHub Pages serve com `max-age=600`, e o navegador guarda. Mudou o
  `inicio.css` ou o `inicio.js`, suba o `?v=` deles no `index.html`.
- **Um ouro só**, o módulo do ápice, além do próprio logo. Paleta, fontes e matriz são as do
  guia de design da FicusMed (`marca/design-guide.md` no workspace dela).

## As páginas de documento

Seguem o mesmo guia: paleta oficial (marfim, figueira, verdes, esmeralda), Archivo nos
títulos, Libre Franklin no corpo, IBM Plex Mono nas microetiquetas, grade-guia de 90px e a
faixa escura na família topográfica. Tema claro e escuro.

As fontes são variáveis: um arquivo cobre todos os pesos, e por isso cada `@font-face`
declara faixa (`font-weight: 100 900`), nunca um peso fixo.

## Contato e empresa

`contato@ficusmed.com`, que chega à caixa da FicusMed pelo roteamento de e-mail da
Cloudflare. A empresa é a TAKAKAZU SERVICOS MEDICOS LTDA, CNPJ 59.926.926/0001-55; os
dados são os do cartão CNPJ na Receita.

Texto sem travessão, por decisão de 21/09/2026.
