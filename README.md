# Kalitkó — sitio demostrativo

Base estática y modular derivada de la Demo B aprobada visualmente. Esta primera entrega funciona en modo demostración: los precios no son vigentes y ningún pedido se envía.

## Arquitectura

- `site/data/products.json`: datos ilustrativos del catálogo.
- `site/js/config.js`: mínimo de 12.000 g usado por la demo.
- `site/js/commerce/pricing.js`: reglas comerciales y cálculos puros.
- `site/js/commerce/cart.js`: estado y operaciones del carrito.
- `site/js/commerce/preview.js`: construcción de la vista previa local, sin envío.
- `site/js/ui/`: catálogo, carrito, navegación y timeline.
- `site/js/utils/format.js`: formatos compartidos.

La combinación de variedades y la exclusión de hierbas/blends son hipótesis provisionales de la demo. Todavía requieren confirmación comercial.

## Requisitos

- Node.js 20 o posterior para servidor local y pruebas.
- No hay dependencias de producción ni proceso de compilación.

## Uso local

```powershell
npm start
```

Abrir `http://localhost:8000`. Como alternativa:

```powershell
python -m http.server 8000 --directory site
```

## Pruebas

```powershell
npm test
```

## Publicación

En Cloudflare Pages, configurar `site/` como directorio de publicación y dejar vacío el comando de build. El sitio conserva `noindex`. Solo genera una vista previa local: no abre WhatsApp, no envía pedidos y no cobra.

Las decisiones técnicas están en `docs/decisions.md`; los datos pendientes, en `docs/pending.md`; y la revisión manual, en `docs/qa-checklist.md`.

