/**
 * نواة — يستقبل التسجيلات من الموقع ويحفظها في جدول Google Sheets.
 * طريقة التركيب في README.md (قسم «ربط التسجيل بالجدول»).
 */

var SHEET_NAME = 'التسجيلات';

var COLUMNS = [
  ['time', 'الوقت'],
  ['mode', 'النوع'],
  ['name', 'الاسم'],
  ['email', 'الإيميل'],
  ['stage', 'المرحلة'],
  ['interest', 'الاهتمام'],
  ['attend', 'الحضور'],
  ['minor', 'أقل من ١٨'],
  ['guardian_name', 'اسم ولي الأمر'],
  ['guardian_contact', 'تواصل ولي الأمر'],
  ['guardian_aware', 'ولي الأمر يعرف'],
  ['expertise', 'مجال الخبرة'],
  ['offer', 'وش يقدر يقدّم'],
  ['consent', 'موافقة التواصل']
];

function doPost(e) {
  var p = (e && e.parameter) || {};

  // spam trap: real visitors never fill this hidden field
  if (p.website) return ok_();

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS.map(function (c) { return c[1]; }));
      sheet.setFrozenRows(1);
    }
    var row = COLUMNS.map(function (c) {
      if (c[0] === 'time') return new Date();
      return clean_(p[c[0]]);
    });
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return ok_();
}

// Keep values short, and stop anything that starts like a formula from running in the sheet
function clean_(v) {
  if (v === undefined || v === null) return '';
  var s = String(v).trim().slice(0, 300);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function ok_() {
  return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
}
