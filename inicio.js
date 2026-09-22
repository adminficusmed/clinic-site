/* clinic.ficusmed.com: o figo em relevo, sob uma luz que segue o cursor.
 *
 * Um shader de tela inteira desenha a parede figueira e, sobre ela, o figo construído
 * como peças de porcelana marfim em relevo: a luz rasante acende o bisel, projeta
 * sombra e faz o brilho do ouro no ápice. O cursor é a lâmpada e inclina de leve o
 * ponto de vista; no celular, o dedo arrasta a luz e, parado, ela passeia devagar.
 *
 * A geometria não mora aqui. As células são lidas do <svg class="figo"> da página, que
 * é a capa oficial FIG. 17 da FicusMed copiada sem mudança, e a posição e a escala vêm
 * da caixa que o CSS deu a ele. Sem WebGL, ou se qualquer coisa falhar, esse SVG fica
 * no lugar e a página continua inteira.
 */
(function () {
  'use strict';

  var raiz = document.documentElement;
  var canvas = document.querySelector('canvas.relevo');
  var figo = document.querySelector('svg.figo');
  if (!canvas || !figo) return;

  function semRelevo() {
    raiz.classList.remove('vivo');
    raiz.classList.add('sem-relevo');
  }

  var gl = null;
  try {
    // Sem powerPreference: 'high-performance' ligaria a GPU dedicada de um MacBook de duas
    // GPUs para desenhar uma parede, e a bateria pagaria.
    var opcoes = { alpha: false, antialias: false, depth: false, stencil: false,
      premultipliedAlpha: false, preserveDrawingBuffer: false };
    gl = canvas.getContext('webgl', opcoes) || canvas.getContext('experimental-webgl', opcoes);
  } catch (e) { gl = null; }
  if (!gl) { semRelevo(); return; }

  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)');
  var semCursor = window.matchMedia('(hover: none)');

  // ------------------------------------------------------------ a matriz, lida do SVG
  // Célula 11×11, raio 2,75, passo 13,6; colunas a partir de x 53,7 e linhas a partir
  // de y 50,6 (o ápice). O ouro é tratado à parte, porque ele chega girado.
  var X0 = 53.7, Y0 = 50.6, PASSO = 13.6, COLS = 7, LINHAS = 10;
  var celulas = new Uint8Array(COLS * LINHAS * 4);
  var apice = { x: 100, y: 56.1 };
  var ret = figo.querySelectorAll('rect');
  for (var i = 0; i < ret.length; i++) {
    var r = ret[i];
    var x = parseFloat(r.getAttribute('x')), y = parseFloat(r.getAttribute('y'));
    if (r.getAttribute('class') === 'ouro') { apice = { x: x + 5.5, y: y + 5.5 }; continue; }
    var c = Math.round((x - X0) / PASSO), l = Math.round((y - Y0) / PASSO);
    if (c < 0 || c >= COLS || l < 0 || l >= LINHAS) continue;
    var m = /rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/.exec(r.getAttribute('fill') || '');
    var luz = m ? parseFloat(m[4]) : 0.7;
    var bege = m && +m[1] === 244;
    // Sobe da base para o ápice, o centro um pouco antes das bordas.
    var atraso = 0.35 + (LINHAS - 1 - l) * 0.085 + Math.abs(c - 3) * 0.035 + ((c * 7 + l * 3) % 5) * 0.008;
    var k = (l * COLS + c) * 4;
    celulas[k] = 255;
    celulas[k + 1] = Math.round(luz * 255);
    celulas[k + 2] = bege ? 255 : 0;
    celulas[k + 3] = Math.min(255, Math.round(atraso * 100));
  }

  // ------------------------------------------------------------ a silhueta-guia
  // Distância com sinal até o contorno do figo, numa textura de 2 texels por unidade.
  // É o traço fino de 0,5 da capa oficial, que no relevo vira um sulco que pega luz.
  var SIL = { x: 40, y: 28, w: 120, h: 166, res: 2, faixa: 8 };
  function silhueta() {
    var curvas = [
      [100, 36, 134, 66, 152, 94, 152, 126],
      [152, 126, 152, 159, 128, 186, 100, 186],
      [100, 186, 72, 186, 48, 159, 48, 126],
      [48, 126, 48, 94, 66, 66, 100, 36]
    ];
    var pts = [];
    for (var a = 0; a < curvas.length; a++) {
      var q = curvas[a];
      for (var s = 0; s < 24; s++) {
        var t = s / 24, u = 1 - t;
        pts.push([
          u * u * u * q[0] + 3 * u * u * t * q[2] + 3 * u * t * t * q[4] + t * t * t * q[6],
          u * u * u * q[1] + 3 * u * u * t * q[3] + 3 * u * t * t * q[5] + t * t * t * q[7]
        ]);
      }
    }
    var n = pts.length;
    var W = SIL.w * SIL.res, H = SIL.h * SIL.res;
    var dados = new Uint8Array(W * H);
    for (var py = 0; py < H; py++) {
      var yy = SIL.y + (py + 0.5) / SIL.res;
      for (var px = 0; px < W; px++) {
        var xx = SIL.x + (px + 0.5) / SIL.res;
        var d2 = 1e9, dentro = false;
        for (var j = 0, k2 = n - 1; j < n; k2 = j++) {
          var ax = pts[k2][0], ay = pts[k2][1], bx = pts[j][0], by = pts[j][1];
          var ex = bx - ax, ey = by - ay, wx = xx - ax, wy = yy - ay;
          var h = (wx * ex + wy * ey) / (ex * ex + ey * ey);
          h = h < 0 ? 0 : h > 1 ? 1 : h;
          var dx = wx - ex * h, dy = wy - ey * h, dd = dx * dx + dy * dy;
          if (dd < d2) d2 = dd;
          if ((ay > yy) !== (by > yy) && xx < ax + (yy - ay) * ex / ey) dentro = !dentro;
        }
        var sd = Math.sqrt(d2) * (dentro ? -1 : 1);
        var v = 0.5 + 0.5 * Math.max(-1, Math.min(1, sd / SIL.faixa));
        dados[py * W + px] = Math.round(v * 255);
      }
    }
    return { W: W, H: H, dados: dados };
  }

  // ------------------------------------------------------------ o shader
  var VERT = 'attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);}';
  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'uniform vec2 uRes;uniform vec2 uOrig;uniform float uEsc;uniform float uDpr;',
    'uniform vec3 uLuz;uniform float uLuzI;uniform vec2 uTilt;uniform float uT;',
    'uniform vec4 uOuro;uniform vec2 uGiro;uniform float uGrade;uniform float uGuia;uniform vec4 uCaixa;',
    'uniform sampler2D uCel;uniform sampler2D uSil;',
    'const float X0=53.7;const float Y0=50.6;const float PASSO=13.6;',
    'const float MEIO=5.5;const float RAIO=2.75;const float ALT=2.8;',
    'const float BISEL=2.1;const float SUBIDA=0.95;',
    'vec3 lin(vec3 c){return pow(c,vec3(2.2));}',
    'float caixa(vec2 l){vec2 q=abs(l)-vec2(MEIO-RAIO);',
    '  return length(max(q,0.0))+min(max(q.x,q.y),0.0)-RAIO;}',
    // Perfil de quarto de círculo: a borda da peça é arredondada como porcelana.
    'float perfil(float d){float t=clamp(-d/BISEL,0.0,1.0);float u=1.0-t;',
    '  return sqrt(max(1.0-u*u,0.0));}',
    'float subida(float a){float x=clamp((uT-a)/SUBIDA,0.0,1.0);',
    '  return 1.0-pow(1.0-x,3.0);}',
    'vec4 cel(vec2 cr){return texture2D(uCel,(cr+0.5)/vec2(7.0,10.0));}',
    'bool fora(vec2 cr){return cr.x<0.0||cr.y<0.0||cr.x>6.0||cr.y>9.0;}',
    'float alturaGrade(vec2 p){',
    '  vec2 cr=floor((p-vec2(X0,Y0))/PASSO);',
    '  if(fora(cr))return 0.0;',
    '  vec4 i=cel(cr);if(i.r<0.5)return 0.0;',
    '  vec2 l=p-(vec2(X0,Y0)+cr*PASSO+MEIO);',
    '  return ALT*subida(i.a*2.55)*perfil(caixa(l));}',
    'vec2 localOuro(vec2 p){vec2 d=p-uOuro.xy;',
    '  return vec2(uGiro.x*d.x+uGiro.y*d.y,-uGiro.y*d.x+uGiro.x*d.y);}',
    'float alturaOuro(vec2 p){if(uOuro.w<=0.0)return 0.0;',
    '  return ALT*uOuro.w*perfil(caixa(localOuro(p)));}',
    'float altura(vec2 p){return max(alturaGrade(p),alturaOuro(p));}',
    'float hash(vec2 p){vec3 p3=fract(vec3(p.xyx)*0.1031);',
    '  p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}',
    'void main(){',
    '  vec2 frag=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y);',
    '  vec2 s=(frag-uOrig)/uEsc;',
    '  bool perto=s.x>uCaixa.x&&s.x<uCaixa.z&&s.y>uCaixa.y&&s.y<uCaixa.w;',
    '  float zTopo=ALT+0.02;',
    '  vec2 p=s;float z=0.0;',
    // O ponto de vista inclinado: marcha do raio pelo campo de alturas.
    '  if(perto){',
    '    float zA=zTopo;float hA=altura(s-zTopo*uTilt);',
    '    for(int i=1;i<=22;i++){',
    '      float zi=zTopo*(1.0-float(i)/22.0);',
    '      float hi=altura(s-zi*uTilt);',
    '      if(hi>=zi){float a=(zA-hA)/max((zA-hA)-(zi-hi),1e-4);',
    '        z=mix(zA,zi,clamp(a,0.0,1.0));p=s-z*uTilt;break;}',
    '      zA=zi;hA=hi;}',
    '  }',
    '  vec3 N=vec3(0.0,0.0,1.0);',
    '  float hg=0.0,ho=0.0;vec4 info=vec4(0.0);',
    '  if(perto){',
    '    float e=0.11;',
    '    float hx=altura(p+vec2(e,0.0))-altura(p-vec2(e,0.0));',
    '    float hy=altura(p+vec2(0.0,e))-altura(p-vec2(0.0,e));',
    '    N=normalize(vec3(-hx/(2.0*e),-hy/(2.0*e),1.0));',
    '    hg=alturaGrade(p);ho=alturaOuro(p);',
    '    vec2 cr=floor((p-vec2(X0,Y0))/PASSO);',
    '    if(!fora(cr))info=cel(cr);',
    '  }',
    '  vec3 pos=vec3(p,z);',
    '  vec3 Lv=uLuz-pos;float dist=length(Lv);vec3 L=Lv/dist;',
    // Duas luzes: a chave é a lâmpada do cursor, com sombra; o preenchimento vem de
    // cima e da frente, fixo, para a porcelana nunca virar cinza longe do cursor.
    '  float atn=uLuzI/(1.0+pow(dist/230.0,2.0));',
    '  float dif=max(dot(N,L),0.0);',
    '  float fill=max(dot(N,normalize(vec3(0.0,-0.35,1.0))),0.0)*uLuzI;',
    // Sombra suave, marchando do ponto até a luz.
    '  float sombra=1.0;',
    '  if(perto&&dif>0.0){',
    '    vec3 ro=pos+N*0.04;',
    '    float tMax=(zTopo-ro.z)/max(L.z,0.06);',
    '    if(tMax>0.0){',
    '      float passo=tMax/18.0;float t=passo*0.5;',
    '      for(int j=0;j<18;j++){',
    '        vec3 q=ro+L*t;float h=altura(q.xy);',
    '        float w=0.07*t+0.18;',
    '        sombra=min(sombra,smoothstep(-w,w,q.z-h));',
    '        t+=passo;}',
    '    }',
    '  }',
    // Oclusão no pé das peças: a parede escurece rente à base.
    '  float ao=1.0;',
    '  if(perto&&z<0.05){',
    '    vec2 g=floor((p-vec2(X0,Y0))/PASSO);float dm=99.0;',
    '    for(int dy=-1;dy<=1;dy++){for(int dx=-1;dx<=1;dx++){',
    '      vec2 cr=g+vec2(float(dx),float(dy));',
    '      if(fora(cr))continue;vec4 i2=cel(cr);if(i2.r<0.5)continue;',
    '      vec2 l=p-(vec2(X0,Y0)+cr*PASSO+MEIO);',
    '      dm=min(dm,caixa(l)+(1.0-subida(i2.a*2.55))*8.0);}}',
    '    if(uOuro.w>0.0)dm=min(dm,caixa(localOuro(p))+(1.0-uOuro.w)*8.0);',
    '    ao=mix(0.78,1.0,smoothstep(0.0,2.4,dm));',
    '  }',
    '  vec3 V=normalize(vec3(-uTilt,1.0));vec3 Hh=normalize(L+V);',
    '  float nh=max(dot(N,Hh),0.0);',
    // A parede: figueira com o brilho da capa oficial atrás do figo; onde a lâmpada
    // bate, ela acende para o esmeralda profundo, e a sombra das peças escurece.
    '  vec3 figueira=lin(vec3(0.0706,0.1412,0.1020));',
    '  vec3 acesa=lin(vec3(0.0902,0.1725,0.1294));',
    '  vec3 esmeralda=lin(vec3(0.0510,0.2902,0.2118));',
    '  vec3 marfim=lin(vec3(0.9843,0.9725,0.9451));',
    '  float halo=1.0-smoothstep(10.0,150.0,length((p-vec2(100.0,111.0))*vec2(1.0,0.82)));',
    '  float atnP=uLuzI/(1.0+pow(dist/105.0,2.0));',
    '  vec2 cel2=floor(frag/uDpr);',
    '  vec3 Nw=normalize(vec3((hash(cel2)-0.5)*0.5,(hash(cel2+17.3)-0.5)*0.5,1.0));',
    '  float luzParede=atnP*max(dot(Nw,L),0.0);',
    '  vec3 parede=mix(figueira,acesa,halo*uLuzI)+esmeralda*0.36*luzParede*sombra;',
    '  parede*=ao*mix(1.0-0.45*uLuzI,1.0,sombra);',
    // A grade-guia de 90px e o contorno do figo, finos, mais visíveis sob a luz.
    '  vec2 gq=(frag-uRes*0.5)/(uGrade*uEsc);',
    '  vec2 gd=abs(fract(gq+0.5)-0.5)*uGrade*uEsc;',
    '  float linha=1.0-smoothstep(uDpr*0.5,uDpr*0.5+1.0,min(gd.x,gd.y));',
    '  parede=mix(parede,marfim,linha*(0.0012+0.006*luzParede));',
    '  if(perto){',
    '    vec2 uv=(p-vec2(40.0,28.0))/vec2(120.0,166.0);',
    '    float sd=(texture2D(uSil,uv).r-0.5)*16.0;',
    '    float px=1.0/uEsc;',
    '    float guia=1.0-smoothstep(0.25-px*0.6,0.25+px*0.6,abs(sd));',
    '    parede=mix(parede,marfim,guia*uGuia*(0.012+0.05*luzParede));',
    '  }',
    // As peças: porcelana marfim, com as quatro luzes da capa oficial guardadas como
    // variação de tom; e o ouro, metálico, no ápice.
    '  vec3 cor=parede;',
    '  if(perto&&z>0.0){',
    '    vec3 base=info.b>0.5?lin(vec3(0.9569,0.9373,0.8941)):marfim;',
    '    vec3 alb=mix(figueira,base,0.6+0.4*info.g);',
    '    float chave=dif*atn*sombra;',
    '    vec3 peca=alb*(0.08+0.50*fill+0.72*chave)+marfim*pow(nh,36.0)*0.16*atn*sombra;',
    '    if(ho>hg){',
    '      vec3 ouro=lin(vec3(0.7765,0.6471,0.3765));',
    '      peca=ouro*(0.30+0.42*fill+0.66*chave)',
    '        +mix(ouro,marfim,0.35)*pow(nh,60.0)*0.8*atn*sombra',
    '        +marfim*pow(nh,220.0)*0.3*atn*sombra;',
    '    }',
    '    cor=mix(parede,peca,smoothstep(0.0,0.32,z));',
    '  }',
    '  cor=pow(max(cor,0.0),vec3(1.0/2.2));',
    '  cor+=(hash(gl_FragCoord.xy)-0.5)*(2.2/255.0);',
    '  gl_FragColor=vec4(cor,1.0);',
    '}'
  ].join('\n');

  // ------------------------------------------------------------ o programa
  // A compilação pode levar segundos no Windows (ANGLE sobre D3D desenrola os laços).
  // Com KHR_parallel_shader_compile ela corre fora da thread da página, e enquanto isso o
  // figo plano continua na tela; sem a extensão, o link bloqueia como sempre bloqueou.
  var paralelo = gl.getExtension('KHR_parallel_shader_compile');
  function shader(tipo, fonte) {
    var sh = gl.createShader(tipo);
    gl.shaderSource(sh, fonte);
    gl.compileShader(sh);
    return sh;
  }
  var vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, 'aPos');
  gl.linkProgram(prog);

  function espera() {
    if (paralelo && !gl.getProgramParameter(prog, paralelo.COMPLETION_STATUS_KHR)) {
      requestAnimationFrame(espera);
      return;
    }
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      if (window.console) {
        console.warn('relevo:', gl.getShaderInfoLog(vs), gl.getShaderInfoLog(fs), gl.getProgramInfoLog(prog));
      }
      semRelevo();
      return;
    }
    inicia();
  }
  requestAnimationFrame(espera);

  var U = {};
  function textura(unidade, w, h, formato, dados, filtro) {
    var tx = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unidade);
    gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, formato, w, h, 0, formato, gl.UNSIGNED_BYTE, dados);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtro);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtro);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tx;
  }

  // ------------------------------------------------------------ medida
  // Até ~3,5 milhões de pixels de desenho: um monitor 5K não precisa de 14 milhões para
  // uma parede lisa, e o celular agradece. A qualidade ainda desce sozinha se o quadro
  // ficar lento de verdade.
  var TETO_PIXELS = 3.5e6;
  var qualidade = 1;
  var tela = { w: 0, h: 0, dpr: 1, esc: 1, ox: 0, oy: 0 };

  // Redimensionar o canvas apaga o que está nele. Por isso quem chama mede() desenha no
  // mesmo quadro, antes de o navegador compor: senão sai um quadro preto.
  function mede() {
    // A caixa do canvas, e não innerWidth: com barra de rolagem clássica, innerWidth
    // inclui a barra, e o relevo sairia comprimido e deslocado.
    var w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    dpr = Math.min(dpr, Math.sqrt(TETO_PIXELS / (w * h))) * qualidade;
    dpr = Math.max(dpr, 0.5);
    var W = Math.round(w * dpr), H = Math.round(h * dpr);
    var mudou = canvas.width !== W || canvas.height !== H;
    if (mudou) { canvas.width = W; canvas.height = H; }
    var b = figo.getBoundingClientRect();
    var esc = b.width / 116;                       // viewBox 42 30 116 160
    tela.w = w; tela.h = h; tela.dpr = W / w;
    tela.esc = esc;
    tela.ox = b.left - 42 * esc;
    tela.oy = b.top - 30 * esc;
    gl.viewport(0, 0, W, H);
    // Página que rola (tela baixa, zoom) devolve a rolagem de um dedo ao palco.
    var rola = document.documentElement.scrollHeight > document.documentElement.clientHeight + 1 ||
      (window.visualViewport && window.visualViewport.scale > 1.01);
    raiz.classList.toggle('rola', !!rola);
    return mudou;
  }

  // ------------------------------------------------------------ a luz
  // Sem cursor, a luz fica acima e à esquerda do figo, e a sombra das peças cai para a
  // direita e para baixo.
  var REPOUSO = { x: 64, y: 58, z: 64 };
  var luz = { x: REPOUSO.x, y: REPOUSO.y, z: REPOUSO.z };
  var alvo = { x: REPOUSO.x, y: REPOUSO.y, z: REPOUSO.z };
  var tilt = { x: 0, y: 0 }, alvoTilt = { x: 0, y: 0 };
  var INCLINA = 0.5;
  var ultimoGesto = -1e9, voltaPasseio = 0;
  // O passeio é de tela de toque sem ninguém tocando: um mouse (tablet com mouse, Surface)
  // segura a luz onde está, e um dedo encostado também.
  var tipo = null, dedo = false;

  function mundo(cx, cy) {
    return { x: (cx - tela.ox) / tela.esc, y: (cy - tela.oy) / tela.esc };
  }
  function aponta(cx, cy, tipoP) {
    tipo = tipoP || 'mouse';
    var p = mundo(cx, cy);
    alvo.x = p.x; alvo.y = p.y; alvo.z = 46;
    if (!reduz.matches) {
      var b = figo.getBoundingClientRect();
      var mx = b.left + b.width / 2, my = b.top + b.height / 2;
      var nx = (cx - mx) / Math.max(tela.w / 2, 1), ny = (cy - my) / Math.max(tela.h / 2, 1);
      nx = Math.max(-1.2, Math.min(1.2, nx)); ny = Math.max(-1.2, Math.min(1.2, ny));
      alvoTilt.x = -nx * INCLINA; alvoTilt.y = -ny * INCLINA;
    }
    ultimoGesto = performance.now();
    if (tipo !== 'mouse') armaPasseio();
    acorda();
  }
  // Parado o dedo, o laço dorme quando a luz chega; quem o acorda para o passeio é isto.
  function armaPasseio() {
    clearTimeout(voltaPasseio);
    if (semCursor.matches && !dedo) voltaPasseio = setTimeout(acorda, PAUSA_TOQUE + 50);
  }
  function solta(e) {
    if (e.pointerType === 'mouse') return;
    dedo = false; ultimoGesto = performance.now(); armaPasseio();
  }
  function repousa() {
    alvo.x = REPOUSO.x; alvo.y = REPOUSO.y; alvo.z = REPOUSO.z;
    alvoTilt.x = 0; alvoTilt.y = 0;
    acorda();
  }

  // ------------------------------------------------------------ a chegada e o passeio
  var t0 = 0;
  var CHEGADA_FIM = 3.3;
  var PAUSA_TOQUE = 3000;       // o passeio volta 3 s depois do último toque
  var PASSEIO_MAX = 60000;      // e dorme depois de 1 min sem toque, para poupar bateria
  function suave(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return 1 - Math.pow(1 - x, 3); }
  function passeia(agora) {
    if (!semCursor.matches || reduz.matches || tipo === 'mouse' || dedo) return false;
    var desde = Math.max(ultimoGesto, t0);
    if (agora - ultimoGesto < PAUSA_TOQUE) return false;
    if (agora - desde > PASSEIO_MAX) {
      alvo.x = REPOUSO.x; alvo.y = REPOUSO.y; alvo.z = REPOUSO.z;
      alvoTilt.x = 0; alvoTilt.y = 0;
      return false;
    }
    var t = agora / 1000;
    alvo.x = REPOUSO.x + Math.sin(t * 0.31) * 30;
    alvo.y = REPOUSO.y + Math.sin(t * 0.23 + 1.3) * 26;
    alvo.z = 60;
    alvoTilt.x = -Math.sin(t * 0.31) * INCLINA * 0.35;
    alvoTilt.y = -Math.sin(t * 0.23 + 1.3) * INCLINA * 0.3;
    return true;
  }

  // ------------------------------------------------------------ o quadro
  var raf = 0, anterior = 0, ultimoDesenho = 0, continuo = false, aceso = false;
  var lentos = 0, medidos = 0;
  var pronto = false, perdido = false;

  function quadro(agora, forca) {
    raf = 0;
    var intervalo = anterior ? agora - anterior : 0;
    var dt = anterior ? Math.min(intervalo / 1000, 0.1) : 1 / 60;
    anterior = agora;
    var tI = reduz.matches ? 99 : (agora - t0) / 1000;
    var passeando = passeia(agora);

    var kL = 1 - Math.exp(-dt * 5.2), kT = 1 - Math.exp(-dt * 3.2);
    luz.x += (alvo.x - luz.x) * kL; luz.y += (alvo.y - luz.y) * kL; luz.z += (alvo.z - luz.z) * kL;
    tilt.x += (alvoTilt.x - tilt.x) * kT; tilt.y += (alvoTilt.y - tilt.y) * kT;

    var mexendo = Math.abs(alvo.x - luz.x) + Math.abs(alvo.y - luz.y) + Math.abs(alvo.z - luz.z) > 0.02 ||
      Math.abs(alvoTilt.x - tilt.x) + Math.abs(alvoTilt.y - tilt.y) > 0.0005;
    var segue = tI < CHEGADA_FIM || mexendo || passeando;

    // Lento de verdade é abaixo de ~24 quadros por segundo, medido entre duas chamadas
    // seguidas do laço, pulem elas o desenho ou não: um monitor de 30 Hz, uma taxa de
    // atualização esquisita ou o passeio a 30 qps não contam. Baixar a qualidade
    // redimensiona o canvas e o apaga, e por isso quem baixa desenha neste mesmo quadro.
    // Resize e scroll só marcam; a medida acontece aqui, antes do desenho, no mesmo quadro.
    var apagou = false;
    if (precisaMedir) { precisaMedir = false; apagou = mede(); }
    var baixou = false;
    if (continuo && intervalo && tI > CHEGADA_FIM && qualidade > 0.55) {
      medidos++;
      if (intervalo > 42) lentos++;
      if (medidos >= 60) {
        if (lentos > 30) { qualidade *= 0.78; mede(); baixou = true; }
        medidos = 0; lentos = 0;
      }
    }
    continuo = segue;

    // No passeio, 30 quadros por segundo bastam e poupam a bateria. Não pula quem acabou
    // de apagar o canvas (forca, baixou): pular aí é o quadro preto.
    if (!forca && !baixou && !apagou && passeando && tI > CHEGADA_FIM && agora - ultimoDesenho < 31) {
      raf = requestAnimationFrame(quadro);
      return;
    }
    ultimoDesenho = agora;

    // A luz acende em 1,6 s; as peças sobem da base ao ápice; o ouro chega por último,
    // solto e girado 12°, e assenta no ápice.
    var luzI = reduz.matches ? 1 : suave((tI - 0.05) / 1.6);
    var u = reduz.matches ? 1 : suave((tI - 1.55) / 1.05);
    var presenca = reduz.matches ? 1 : Math.min(1, Math.max(0, (tI - 1.55) / 0.35));
    var ox = apice.x + 17 * (1 - u), oy = apice.y - 12 * (1 - u);
    var giro = 0.21 * (1 - u);
    var guia = reduz.matches ? 1 : suave((tI - 0.3) / 1.4);

    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform2f(U.uOrig, tela.ox * tela.dpr, tela.oy * tela.dpr);
    gl.uniform1f(U.uEsc, tela.esc * tela.dpr);
    gl.uniform1f(U.uDpr, tela.dpr);
    gl.uniform3f(U.uLuz, luz.x, luz.y, luz.z);
    gl.uniform1f(U.uLuzI, luzI);
    gl.uniform2f(U.uTilt, tilt.x, tilt.y);
    gl.uniform1f(U.uT, tI);
    gl.uniform4f(U.uOuro, ox, oy, giro, presenca);
    gl.uniform2f(U.uGiro, Math.cos(giro), Math.sin(giro));
    gl.uniform1f(U.uGrade, 90 / tela.esc);
    gl.uniform1f(U.uGuia, guia);
    // A região cara do shader (relevo, sombra) cobre o figo e o alcance da sombra, que
    // cresce quando a lâmpada está longe e baixa. Fora dela, só parede.
    var dh = Math.hypot(luz.x - 100, luz.y - 117) + 60;
    var alcance = Math.min(90, 2.8 * dh / Math.max(luz.z, 20)) + 8;
    gl.uniform4f(U.uCaixa, 48 - alcance, 44 - alcance, 152 + alcance, 190 + alcance);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (!aceso) { aceso = true; raiz.classList.add('vivo'); }

    if (segue) raf = requestAnimationFrame(quadro);
    else anterior = 0;
  }
  function acorda() { if (pronto && !raf && !perdido) raf = requestAnimationFrame(quadro); }
  // Desenha já, no quadro corrente: é o que se usa logo depois de mede().
  function desenhaJa() {
    if (!pronto || perdido) return;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    quadro(performance.now(), true);
  }

  // ------------------------------------------------------------ ciclo de vida
  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault(); perdido = true;
    if (raf) cancelAnimationFrame(raf); raf = 0;
    semRelevo();
  });

  // Redimensionar o canvas o apaga. Se isso acontecesse fora do quadro, depois de ele já
  // ter desenhado, sairia um quadro preto ou um desenho em dobro; então resize e scroll só
  // marcam, e o próprio quadro mede antes de desenhar.
  var precisaMedir = false;
  function remede() {
    precisaMedir = true;
    acorda();
  }

  function inicia() {
    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    textura(0, COLS, LINHAS, gl.RGBA, celulas, gl.NEAREST);
    var sil = silhueta();
    textura(1, sil.W, sil.H, gl.LUMINANCE, sil.dados, gl.LINEAR);

    ['uRes', 'uOrig', 'uEsc', 'uDpr', 'uLuz', 'uLuzI', 'uTilt', 'uT', 'uOuro', 'uGiro', 'uGrade',
     'uGuia', 'uCaixa', 'uCel', 'uSil'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    gl.uniform1i(U.uCel, 0);
    gl.uniform1i(U.uSil, 1);

    window.addEventListener('pointermove', function (e) { aponta(e.clientX, e.clientY, e.pointerType); }, { passive: true });
    window.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') dedo = true;
      aponta(e.clientX, e.clientY, e.pointerType);
    }, { passive: true });
    window.addEventListener('pointerup', solta, { passive: true });
    window.addEventListener('pointercancel', solta, { passive: true });
    window.addEventListener('mouseout', function (e) { if (!e.relatedTarget) repousa(); });
    window.addEventListener('blur', repousa);
    window.addEventListener('resize', remede);
    window.addEventListener('scroll', remede, { passive: true });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', remede);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remede);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) { anterior = 0; continuo = false; acorda(); }
    });
    function aoMudar(mq, fn) {
      if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn);
    }
    aoMudar(reduz, function () { tilt.x = tilt.y = alvoTilt.x = alvoTilt.y = 0; acorda(); });
    aoMudar(semCursor, acorda);

    pronto = true;
    t0 = performance.now();
    // Compilação lenta: o figo plano já apareceu (0,9 s no CSS). Refazer a chegada seria
    // mostrá-lo, apagá-lo e reconstruí-lo; o relevo entra pronto, cruzando com ele.
    if (t0 > 800) t0 -= CHEGADA_FIM * 1000;
    mede();
    desenhaJa();
  }
})();
