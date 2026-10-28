/* Muallim-ul-Quran exam prep — static SPA (hash router). No build step. */
(function () {
  'use strict';
  var MQ = window.MQ, L = MQ.lessons, app = document.getElementById('app');

  /* ---------- helpers ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(s) {
    return String(s).replace(/[ً-ٰٟۖ-ۭـ‌‍]/g, '')
      .replace(/[آأإٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim();
  }
  function enOf(a) { var e = MQ.en && MQ.en[norm(a)]; if (e) return e; if (String(a).indexOf(' / ') > -1) { var parts = a.split(' / ').map(function (t) { return MQ.en && MQ.en[norm(t)]; }); if (parts.every(Boolean)) return parts.join(' / '); } return ''; }
  function enSpan(a) { var e = enOf(a); return e ? '<span class="en">' + esc(e) + '</span>' : ''; }
  function lno(l) { return l.no === 0 ? 'تمہید' : (l.id === 'u3l11' ? 'نمونہ امتحانی پرچہ' : 'سبق ' + l.no); }
  function bare(s) { var n = norm(s); return n.indexOf('ال') === 0 && n.length > 3 ? n.slice(2) : n; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var done = {}; try { done = JSON.parse(store('mq-done') || '{}') || {}; } catch (e) { done = {}; }
  function saveDone() { store('mq-done', JSON.stringify(done)); }
  function byId(id) { for (var i = 0; i < L.length; i++) if (L[i].id === id) return L[i]; }
  function isAr(s) { return /[\u064B-\u0652]/.test(s); }
  function ar(s, cls) { return '<span class="ar ' + (cls || '') + '" lang="ar" dir="rtl">' + esc(s) + '</span>'; }

  /* ---------- theme ---------- */
  (function () {
    var t = store('mq-theme'); if (t) document.documentElement.setAttribute('data-theme', t);
    document.getElementById('theme').addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      if (!cur) cur = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      var nx = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nx); store('mq-theme', nx);
    });
  })();

  /* ---------- lookups built from lesson data ---------- */
  function lessonWords(l) { // [ar(vowelled), ur]
    if (l.kind === 'plural') return l.words.map(function (w) { return [w[0], w[2], w[1]]; });
    if (l.kind === 'grammar') {
      var out = (l.words || []).map(function (w) { return [w[0], (l.urPrefix || '') + w[1] + (l.urSuffix || '')]; });
      (l.groups || []).forEach(function (g) { g.items.forEach(function (i) { out.push([i[0], i[1]]); }); });
      return out;
    }
    return l.words || [];
  }
  function lookup(l, plain, key) { // find vowelled entry matching plain/bare text
    var n = norm(plain), b = bare(plain), ws = lessonWords(l), i, w;
    for (i = 0; i < ws.length; i++) { w = ws[i]; if (norm(w[0]) === n) return w; }
    for (i = 0; i < ws.length; i++) { w = ws[i]; if (bare(w[0]) === b) return w; }
    return null;
  }
  function patMatch(l, pat) { // 'الحلا_' -> word whose norm matches
    var re = new RegExp('^' + norm(pat).replace(/_/g, '.') + '$'), ws = lessonWords(l), i;
    for (i = 0; i < ws.length; i++) { if (re.test(norm(ws[i][0]))) return ws[i]; if (l.kind === 'plural' && re.test(norm(ws[i][2]))) return [ws[i][2], ws[i][1], ws[i][0]]; }
    var rb = new RegExp('^' + bare(pat).replace(/_/g, '.') + '$');
    for (i = 0; i < ws.length; i++) { if (rb.test(bare(ws[i][0]))) return ws[i]; if (l.kind === 'plural' && rb.test(bare(ws[i][2]))) return [ws[i][2], ws[i][1], ws[i][0]]; }
    // fallback: a trailing '_' may stand for more than one missing letter
    var rp = new RegExp('^' + bare(pat).replace(/_$/, '.+').replace(/_/g, '.') + '$');
    for (i = 0; i < ws.length; i++) { if (rp.test(bare(ws[i][0]))) return ws[i]; }
    return null;
  }
  function anagram(l, letters) { // jumbled letters -> word
    var k = letters.split('').sort().join(''), ws = lessonWords(l), i, b;
    for (i = 0; i < ws.length; i++) { b = bare(ws[i][0]).replace(/ /g, ''); if (b.split('').sort().join('') === k) return ws[i]; b = norm(ws[i][0]).replace(/ /g, ''); if (b.split('').sort().join('') === k) return ws[i]; }
    return null;
  }
  function hlVerse(verse, hl) {
    var toks = verse.split(/\s+/), h = norm(hl).split(' '), nt = toks.map(norm), i, j, ok;
    for (i = 0; i + h.length <= toks.length; i++) {
      ok = true;
      for (j = 0; j < h.length; j++) { if (!(nt[i + j] === h[j] || nt[i + j].indexOf(h[j]) !== -1)) { ok = false; break; } }
      if (ok) {
        return toks.map(function (t, k) { return (k === i ? '<mark>' : '') + esc(t) + (k === i + h.length - 1 ? '</mark>' : ''); }).join(' ');
      }
    }
    return null;
  }
  window.__mq = { enOf: enOf, makeQuestions: makeQuestions, anagram: anagram, norm: norm, hlVerse: hlVerse, lookup: lookup, patMatch: patMatch, lessonWords: lessonWords };

  /* ---------- quiz data ---------- */
  function pairsOf(l) {
    var seen = {}, out = [];
    function add(a, u) { if (!a || !u) return; var k = norm(a); if (seen[k]) return; seen[k] = 1; out.push({ a: a, u: u }); }
    if (l.kind === 'plural') { l.words.forEach(function (w) { add(w[0], w[2]); add(w[1], w[2]); }); return out; }
    lessonWords(l).forEach(function (w) { add(w[0], w[1]); });
    if (l.kind === 'grammar') (l.qs || []).forEach(function (q) { if (q.type === 'translate') q.items.forEach(function (i) { add(i[0], i[1]); }); });
    return out;
  }
  var GP = null;
  function globalPairs() { if (!GP) { GP = []; L.forEach(function (l) { GP = GP.concat(pairsOf(l)); }); GP.forEach(function (x) { x.e = enOf(x.a); }); } return GP; }
  var KV = { ar: function (p) { return p.a; }, ur: function (p) { return p.u; }, en: function (p) { return p.e; } };
  var LEAD = { ar: 'درست عربی لفظ / قطعہ منتخب کریں', ur: 'درست اردو مطلب منتخب کریں', en: 'درست انگریزی معنی منتخب کریں' };
  var TYPES = [['ar', 'ur'], ['ur', 'ar'], ['ar', 'en'], ['en', 'ar'], ['ur', 'en'], ['en', 'ur']];
  function makeQuestions(lessons, n) {
    var all = [];
    lessons.forEach(function (l) { var p = pairsOf(l); p.forEach(function (x) { x.l = l.id; x.e = enOf(x.a); }); all = all.concat(p); });
    var gp = globalPairs(), rounds = [[], [], [], [], [], []];
    shuffle(all).forEach(function (p) {
      var ts = shuffle(TYPES.filter(function (t) { return (t[0] !== 'en' && t[1] !== 'en') || p.e; }));
      ts.forEach(function (t, k) { rounds[k].push([p, t]); });
    });
    var cand = []; rounds.forEach(function (r) { cand = cand.concat(r); });
    if (n > 0) cand = cand.slice(0, n);
    var same = shuffle(all);
    return cand.map(function (c) {
      var p = c[0], qk = c[1][0], ak = c[1][1], right = KV[ak](p), seen = {}, opts = [], key = function (v) { return ak === 'ar' ? norm(v) : v; };
      seen[key(right)] = 1; seen[key(KV[qk](p))] = 1;
      var take = function (x) { var v = KV[ak](x); if (!v || opts.length >= 3 || seen[key(v)] || x === p) return; seen[key(v)] = 1; opts.push(v); };
      same.forEach(take);
      for (var t = 0; t < 400 && opts.length < 3; t++) take(gp[Math.floor(Math.random() * gp.length)]);
      opts.push(right);
      return { q: KV[qk](p), qk: qk, ak: ak, right: right, opts: shuffle(opts), lead: LEAD[ak] };
    });
  }
  function kv(kind, s) { return kind === 'ar' ? ar(s) : kind === 'en' ? '<span class="en en-big">' + esc(s) + '</span>' : '<span class="ur">' + esc(s) + '</span>'; }
  function runQuiz(box, qs, onEnd) {
    var i = 0, score = 0, wrong = [];
    function show() {
      if (i >= qs.length) {
        box.innerHTML = '<div class="qz res"><div class="sc">' + score + ' / ' + qs.length + '</div><p>' + (score === qs.length ? 'ماشاء اللہ! مکمل نمبر۔' : score / qs.length >= .7 ? 'بہت خوب! کچھ مزید مشق کریں۔' : 'مزید تیاری کی ضرورت ہے — اسباق دوبارہ دیکھیں۔') + '</p>' +
          (wrong.length ? '<h3>غلط جوابات</h3><div class="rev">' + wrong.map(function (w) { return '<div>' + kv(w.qk, w.q) + ' ← ' + kv(w.ak, w.right) + '</div>'; }).join('') + '</div>' : '') +
          '<p><button class="btn p" id="again">دوبارہ</button></p></div>';
        document.getElementById('again').onclick = onEnd; return;
      }
      var q = qs[i];
      box.innerHTML = '<div class="qz"><div class="prog"><span>سوال ' + (i + 1) + ' / ' + qs.length + '</span><span>درست: ' + score + '</span></div><div class="qb"><div class="lead">' + q.lead + '</div><div class="big">' + kv(q.qk, q.q) + '</div><div class="opts">' +
        q.opts.map(function (o, k) { return '<button class="opt k-' + q.ak + (q.ak === 'ar' ? ' ar' : '') + '" data-k="' + k + '"' + (q.ak === 'ar' ? ' lang="ar" dir="rtl"' : q.ak === 'en' ? ' dir="ltr"' : '') + '>' + esc(o) + '</button>'; }).join('') + '</div></div></div>';
      var locked = false;
      [].forEach.call(box.querySelectorAll('.opt'), function (b) {
        b.onclick = function () {
          if (locked) return; locked = true;
          var ok = q.opts[+b.dataset.k] === q.right;
          if (ok) score++; else wrong.push(q);
          [].forEach.call(box.querySelectorAll('.opt'), function (x) { if (q.opts[+x.dataset.k] === q.right) x.classList.add('ok'); });
          if (!ok) b.classList.add('no');
          setTimeout(function () { i++; show(); }, ok ? 650 : 1500);
        };
      });
    }
    show();
  }

  /* ---------- views ---------- */
  function home() {
    var n = L.length, d = L.filter(function (l) { return done[l.id]; }).length;
    var h = '<section class="hero"><h1>معلم القرآن — امتحانی تیاری</h1><p>مکمل کتاب (تینوں یونٹ، صفحہ 103 تک) — سبق وار الفاظ، قواعد، مشقیں، کوئز اور فلیش کارڈز۔ عربی (مکمل اعراب کے ساتھ)، اردو اور انگریزی معانی الگ الگ رنگوں میں؛ اعراب ہٹا کر بھی پڑھ سکتے ہیں۔</p><div class="bar"><i style="width:' + Math.round(d * 100 / n) + '%"></i></div><small>' + d + ' / ' + n + ' اسباق مکمل</small></section>';
    MQ.units.forEach(function (u) {
      h += '<section class="unit"><h2>یونٹ ' + u.no + ': ' + esc(u.title) + '</h2><p class="sub">صفحات ' + u.pages + ' — ' + esc(u.sub) + '</p><div class="grid">';
      L.filter(function (l) { return l.unit === u.no; }).forEach(function (l) {
        h += '<a class="lc ' + (done[l.id] ? 'done' : '') + '" href="#/l/' + l.id + '"><span class="no">' + lno(l) + ' · صفحہ ' + l.pages + '</span><span class="t ' + (isAr(l.title) ? 'ar' : '') + '">' + esc(l.title) + '</span></a>';
      });
      h += '</div></section>';
    });
    app.innerHTML = h;
  }

  function wordCard(a, u, a2) { return '<div class="card"><span class="ar" lang="ar" dir="rtl">' + esc(a) + '</span>' + (a2 ? '<span class="ar2 ar" dir="rtl">' + esc(a2) + '</span>' : '') + '<span class="ur">' + esc(u) + '</span>' + enSpan(a) + '</div>'; }
  function box(title, inner) { return '<div class="box">' + (title ? '<h3>' + title + '</h3>' : '') + inner + '</div>'; }

  function study(l) {
    var h = '';
    if (l.formula) h += '<div class="formula">' + ar(l.formula[0]) + '<span>' + esc(l.formula[1]) + '</span></div>';
    if (l.intro) h += box('', '<span>' + esc(l.intro) + '</span>');
    if (l.rule && l.rule.length) h += box('قاعدہ', '<ul>' + l.rule.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>');
    if (l.examples) h += '<table class="ex"><tr><th>لفظ</th><th></th><th>تبدیلی کے بعد</th><th>مطلب</th></tr>' + l.examples.map(function (e) { return '<tr><td>' + ar(e[0]) + '</td><td>' + esc(e[1]) + '</td><td>' + ar(e[2]) + '</td><td>' + esc(e[3]) + '</td></tr>'; }).join('') + '</table>';
    var tools = '<div class="tools"><button class="btn" id="hideur">ترجمہ چھپائیں (خود جانچیں)</button><button class="btn" onclick="window.print()">پرنٹ</button></div>';
    h += tools;
    if (l.kind === 'plural') {
      h += '<h3 class="gt">مفرد ← جمع</h3><div class="wg">' + l.words.map(function (w) { return wordCard(w[0], w[2], w[1]); }).join('') + '</div>';
    } else if (l.kind === 'grammar') {
      if (l.words && l.words.length) h += '<h3 class="gt">الفاظ <small>(کتاب کی فہرست؛ معانی شامل کیے گئے)</small></h3><div class="wg">' + l.words.map(function (w) { return wordCard(w[0], (l.urPrefix || '') + w[1] + (l.urSuffix || '')); }).join('') + '</div>';
      (l.groups || []).forEach(function (g) {
        h += '<h3 class="gt">' + esc(g.title) + (g.note ? '<small>' + esc(g.note) + '</small>' : '') + '</h3><div class="wg">' + g.items.map(function (i) { return wordCard(i[0], i[1]); }).join('') + '</div>';
      });
    } else {
      h += '<h3 class="gt">الفاظ <small>(معانی کتاب میں خالی تھے؛ مطالعہ کے لیے شامل کیے گئے)</small></h3><div class="wg">' + l.words.map(function (w) { return wordCard(w[0], w[1]); }).join('') + '</div>';
      if (l.tips) h += box('یاد رکھیں', '<ul>' + l.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>');
    }
    return h;
  }

  function item(qHtml, ansHtml, cls) { return '<div class="it ' + (cls || '') + '"><span class="qq ' + '">' + qHtml + '</span><button class="rv" type="button">جواب</button><span class="ans">' + ansHtml + '</span></div>'; }
  function verseItem(v, hl, tr) {
    return '<div class="it vr"><span class="qq ar" dir="rtl">' + esc(v[0]) + '</span><button class="rv" type="button">جواب</button><div class="tr"><span class="ar" dir="rtl">' + (hlVerse(v[0], v[1]) || esc(v[0])) + '</span><br>' + '<span class="ur">' + esc(v[2] || '') + '</span>' + enSpan(v[0]) + '</div></div>';
  }
  function qBlock(n, head, inner, grid) { return '<div class="q"><h3><b>' + n + '</b>' + esc(head) + '</h3><div class="' + (grid ? 'qg' : 'qi') + '">' + inner + '</div></div>'; }

  function exercises(l) {
    var h = '<div class="tools"><button class="btn" id="showall">سب جوابات دکھائیں</button><button class="btn" id="hideall">سب چھپائیں</button></div>', n = 0;
    if (l.ex) {
      var H = Object.assign({
        q1: 'درج ذیل الفاظ کا مطلب بتائیں۔', q2: 'درج ذیل اردو الفاظ کے عربی الفاظ لکھیں۔', q3: 'درج ذیل الفاظ کی مختصر وضاحت کریں۔',
        q4: 'درج ذیل الفاظ ناکمل ہیں۔ انہیں مکمل کریں۔', q5: 'درج ذیل الفاظ پر مناسب حرکات لگائیں۔', q6: 'درج ذیل حروف کو ملا کر لفظ بنائیں۔',
        q7: 'درج ذیل قرآنی قطعات میں سے سبق کے الفاظ کو ہائی لائٹ کریں۔'
      }, l.qHeads || {}), e = l.ex;
      if (e.q1) h += qBlock(++n, H.q1, e.q1.map(function (w) { var x = lookup(l, w); return item(ar(w), esc(x ? x[1] : '—')); }).join(''), 1);
      if (e.q2) h += qBlock(++n, H.q2, e.q2.map(function (p) { var a = p[1].split(' / ').map(function (t) { var x = lookup(l, t); return x ? x[0] : t; }).join(' / '); return item('<span class="u">' + esc(p[0]) + '</span>', ar(a, 'ans')); }).join(''), 1);
      if (e.q3) h += qBlock(++n, H.q3, e.q3.map(function (p) { var x = lookup(l, p[0]); return item(ar(x ? x[0] : p[0]), esc(p[1])); }).join(''));
      if (e.q4) h += qBlock(++n, H.q4, e.q4.map(function (p) { var x = patMatch(l, p); return item('<span class="pat ar">' + esc(p) + '</span>', x ? ar(x[0]) : '—'); }).join(''), 1);
      if (e.q5) h += qBlock(++n, H.q5, e.q5.map(function (w) { var x = lookup(l, w); return item(ar(w), ar(x ? x[0] : w)); }).join(''), 1);
      if (e.q6) h += qBlock(++n, H.q6, e.q6.map(function (p) { var w = p.replace(/-/g, ''), x = lookup(l, w) || anagram(l, norm(w)); return item('<span class="pat ar">' + esc(p) + '</span>', ar(x ? x[0] : w)); }).join(''), 1);
      if (e.q7) h += qBlock(++n, H.q7, e.q7.map(function (v) { return verseItem(v); }).join(''));
    } else if (l.qs) {
      l.qs.forEach(function (q) {
        var inner = '', grid = 1;
        if (q.type === 'translate') inner = q.items.map(function (i) { return item(ar(i[0]), esc(i[1])); }).join('');
        else if (q.type === 'plainQ') { grid = 0; inner = q.items.map(function (i) { return item('<span class="pat ar">' + esc(i[0]) + '</span>', ar(i[1])); }).join(''); }
        else if (q.type === 'highlight') { grid = 0; inner = q.items.map(function (v) { return verseItem(v); }).join(''); }
        else if (q.type === 'toPlural') inner = q.items.map(function (w) { var x = lookup(l, w), y = null; l.words.forEach(function (r) { if (!y && (norm(r[0]) === norm(w) || bare(r[0]) === bare(w))) y = r; }); return item(ar(w), ar(y ? y[1] : '—')); }).join('');
        else if (q.type === 'toSingular') inner = q.items.map(function (w) { var y = null; l.words.forEach(function (r) { if (!y && (norm(r[1]) === norm(w) || bare(r[1]) === bare(w))) y = r; }); return item(ar(w), ar(y ? y[0] : '—')); }).join('');
        else if (q.type === 'mixed') inner = q.items.map(function (w) { var y = null, p = null; l.words.forEach(function (r) { if (!y && bare(r[0]) === bare(w)) { y = r; p = r[1]; } if (!y && bare(r[1]) === bare(w)) { y = r; p = r[0]; } }); return item(ar(w), ar(p || '—')); }).join('');
        else if (q.type === 'completePlural') inner = q.items.map(function (p) { var x = patMatch(l, p); return item('<span class="pat ar">' + esc(p) + '</span>', x ? ar(x[0]) : '—'); }).join('');
        else inner = q.items.map(function (i) { return item(esc(JSON.stringify(i)), ''); }).join('');
        h += qBlock(++n, q.t, inner, grid);
      });
    }
    if (!n) h += '<p class="empty">اس سبق میں کتاب کے مطابق الگ سے مشق نہیں دی گئی۔</p>';
    return h;
  }

  function cards(box0, l) {
    var ps = shuffle(pairsOf(l)), i = 0, flip = false;
    function draw() {
      var p = ps[i];
      box0.innerHTML = '<div class="fc"><div class="face" id="face">' + (flip ? '<span class="u">' + esc(p.u) + '</span>' + enSpan(p.a) + '<small>عربی دیکھنے کے لیے دبائیں</small>' : ar(p.a) + '<small>مطلب دیکھنے کے لیے دبائیں</small>') + '</div><div class="nav"><button class="btn" id="nx">◂ اگلا</button><span>' + (i + 1) + ' / ' + ps.length + '</span><button class="btn" id="pv">پچھلا ▸</button></div><p><button class="btn" id="sh">دوبارہ ملائیں</button></p></div>';
      document.getElementById('face').onclick = function () { flip = !flip; draw(); };
      document.getElementById('nx').onclick = function () { i = (i + 1) % ps.length; flip = false; draw(); };
      document.getElementById('pv').onclick = function () { i = (i - 1 + ps.length) % ps.length; flip = false; draw(); };
      document.getElementById('sh').onclick = function () { ps = shuffle(ps); i = 0; flip = false; draw(); };
    }
    if (!ps.length) { box0.innerHTML = '<p class="empty">کارڈز دستیاب نہیں۔</p>'; return; }
    draw();
  }

  function lesson(id, tab) {
    var l = byId(id); if (!l) { app.innerHTML = '<p class="empty">سبق نہیں ملا۔</p>'; return; }
    tab = tab || 'study';
    var idx = L.indexOf(l), prev = L[idx - 1], next = L[idx + 1];
    var tabs = [['study', 'سبق'], ['ex', 'مشق'], ['quiz', 'کوئز'], ['cards', 'فلیش کارڈ']];
    var h = '<div class="crumb"><a href="#/">فہرست</a> › یونٹ ' + l.unit + ' › ' + lno(l) + ' (صفحہ ' + l.pages + ')</div><h1 class="lh ' + (isAr(l.title) ? 'ar' : '') + '">' + esc(l.title) + '</h1>' +
      '<div class="tabs">' + tabs.map(function (t) { return '<a href="#/l/' + id + (t[0] === 'study' ? '' : '/' + t[0]) + '" class="' + (t[0] === tab ? 'on' : '') + '">' + t[1] + '</a>'; }).join('') + '</div><div id="pane"></div>' +
      '<div class="tools"><button class="btn ' + (done[id] ? 'on' : 'p') + '" id="mark">' + (done[id] ? '✓ مکمل — منسوخ کریں' : 'سبق مکمل نشان زد کریں') + '</button></div>' +
      '<div class="lnav">' + (prev ? '<a class="btn" href="#/l/' + prev.id + '">▸ پچھلا سبق</a>' : '<span></span>') + (next ? '<a class="btn" href="#/l/' + next.id + '">اگلا سبق ◂</a>' : '<span></span>') + '</div>';
    app.innerHTML = h;
    var pane = document.getElementById('pane');
    if (tab === 'study') { pane.innerHTML = study(l); document.body.classList.remove('hide-ur'); }
    else if (tab === 'ex') pane.innerHTML = exercises(l);
    else if (tab === 'quiz') {
      var cnt = +(store('mq-qn') || 20);
      pane.innerHTML = '<div class="sel"><label>سوالات: <select id="qn">' + [10, 20, 30, 50, 0].map(function (v) { return '<option value="' + v + '"' + (v === cnt ? ' selected' : '') + '>' + (v || 'تمام') + '</option>'; }).join('') + '</select></label></div><div id="qbox"></div>';
      var qbox = document.getElementById('qbox');
      var start = function () { var qs = makeQuestions([l], cnt); if (qs.length < 2) { qbox.innerHTML = '<p class="empty">اس سبق کے لیے کوئز دستیاب نہیں۔</p>'; return; } runQuiz(qbox, qs, start); };
      document.getElementById('qn').onchange = function () { cnt = +this.value; store('mq-qn', String(cnt)); start(); };
      start();
    }
    else cards(pane, l);
    decorate(pane);
    document.getElementById('mark').onclick = function () { if (done[id]) delete done[id]; else done[id] = 1; saveDone(); lesson(id, tab); };
    var hb = document.getElementById('hideur'); if (hb) hb.onclick = function () { document.body.classList.toggle('hide-ur'); hb.textContent = document.body.classList.contains('hide-ur') ? 'ترجمہ دکھائیں' : 'ترجمہ چھپائیں (خود جانچیں)'; };
    var sa = document.getElementById('showall'); if (sa) { sa.onclick = function () { [].forEach.call(pane.querySelectorAll('.it'), function (x) { x.classList.add('shown'); }); }; document.getElementById('hideall').onclick = function () { [].forEach.call(pane.querySelectorAll('.it'), function (x) { x.classList.remove('shown'); }); }; }
  }

  function exam() {
    app.innerHTML = '<h1 class="lh">امتحانی مشق</h1><p>منتخب اسباق سے بے ترتیب سوالات۔</p><div class="sel"><label>یونٹ: <select id="su"><option value="0">تینوں یونٹ</option><option value="1">یونٹ 1</option><option value="2">یونٹ 2</option><option value="3">یونٹ 3</option></select></label><label>سوالات: <select id="sn"><option>10</option><option selected>20</option><option>30</option><option>50</option><option>100</option></select></label><button class="btn p" id="go">شروع کریں</button></div><div id="pane"></div>';
    document.getElementById('go').onclick = function () {
      var u = +document.getElementById('su').value, n = +document.getElementById('sn').value;
      var ls = L.filter(function (l) { return !u || l.unit === u; }), pane = document.getElementById('pane');
      var go = function () { runQuiz(pane, makeQuestions(ls, n), go); }; go();
    };
  }

  /* ---------- English under answers ---------- */
  function decorate(root) {
    [].forEach.call(root.querySelectorAll('.it:not(.vr)'), function (it) {
      var ans = it.querySelector('.ans'), q = it.querySelector('.qq'); if (!ans || !q || ans.querySelector('.en')) return;
      var a = ans.querySelector('.ar'), qa = q.querySelector('.ar:not(.pat)');
      var src = a ? a.textContent : qa ? qa.textContent : '';
      var e = src ? enOf(src) : '';
      if (!e && a && qa) e = enOf(qa.textContent);
      if (e) ans.insertAdjacentHTML('beforeend', ' <span class="en">' + esc(e) + '</span>');
    });
  }

  /* ---------- harakat / English toggles ---------- */
  var HK_ALL = /[ً-ٰٟۖ-ۭ]/g, HK_MIN = /[ً-ْ]/g, orig = new WeakMap();
  var showHK = store('mq-hk') !== '0', showEN = store('mq-en') !== '0';
  function eachText(root, fn) { var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = []; while ((n = w.nextNode())) list.push(n); list.forEach(fn); }
  function stripNode(n) {
    var p = n.parentNode; if (!p || p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE') return;
    var re = p.closest && p.closest('.ar') ? HK_ALL : HK_MIN, t = n.data.replace(re, '');
    if (t !== n.data) { if (!orig.has(n)) orig.set(n, n.data); n.data = t; }
  }
  function applyHK() {
    if (showHK) eachText(document.body, function (n) { if (orig.has(n)) { n.data = orig.get(n); orig.delete(n); } });
    else eachText(document.body, stripNode);
  }
  function syncButtons() {
    var hk = document.getElementById('hk'), eb = document.getElementById('enb');
    if (hk) { hk.textContent = showHK ? 'اعراب: ✓' : 'اعراب: ✗'; hk.setAttribute('aria-pressed', showHK); }
    if (eb) { eb.textContent = showEN ? 'EN: ✓' : 'EN: ✗'; eb.setAttribute('aria-pressed', showEN); }
    document.body.classList.toggle('no-en', !showEN);
  }
  (function () {
    var hk = document.getElementById('hk'), eb = document.getElementById('enb');
    if (hk) hk.onclick = function () { showHK = !showHK; store('mq-hk', showHK ? '1' : '0'); syncButtons(); applyHK(); };
    if (eb) eb.onclick = function () { showEN = !showEN; store('mq-en', showEN ? '1' : '0'); syncButtons(); };
    syncButtons();
    if (window.MutationObserver) new MutationObserver(function () { if (!showHK) applyHK(); }).observe(app, { childList: true, subtree: true, characterData: true });
  })();

  /* ---------- router ---------- */
  function route() {
    var p = (location.hash || '#/').replace(/^#\/?/, '').split('/');
    window.scrollTo(0, 0);
    if (p[0] === 'l' && p[1]) lesson(p[1], p[2]);
    else if (p[0] === 'exam') exam();
    else home();
    if (!showHK) applyHK();
    document.title = (p[0] === 'l' && byId(p[1]) ? byId(p[1]).title + ' — ' : '') + 'معلم القرآن — امتحانی تیاری';
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('.rv,.card') : null; if (!t) return;
    if (t.classList.contains('card')) t.classList.toggle('shown'); else t.parentNode.classList.add('shown');
  });
  window.addEventListener('hashchange', route);
  route();
})();
