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