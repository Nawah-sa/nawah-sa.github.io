/* نواة — hero orbit, config wiring, smooth scroll */
(function () {
  var C = window.NAWAH || {};
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- config wiring ----------
  function $(id) { return document.getElementById(id); }
  if (C.founderName) $('founder-name').textContent = C.founderName;
  if (C.founderPhoto) {
    var av = $('founder-avatar');
    av.innerHTML = '';
    var img = document.createElement('img');
    img.src = C.founderPhoto;
    img.alt = C.founderName ? 'صورة ' + C.founderName : 'صورة المؤسس';
    av.appendChild(img);
  }
  if (C.email) {
    var a = $('contact-email');
    a.textContent = C.email;
    a.href = 'mailto:' + C.email;
    $('contact-line').hidden = false;
  }
  if (C.instagram) { $('ig-link').href = C.instagram; $('ig-link').hidden = false; }
  if (C.x) { $('x-link').href = C.x; $('x-link').hidden = false; }
  $('year').textContent = new Date().getFullYear();

  // ---------- hero orbit ----------
  var svg = $('orbit');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var backG = $('orbit-back'), frontG = $('orbit-front'), ring = $('ring');
  var CEN = { x: 400, y: 330 }, F = 1600, STEPS = 40, D2R = Math.PI / 180;
  var orbits = [
    { R: 250, roll: -26, color: '#A6E35A', speed: 0.34, phases: [0.4], dotR: 9, back: 0.16, front: 0.55 },
    { R: 325, roll: 15, color: '#EEF3EA', speed: -0.22, phases: [1.7, 4.6], dotR: 6, back: 0.07, front: 0.26 },
    { R: 385, roll: -7, color: '#EEF3EA', speed: 0.13, phases: [3.1], dotR: 5, back: 0.05, front: 0.18 }
  ];
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  }
  orbits.forEach(function (o) {
    o.backPath = el('path', { fill: 'none', stroke: o.color, 'stroke-width': 1.6 }, backG);
    o.frontPath = el('path', { fill: 'none', stroke: o.color, 'stroke-width': 1.8 }, frontG);
    o.dots = o.phases.map(function () {
      return { b: el('circle', { r: o.dotR, fill: o.color }, backG), f: el('circle', { r: o.dotR, fill: o.color }, frontG) };
    });
  });
  function project(R, th, pitch, roll) {
    var x0 = R * Math.cos(th), z0 = R * Math.sin(th);
    var y1 = -z0 * Math.sin(pitch), z1 = z0 * Math.cos(pitch);
    var x2 = x0 * Math.cos(roll) - y1 * Math.sin(roll);
    var y2 = x0 * Math.sin(roll) + y1 * Math.cos(roll);
    var s = F / (F - z1);
    return { x: CEN.x + x2 * s, y: CEN.y + y2 * s, z: z1, s: s };
  }
  function half(R, from, pitch, roll) {
    var d = '';
    for (var i = 0; i <= STEPS; i++) {
      var p = project(R, from + Math.PI * i / STEPS, pitch, roll);
      d += (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1);
    }
    return d;
  }
  function ease(x) { x = Math.min(1, Math.max(0, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  var target = { x: 0, y: 0 }, tilt = { x: 0, y: 0 };
  svg.addEventListener('pointermove', function (e) {
    var r = svg.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  svg.addEventListener('pointerleave', function () { target.x = 0; target.y = 0; });

  function draw(t) {
    tilt.x += (target.x - tilt.x) * 0.06;
    tilt.y += (target.y - tilt.y) * 0.06;
    var pitch = (22 + tilt.y * 10) * D2R;
    ring.setAttribute('stroke-dashoffset', (1 - ease(t / 1.6)).toFixed(3));
    var fade = 0.15 + 0.85 * ease((t - 0.9) / 1.2);
    orbits.forEach(function (o) {
      var roll = (o.roll + tilt.x * 8) * D2R;
      o.backPath.setAttribute('d', half(o.R, Math.PI, pitch, roll));
      o.frontPath.setAttribute('d', half(o.R, 0, pitch, roll));
      o.backPath.setAttribute('stroke-opacity', (o.back * fade).toFixed(3));
      o.frontPath.setAttribute('stroke-opacity', (o.front * fade).toFixed(3));
      o.dots.forEach(function (d, i) {
        var p = project(o.R, o.phases[i] + o.speed * Math.max(0, t - 0.9), pitch, roll);
        var front = p.z >= 0, show = front ? d.f : d.b, hide = front ? d.b : d.f;
        show.setAttribute('cx', p.x.toFixed(1));
        show.setAttribute('cy', p.y.toFixed(1));
        show.setAttribute('r', (o.dotR * p.s).toFixed(2));
        show.setAttribute('opacity', ((front ? 1 : 0.45) * fade).toFixed(3));
        hide.setAttribute('opacity', 0);
      });
    });
  }

  if (reduce) { draw(4); return; }
  var t = 0, last = null, visible = true, raf = 0;
  function loop(now) {
    raf = 0;
    if (last !== null) t += Math.min(0.05, (now - last) / 1000);
    last = now;
    draw(t);
    if (visible) raf = requestAnimationFrame(loop);
  }
  draw(0);
  raf = requestAnimationFrame(loop);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible && !raf) { last = null; raf = requestAnimationFrame(loop); }
    }).observe(svg);
  }
})();
