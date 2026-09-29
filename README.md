# Kalitkó — sitio demostrativo

Base estática y modular derivada de la Demo B aprobada visualmente. Esta primera entrega funciona en modo demostración: los precios no son vigentes y ningún pedido se envía.

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

En Cloudflare Pages, configurar `site/` como directorio de publicación y dejar vacío el comando de build. El sitio conserva `noindex` y el checkout desactivado hasta que se aprueben datos y reglas comerciales.

Las decisiones técnicas están en `docs/decisions.md`; los datos pendientes, en `docs/pending.md`; y la revisión manual, en `docs/qa-checklist.md`.

