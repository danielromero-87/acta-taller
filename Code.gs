const SHEET_ID = '11jWB0BdgNeKomlsA8iJNMaVUecg48Adv-5-bQLNpKy0';

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
