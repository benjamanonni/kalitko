# Decisiones de implementación

- La referencia visual es `referencias/demo-b-aprobada-por-benja.html`; no se publica ni se importa como código de producción.
- El sitio se sirve directamente desde `site/`, sin framework, bundler ni backend.
- La interfaz, el estado del carrito y los cálculos comerciales viven en módulos separados.
- `config.js` contiene únicamente el umbral de 12.000 g que consume la aplicación; no declara flags sin efecto.
- El catálogo usa JSON y rotula todos los importes como ilustrativos.
- El mínimo mayorista de la demo es 12.000 g. Como hipótesis provisional, combina variedades elegibles y excluye hierbas/blends; ambas reglas requieren confirmación comercial.
- `commerce/preview.js` genera únicamente una vista previa local. No existe checkout real, no se abre WhatsApp y no se envían datos.
- El logo oficial se usa sin redibujarlo. Las imágenes de campaña se describen como recursos publicitarios, no como documentos históricos.
- El logo conserva el PNG original. Las tres fotografías entregadas para Historia se exportaron a WebP (calidad 86); la comparación antes/después dio un error RMS de 2,24 a 2,60 sobre 255 y redujo su peso combinado.
- La imagen principal se carga con prioridad alta; las imágenes bajo el pliegue usan carga diferida y todas declaran dimensiones reales.
- `referencias/` se ignora en Git y nunca forma parte de la carpeta pública.

