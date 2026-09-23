# Zotero Zettelkasten

Plugin para **Zotero 7 o superior** (probado con Zotero 9) que genera, a partir
de un elemento seleccionado, una
nota de bibliografía en Markdown lista para Obsidian/Zettelkasten. La nota
incluye un frontmatter (título, fecha, cita completa, cita corta, tipo y tags)
y, si el elemento tiene anotaciones en PDF, el comentario y el texto resaltado.

La nota se puede:

- **Copiar al portapapeles**, o
- **Crear como archivo `.md`** en una carpeta configurada. El nombre del archivo
  es el contenido del campo `cite` (por ejemplo `Hinton et al., 2015.md`).

## Requisitos

- Zotero 7 o superior
- Node.js 18+ y npm (solo para compilar)

## Compilar

```bash
npm install
npm run build
```

El build genera el plugin empaquetado en:

```
.scaffold/build/zotero-zettelkasten.xpi
```

## Instalar

1. Abre Zotero.
2. Ve a **Herramientas → Complementos** (en algunas versiones, **Editar →
   Ajustes → Complementos**).
3. Pulsa el engranaje (arriba a la derecha) y elige **Install Plugin From
   File…**.
4. Selecciona `.scaffold/build/zotero-zettelkasten.xpi`.
5. Reinicia Zotero si el plugin lo solicita.

También puedes arrastrar el archivo `.xpi` sobre la ventana de Zotero.

## Configurar

Abre **Editar → Ajustes → Zettelkasten**:

- **Carpeta de destino**: carpeta donde se crearán los archivos `.md`. Si la
  dejas vacía, la opción de crear archivo mostrará un aviso.
- **Estilo de cita**: ID del estilo CSL (por defecto APA 7.ª edición,
  `http://www.zotero.org/styles/apa`).
- **Plantilla**: plantilla del frontmatter. Marcadores admitidos: `title`,
  `citation`, `cite` y `date` (con formato Moment.js, p. ej.
  `YYYY-MM-DDTHH:mm:ssZ`).
- **Incluir comentarios / texto resaltado** de las anotaciones.

## Uso

Selecciona un único elemento regular en la biblioteca, haz clic derecho y
elige alguna de estas opciones:

- **Copiar nota de bibliografía**
- **Crear archivo de nota de bibliografía**

Si el archivo ya existe, se muestra un aviso y no se sobrescribe.

## Desarrollo

Para arrancar Zotero con el plugin cargado desde el código fuente y recarga en
caliente:

```bash
ZOTERO_PLUGIN_ZOTERO_BIN_PATH="/home/dannyzimm/Programas/Zotero_linux-x86_64/zotero" npm start
```

Comprobación de tipos y formato:

```bash
npm run check
npm run format
```

## Publicación

Si publicas el plugin en otro repositorio, actualiza el campo `repository` de
`package.json` y, si quieres habilitar actualizaciones automáticas, el
`updateURL` en `zotero-plugin.config.ts`.
