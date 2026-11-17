# SRBWeb

Descripción
-----------

`SRBWeb` es el sitio estático del proyecto SRB. Contiene la interfaz web, recursos estáticos (CSS, JS, fuentes y imágenes) y los archivos necesarios para desplegar una versión estática del sitio.

Características
---------------
- Estructura ligera basada en HTML, CSS y JavaScript.
- Uso de Bootstrap para grid y utilidades.
- Recursos organizados en carpetas: `css/`, `js/`, `img/`, `fonts/`.

Estructura del repositorio
--------------------------

- `index.html` — página principal.
- `css/` — hojas de estilo (Bootstrap y `main.css`).
- `js/` — scripts JavaScript (Bootstrap bundle y `slider.js`).
- `img/` — imágenes del sitio (subcarpetas para aliados y clientes).
- `fonts/` — fuentes utilizadas por el proyecto.

Instalación y uso
------------------

1. Clona el repositorio o descarga los archivos al equipo.
2. Abrir `index.html` en el navegador para una vista local rápida.

Servidor local (recomendado para desarrollo):

 - Con Python 3 (desde la raíz del proyecto):

```powershell
python -m http.server 8000
# luego abrir http://localhost:8000
```

 - Con Live Server (VS Code): Instala la extensión "Live Server" y pulsa "Go Live".

Desarrollo
---------

- Edita estilos en `css/main.css`.
- Edita scripts en `js/slider.js` o añade nuevos archivos en `js/`.
- Ten en cuenta que el proyecto incluye archivos de Bootstrap ya compilados en la carpeta `css/` y `js/`.

Buenas prácticas
----------------

- Versiona cambios con Git y crea ramas para funcionalidades nuevas.
- Optimiza imágenes antes de añadirlas a `img/` para mejorar rendimiento.


Licencia
--------

Este repositorio no incluye una licencia explícita. Añade una licencia si deseas permitir usos específicos (por ejemplo, MIT, Apache-2.0).

Contacto
-------

Para preguntas o soporte, contacta al mantenedor del proyecto.
