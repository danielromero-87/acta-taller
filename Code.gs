const SHEET_ID = '11jWB0BdgNeKomlsA8iJNMaVUecg48Adv-5-bQLNpKy0';
const EMAIL_SENDER_NAME = '8/7 Autos';
const INTERNAL_RECIPIENTS = [
  'john.rodriguez@87autos.com',
  'asistente@87autos.com',
  'felixochosiete@gmail.com'
];

const COLUMN_NAME_MAP = {
  tipoFormulario: 'TIPO_FORMULARIO',
  fechaEntrega: 'FECHA_ENTREGA',
  fechaSalida: 'FECHA_SALIDA',
  ordenTrabajo: 'ORDEN_TRABAJO',
  propietario: 'PROPIETARIO',
  documento: 'DOCUMENTO',
  telefono: 'TELEFONO',
  correo: 'CORREO',
  placa: 'PLACA',
  marca: 'MARCA',
  color: 'COLOR',
  km: 'KILOMETRAJE',
  seguroVence: 'SEGURO_VENCE',
  tecnicoVence: 'TECNOMECANICA_VENCE',
  combustible: 'COMBUSTIBLE',
  descripcionFalla: 'DESCRIPCION_FALLA',
  diagramaNotas: 'DIAGRAMA',
  signatureClient: 'FIRMA_CLIENTE',
  signatureResponsible: 'FIRMA_RESPONSABLE',
  tapaCombustible: 'TAPA_COMBUSTIBLE',
  stop: 'STOP',
  cenicero: 'CENICERO',
  encendedor: 'ENCENDEDOR',
  antena: 'ANTENA',
  espejos: 'ESPEJOS',
  boceles: 'BOCELES',
  manijas: 'MANIJAS',
  vidrios: 'VIDRIOS',
  frenoEstacionamiento: 'FRENO_ESTACIONAMIENTO',
  aireAcondicionado: 'AIRE_ACONDICIONADO',
  elevavidrios: 'ELEVAVIDRIOS',
  exploradoras: 'EXPLORADORAS',
  pernoSeguridad: 'PERNO_SEGURIDAD',
  herramientas: 'HERRAMIENTAS',
  gato: 'GATO',
  manuales: 'MANUALES',
  certificadoGases: 'CERTIFICADO_GASES',
  tarjetaPropiedad: 'TARJETA_PROPIEDAD',
  lucesInstrumentos: 'LUCES_INSTRUMENTOS_PANTALLA',
  lucesInteriores: 'LUCES_INTERIORES',
  volante: 'VOLANTE',
  golpe: 'GOLPE',
  rayado: 'RAYADO',
  abolladura: 'ABOLLADURA',
  limpio: 'LIMPIO',
  sucio: 'SUCIO',
  muySucio: 'MUY_SUCIO',
  deliveryDate: 'FECHA_ENTREGA',
  quoteNumber: 'NUMERO_COTIZACION',
  clientName: 'NOMBRE_CLIENTE',
  clientId: 'DOCUMENTO_CLIENTE',
  clientAddress: 'DIRECCION_CLIENTE',
  clientPhone: 'TELEFONO_CLIENTE',
  clientEmail: 'CORREO_CLIENTE',
  vehicleMake: 'MARCA_VEHICULO',
  vehicleLine: 'LINEA_VEHICULO',
  vehicleModel: 'MODELO_VEHICULO',
  vehicleColor: 'COLOR_VEHICULO',
  vehiclePlate: 'PLACA_VEHICULO',
  vehicleKm: 'KILOMETRAJE_VEHICULO',
  vehicleVin: 'VIN_VEHICULO',
  vehicleEngineNum: 'NUMERO_MOTOR_VEHICULO',
  serviceObservations: 'OBSERVACIONES_SERVICIO',
  deliveryCondition: 'CONDICION_ENTREGA',
  selectedServices: 'SERVICIOS_REALIZADOS',
  selectedDeliveryItems: 'ELEMENTOS_ENTREGADOS'
};

const CANONICAL_HEADERS = (function() {
  const headers = Object.keys(COLUMN_NAME_MAP).map(key => COLUMN_NAME_MAP[key]);
  headers.push('FECHA_REGISTRO');
  return new Set(headers);
})();

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Solicitud vacia o invalida.');
    }

    const payload = JSON.parse(e.postData.contents);
    const formType = payload.tipoFormulario === 'entrega' ? 'entrega' : 'ingreso';
    const normalizedData = normalizePayload(payload);

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheetName = formType === 'ingreso' ? 'Actas_Ingreso' : 'Actas_Entrega';

    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    const headers = prepareHeaders(sheet, normalizedData, formType);
    const row = headers.map(header => header === 'FECHA_REGISTRO' ? normalizedData[header] : (normalizedData[header] !== undefined ? normalizedData[header] : ''));
    sheet.appendRow(row);

    try {
      sendNotificationEmails(payload, normalizedData, formType);
    } catch (emailError) {
      console.error('No se pudo enviar la notificación por correo: ' + emailError);
    }

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

function sendNotificationEmails(rawPayload, normalizedData, formType) {
  const internalRecipients = (INTERNAL_RECIPIENTS || [])
    .map(email => (typeof email === 'string' ? email.trim() : ''))
    .filter(isValidEmail);

  const clientEmailCandidate = formType === 'ingreso'
    ? (rawPayload.correo || rawPayload.clientEmail || '')
    : (rawPayload.clientEmail || rawPayload.correo || '');
  const clientEmail = isValidEmail(clientEmailCandidate) ? clientEmailCandidate.trim() : '';

  if (!clientEmail && internalRecipients.length === 0) {
    return;
  }

  const scriptTimezone = Session.getScriptTimeZone() || 'America/Bogota';
  const registro = normalizedData.FECHA_REGISTRO instanceof Date
    ? Utilities.formatDate(normalizedData.FECHA_REGISTRO, scriptTimezone, 'yyyy-MM-dd HH:mm')
    : Utilities.formatDate(new Date(), scriptTimezone, 'yyyy-MM-dd HH:mm');

  const plate = rawPayload.placa || rawPayload.vehiclePlate || 'sin placa';
  const subject = `[8/7 Autos] Acta de ${formType === 'ingreso' ? 'Ingreso' : 'Entrega'} - ${plate}`;

  const summaryRows = buildSummaryRows(rawPayload, formType, registro);
  const htmlBody = buildHtmlBody(summaryRows, formType);
  const textBody = buildPlainBody(summaryRows, formType);

  let to = clientEmail;
  let bccList = internalRecipients;

  if (!clientEmail) {
    to = internalRecipients[0];
    bccList = internalRecipients.slice(1);
  }

  MailApp.sendEmail({
    to,
    subject,
    name: EMAIL_SENDER_NAME,
    htmlBody,
    body: textBody,
    bcc: bccList.length ? bccList.join(',') : undefined,
    noReply: true
  });
}

function buildSummaryRows(rawPayload, formType, registro) {
  const baseRows = [
    ['Fecha de registro', registro],
    ['Formulario', formType === 'ingreso' ? 'Acta de ingreso' : 'Acta de entrega']
  ];

  if (formType === 'ingreso') {
    baseRows.push(
      ['Propietario', rawPayload.propietario || ''],
      ['Documento', rawPayload.documento || ''],
      ['Teléfono', rawPayload.telefono || ''],
      ['Correo', rawPayload.correo || ''],
      ['Placa', rawPayload.placa || ''],
      ['Marca', rawPayload.marca || ''],
      ['Color', rawPayload.color || ''],
      ['Kilometraje', rawPayload.km || ''],
      ['Descripción / falla reportada', rawPayload.descripcionFalla || ''],
      ['Objetos inventariados', resumenInventario(rawPayload)]
    );
  } else {
    baseRows.push(
      ['Cliente', rawPayload.clientName || rawPayload.propietario || ''],
      ['Documento', rawPayload.clientId || ''],
      ['Teléfono', rawPayload.clientPhone || ''],
      ['Correo', rawPayload.clientEmail || rawPayload.correo || ''],
      ['Placa', rawPayload.vehiclePlate || rawPayload.placa || ''],
      ['Marca', rawPayload.vehicleMake || ''],
      ['Línea', rawPayload.vehicleLine || ''],
      ['Modelo', rawPayload.vehicleModel || ''],
      ['Servicios realizados', rawPayload.selectedServices || ''],
      ['Elementos entregados', rawPayload.selectedDeliveryItems || ''],
      ['Condición de entrega', rawPayload.deliveryCondition || ''],
      ['Observaciones', rawPayload.serviceObservations || '']
    );
  }

  return baseRows.filter(row => row && (row[1] || '').toString().trim() !== '');
}

function buildHtmlBody(rows, formType) {
  const intro = formType === 'ingreso'
    ? 'Te compartimos el detalle del acta de ingreso registrada en 8/7 Autos:'
    : 'Te compartimos el detalle del acta de entrega registrada en 8/7 Autos:';

  const tableRows = rows.map(([label, value]) => {
    const safeValue = value
      .toString()
      .replace(/\n/g, '<br>');
    return `<tr><th align="left" style="padding:6px 8px;background:#f2f4ff;border-bottom:1px solid #d7def4;">${label}</th><td style="padding:6px 8px;border-bottom:1px solid #e4e8f7;">${safeValue}</td></tr>`;
  }).join('');

  return `
    <div style="font-family:'Poppins',Arial,sans-serif;color:#273043;font-size:14px;">
      <p>${intro}</p>
      <table style="border-collapse:collapse;width:100%;max-width:640px;margin-top:12px;">
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      <p style="margin-top:16px;color:#808aa5;font-size:12px;">Este mensaje se genera de forma automática para efectos de trazabilidad.</p>
    </div>
  `;
}

function buildPlainBody(rows, formType) {
  const intro = formType === 'ingreso'
    ? 'Te compartimos el detalle del acta de ingreso registrada en 8/7 Autos:'
    : 'Te compartimos el detalle del acta de entrega registrada en 8/7 Autos:';

  const bodyLines = rows.map(([label, value]) => `${label}: ${value}`);
  return [intro, '', ...bodyLines, '', 'Este mensaje se genera de forma automática para efectos de trazabilidad.'].join('\n');
}

function resumenInventario(rawPayload) {
  const keys = [
    'tapaCombustible', 'stop', 'cenicero', 'encendedor', 'antena', 'espejos', 'boceles',
    'manijas', 'vidrios', 'frenoEstacionamiento', 'aireAcondicionado', 'elevavidrios',
    'exploradoras', 'pernoSeguridad', 'herramientas', 'gato', 'manuales', 'certificadoGases',
    'tarjetaPropiedad', 'lucesInstrumentos', 'lucesInteriores', 'volante', 'golpe', 'rayado',
    'abolladura', 'limpio', 'sucio', 'muySucio'
  ];

  const presentes = keys
    .filter(key => rawPayload[key] && rawPayload[key].toString().toLowerCase() === 'sí')
    .map(key => key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()));

  return presentes.length ? presentes.join(', ') : 'Sin cambios registrados';
}

function isValidEmail(value) {
  if (typeof value !== 'string') {
    return false;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function normalizePayload(payload) {
  const normalized = { FECHA_REGISTRO: new Date() };

  Object.keys(payload).forEach(key => {
    if (key === 'timestamp') {
      return;
    }

    const header = COLUMN_NAME_MAP[key] || toCanonicalHeader(key);
    if (header && header !== 'FECHA_REGISTRO') {
      let value = payload[key];
      if (header === 'DIAGRAMA') {
        value = formatDiagramNotes(value);
      }
      normalized[header] = value;
    }
  });

  if (!normalized.TIPO_FORMULARIO && typeof payload.tipoFormulario === 'string') {
    normalized.TIPO_FORMULARIO = payload.tipoFormulario;
  }

  return normalized;
}

function prepareHeaders(sheet, normalizedData, formType) {
  const hasHeaderRow = sheet.getLastRow() >= 1;
  if (hasHeaderRow) {
    const firstHeaderValue = sheet.getRange(1, 1).getValue();
    if (firstHeaderValue && toCanonicalHeader(firstHeaderValue) !== 'FECHA_REGISTRO') {
      sheet.insertColumnsBefore(1, 1);
    }
  }

  const lastColumn = sheet.getLastColumn();
  let existingHeadersRaw = [];
  if (sheet.getLastRow() >= 1 && lastColumn > 0) {
    existingHeadersRaw = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  }

  const headerOrder = new Map();
  headerOrder.set('FECHA_REGISTRO', true);

  existingHeadersRaw.forEach(value => {
    const header = toCanonicalHeader(value);
    if (header && header !== 'FECHA_REGISTRO') {
      headerOrder.set(header, true);
    }
  });

  Object.keys(normalizedData).forEach(header => {
    if (header && header !== 'FECHA_REGISTRO') {
      headerOrder.set(header, true);
    }
  });

  const finalHeaders = Array.from(headerOrder.keys());
  const specialAfter = ['DIAGRAMA', 'DESCRIPCION_FALLA', 'FIRMA_CLIENTE', 'FIRMA_RESPONSABLE'];

  const filtered = finalHeaders.filter(header => header !== 'FECHA_REGISTRO' && !specialAfter.includes(header));
  const ordered = ['FECHA_REGISTRO'];
  let insertedAfter = false;

  filtered.forEach(header => {
    ordered.push(header);
    if (!insertedAfter && header === 'MUY_SUCIO') {
      specialAfter.forEach(special => {
        if (headerOrder.has(special) && !ordered.includes(special)) {
          ordered.push(special);
        }
      });
      insertedAfter = true;
    }
  });

  if (!insertedAfter) {
    specialAfter.forEach(special => {
      if (headerOrder.has(special) && !ordered.includes(special)) {
        ordered.push(special);
      }
    });
  }

  ensureColumns(sheet, ordered.length);
  sheet.getRange(1, 1, 1, ordered.length).setValues([ordered]);
  return ordered;
}

function formatDiagramNotes(raw) {
  if (!raw) {
    return '';
  }

  let notes;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return '';
    }
    try {
      notes = JSON.parse(trimmed);
    } catch (err) {
      return trimmed;
    }
  } else {
    notes = raw;
  }

  if (!Array.isArray(notes)) {
    return typeof notes === 'string' ? notes : '';
  }

  const formatted = notes
    .map(item => {
      if (!item) {
        return '';
      }
      const part = (item.partName || '').toString().trim();
      const note = (item.noteText || '').toString().trim();
      if (part && note) {
        return part + ': ' + note;
      }
      return part || note;
    })
    .filter(Boolean);

  return formatted.join(' | ');
}

function toCanonicalHeader(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) {
    return '';
  }

  if (raw === 'FECHA_REGISTRO') {
    return 'FECHA_REGISTRO';
  }

  if (CANONICAL_HEADERS.has(raw)) {
    return raw;
  }

  if (COLUMN_NAME_MAP[raw]) {
    return COLUMN_NAME_MAP[raw];
  }

  const lower = raw.toLowerCase();
  if (COLUMN_NAME_MAP[lower]) {
    return COLUMN_NAME_MAP[lower];
  }

  const normalized = raw
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/\s+/g, '_')
    .toUpperCase();

  if (normalized === 'TIMESTAMP') {
    return 'FECHA_REGISTRO';
  }

  if (normalized === 'DIAGRAMA_DANOS' || normalized === 'DIAGRAMA_NOTAS' || normalized === 'DIAGRAMANOTAS') {
    return 'DIAGRAMA';
  }

  if (CANONICAL_HEADERS.has(normalized)) {
    return normalized;
  }

  return normalized;
}

function ensureColumns(sheet, requiredColumns) {
  const maxColumns = sheet.getMaxColumns();
  if (maxColumns < requiredColumns) {
    sheet.insertColumnsAfter(maxColumns, requiredColumns - maxColumns);
  }
}
