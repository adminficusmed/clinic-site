# clinic.ficusmed.com

Site público do **Clinic**, o sistema editorial interno da FicusMed. Existe por um motivo
concreto: o Google exige página inicial, política de privacidade e termos públicos, num
domínio autorizado e verificado, para que um app OAuth saia do status "Testando". E é o
status "Testando" que faz o token de atualização do Google Drive expirar a cada 7 dias.

Estático, sem build e sem dependência. Publicado por GitHub Pages no domínio
`clinic.ficusmed.com`.

- `index.html`: o que o Clinic é, o que ele faz com o Drive, e quem responde por ele
- `privacidade.html`: política de privacidade (obrigatória para a verificação do Google)
- `termos.html`: termos de serviço
- `estilo.css`: o visual, pela régua do guia de design da FicusMed
- `fontes/`, `img/`: fontes e logos copiados do kit da FicusMed, sem alteração
- `CNAME`: domínio personalizado do GitHub Pages

**Os três caminhos não mudam.** A tela de consentimento do Google aponta para `/`,
`/privacidade.html` e `/termos.html`; trocar um nome de arquivo derruba o link dela.

O conteúdo descreve o comportamento real do sistema. Se o Clinic mudar o que faz com o
Drive (outro escopo, outro destino, outro terceiro recebendo dado), **esta política muda
junto**, senão ela vira mentira publicada.

## O visual

Segue `marca/design-guide.md` do workspace da FicusMed: paleta oficial (marfim, figueira,
verdes, esmeralda), Archivo nos títulos, Libre Franklin no corpo, Newsreader na abertura,
IBM Plex Mono nas microetiquetas. Os efeitos de fundo são os do ficusmed.com: grade-guia
de 90px com máscara radial, brilho radial atrás do figo, e a faixa escura na família
topográfica. O figo em construção usa a matriz oficial e a composição da capa marfim; o
ouro aparece num ponto só, o módulo que chega. Tema escuro segue a família figueira.
Movimento some com `prefers-reduced-motion`.

As fontes são variáveis: um arquivo cobre todos os pesos, e por isso cada `@font-face`
declara faixa (`font-weight: 100 900`), nunca um peso fixo.

## Contato e empresa

`contato@ficusmed.com`, que chega à caixa da FicusMed pelo roteamento de e-mail da
Cloudflare. A empresa é a TAKAKAZU SERVICOS MEDICOS LTDA, CNPJ 59.926.926/0001-55; os
dados são os do cartão CNPJ na Receita.

Texto sem travessão, por decisão de 21/09/2026.
