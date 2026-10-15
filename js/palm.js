/* نواة — «من نواة إلى نخلة»: the palm grows one part per session as you scroll (GSAP + ScrollTrigger, Lenis on desktop) */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var PARTS = ['النواة', 'الجذور', 'السعف', 'حلقات الجذع', 'الفسائل', 'التمر'];
  var AR = ['١', '٢', '٣', '٤', '٥', '٦'];
  var ghostL = document.getElementById('ghost'), liveL = document.getElementById('live');
  if (!ghostL || !liveL) return;
  var panels = Array.prototype.slice.call(document.querySelectorAll('#panels .panel'));
  var status = document.getElementById('status');

  // ---------- drawing ----------
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function f1(n) { return n.toFixed(1); }
  function stroke(parent, d, w) { return el('path', { d: d, 'stroke-width': w, pathLength: 1 }, parent); }

  var FRONDS = [[-96, 118, 6], [-138, 150, 42], [-44, 150, 42], [178, 168, 74], [2, 168, 74], [150, 140, 62], [30, 140, 62]];
  function frond(g, C, deg, L, arch, s) {
    var a = deg * Math.PI / 180;
    var E = [C.x + L * Math.cos(a), C.y + L * Math.sin(a)];
    var Q = [C.x + 0.5 * L * Math.cos(a), C.y + 0.5 * L * Math.sin(a) - arch];
    stroke(g, 'M' + f1(C.x) + ' ' + f1(C.y) + 'Q' + f1(Q[0]) + ' ' + f1(Q[1]) + ' ' + f1(E[0]) + ' ' + f1(E[1]), 5 * s);
    for (var t = 0.2; t < 0.97; t += 0.085) {
      var u = 1 - t;
      var bx = u * u * C.x + 2 * u * t * Q[0] + t * t * E[0];
      var by = u * u * C.y + 2 * u * t * Q[1] + t * t * E[1];
      var tx = 2 * u * (Q[0] - C.x) + 2 * t * (E[0] - Q[0]);
      var ty = 2 * u * (Q[1] - C.y) + 2 * t * (E[1] - Q[1]);
      var m = Math.hypot(tx, ty); tx /= m; ty /= m;
      var len = 24 * s * (1 - 0.55 * t);
      [1, -1].forEach(function (side) {
        var ang = side * 1.05;
        var lx = tx * Math.cos(ang) - ty * Math.sin(ang);
        var ly = tx * Math.sin(ang) + ty * Math.cos(ang);
        stroke(g, 'M' + f1(bx) + ' ' + f1(by) + 'L' + f1(bx + lx * len) + ' ' + f1(by + ly * len), 3 * s);
      });
    }
  }
  function crown(g, C, s) { FRONDS.forEach(function (f) { frond(g, C, f[0], f[1] * s, f[2] * s, s); }); }
  function trunk(g, base, rings, s) {
    var x = base.x, y = base.y;
    for (var i = 0; i < rings; i++) {
      y = base.y - (10 + i * 26) * s;
      x = base.x + i * i * 0.32 * s;
      var w = 17 * s;
      stroke(g, 'M' + f1(x - w) + ' ' + f1(y + 3 * s) + 'Q' + f1(x) + ' ' + f1(y - 7 * s) + ' ' + f1(x + w) + ' ' + f1(y + 3 * s), 18 * s);
    }
    return { x: x, y: y - 12 * s };
  }
  // the offshoots reuse this same function at a smaller scale
  function palm(gT, gC, base, rings, s) { var C = trunk(gT, base, rings, s); crown(gC, C, s); return C; }

  var GROUND = 432;
  function render(layer, withSoil) {
    var parts = {};
    function part(n, cls) { var g = el('g', { 'class': 'part ' + (cls || '') }, null); parts[n] = g; return g; }
    var roots = part(2);
    ['M232 446 Q210 480 176 498', 'M232 446 Q254 486 292 500', 'M232 448 Q228 492 214 524'].forEach(function (d) { stroke(roots, d, 6); });
    ['M232 446 Q196 462 160 462', 'M232 446 Q270 464 306 460'].forEach(function (d) { stroke(roots, d, 5); });
    layer.appendChild(roots);
    if (withSoil) el('path', { 'class': 'soil', d: 'M70 ' + GROUND + ' H430' }, layer);
    var seed = part(1, 'seed');
    var sg = el('g', { transform: 'translate(232 448) rotate(-30)' }, seed);
    el('ellipse', { cx: 0, cy: 0, rx: 10, ry: 15 }, sg);
    el('path', { d: 'M0 -10 Q2.8 0 0 10', 'stroke-width': 2.6, fill: 'none' }, sg);
    layer.appendChild(seed);
    var shoots = part(5);
    palm(shoots, shoots, { x: 128, y: GROUND }, 2, 0.4);
    palm(shoots, shoots, { x: 350, y: GROUND }, 2, 0.34);
    layer.appendChild(shoots);
    var trunkG = part(4), datesG = part(6), crownG = part(3);
    var C = palm(trunkG, crownG, { x: 232, y: GROUND }, 10, 1);
    layer.appendChild(trunkG);
    [[-1, 0], [1, 6]].forEach(function (c) {
      var side = c[0], ex = C.x + side * 30, ey = C.y + 54 + c[1];
      stroke(datesG, 'M' + f1(C.x + side * 10) + ' ' + f1(C.y + 8) + 'Q' + f1(C.x + side * 26) + ' ' + f1(C.y + 16) + ' ' + f1(ex) + ' ' + f1(ey), 3);
      [[0], [-1, 1], [-2, 0, 2], [-1, 1]].forEach(function (row, r) {
        row.forEach(function (k) { el('circle', { cx: f1(ex + k * 6.5), cy: f1(ey + 4 + r * 11), r: 6 }, datesG); });
      });
    });
    layer.appendChild(datesG);
    layer.appendChild(crownG);
    parts.crownCenter = C;
    return parts;
  }

  render(ghostL, true);
  var live = render(liveL, false);

  function setCur(i) {
    for (var k = 1; k <= 6; k++) live[k].classList.toggle('cur', k === i + 1);
    panels.forEach(function (p, n) { p.classList.toggle('is-cur', n === i); });
    if (i < 0) { status.textContent = 'انزل عشان تزرع النواة'; return; }
    status.textContent = 'اللقاء ' + AR[i] + ' من ٦ · ';
    var b = document.createElement('b');
    b.textContent = PARTS[i];
    status.appendChild(b);
  }

  function showWhole() {
    setCur(5);
    document.body.classList.remove('js-motion');
  }

  // GSAP loads with `defer`, so it is ready by the time this runs
  if (!window.gsap || !window.ScrollTrigger) { showWhole(); return; }
  gsap.registerPlugin(ScrollTrigger);
  var mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', function () {
    document.body.classList.add('js-motion');
    setCur(-1);
    for (var n = 1; n <= 6; n++) {
      var g = live[n], i = n - 1;
      var paths = g.querySelectorAll('path'), dots = g.querySelectorAll('circle');
      var tl = gsap.timeline({ scrollTrigger: { trigger: panels[i], start: 'top 70%', end: 'center 40%', scrub: 0.6 } });
      if (n === 1) {
        tl.fromTo(g, { opacity: 0, scale: 0.2, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, ease: 'back.out(2)', duration: 1 });
      } else {
        gsap.set(paths, { strokeDasharray: '1 1', strokeDashoffset: 1 });
        tl.to(paths, { strokeDashoffset: 0, ease: 'none', duration: 1, stagger: { amount: 0.6 } }, 0);
        if (dots.length) tl.fromTo(dots, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, ease: 'back.out(3)', duration: 0.4, stagger: { amount: 0.5 } }, 0.5);
      }
      ScrollTrigger.create({
        trigger: panels[i], start: 'top 60%', end: 'bottom 60%',
        onToggle: (function (idx) { return function (self) { if (self.isActive) setCur(idx); }; })(i),
        onLeaveBack: (function (idx) { return function () { if (idx === 0) setCur(-1); }; })(i)
      });
    }
    var C = live.crownCenter;
    gsap.to([live[3], live[6]], { rotation: 0.8, svgOrigin: C.x.toFixed(0) + ' ' + C.y.toFixed(0), duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    // Lenis: smooth wheel scrolling on mouse devices only, driven by GSAP's clock
    if (!window.Lenis || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    var tick = function (time) { lenis.raf(time * 1000); };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // in-page links scroll smoothly through Lenis too
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        lenis.scrollTo(t, { offset: -12 });
        history.replaceState(null, '', id);
      });
    });
    return function () { gsap.ticker.remove(tick); lenis.destroy(); };
  });

  mm.add('(prefers-reduced-motion: reduce)', showWhole);
})();
