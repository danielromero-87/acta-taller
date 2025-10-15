const SHEET_ID = '11jWB0BdgNeKomlsA8iJNMaVUecg48Adv-5-bQLNpKy0';
const EMAIL_SENDER_NAME = '8/7 Autos';
const INTERNAL_RECIPIENTS = [
  'john.rodriguez@87autos.com',
  'asistente@87autos.com',
  'felixochosiete@gmail.com'
];

const DOC_TEMPLATE_IDS = {
  default: '18DTbB_ak1cXJiF7UqygSM4-AoaI1zzAAb0vJ59UAzDw',
  ingreso: '18DTbB_ak1cXJiF7UqygSM4-AoaI1zzAAb0vJ59UAzDw',
  entrega: '1OAO5OitkS30p06uW_0IweHCpFYS41H0GvZ-Na9PpRg4'
};

const FOLDER_ID = ''; // Opcional: ID de la carpeta de Drive donde se almacenarán las firmas
const SIGNATURE_STORAGE_MODE = 'BASE64'; // Valores soportados: 'DRIVE_URL', 'DRIVE_ID', 'BASE64'
const CLIENT_SIGNATURE_PLACEHOLDER = '{{firma del cliente}}';
const RESPONSIBLE_SIGNATURE_PLACEHOLDER = '{{firma del responsable}}';

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

const CLIENT_SIGNATURE_RAW_KEYS = [
  'signatureClient',
  'signature_client',
  'signatureClientUrl',
  'signature_client_url',
  'firmaCliente',
  'firma_cliente',
  'firmaClienteUrl',
  'firma_cliente_url',
  'signatureClientIngreso',
  'signature_client_ingreso',
  'firmaClienteIngreso',
  'firma_cliente_ingreso',
  'signatureClientEntrega',
  'signature_client_entrega',
  'firmaClienteEntrega',
  'firma_cliente_entrega'
];

const RESPONSIBLE_SIGNATURE_RAW_KEYS = [
  'signatureResponsible',
  'signature_responsible',
  'signatureResponsibleUrl',
  'signature_responsible_url',
  'firmaResponsable',
  'firma_responsable',
  'firmaResponsableUrl',
  'firma_responsable_url',
  'signatureResponsibleIngreso',
  'signature_responsible_ingreso',
  'firmaResponsableIngreso',
  'firma_responsable_ingreso',
  'signatureResponsibleEntrega',
  'signature_responsible_entrega',
  'firmaResponsableEntrega',
  'firma_responsable_entrega'
];

const CLIENT_SIGNATURE_ALIASES = buildSignatureAliasData(CLIENT_SIGNATURE_RAW_KEYS);
const RESPONSIBLE_SIGNATURE_ALIASES = buildSignatureAliasData(RESPONSIBLE_SIGNATURE_RAW_KEYS);

/**
 * Punto de entrada del webhook. Recibe el payload del formulario,
 * guarda los datos en Sheets, procesa la firma y dispara el flujo de PDF + correo.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Solicitud vacía o inválida.');
    }

    const rawPayload = JSON.parse(e.postData.contents);
    const formType = rawPayload.tipoFormulario === 'entrega' ? 'entrega' : 'ingreso';
    const scriptTimezone = Session.getScriptTimeZone() || 'America/Bogota';
    const timestamp = new Date();
    const registro = Utilities.formatDate(timestamp, scriptTimezone, 'yyyy-MM-dd HH:mm');

    const clientSignature = processSignatureFromPayload(rawPayload, CLIENT_SIGNATURE_RAW_KEYS, 'cliente', timestamp);
    const responsibleSignature = processSignatureFromPayload(rawPayload, RESPONSIBLE_SIGNATURE_RAW_KEYS, 'responsable', timestamp);

    const normalizedData = normalizePayload(rawPayload);
    normalizedData.FECHA_REGISTRO = timestamp;

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheetName = formType === 'entrega' ? 'Actas_Entrega' : 'Actas_Ingreso';
    const sheet = getOrCreateSheet(spreadsheet, sheetName);

    const headers = prepareHeaders(sheet, normalizedData);
    const row = headers.map(header => {
      if (header === 'FECHA_REGISTRO') {
        return normalizedData[header];
      }
      return normalizedData[header] !== undefined ? normalizedData[header] : '';
    });
    sheet.appendRow(row);

    generatePdfAndSendEmail({
      formType,
      normalizedData,
      rawPayload,
      registro,
      clientSignatureValue: clientSignature.storedValue,
      clientSignatureBlob: clientSignature.blob,
      responsibleSignatureValue: responsibleSignature.storedValue,
      responsibleSignatureBlob: responsibleSignature.blob
    });

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error('Error en doPost:', error);
    const message = error instanceof Error ? error.message : String(error);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Convierte los distintos alias de firma, la almacena (base64 o Drive)
 * y devuelve el valor que se guardará en Sheets junto con el Blob para el PDF.
 */
function processSignatureFromPayload(payload, keys, prefix, timestamp) {
  if (!keys || !keys.length) {
    return { storedValue: '', blob: null };
  }
  let rawValue = '';
  keys.some(key => {
    if (payload && payload[key]) {
      rawValue = payload[key];
      return true;
    }
    return false;
  });

  const fallbackName = `firma-${prefix}-${Utilities.formatDate(timestamp, Session.getScriptTimeZone() || 'UTC', 'yyyyMMdd-HHmmss')}.png`;
  const signatureData = normalizeSignatureValue(rawValue, fallbackName);

  keys.forEach((key, index) => {
    if (index === 0) {
      payload[key] = signatureData.storedValue || '';
    } else {
      delete payload[key];
    }
  });

  return signatureData;
}

/**
 * Normaliza una firma recibida en base64 o como ID/URL de Drive.
 * Devuelve el valor que irá a Sheets y, si es posible, el Blob para el PDF.
 */
function normalizeSignatureValue(rawValue, fallbackFileName) {
  if (!rawValue || typeof rawValue !== 'string') {
    return { storedValue: '', blob: null };
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return { storedValue: '', blob: null };
  }

  if (trimmed.startsWith('data:image')) {
    const blob = base64ToBlob(trimmed, fallbackFileName);
    if (SIGNATURE_STORAGE_MODE === 'BASE64') {
      return { storedValue: trimmed, blob };
    }
    const saved = saveSignatureToDrive(trimmed, fallbackFileName);
    if (!saved || (!saved.id && !saved.url)) {
      return { storedValue: trimmed, blob };
    }
    const storedValue = SIGNATURE_STORAGE_MODE === 'DRIVE_ID' ? saved.id : saved.url;
    return {
      storedValue,
      blob: saved.blob || blob
    };
  }

  return { storedValue: trimmed, blob: null };
}

/**
 * Convierte una cadena base64 (data URL) en un Blob utilizable en Apps Script.
 */
function base64ToBlob(base64String, defaultName) {
  if (!base64String || typeof base64String !== 'string') {
    return null;
  }
  const match = base64String.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return null;
  }
  const contentType = match[1];
  const bytes = Utilities.base64Decode(match[2]);
  return Utilities.newBlob(bytes, contentType, defaultName || 'firma.png');
}

/**
 * Guarda una firma en Drive y devuelve sus metadatos de acceso.
 */
function saveSignatureToDrive(base64Signature, filename) {
  const blob = base64ToBlob(base64Signature, filename);
  if (!blob) {
    return { id: '', url: '', blob: null };
  }
  try {
    const folder = getSignatureFolder();
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return {
      id: file.getId(),
      url: file.getUrl(),
      blob: file.getBlob()
    };
  } catch (error) {
    console.error('No se pudo guardar la firma en Drive:', error);
    return { id: '', url: '', blob: null };
  }
}

/**
 * Devuelve el Blob de una firma almacenada en base64 o en Google Drive.
 */
function getSignatureBlob(signatureCellValue) {
  if (!signatureCellValue || typeof signatureCellValue !== 'string') {
    return null;
  }
  const trimmed = signatureCellValue.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('data:image')) {
    return base64ToBlob(trimmed, 'firma-cliente.png');
  }

  const fileId = extractDriveFileId(trimmed);
  if (!fileId) {
    return null;
  }
  try {
    return DriveApp.getFileById(fileId).getBlob();
  } catch (error) {
    console.error('No se pudo obtener la firma desde Drive:', error);
    return null;
  }
}

/**
 * Obtiene la carpeta destino para las firmas, o el root del usuario si no se configuró.
 */
function getSignatureFolder() {
  if (FOLDER_ID) {
    try {
      return DriveApp.getFolderById(FOLDER_ID);
    } catch (error) {
      console.warn('No se pudo acceder a la carpeta configurada. Se usa la carpeta raíz. Detalle:', error);
    }
  }
  return DriveApp.getRootFolder();
}

/**
 * Orquesta la generación del PDF y el envío del correo de notificación.
 */
function generatePdfAndSendEmail(options) {
  try {
    const formType = options.formType;
    const normalizedData = options.normalizedData || {};
    const rawPayload = options.rawPayload || {};
    const registro = options.registro || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'America/Bogota', 'yyyy-MM-dd HH:mm');

    const internalRecipients = (INTERNAL_RECIPIENTS || [])
      .map(email => (typeof email === 'string' ? email.trim() : ''))
      .filter(isValidEmail);

    const clientEmailCandidate = formType === 'ingreso'
      ? (rawPayload.correo || rawPayload.clientEmail || '')
      : (rawPayload.clientEmail || rawPayload.correo || '');
    const clientEmail = isValidEmail(clientEmailCandidate) ? clientEmailCandidate.trim() : '';

    if (!clientEmail && internalRecipients.length === 0) {
      console.warn('No hay destinatarios válidos para enviar la notificación.');
      return;
    }

    const clientSignatureBlob = options.clientSignatureBlob || getSignatureBlob(options.clientSignatureValue);
    const responsibleSignatureBlob = options.responsibleSignatureBlob || getSignatureBlob(options.responsibleSignatureValue);

    const pdfBlob = buildPdfFromTemplate({
      formType,
      normalizedData,
      rawPayload,
      registro,
      clientSignatureBlob,
      responsibleSignatureBlob
    });

    const plate = rawPayload.placa || rawPayload.vehiclePlate || 'sin placa';
    const subject = `[8/7 Autos] Acta de ${formType === 'ingreso' ? 'Ingreso' : 'Entrega'} - ${plate}`;
    const emailBodies = buildEmailBodiesForPdf(formType, rawPayload, plate, registro, !!pdfBlob);

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
      htmlBody: emailBodies.html,
      body: emailBodies.text,
      bcc: bccList.length ? bccList.join(',') : undefined,
      attachments: pdfBlob ? [pdfBlob] : undefined,
      noReply: true
    });
  } catch (error) {
    console.error('No se pudo generar el PDF o enviar el correo:', error);
  }
}

/**
 * Crea una copia de la plantilla, inserta datos y devuelve el PDF resultante.
 */
function buildPdfFromTemplate(options) {
  const templateId = (DOC_TEMPLATE_IDS && (DOC_TEMPLATE_IDS[options.formType] || DOC_TEMPLATE_IDS.default)) || '';
  if (!templateId) {
    console.warn('No hay plantilla configurada para el tipo de formulario:', options.formType);
    return null;
  }

  try {
    const templateFile = DriveApp.getFileById(templateId);
    const fileName = buildActaFileName(options.formType, options.rawPayload, options.registro);
    const copy = templateFile.makeCopy(fileName + ' (editable)');
    const docId = copy.getId();

    const doc = DocumentApp.openById(docId);
    const placeholders = buildTemplatePlaceholders(options.formType, options.normalizedData, options.rawPayload, options.registro);
    applyTextPlaceholders(doc.getBody(), placeholders);
    doc.saveAndClose();

    insertSignatureInDoc(docId, options.clientSignatureBlob, CLIENT_SIGNATURE_PLACEHOLDER);
    insertSignatureInDoc(docId, options.responsibleSignatureBlob, RESPONSIBLE_SIGNATURE_PLACEHOLDER);

    const pdfBlob = copy.getAs(MimeType.PDF).setName(fileName + '.pdf');
    copy.setTrashed(true);
    return pdfBlob;
  } catch (error) {
    console.error('Error al construir el PDF:', error);
    return null;
  }
}

/**
 * Inserta una firma en el documento copiando el Blob en la posición del marcador.
 */
function insertSignatureInDoc(docId, signatureBlob, placeholder) {
  if (!signatureBlob) {
    return;
  }

  const token = (placeholder || CLIENT_SIGNATURE_PLACEHOLDER).trim();
  const normalizedToken = token.replace(/[{}]/g, '').trim();
  if (!normalizedToken) {
    return;
  }

  const searchPattern = `\\{\\{\\s*${escapeRegExp(normalizedToken)}\\s*\\}\\}`;

  try {
    const doc = DocumentApp.openById(docId);
    const body = doc.getBody();
    let range = body.findText(searchPattern);
    let inserted = false;

    while (range) {
      const element = range.getElement();
      if (element && element.getType() === DocumentApp.ElementType.TEXT) {
        let insertedHere = false;
        const text = element.asText();
        const start = range.getStartOffset();
        const end = range.getEndOffsetInclusive();
        text.deleteText(start, end);

        const parent = element.getParent();
        const blob = signatureBlob.copyBlob();

        if (parent) {
          const elementIndex = parent.getChildIndex(element);
          const parentType = parent.getType();

          if (parentType === DocumentApp.ElementType.PARAGRAPH) {
            parent.asParagraph().insertInlineImage(elementIndex + 1, blob);
            insertedHere = true;
          } else if (parentType === DocumentApp.ElementType.LIST_ITEM) {
            parent.asListItem().insertInlineImage(elementIndex + 1, blob);
            insertedHere = true;
          } else if (parentType === DocumentApp.ElementType.TABLE_CELL) {
            const paragraph = parent.asTableCell().insertParagraph(elementIndex + 1, '');
            paragraph.insertInlineImage(0, blob);
            insertedHere = true;
          } else if (parentType === DocumentApp.ElementType.BODY_SECTION) {
            parent.asBody().insertParagraph(elementIndex + 1, '').insertInlineImage(0, blob);
            insertedHere = true;
          }
        }

        if (!insertedHere) {
          body.appendParagraph('').insertInlineImage(0, blob);
          insertedHere = true;
        }

        inserted = inserted || insertedHere;
      }

      range = body.findText(searchPattern, range);
    }

    if (!inserted) {
      body.appendParagraph('').insertInlineImage(0, signatureBlob.copyBlob());
    }

    doc.saveAndClose();
  } catch (error) {
    console.error('No se pudo insertar la firma en el documento:', error);
  }
}

/**
 * Genera los textos y HTML del correo según exista o no PDF.
 */
function buildEmailBodiesForPdf(formType, rawPayload, plate, registro, pdfGenerated) {
  const customerName =
    (formType === 'ingreso'
      ? rawPayload.propietario || rawPayload.clientName
      : rawPayload.clientName || rawPayload.propietario) || 'cliente';

  const actaLabel = formType === 'ingreso' ? 'ingreso' : 'entrega';
  const introHtml = `Hola ${customerName}, registramos el ${actaLabel} del vehículo ${plate} el ${registro}.`;
  const introText = `Hola ${customerName}, registramos el ${actaLabel} del vehículo ${plate} el ${registro}.`;
  const pdfParagraphHtml = pdfGenerated
    ? 'Adjuntamos el acta en formato PDF para tu consulta y archivo personal.'
    : 'No se pudo generar el PDF automáticamente; por favor contacta al equipo administrativo para obtenerlo.';
  const pdfParagraphText = pdfGenerated
    ? 'Adjuntamos el acta en formato PDF para tu consulta y archivo personal.'
    : 'No se pudo generar el PDF automáticamente; por favor contacta al equipo administrativo para obtenerlo.';

  const html = `
    <div style="font-family:'Poppins',Arial,sans-serif;color:#273043;font-size:14px;line-height:1.6;">
      <p>${introHtml}</p>
      <p>${pdfParagraphHtml}</p>
      <p>Gracias por confiar en 8/7 Autos.</p>
      <p>Atentamente,<br>Equipo 8/7 Autos</p>
    </div>
  `;

  const text = [
    introText,
    '',
    pdfParagraphText,
    '',
    'Gracias por confiar en 8/7 Autos.',
    'Atentamente,',
    'Equipo 8/7 Autos'
  ].join('\n');

  return { html, text };
}

/**
 * Construye el mapa de marcadores para renderizar la plantilla del acta.
 */
function buildTemplatePlaceholders(formType, normalizedData, rawPayload, registro) {
  const timezone = Session.getScriptTimeZone() || 'America/Bogota';
  const skipKeys = new Set(['FIRMA_CLIENTE', 'FIRMA_RESPONSABLE']);
  const placeholders = {};

  Object.keys(normalizedData || {}).forEach(key => {
    if (skipKeys.has(key)) {
      return;
    }
    placeholders[key] = formatValueForTemplate(normalizedData[key], timezone);
  });

  placeholders.FECHA_REGISTRO = registro;
  placeholders.FORMULARIO = formType === 'ingreso' ? 'Acta de ingreso' : 'Acta de entrega';
  placeholders.PLACA = rawPayload.placa || rawPayload.vehiclePlate || placeholders.PLACA || '';
  placeholders.NOMBRE_CLIENTE = rawPayload.clientName || rawPayload.propietario || placeholders.NOMBRE_CLIENTE || '';
  placeholders.PROPIETARIO = rawPayload.propietario || placeholders.NOMBRE_CLIENTE || '';
  placeholders.INVENTARIO_COMPLETO = resumenInventario(rawPayload);
  placeholders.NOTAS_DEL_DIAGRAMA = placeholders.DIAGRAMA || '';
  placeholders.DIAGRAMA_RESUMEN = placeholders.DIAGRAMA || '';

  return placeholders;
}

/**
 * Reemplaza los marcadores de texto {{TOKEN}} por los valores indicados.
 */
function applyTextPlaceholders(body, placeholders) {
  if (!placeholders) {
    return;
  }
  Object.keys(placeholders).forEach(key => {
    const value = placeholders[key] == null ? '' : String(placeholders[key]);
    const variants = new Set([
      key,
      key.toLowerCase(),
      key.replace(/_/g, ''),
      toLowerCamel(key)
    ]);
    variants.forEach(token => {
      if (!token) {
        return;
      }
      const pattern = `\\{\\{\\s*${escapeRegExp(token)}\\s*\\}\\}`;
      body.replaceText(pattern, value);
    });
  });
}

/**
 * Normaliza el payload del formulario a los encabezados esperados en Sheets.
 */
function normalizePayload(payload) {
  const normalized = {};

  Object.keys(payload || {}).forEach(key => {
    if (key === 'timestamp') {
      return;
    }

    const normalizedKey = normalizeSignatureKey(key);
    if (CLIENT_SIGNATURE_ALIASES.set.has(normalizedKey)) {
      const header = COLUMN_NAME_MAP.signatureClient || toCanonicalHeader('signatureClient');
      if (header) {
        normalized[header] = payload[key];
      }
      return;
    }
    if (RESPONSIBLE_SIGNATURE_ALIASES.set.has(normalizedKey)) {
      const header = COLUMN_NAME_MAP.signatureResponsible || toCanonicalHeader('signatureResponsible');
      if (header) {
        normalized[header] = payload[key];
      }
      return;
    }

    const header = COLUMN_NAME_MAP[key] || toCanonicalHeader(key);
    if (header) {
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

/**
 * Asegura que los encabezados existan y estén en el orden correcto antes de insertar la fila.
 */
function prepareHeaders(sheet, normalizedData) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  let existingHeadersRaw = [];

  if (lastRow >= 1 && lastColumn > 0) {
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

  Object.keys(normalizedData || {}).forEach(header => {
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

/**
 * Devuelve (o crea) la pestaña correspondiente en el Spreadsheet.
 */
function getOrCreateSheet(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  return sheet || spreadsheet.insertSheet(sheetName);
}

/**
 * Convierte los valores del diagrama en un resumen legible.
 */
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

/**
 * Construye el nombre del archivo PDF a generar.
 */
function buildActaFileName(formType, rawPayload, registro) {
  const basePlate = (rawPayload.placa || rawPayload.vehiclePlate || 'SIN_PLACA')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '_');

  const cleanTimestamp = (registro || '').replace(/[^0-9]/g, '');
  return `Acta-${formType === 'ingreso' ? 'Ingreso' : 'Entrega'}-${basePlate}-${cleanTimestamp || Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHHmmss')}`;
}

/**
 * Resume los elementos inventariados marcados como "sí".
 */
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

function formatValueForTemplate(value, timezone) {
  if (value == null) {
    return '';
  }

  if (value instanceof Date) {
    return Utilities.formatDate(value, timezone, 'yyyy-MM-dd HH:mm');
  }

  if (Array.isArray(value)) {
    return value
      .map(item => formatValueForTemplate(item, timezone))
      .filter(Boolean)
      .join(', ');
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (err) {
      return String(value);
    }
  }

  return String(value);
}

function extractDriveFileId(value) {
  if (!value) {
    return '';
  }
  const directIdPattern = /^[a-zA-Z0-9_-]{20,}$/;
  if (directIdPattern.test(value)) {
    return value;
  }
  const match = String(value).match(/[-\w]{25,}/);
  return match ? match[0] : '';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toLowerCamel(value) {
  if (!value) {
    return '';
  }
  const lower = value.toLowerCase();
  if (lower.indexOf('_') === -1) {
    return lower;
  }
  return lower
    .split('_')
    .map((part, index) => {
      if (index === 0) {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

function normalizeSignatureKey(key) {
  return (key || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildSignatureAliasData(rawKeys) {
  const seen = new Set();
  const ordered = [];
  rawKeys.forEach(key => {
    const normalized = normalizeSignatureKey(key);
    if (!normalized || seen.has(normalized)) {
      return;
    }
    seen.add(normalized);
    ordered.push(normalized);
  });
  return { list: ordered, set: seen };
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
