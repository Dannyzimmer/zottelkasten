# Zotero Zettelkasten

Plugin para **Zotero 7 o superior** (probado con Zotero 10) que genera, a partir
de un elemento seleccionado, una nota de bibliografía en Markdown lista para
Obsidian/Zettelkasten. La nota incluye un frontmatter (título, fecha, cita
completa, cita corta, tipo y tags) y, opcionalmente, las anotaciones de los PDF
(comentario y texto resaltado) y las notas hijas del elemento.

La nota se puede:

- **Copiar al portapapeles**, o
- **Crear como archivo `.md`** en una carpeta configurada. El nombre del archivo
  es el contenido del campo `cite` (por ejemplo `Hinton et al., 2015.md`).

## Requisitos

- Zotero 7 o superior (probado con Zotero 10)
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

## Uso

Selecciona un único elemento regular en la biblioteca, haz clic derecho y abre
el submenú **Zettelkasten**:

- **Copiar nota de bibliografía**: solo la cabecera YAML.
- **Copiar nota con anotaciones**: cabecera + anotaciones de los PDF
  (comentario y texto resaltado) y notas hijas.
- **Crear archivo de nota de bibliografía**: solo la cabecera YAML.
- **Crear archivo con anotaciones**: cabecera + anotaciones y notas hijas.
- **Actualizar anotaciones**: reemplaza el cuerpo de un archivo ya creado.

Si el archivo ya existe, al crearlo se muestra un aviso y no se sobrescribe.

**Actualizar anotaciones** solo está activa si el archivo ya se ha creado (misma
carpeta y nombre). Al pulsarla se pide confirmación, ya que se reemplaza todo el
cuerpo del archivo (lo que hay después de la cabecera YAML) con las anotaciones
y notas hijas actuales; la cabecera YAML no se toca. Si el elemento no tiene
anotaciones ni notas hijas, no se modifica el archivo. Si el archivo no empieza
por una cabecera YAML, se cancela para no perder datos.

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
`package.json`; el `update_url` del manifiesto se genera a partir de él.

Zotero exige que `applications.zotero.update_url` exista y **no esté vacío**: un
`update_url` vacío o ausente impide instalar el plugin. Por eso el valor por
defecto apunta a las releases del repositorio indicado en `repository`.
