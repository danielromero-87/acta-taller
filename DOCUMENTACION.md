# Documentación del Proyecto: Sistema de Actas 8/7 Autos

## 1. Introducción

Este proyecto es un sistema de gestión de vehículos para el taller de servicio automotriz "8/7 Autos". Su objetivo principal es digitalizar y automatizar el proceso de registro y entrega de vehículos, reemplazando los formularios en papel por un flujo de trabajo digital eficiente y transparente.

El sistema se compone de dos formularios web principales:

1.  **Acta de Ingreso**: Permite documentar de forma exhaustiva el estado de un vehículo cuando llega al taller. Registra datos del propietario, información del vehículo, un inventario de los objetos presentes y, de manera crucial, un diagrama interactivo para señalar con precisión cualquier daño preexistente (golpes, rayones).
2.  **Acta de Entrega**: Facilita el registro de todos los servicios realizados en el vehículo. Al finalizar, genera un acta formal en PDF que se envía automáticamente por correo electrónico al cliente, documentando el trabajo hecho y el estado del vehículo a la entrega.

El propósito es mejorar la transparencia con el cliente, crear un registro digital robusto para la trazabilidad y agilizar la comunicación y la entrega de documentos.

## 2. Tecnologías Utilizadas

El sistema está construido con tecnologías web estándar y aprovecha el ecosistema de Google para el backend, lo que lo hace robusto y de bajo costo.

*   **Frontend**:
    *   **HTML5**: Para la estructura de los formularios.
    *   **CSS3**: Para el diseño y la presentación, utilizando Google Fonts (Poppins) para la tipografía.
    *   **JavaScript (Vanilla JS)**: Para toda la lógica del lado del cliente, incluyendo la interactividad de los formularios, la manipulación del DOM, la creación de los diagramas de daños con SVG y la captura de firmas digitales en elementos `<canvas>`. No se utilizan frameworks externos como React o Angular.

*   **Backend**:
    *   **Google Apps Script**: Funciona como el cerebro del sistema. Dos scripts separados (desplegados como aplicaciones web) reciben los datos de los formularios de ingreso y entrega para procesarlos.

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

1.  **Flujo de Ingreso (`acta_de_ingreso.html`)**:
    *   Un técnico del taller abre este formulario en un navegador.
    *   Rellena la información del propietario y del vehículo.
    *   Realiza un inventario marcando casillas de verificación para los elementos presentes en el coche (gato, herramientas, etc.).
    *   Utiliza el **diagrama de vehículo interactivo**: hace clic en la imagen del coche para marcar la ubicación de cualquier daño. Escribe una descripción del daño (ej. "Rayón profundo"), y la nota aparece a un lado, conectada por una línea al punto exacto del clic.
    *   Describe la falla reportada por el cliente o el trabajo a realizar.
    *   El cliente y el técnico firman digitalmente en los recuadros de firma (`<canvas>`).
    *   Al pulsar "Enviar", el JavaScript del navegador recopila todos los datos (incluyendo las notas del diagrama como un texto JSON y las firmas como imágenes Base64) y los envía al backend de Google Apps Script.

2.  **Flujo de Entrega (`Acta de Entrega.html`)**:
    *   Cuando el trabajo ha finalizado, el técnico abre este segundo formulario.
    *   Rellena los datos del cliente y del vehículo.
    *   Selecciona los servicios que se realizaron de una lista de categorías dinámicas. Los servicios seleccionados aparecen como "etiquetas" para una fácil visualización.
    *   Añade observaciones finales sobre el servicio.
    *   El cliente y el técnico vuelven a firmar para confirmar la entrega y la conformidad.
    *   Al pulsar "Enviar", JavaScript recopila toda la información y la envía a un segundo endpoint de Google Apps Script, dedicado al proceso de entrega.

### Backend (Lo que pasa en el servidor de Google)

1.  **Proceso de Ingreso**:
    *   El script de Google Apps Script correspondiente al ingreso recibe la petición `POST` con los datos del formulario.
    *   Decodifica las firmas en Base64 y las guarda como archivos de imagen PNG en una carpeta específica de Google Drive ("Firmas_Actas_Ingreso").
    *   Añade una nueva fila a la hoja de cálculo de "Ingresos" en Google Sheets con toda la información: datos del cliente, del vehículo, inventario, el JSON de las notas del diagrama y las URLs a las imágenes de las firmas guardadas.
    *   De forma similar al proceso de entrega, genera un PDF a partir de una plantilla de Google Docs y lo envía por correo al cliente como confirmación.

2.  **Proceso de Entrega**:
    *   El segundo script de Google Apps Script recibe los datos del formulario de entrega.
    *   También guarda las firmas de entrega en la carpeta de Google Drive.
    *   Añade una nueva fila a la hoja de cálculo de "Entregas" en Google Sheets.
    *   **Generación de PDF**: El script abre una plantilla predefinida de Google Docs, reemplaza los marcadores de posición (ej. `{{clientName}}`, `{{vehiclePlate}}`) con los datos del formulario, e incluso inserta las imágenes de las firmas directamente en el documento.
    *   **Envío de Correo**: Convierte el documento finalizado a formato PDF, le asigna un nombre (ej. `Acta_Entrega_PLACA123.pdf`) y lo envía automáticamente por correo electrónico al cliente, adjuntando el PDF.
    *   Finalmente, elimina la copia temporal del documento de Google Docs para mantener limpio el Drive.

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
