# Decisiones de implementación

- La referencia visual es `referencias/demo-b-aprobada-por-benja.html`; no se publica ni se importa como código de producción.
- El sitio se sirve directamente desde `site/`, sin framework, bundler ni backend.
- La interfaz, el estado del carrito y los cálculos comerciales viven en módulos separados.
- El catálogo usa JSON y rotula todos los importes como ilustrativos.
- El mínimo mayorista de la demo es 12.000 g y solo suma productos de yerba marcados como elegibles.
- El checkout genera únicamente una vista previa local. No abre WhatsApp ni envía datos.
- El logo oficial se usa sin redibujarlo. Las imágenes de campaña se describen como recursos publicitarios, no como documentos históricos.
- `referencias/` se ignora en Git y nunca forma parte de la carpeta pública.

