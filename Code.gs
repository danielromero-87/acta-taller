function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Solicitud vacía o inválida.');
    }

    const payload = JSON.parse(e.postData.contents);
    payload.timestamp = new Date();

    const spreadsheet = SpreadsheetApp.openById('TU_ID_DE_GOOGLE_SHEET');
    const sheetName = payload.tipoFormulario === 'ingreso' ? 'Actas_Ingreso' : 'Actas_Entrega';

    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    const keys = Object.keys(payload);

    ensureColumns(sheet, keys.length);

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
    }

    let headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), keys.length)).getValues()[0]
      .map(header => (typeof header === 'string' ? header.trim() : header))
      .filter(Boolean);

    const missingKeys = keys.filter(key => !headers.includes(key));
    if (missingKeys.length > 0) {
      const requiredColumns = headers.length + missingKeys.length;
      ensureColumns(sheet, requiredColumns);
      sheet.getRange(1, headers.length + 1, 1, missingKeys.length).setValues([missingKeys]);
      headers = headers.concat(missingKeys);
    }

    const row = headers.map(key => (key in payload ? payload[key] : ''));
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function ensureColumns(sheet, requiredColumns) {
  const maxColumns = sheet.getMaxColumns();
  if (maxColumns < requiredColumns) {
    sheet.insertColumnsAfter(maxColumns, requiredColumns - maxColumns);
  }
}
