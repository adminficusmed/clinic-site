# clinic.ficusmed.com

Site público do **Clinic**, o sistema editorial interno. Existe por um motivo concreto: o
Google exige página inicial, política de privacidade e termos públicos, num domínio
autorizado e verificado, para que um app OAuth saia do status "Testando" — e é o status
"Testando" que faz o token de atualização do Google Drive expirar a cada 7 dias.

Três páginas estáticas, sem build, sem dependência. Publicado por GitHub Pages no domínio
`clinic.ficusmed.com`.

- `index.html` — o que o Clinic é e o que ele faz com o Drive
- `privacidade.html` — política de privacidade (obrigatória para a verificação do Google)
- `termos.html` — termos de serviço
- `CNAME` — domínio personalizado do GitHub Pages

O conteúdo descreve o comportamento real do sistema. Se o Clinic mudar o que faz com o
Drive — outro escopo, outro destino, outro terceiro recebendo dado — **esta política muda
junto**, senão ela vira mentira publicada.
