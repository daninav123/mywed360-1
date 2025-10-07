from pathlib import Path
text = Path('docs/flujos-especificos/flujo-10-gestion-bodas-multiples.md').read_text(encoding='utf8')
old = "## 2. Trigger y rutas\n- /bodas (Bodas.jsx) lista bodas activas/archivadas.\n- Selector global WeddingSelector disponible cuando hay múltiples bodas.\n- /bodas/:id (BodaDetalle.jsx) hub de cada boda.\n"
new = "## 2. Trigger y rutas\n- Menú inferior (rol planner) → pestaña **Bodas** (/bodas, Bodas.jsx) lista activas y archivadas.\n- Owners acceden desde Home (widget "Gestiona tu boda") o desde onboarding; ambos caminos terminan en /bodas con la boda actual destacada.\n- Selector global WeddingSelector aparece cuando hay múltiples bodas y permite saltar a /bodas/:id (BodaDetalle.jsx).\n"
if old not in text:
    raise SystemExit('pattern not found')
Path('docs/flujos-especificos/flujo-10-gestion-bodas-multiples.md').write_text(text.replace(old, new), encoding='utf8')
