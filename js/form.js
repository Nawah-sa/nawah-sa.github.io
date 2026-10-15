/* نواة — registration form: learn / mentor, guardian details for under-18, sends to Google Sheets */
(function () {
  var C = window.NAWAH || {};
  var form = document.getElementById('reg');
  if (!form) return;
  function $(id) { return document.getElementById(id); }

  var modeInput = $('mode');
  var learn = $('learn-fields'), mentor = $('mentor-fields'), guardian = $('guardian');
  var errorBox = $('form-error'), submit = $('submit');

  // Until the Google Sheet is connected, say so plainly instead of pretending to save
  if (!C.sheetUrl) {
    submit.disabled = true;
    submit.style.opacity = '0.5';
    submit.style.cursor = 'not-allowed';
    $('form-closed').hidden = false;
  }

  function setMode(m) {
    modeInput.value = m;
    form.querySelectorAll('.mode button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.mode === m));
    });
    learn.hidden = m !== 'learn';
    mentor.hidden = m !== 'mentor';
    submit.textContent = m === 'learn' ? 'سجّل اهتمامك' : 'سجّل كمساعد';
  }
  form.querySelectorAll('.mode button').forEach(function (b) {
    b.addEventListener('click', function () { setMode(b.dataset.mode); });
  });

  form.querySelectorAll('input[name="minor"]').forEach(function (r) {
    r.addEventListener('change', function () { guardian.hidden = !(r.checked && r.value === 'نعم'); });
  });

  function val(name) {
    var el = form.querySelector('[name="' + name + '"]:checked') || form.querySelector('[name="' + name + '"]:not([type="radio"]):not([type="checkbox"])');
    return el ? el.value.trim() : '';
  }
  function checked(name) { var el = form.querySelector('[name="' + name + '"]'); return !!(el && el.checked); }

  function validate() {
    var errs = [];
    var name = $('name'), email = $('email');
    [name, email].forEach(function (i) { i.removeAttribute('aria-invalid'); });
    if (!val('name')) { errs.push('اكتب اسمك'); name.setAttribute('aria-invalid', 'true'); }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val('email'))) { errs.push('اكتب إيميل صحيح'); email.setAttribute('aria-invalid', 'true'); }
    if (modeInput.value === 'learn') {
      if (!val('stage')) errs.push('اختر وين أنت الحين');
      if (!val('interest')) errs.push('اختر وش يهمك');
      if (!val('attend')) errs.push('اختر كيف تفضّل تحضر');
      if (!val('minor')) errs.push('قل لنا إذا عمرك أقل من ١٨');
      if (val('minor') === 'نعم') {
        if (!val('guardian_name')) errs.push('اكتب اسم ولي أمرك');
        if (!val('guardian_contact')) errs.push('اكتب جوال أو إيميل ولي أمرك');
        if (!checked('guardian_aware')) errs.push('تأكد إن ولي أمرك يعرف إنك سجّلت');
      }
    } else if (!val('expertise')) {
      errs.push('اكتب مجال خبرتك');
    }
    if (!checked('consent')) errs.push('وافق على التواصل وسياسة الخصوصية');
    return errs;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!C.sheetUrl) return;
    var errs = validate();
    if (errs.length) {
      errorBox.textContent = errs.join('، ') + '.';
      errorBox.hidden = false;
      return;
    }
    errorBox.hidden = true;

    var data = new URLSearchParams();
    var mode = modeInput.value;
    var fields = ['mode', 'name', 'email', 'website'];
    if (mode === 'learn') {
      fields = fields.concat(['stage', 'interest', 'attend', 'minor']);
      if (val('minor') === 'نعم') fields = fields.concat(['guardian_name', 'guardian_contact']);
    } else {
      fields = fields.concat(['expertise', 'offer']);
    }
    fields.forEach(function (f) { data.append(f, val(f)); });
    if (mode === 'learn' && val('minor') === 'نعم') data.append('guardian_aware', checked('guardian_aware') ? 'نعم' : 'لا');
    data.append('consent', checked('consent') ? 'نعم' : 'لا');

    submit.disabled = true;
    submit.textContent = 'يرسل…';
    // Apps Script doesn't send CORS headers, so the response is opaque; a network failure still throws
    fetch(C.sheetUrl, { method: 'POST', mode: 'no-cors', body: data })
      .then(function () {
        $('done-text').textContent = mode === 'learn'
          ? 'بنتواصل معك على إيميلك أول ما ننزل موعد يناسبك.'
          : 'شكراً إنك تبي تشاركنا خبرتك. بنتواصل معك على إيميلك ونرتّب الخطوة الجاية سوا.';
        form.hidden = true;
        $('done').hidden = false;
      })
      .catch(function () {
        errorBox.textContent = 'ما قدرنا نرسل تسجيلك. تأكد من اتصالك بالإنترنت وجرّب مرة ثانية.';
        errorBox.hidden = false;
      })
      .then(function () {
        submit.disabled = false;
        submit.textContent = mode === 'learn' ? 'سجّل اهتمامك' : 'سجّل كمساعد';
      });
  });

  $('again').addEventListener('click', function () {
    form.reset();
    guardian.hidden = true;
    setMode('learn');
    $('done').hidden = true;
    form.hidden = false;
    $('name').focus();
  });
})();
