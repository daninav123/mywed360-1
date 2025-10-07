from pathlib import Path
path = Path('docs/flujos-especificos/flujo-5-timeline-tareas.md')
text = path.read_text(encoding='utf8')
old = "## 2. Trigger y rutas\n- Menú lateral ? /tareas (kanban) y /checklist (lista).\n- Vista calendario /tareas/calendario (cuando habilitada).\n- Widgets y CTA desde dashboard/invitados/proveedores para crear tareas contextuales.\n"
new = "## 2. Trigger y rutas\n- Menú inferior → pestaña **Tareas** (/tareas) con acceso a la checklist (/checklist) desde el mismo módulo.\n- Vista calendario disponible en /tareas/calendario (cuando está habilitada) y Gantt enlazado en el panel superior.\n- Widgets en Home, Invitados, Proveedores y Finanzas disparan creación rápida de tareas contextuales.\n"
if old not in text:
    raise SystemExit('pattern not found')
path.write_text(text.replace(old, new), encoding='utf8')
