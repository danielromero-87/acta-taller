# Documentación del Proyecto: Sistema de Actas 8/7 Autos

## 1. Introducción

Este proyecto es un sistema de gestión de vehículos para el taller de servicio automotriz "8/7 Autos". Su objetivo principal es digitalizar y automatizar el proceso de registro y entrega de vehículos, reemplazando los formularios en papel por un flujo de trabajo digital eficiente y transparente.

El sistema se compone de dos formularios web principales:

1.  **Acta de Ingreso**: Permite documentar de forma exhaustiva el estado de un vehículo cuando llega al taller. Registra datos del propietario, información del vehículo, un inventario de los objetos presentes y, de manera crucial, un diagrama interactivo para señalar con precisión cualquier daño preexistente (golpes, rayones).
2.  **Acta de Entrega**: Facilita el registro de todos los servicios realizados en el vehículo y la conformidad del cliente al retirarlo del taller. Actualmente ambos formularios conviven dentro de un único HTML (`taller-actas-87.html`) que permite cambiar entre ellos mediante un selector.

El propósito es mejorar la transparencia con el cliente, crear un registro digital robusto para la trazabilidad y agilizar la comunicación y la entrega de documentos.

## 2. Tecnologías Utilizadas

El sistema está construido con tecnologías web estándar y aprovecha el ecosistema de Google para el backend, lo que lo hace robusto y de bajo costo.

*   **Frontend**:
    *   **HTML5**: Toda la interfaz se entrega desde `taller-actas-87.html`, que alberga ambos formularios y la lógica de cambio entre ellos.
    *   **CSS3**: Para el diseño y la presentación, utilizando Google Fonts (Poppins) para la tipografía y estilos responsive que permiten operar desde dispositivos móviles.
    *   **JavaScript (Vanilla JS)**: Para toda la lógica del lado del cliente, incluyendo el selector de formularios, la interactividad de cada flujo, la manipulación del DOM, la creación de los diagramas de daños con SVG y la captura de firmas digitales en elementos `<canvas>`. No se utilizan frameworks externos como React o Angular.

*   **Backend**:
*   **Google Apps Script**: Un único endpoint (`Code.gs`) despliega la aplicación web y decide en qué pestaña del Google Sheets guardar cada envío según el `tipoFormulario` recibido (`ingreso` o `entrega`).
    *   Además, el backend dispara correos de confirmación al cliente (dirección escrita en el formulario) y copia oculta a los correos internos definidos en `INTERNAL_RECIPIENTS`.

*   **Base de Datos**:
    *   **Google Sheets**: Actúa como la base de datos del sistema. Cada envío de formulario (tanto de ingreso como de entrega) se guarda como una nueva fila en una hoja de cálculo de Google, permitiendo un fácil acceso y gestión de los registros.

*   **Almacenamiento de Archivos**:
    *   **Google Drive**: Se utiliza para almacenar las imágenes de las firmas (capturadas en los formularios y guardadas como archivos PNG) y para alojar la plantilla de Google Docs que sirve de base para generar el acta de entrega en PDF.

*   **Control de Versiones**:
    *   **Git**: Para el seguimiento de los cambios en el código.
    *   **GitHub**: Como repositorio remoto para alojar el código del proyecto.

## 3. Funcionamiento Detallado

El flujo de trabajo del sistema se divide en dos procesos principales: el ingreso y la entrega del vehículo.

### Frontend (Lo que pasa en el navegador)

1.  **Flujo de Ingreso (`taller-actas-87.html`, sección Ingreso)**:
    *   Un técnico del taller abre este formulario en un navegador.
    *   Rellena la información del propietario y del vehículo.
    *   Realiza un inventario marcando casillas de verificación para los elementos presentes en el coche (gato, herramientas, etc.).
    *   Utiliza el **diagrama de vehículo interactivo**: hace clic en la imagen del coche para marcar la ubicación de cualquier daño. Escribe una descripción del daño (ej. "Rayón profundo"), y la nota aparece a un lado, conectada por una línea al punto exacto del clic.
    *   Describe la falla reportada por el cliente o el trabajo a realizar.
    *   El cliente y el técnico firman digitalmente en los recuadros de firma (`<canvas>`).
    *   Al pulsar "Enviar", el JavaScript del navegador recopila todos los datos (incluyendo las notas del diagrama como un texto JSON y las firmas como imágenes Base64) y los envía al backend único de Google Apps Script junto con `tipoFormulario: "ingreso"`.
    *   Tras el envío se muestra un aviso flotante en la parte superior confirmando el éxito o indicando el error, evitando los `alert()` del navegador y dejando la página lista para registrar otro vehículo.

2.  **Flujo de Entrega (`taller-actas-87.html`, sección Entrega)**:
    *   Cuando el trabajo ha finalizado, el técnico abre este segundo formulario.
    *   Rellena los datos del cliente y del vehículo.
    *   Selecciona los servicios que se realizaron de una lista de categorías dinámicas. Los servicios seleccionados aparecen como "etiquetas" para una fácil visualización.
    *   Añade observaciones finales sobre el servicio.
    *   El cliente y el técnico vuelven a firmar para confirmar la entrega y la conformidad.
    *   Al pulsar "Enviar", JavaScript recopila toda la información y la envía al mismo endpoint de Google Apps Script con `tipoFormulario: "entrega"`, mostrando el mismo aviso flotante de confirmación.

### Backend (Lo que pasa en el servidor de Google)

1.  **Proceso unificado (`Code.gs`)**:
    *   El script de Google Apps Script recibe la petición `POST` con los datos serializados en JSON.
    *   Analiza el `tipoFormulario` para identificar si el envío corresponde al ingreso o a la entrega y selecciona la pestaña "Actas_Ingreso" o "Actas_Entrega" dentro del mismo Google Sheets.
    *   Si la pestaña no existe, la crea dinámicamente y escribe los encabezados con las claves recibidas.
    *   Garantiza que todas las columnas de la hoja contengan los encabezados necesarios, agregando columnas nuevas cuando el frontend envía campos adicionales.
    *   Adjunta un `timestamp` y agrega la fila al final de la hoja. En esta fase todavía no se procesan firmas ni se generan PDFs; el código está preparado para extenderse con esas funciones más adelante si se requiere.
    *   Envía un correo al cliente con el resumen del acta y copia a los correos internos configurados, manteniendo trazabilidad automática.

## 4. Control de Versiones con Git

Para gestionar el código de este proyecto y subirlo a un repositorio en GitHub, se utilizarían los siguientes comandos básicos de Git en la terminal:

1.  **Verificar el estado de los archivos**:
    ```bash
    git status
    ```
    Este comando muestra qué archivos han sido modificados, cuáles son nuevos y cuáles están listos para ser confirmados.

2.  **Añadir archivos al área de preparación (Staging)**:
    ```bash
    git add .
    ```
    Este comando añade todos los archivos nuevos o modificados al área de preparación, dejándolos listos para ser incluidos en el próximo "commit". Para añadir solo un archivo específico, se usaría `git add nombre_del_archivo.html`.

3.  **Confirmar los cambios (Commit)**:
    ```bash
    git commit -m "docs: Create initial project documentation"
    ```
    Este comando guarda una instantánea de los cambios preparados. El mensaje (`-m`) debe ser descriptivo, explicando qué se hizo. Se recomienda seguir un estándar como [Conventional Commits](https://www.conventionalcommits.org/).

4.  **Subir los cambios a GitHub**:
    ```bash
    git push origin main
    ```
    Este comando sube la rama local (`main`) al repositorio remoto configurado como `origin` (que normalmente es GitHub).

## 5. Estado actual y archivos clave

*   **HTML unificado**: `taller-actas-87.html` contiene la página completa con ambos formularios, los estilos responsive y toda la lógica JavaScript del frontend.
*   **Backend Apps Script**: `Code.gs` implementa la función `doPost(e)` que orquesta el guardado en las hojas `Actas_Ingreso` y `Actas_Entrega`.
    *   Variables clave a ajustar: `INTERNAL_RECIPIENTS` (lista de correos internos que recibirán copia) y `EMAIL_SENDER_NAME` (nombre que verá el destinatario).
*   **Diagramas y firmas**: El diagrama del vehículo usa un `<map>` actualizado con zonas interactivas y el almacenamiento de firmas se realiza en `<canvas>` dentro del mismo HTML.
*   **Último commit de referencia**: `docs: registrar estado tras unificacion` (consulta `git log -1 --oneline` para obtener el hash exacto). El commit anterior clave fue `92a95e5 feat: integrar actas en pagina unificada`.


## 6. Historial de problemas y soluciones recientes

### 6.1 Enlace de despliegue correcto
- **Problema detectado:** el formulario unificado `taller-actas-87.html` conservaba el marcador `TU_DEPLOY_ID`, por lo que las peticiones `POST` nunca alcanzaban el Apps Script publicado.
- **Solución aplicada:** se reemplazó el marcador por el endpoint real `https://script.google.com/macros/s/AKfycbw0rUlut6x910q-bG-523tUmgEPJxfSpCvXVs0D0eKmhbP3gx_dYfqYn3Z727MeCceA/exec` y se instruyó a redeployar el Web App tras cada cambio.
- **Resultado:** los formularios de ingreso y entrega envían datos correctamente al backend.

### 6.2 Vinculación con la hoja de cálculo
- **Problema detectado:** el script `Code.gs` todavía usaba el marcador `TU_ID_DE_GOOGLE_SHEET`, por lo que las ejecuciones fallaban al intentar abrir la hoja.
- **Solución aplicada:** se introdujo el ID real `11jWB0BdgNeKomlsA8iJNMaVUecg48Adv-5-bQLNpKy0` y se documentó cómo encontrarlo en la URL de Google Sheets.
- **Resultado:** los envíos se almacenan en las pestañas `Actas_Ingreso` y `Actas_Entrega` del libro correcto.

### 6.3 Normalización de encabezados y orden de columnas
- **Problema detectado:** los encabezados se guardaban con claves mezcladas (camelCase, español/inglés y `timestamp` al final) y las firmas aparecían en medio del dataset.
- **Solución aplicada:** se creó un mapeo explícito `COLUMN_NAME_MAP` en `Code.gs` que:
  - convierte todas las claves a mayúsculas en español;
  - añade `FECHA_REGISTRO` al inicio de cada fila;
  - reordena las columnas para ubicar `DIAGRAMA`, `DESCRIPCION_FALLA`, `FIRMA_CLIENTE` y `FIRMA_RESPONSABLE` inmediatamente después de `MUY_SUCIO`.
- **Resultado:** la hoja queda homogeneizada y lista para filtros, tablas dinámicas o integraciones externas.

### 6.4 Formato legible del diagrama de daños
- **Problema detectado:** el campo `diagramaNotas` se almacenaba como JSON bruto, dificultando su lectura en Google Sheets.
- **Solución aplicada:** se agregó la función `formatDiagramNotes` que transforma cada entrada en el patrón `Parte: descripción` separado por `|`, garantizando legibilidad sin perder contexto.
- **Resultado:** el personal del taller puede interpretar rápidamente los daños registrados desde la hoja.

### 6.5 Flujo recomendado tras cada cambio
1. Guardar los cambios en Apps Script (`Code.gs`).
2. Publicar una nueva versión del Web App (Manage deployments → Edit → New version → Deploy).
3. Recargar `taller-actas-87.html` y enviar formularios de prueba para confirmar el guardado en Sheets.

Estas notas sirven como bitácora de las incidencias recientes y facilitan futuras operaciones de mantenimiento.
