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

2.  **Flujo de Entrega (`taller-actas-87.html`, sección Entrega)**:
    *   Cuando el trabajo ha finalizado, el técnico abre este segundo formulario.
    *   Rellena los datos del cliente y del vehículo.
    *   Selecciona los servicios que se realizaron de una lista de categorías dinámicas. Los servicios seleccionados aparecen como "etiquetas" para una fácil visualización.
    *   Añade observaciones finales sobre el servicio.
    *   El cliente y el técnico vuelven a firmar para confirmar la entrega y la conformidad.
    *   Al pulsar "Enviar", JavaScript recopila toda la información y la envía al mismo endpoint de Google Apps Script con `tipoFormulario: "entrega"`.

### Backend (Lo que pasa en el servidor de Google)

1.  **Proceso unificado (`Code.gs`)**:
    *   El script de Google Apps Script recibe la petición `POST` con los datos serializados en JSON.
    *   Analiza el `tipoFormulario` para identificar si el envío corresponde al ingreso o a la entrega y selecciona la pestaña "Actas_Ingreso" o "Actas_Entrega" dentro del mismo Google Sheets.
    *   Si la pestaña no existe, la crea dinámicamente y escribe los encabezados con las claves recibidas.
    *   Garantiza que todas las columnas de la hoja contengan los encabezados necesarios, agregando columnas nuevas cuando el frontend envía campos adicionales.
    *   Adjunta un `timestamp` y agrega la fila al final de la hoja. En esta fase todavía no se procesan firmas ni se generan PDFs; el código está preparado para extenderse con esas funciones más adelante si se requiere.

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
*   **Diagramas y firmas**: El diagrama del vehículo usa un `<map>` actualizado con zonas interactivas y el almacenamiento de firmas se realiza en `<canvas>` dentro del mismo HTML.
*   **Último commit de referencia**: `docs: registrar estado tras unificacion` (consulta `git log -1 --oneline` para obtener el hash exacto). El commit anterior clave fue `92a95e5 feat: integrar actas en pagina unificada`.
