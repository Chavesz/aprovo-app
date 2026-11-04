// Movimento da landing /aprovo: carrega GSAP, ScrollTrigger e Lenis só depois da página pronta,
// e só para quem não pediu movimento reduzido. Sem JS (ou com movimento reduzido) a página fica completa e parada.
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var CDN = '/js/vendor/';
  function js(src) {
    return new Promise(function (ok, erro) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = erro; document.head.appendChild(s); });
  }
  function iniciar() {
    Promise.all([js(CDN + 'gsap.min.js'), js('/js/vendor/lenis.min.js')])
      .then(function () { return js(CDN + 'ScrollTrigger.min.js'); })
      .then(animar)
      .catch(function () { /* sem rede para o CDN: a página segue parada e completa */ });
    if (matchMedia('(min-width: 880px)').matches) js('/js/vendor/three.min.js').then(fundo).catch(function () {});
  }
  function animar() {
    var gsap = window.gsap; gsap.registerPlugin(window.ScrollTrigger);
    var lenis = new window.Lenis({ duration: 1.1, anchors: true });
    lenis.on('scroll', window.ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    gsap.context(function () {
      // Abertura do hero: curta, uma vez.
      gsap.timeline({ defaults: { ease: 'power4.out', duration: 0.9 } })
        .from('.hero .kicker, .hero h1, .hero .lead, .hero .cta, .hero .sec, .hero .selo', { y: 28, opacity: 0, stagger: 0.09 })
        .from('.demo', { y: 40, opacity: 0, duration: 1 }, '-=0.7')
        .from('.demo .alt, .demo .mentor-bal', { x: -16, opacity: 0, stagger: 0.12 }, '-=0.5');
      // O grifo "pinta" a frase.
      gsap.from('.grifo', { backgroundSize: '0% 100%', duration: 1, ease: 'power2.out', delay: 0.5 });
      // Seções entram ao rolar, uma vez.
      gsap.utils.toArray('section').forEach(function (s) {
        gsap.from(s.querySelectorAll('.kicker, h2, .numeros > div, .passos li, .caixa, .plano, .chat p, .check li, details, .bancas span'), {
          y: 32, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06,
          scrollTrigger: { trigger: s, start: 'top 82%', once: true }
        });
      });
      // Números contam até o valor real.
      gsap.utils.toArray('.numeros strong').forEach(function (el) {
        var alvo = parseInt(el.textContent.replace(/\D/g, ''), 10); if (!alvo) return;
        var o = { v: 0 }, fmt = function (n) { return Math.round(n).toLocaleString('pt-BR'); };
        gsap.to(o, { v: alvo, duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true }, onUpdate: function () { el.textContent = fmt(o.v); } });
      });
      // Desktop: o card de exemplo se desloca um pouco com a rolagem do hero.
      gsap.matchMedia().add('(min-width: 880px)', function () {
        gsap.to('.demo', { y: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 } });
      });
    });
    document.fonts && document.fonts.ready.then(function () { window.ScrollTrigger.refresh(); });
    addEventListener('load', function () { window.ScrollTrigger.refresh(); });
  }
  // Three.js: pontinhos "de marca-texto" bem discretos atrás do hero, só no desktop. Para quando a aba some.
  function fundo() {
    var T = window.THREE, hero = document.querySelector('.hero'); if (!T || !hero) return;
    var c = document.createElement('canvas'); c.className = 'hero-fundo'; c.setAttribute('aria-hidden', 'true'); hero.prepend(c);
    var r = new T.WebGLRenderer({ canvas: c, alpha: true, antialias: true }); r.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    var cena = new T.Scene(), cam = new T.PerspectiveCamera(50, 1, 0.1, 100); cam.position.z = 12;
    var n = 70, pos = new Float32Array(n * 3);
    for (var i = 0; i < n * 3; i++) pos[i] = (Math.random() - 0.5) * (i % 3 === 2 ? 6 : 22);
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    var escuro = matchMedia('(prefers-color-scheme: dark)').matches;
    var pts = new T.Points(g, new T.PointsMaterial({ color: escuro ? 0xffd43b : 0x4a2f7a, size: 0.09, transparent: true, opacity: escuro ? 0.5 : 0.35 }));
    cena.add(pts);
    function tam() { var w = hero.offsetWidth, h = hero.offsetHeight; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    tam(); addEventListener('resize', tam);
    var mx = 0, my = 0; addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
    (function loop() {
      if (!document.hidden && hero.getBoundingClientRect().bottom > 0) {
        pts.rotation.y += 0.0008; pts.rotation.x += (my * 0.2 - pts.rotation.x) * 0.03; pts.rotation.z += (mx * 0.1 - pts.rotation.z) * 0.03;
        r.render(cena, cam);
      }
      requestAnimationFrame(loop);
    })();
  }
  if (document.readyState === 'complete') setTimeout(iniciar, 200);
  else addEventListener('load', function () { setTimeout(iniciar, 200); });
})();
