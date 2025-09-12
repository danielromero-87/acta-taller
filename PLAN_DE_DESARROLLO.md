# Plan de Desarrollo: Refactorización del Acta de Ingreso

## Objetivo
Reconstruir desde cero la funcionalidad del "Acta de Ingreso" para asegurar que el formulario HTML envíe los datos a un Google Apps Script, el cual generará un PDF a partir de una plantilla de Google Doc y lo enviará por correo electrónico.

---

## Fase 1: Preparación del Entorno

### 1.1 Limpieza de Archivos Anteriores
- **Estado:** Completado.

---

## Fase 2: Creación de los Componentes

### 2.1 Creación del Archivo HTML
- **Estado:** Completado.

### 2.2 Creación del Google Apps Script
- **Acción:** Generar y proporcionar el código para un nuevo proyecto de Google Apps Script.
- **Estado:** Completado.

### 2.3 Tu Acción - Creación del Script
- **Acción del Usuario:** Crear un nuevo proyecto de Apps Script (vinculado a la Hoja de Cálculo), pegar el código proporcionado y guardarlo.
- **Estado:** Completado.

---

## Fase 3: Conexión y Publicación

### 3.1 Publicación del Script
- **Acción del Usuario:** Publicar el nuevo script como "Aplicación Web" y proporcionar la URL.
- **Estado:** Completado.

### 3.2 Conexión HTML -> Script
- **Acción:** Actualizar el archivo `acta_de_ingreso.html` con la URL del script.
- **Estado:** Completado.

---

## Fase 4: Pruebas y Despliegue

### 4.1 Subida a GitHub
- **Acción:** Subir la versión final de `acta_de_ingreso.html` y `PLAN_DE_DESARROLLO.md` al repositorio de GitHub.
- **Estado:** Pendiente.

### 4.2 Prueba de Aceptación del Usuario (UAT)
- **Acción del Usuario:** Acceder a la URL pública de GitHub Pages y realizar un envío de prueba completo.
- **Estado:** Pendiente.

---

## Fase 5: Versionado Final

### 5.1 Commit Final
- **Acción:** Una vez validado el funcionamiento, realizar un `commit` final para documentar la versión estable.
- **Estado:** Pendiente.
---

## Fase 6: Correcciones y Mejoras

### 6.1 Corrección de Firma en Tablets
- **Problema:** La funcionalidad de la firma no respondía en dispositivos táctiles (tablets).
- **Causa:** El código solo estaba programado para eventos de ratón (`mousedown`, `mousemove`) y no para eventos táctiles (`touchstart`, `touchmove`).
- **Solución:** Se modificó el archivo `acta_de_ingreso.html` para añadir los listeners de eventos táctiles necesarios, asegurando que la funcionalidad de dibujo en el canvas sea compatible tanto con ratón como con pantallas táctiles.
- **Estado:** Completado.

### 6.2 Corrección de Guardado de Datos en Google Sheets
- **Problema:** No todos los datos del formulario se estaban guardando en la hoja de cálculo de Google.
- **Causa:** El código del Google Apps Script no incluía todos los campos del formulario al momento de crear la nueva fila en el documento.
- **Solución:** Se actualizó la función `doPost` en el Google Apps Script para que el array `newRowData` contenga todos los campos enviados desde el formulario, incluyendo el inventario completo, estado del vehículo, fechas y notas.
- **Estado:** Completado.

### 6.3 Actualización de URL del Script
- **Problema:** El archivo `acta_de_ingreso.html` apuntaba a una URL de script desactualizada.
- **Causa:** Al redesplegar el Google Apps Script, se generó una nueva URL que no se había reflejado en el archivo HTML.
- **Solución:** Se actualizó la `scriptUrl` en `acta_de_ingreso.html` para que apunte al despliegue más reciente del script.
- **Estado:** Completado.
