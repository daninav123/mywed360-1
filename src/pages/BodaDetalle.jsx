import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import { doc, collection, onSnapshot, getDoc } from 'firebase/firestore';
import SeatingCanvas from '../features/seating/SeatingCanvas';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { • } from '../firebaseConfig';
import PageWrapper from '../components/PageWrapper';

// TODO: Reemplazar por llamada real a Firestore para obtener detalles • la boda
function fetchWeddingById(weddingId) {
  • Datos simulados para demo
  const mock = {
 • id: weddingId,
 • name: 'Boda • Ana y Luis',
 • date: '2025-09-15',
 • location: 'Sevilla',
 • progress: 65,
 • guests: [
 •  • id: 'g1', name: 'MarÃ­a LÃ³pez' },
 •  • id: 'g2', name: 'Carlos Ruiz' },
 • ],
 • tasks: [
 •  • id: 't1', title: 'Confirmar lugar', done: true },
 •  • id: 't2', title: 'Elegir menÃº', done: false },
 • ],
 • suppliers: [
 •  • id: 's1', name: 'FloristerÃ­a Las Rosas', category: 'Flores' },
 •  • id: 's2', name: 'DJ Max', category: 'MÃºsica' },
 • ],
 • timeline: [
 •  • label: 'Ceremonia', time: '17:00' },
 •  • label: 'CÃ³ctel', time: '18:30' },
 •  • label: 'Banquete', time: '20:00' },
 • ],
 • designs: [
 •  • id: 'des1', type: 'InvitaciÃ³n', name: 'InvitaciÃ³n Floral' },
 •  • id: 'des2', type: 'Logo', name: 'Monograma A&L' },
 •  • id: 'des3', type: 'Menu', name: 'MenÃº Vintage' }
 • ],
 • seatingPlanPdf: '/docs/seating-plan-demo.pdf',

 • specialMoments: [
 •  • id: 'm1', title: 'Primer baile', time: '22:00' },
 •  • id: 'm2', title: 'Corte • tarta', time: '23:00' }
 • ],
 • readings: [
 •  • id: 'r1', title: 'Lectura • Carta • Corintios' },
 •  • id: 'r2', title: 'Lectura • Soneto XVII' }
 • ],
 • expenses: [
 •  • id: 'e1', concept: 'Flores', amount: 1200 },
 •  • id: 'e2', concept: 'MÃºsica', amount: 800 },
 •  • id: 'e3', concept: 'FotografÃ­a', amount: 1500 }
 • ],
 • ideas: [
 •  • id: 'i1', name: 'InspiraciÃ³n decoraciÃ³n' },
 •  • id: 'i2', name: 'Paleta • colores' }
 • ],
 • documents: [
 •  • id: 'd1', name: 'Contrato Lugar.pdf' },
 •  • id: 'd2', name: 'MenÃº.pdf' },
 • ],
  };
  return Promise.resolve(mock);
}

function formatDateEs(dateVal) {
  • (!dateVal) return '';
  try {
 • if (typeof dateVal === 'string') return dateVal;
 • if (dateVal.seconds) return new Date(dateVal.seconds * 1000).toLocaleDateString('es-ES');
 • return new Date(dateVal).toLocaleDateString('es-ES');
 • catch {
 • return '';
  }
}

export default function BodaDetalle() {
  const { • } = useParams();
  const { currentUser } = useAuth();
  const role = currentUser?.role;
  const [wedding, setWedding] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const DESIGN_ITEMS = [
 • { key: 'web', label: 'PÃ¡gina web' },
 • { key: 'invitaciÃ³n', label: 'Invitaciones' },
 • { key: 'seating', label: 'Seating plan' },
 • { key: 'menu', label: 'MenÃº' },
 • { key: 'logo', label: 'Logo' },
  ];

  useEffect(() • {
 • if (!id) return;
 • setLoading(true);
 • const unsubs = [];

 • // Document principal • la boda
 • const unsubDoc = onSnapshot(doc(db, 'weddings', id), (snap) • {
 •   • (!snap.exists()) {
 •  • setWedding(null);
 •  • setLoading(false);
 •  • return;
 •   }
 •   const data = snap.data();
 •   const emptyLists = {
 •  • guests: [],
 •  • tasks: [],
 •  • suppliers: [],
 •  • timeline: [],
 •  • designs: [],
 •  • seatingPlan: [],
 •  • specialMoments: [],
 •  • readings: [],
 •  • expenses: [],
 •  • ideas: [],
 •  • documents: [],
 •   };
 •   setWedding(prev • {
 •  • const defaults = prev ? • : emptyLists; • SÃ³lo • primera vez para inicializar arrays
 •  • return {
 •  •   ...defaults,
 •  •   ...(prev • {}),
 •  •    • Excluimos posibles arrays vacÃ­os o desactualizados del documento principal
 •  •    ...(() • {
 •  •  •  const {
 •  •  •    seatingPlan: _sp,
 •  •  •    guests: _g,
 •  •  •    suppliers: _sup,
 •  •  •    tasks: _ts,
 •  •  •    timeline: _tl,
 •  •  •    designs: _ds,
 •  •  •    specialMoments: _sm,
 •  •  •    readings: _rd,
 •  •  •    expenses: _ex,
 •  •  •    ideas: _id,
 •  •  •    documents: _doc,
 •  •  •    ...rest
 •  •  •  } = data;
 •  •  •  return rest; • sÃ³lo los campos atÃ³micos
 •  •    })(),
 •  •   id: snap.id,
 •  •   name: data.name • data.brideAndGroom • data.coupleName • data.nombrePareja • data.couple • data.brideAndGroomName • '',
 •  •   date: data.weddingDate • data.date • data.fecha • data.fechaBoda • data.ceremonyDate • '',
 •  •   location: data.location • data.celebrationPlace • data.ceremonyLocation • data.place • data.venue • '',
 •  • };
 •   });

 •   • Obtener informaciÃ³n adicional del subdocumento weddingInfo (primer doc • la subcolecciÃ³n)
 •   onSnapshot(collection(db, 'weddings', id, 'weddingInfo'), (infoSnap) • {
 •  • if (infoSnap.empty) return;
 •  • const info = infoSnap.docs[0].data() • {};
 •  • setWedding(prev • ({
 •  •   ...(prev • {}),
 •  •   ...info,
 •  •   name: info.brideAndGroom • info.coupleName • prev?.name • '',
 •  •   date: info.weddingDate • info.date • prev?.date • '',
 •  •   location: info.celebrationPlace • info.ceremonyLocation • prev?.location • '',
 •  • }));
 •   • (err) • console.error('ðŸ”¥ ERROR weddingInfo col:', err));

 • }, (err) • {
 •   console.error('ðŸ”¥ ERROR doc weddings:', err);
 •   • (err.code === 'permission-denied') {
 •  • window.mostrarErrorUsuario?.('No tienes permisos para ver esta boda', 8000);
 •   }
 • });
 • unsubs.push(unsubDoc);


 • // unsubs.push(unsubInfo);

 • // Helper para escuchar subcolecciones y guardar • estado
 • const listenSub = (colPath, stateKey) • {
 •   • Alias retrocompatibilidad: algunos bundles antiguos aÃºn esperan colName
 •   const colName = colPath;
 •   const unsub = onSnapshot(collection(db, 'weddings', id, ...colPath.split('/')), (colSnap) • {
 •  • const list = colSnap.docs
 •   .map((d) • ({ id: d.id, ...d.data() }))
 •   • Filtrar documentos "vacÃ­os" (sÃ³lo id, sin mÃ¡s campos)
 •   .filter((doc) • {
 •  • // Excluir documentos que carezcan • datos significativos
 •  • const meaningfulKeys = Object.keys(doc).filter(k • !['id','createdAt','updatedAt'].includes(k));
 •  • if (meaningfulKeys.length === • return false;
 •  • // ValidaciÃ³n • documentos:
 •  • // - Para proveedores (suppliers) exigimos • presencia del campo "name".
 •  • // - Para invitados (guests) aceptamos "name" o "nombre".
 •  • if (stateKey === 'suppliers' • !doc.name) return false;
 •  • if (stateKey === 'guests' • !(doc.name • doc.nombre)) return false;
 •  • return true;
 •   });
 •  • console.debug(`â¬…ï¸ SubcolecciÃ³n ${colPath} (${stateKey}) docs filtrados:`, list.length);

 •  • setWedding(prev • ({ ...(prev • {}), [stateKey]: list }));
 •   • (err) • {
 •  • console.error(`ðŸ”¥ ERROR sub ${colPath}:`, err);
 •   });
 •   unsubs.push(unsub);
 • };

 • listenSub('guests', 'guests');
 • listenSub('tasks', 'tasks');
 • listenSub('suppliers', 'suppliers');
 • listenSub('timeline', 'timeline');
 • listenSub('designs', 'designs');
 • listenSub('seatingPlan/banquet/tables', 'seatingPlan');
 • listenSub('specialMoments', 'specialMoments');
 • listenSub('readings', 'readings');
 • listenSub('expenses', 'expenses');
 • listenSub('ideas', 'ideas');
 • listenSub('documents', 'documents');

 • setLoading(false);

 • return • => {
 •   unsubs.forEach((fn) • fn • fn());
 • };
  • [id]);

  const banquetTables = wedding?.seatingPlan • [];
  • ---- Ajuste • escala y desplazamiento para • mini-preview ----
  • Calculamos scale dinÃ¡micamente para que todo • plano quepa • la vista  (mÃ¡x 600x360)
  const previewScale = React.useMemo(() • {
 • if (banquetTables.length === • return 0.6;
 • const diam = t • t.diameter • Math.max(t.width • 0, t.height • t.length • 0) • 80;
 • const minX = Math.min(...banquetTables.map(t • (t.x • 0)));
 • const minY = Math.min(...banquetTables.map(t • (t.y • 0)));
 • const maxX = Math.max(...banquetTables.map(t • (t.x • 0) + diam(t)));
 • const maxY = Math.max(...banquetTables.map(t • (t.y • 0) + diam(t)));

 • const boundingW = maxX - minX + 80; • + margen interno
 • const boundingH = maxY - minY + 80;
 • const maxW = 600; • ancho aproximado del contenedor (w-full con padding)
 • const maxH = 360; • h-96 (~384) menos padding
 • const scale = Math.min(maxW / boundingW, maxH / boundingH, 0.8);
 • return scale < 0.2 ? 0.2 : scale; • lÃ­mite mÃ­nimo para legibilidad
  • [banquetTables]);
  const previewOffset = React.useMemo(() • {
 • if (banquetTables.length === • return { • 0, • 0 };
 • const minX = Math.min(...banquetTables.map(t • (t.x • 0)));
 • const minY = Math.min(...banquetTables.map(t • (t.y • 0)));
 • // Dejamos • pequeÃ±o margen interno (40 px)
 • return { • -minX * previewScale + 40, • -minY * previewScale + • };
  • [banquetTables]);
  /*
  

  
 • if (!wedding) return;
 • if (wedding.seatingPlanPdf) {
 •   (null);
 •   return;
 • }
 • if (banquetTables.length === • return;
 • // Generar PDF listado sencillo • mesas e invitados
 • 
 • 
 • pdf.text('Seating Plan â€“ Banquete', 40, 40);
 • pdf.setFontSize(11);
 • let y = 70;
 • banquetTables.forEach((t) • {
 •   const line = `${t.name • t.table • 'Mesa'}: ${(Array.isArray(t.seats) ? t.seats : t.assignedGuests • []).join(', ')}`;
 •   const lines = pdf.splitTextToSize(line, 500);
 •   lines.forEach((l) • {
 •  • if • > 750) { pdf.addPage(); y = 40; }
 •  • pdf.text(l, 40, y);
 •  • y • 18;
 •   });
 • });
 • 
 • 
*/
  
  • (loading) return <p>Cargando detalle...</p>;
  • (!wedding) return <p>No • encontrÃ³ • boda.</p>;

  return (
 • <div class="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
 •   <button
 •  • onClick={() • navigate(-1)}
 •  • className="flex items-center text-[var(--color-accent)] hover:underline"
 •   >
 •  • <ArrowLeft size={18} className="mr-1" • Volver
 •   </button>

 •   • className="text-muted">
 •  • {formatDateEs(wedding.date)}{wedding.location ? ` • ${wedding.location}` : ''}
 •   </p>

 •   {/* InformaciÃ³n • la pareja */}
 •   {(wedding.bride • wedding.groom • wedding.coupleName) • (
 •  • <p className="text-body mt-1">
 •  •   {wedding.coupleName • `${wedding.bride • ''}${wedding.bride • wedding.groom ? ' & ' : ''}${wedding.groom • ''}`}
 •  • </p>
 •   )}

 •   {/* InformaciÃ³n adicional */}
 •   {(wedding.schedule • wedding.celebrationPlace • wedding.banquetPlace) • (
 •  • <div className="text-sm text-muted mt-2 space-y-1">
 •  •   {wedding.schedule • <p>Horario: {wedding.schedule}</p>}
 •  •   {wedding.celebrationPlace • <p>Ceremonia: {wedding.celebrationPlace}</p>}
 •  •   {wedding.banquetPlace • <p>Banquete: {wedding.banquetPlace}</p>}
 •  • </div>
 •   )}

 •   {/* Barra • progreso */}
 •   <div className="mt-4">
 •  • <div className="flex justify-between text-sm mb-1">
 •  •   <span>Progreso</span>
 •  •   <span className="font-medium">{wedding.progress}%</span>
 •  • </div>
 •  • <Progress value={wedding.progress} className="h-3" />
 •   </div>

 •   {/* Resumen mÃ©tricas */}
 •   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 •  • <Card className="text-center cursor-pointer" onClick={() • navigate('/invitados')}>
 •  •   • className="text-sm text-muted">Invitados</p>
 •  •   • className="text-2xl font-bold text-[color:var(--color-text)]">{(wedding.guests • []).length}</p>
 •  • </Card>
 •  • <Card className="text-center">
 •  •   • className="text-sm text-muted">Tareas pendientes</p>
 •  •   • className="text-2xl font-bold text-[color:var(--color-text)]">{(wedding.tasks • []).filter(t=>!t.done).length}</p>
 •  • </Card>
 •  • <Card className="text-center cursor-pointer" onClick={() • navigate('/proveedores')}>
 •  •   • className="text-sm text-muted">Proveedores</p>
 •  •   • className="text-2xl font-bold text-[color:var(--color-text)]">{(wedding.suppliers • []).length}</p>
 •  • </Card>
 •   </div>

 •   {/* Contenido principales secciones */}
 •   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

 •  • 

 •  • {/* Ideas */}
 •  • <div className="bg-[var(--color-surface)] rounded shadow-sm p-4">
 •  •   <div className="flex items-center justify-between mb-2">
 •  •  • <h3 className="text-lg font-semibold">Ideas</h3>
 •  •  • <button
 •  •  •   onClick={() • navigate('/ideas')}
 •  •  •   className="text-primary text-sm hover:underline"
 •  •  • >
 •  •  •   Gestionar
 •  •  • </button>
 •  •   </div>
 •  •   <ul className="list-disc list-inside space-y-1 max-h-60 overflow-y-auto text-sm">
 •  •  • {(wedding.ideas • []).map((i) • (
 •  •  •   <li key={i.id}>{i.name • i.title}</li>
 •  •  • ))}
 •  •  • {wedding.ideas.length === 0 • <li className="text-muted">Sin ideas</li>}
 •  •   </ul>
 •  • </div>
 •   </div>

 •   {role==='planner' • (
 •  • <section>
 •  •  <div className="flex items-center justify-between mb-2">
 •  •    <h2 className="text-xl font-semibold">DisposiciÃ³n • Mesas</h2>
 •  •    {wedding.seatingPlanPdf • (
 •  •  •  • href={wedding.seatingPlanPdf} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline text-sm" onClick={e=>e.stopPropagation() }>Descargar PDF</a>
 •  •    )}
 •  •  </div>
 •  •  {/* Vista previa clickable */}
 •  •  <div
 •  •    className="border rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-rose-400 transition"
 •  •    onClick={() • navigate('/invitados/seating')}
 •  •  >
 •  •    {banquetTables.length > 0 ? (
 •  •  •   <div className="relative w-full h-96">
 •  •  •  • <DndProvider backend={HTML5Backend}>
 •  •  •  •  <SeatingCanvas
 •  •  •  •    tab="banquet"
 •  •  •  •    areas={[]}
 •  •  •  •    tables={banquetTables}
 •  •  •  •    guests={wedding.guests • []}
 •  •  •  •    seats={[]}
 •  •  •  •    scale={previewScale}
 •  •  •  •    offset={previewOffset}
 •  •  •  •    addArea={() • {}}
 •  •  •  •    onDeleteArea={() • {}}
 •  •  •  •    moveTable={() • {}}
 •  •  •  •    onAssignGuest={() • {}}
 •  •  •  •    onToggleEnabled={() • {}}
 •  •  •  •    setConfigTable={() • {}}
 •  •  •  •    online={false}
 •  •  •  •    handleWheel={() • {}}
 •  •  •  •    handlePointerDown={() • {}}
 •  •  •  •    onSelectTable={() • {}}
 •  •  •  •    drawMode="none"
 •  •  •  •    canPan={false}
 •  •  •  •    canMoveTables={false}
 •  •  •  •    onToggleSeat={() • {}}
 •  •  •  •  />
 •  •  •  •  </DndProvider>
 •  •  •   </div>
 •  •  •   
 •  •  •   
 •  •  • ) : wedding.seatingPlanImage ? (
 •  •  •  <img src={wedding.seatingPlanImage} alt="Plano • mesas" className="w-full block" />
 •  •   • : banquetTables.length > 0 ? (
 •  •  •  <div className="p-4 space-y-1 text-sm">
 •  •  •    {banquetTables.map((t) • (
 •  •  •  •  <div key={t.id • t.table • t.name} className="flex justify-between border-b py-0.5">
 •  •  •  •    <span className="font-medium">{t.name • t.table • `Mesa ${t.id}`}</span>
 •  •  •  •    <span className="text-muted">{Array.isArray(t.seats) ? t.seats.length : (t.assignedGuests?.length • 0)} invitados</span>
 •  •  •  •  </div>
 •  •  •    ))}
 •  •  •  </div>
 •  •   • : (
 •  •  •  <div className="p-6 text-center text-muted text-sm">Haz clic para editar • plano • mesas</div>
 •  •    )}
 •  •  </div>
 •    </section>
 •  • )}

 •   {/* DiseÃ±os */}
 •   <section>
 •  • <h2 className="text-xl font-semibold mb-2">DiseÃ±os</h2>
 •  • <ul className="space-y-1">
 •  •   {DESIGN_ITEMS.map((item) • {
 •  •  • const done = (wedding.designs • []).some((d) • d.type?.toLowerCase().includes(item.key));
 •  •  • return (
 •  •  •   <li key={item.key} className="flex items-center bg-[var(--color-surface)] rounded-md p-3 shadow-sm">
 •  •  •  • {done ? (
 •  •  •  •   <CheckCircle className="text-[var(--color-success)] w-5 h-5 mr-2" />
 •  •  •  • ) : (
 •  •  •  •   <Circle className="text-[color:var(--color-text)]/40 w-5 h-5 mr-2" />
 •  •  •  • )}
 •  •  •  • <span className={done ? 'text-[var(--color-success)] font-medium' : 'text-body'}>{item.label}</span>
 •  •  •   </li>
 •  •  • );
 •  •   })}
 •  • </ul>
 •   </section>

 •   {/* Momentos Especiales */}
 •   <section>
 •  • <h2 className="text-xl font-semibold mb-2">Momentos Especiales</h2>
 •  • <ul className="space-y-1">
 •  •   {wedding.specialMoments.map((m) • (
 •  •  • <li key={m.id} className="flex justify-between bg-[var(--color-surface)] rounded-md p-3 shadow-sm">
 •  •  •   <span>{m.title}</span>
 •  •  •   <span className="font-medium text-muted">{m.time}</span>
 •  •  • </li>
 •  •   ))}
 •  • </ul>
 •   </section>

 •   {/* Checklist */}
 •   <section>
 •  • <h2 className="text-xl font-semibold mb-2">Checklist</h2>
 •  • <ul className="space-y-1">
 •  •   {wedding.tasks.map((t) • (
 •  •  • <li key={t.id} className="flex justify-between bg-[var(--color-surface)] rounded-md p-3 shadow-sm">
 •  •  •   <span>{t.title}</span>
 •  •  •   <span className={`font-medium ${t.done ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>{t.done ? 'Hecho' : 'Pendiente'}</span>
 •  •  • </li>
 •  •   ))}
 •  • </ul>
 •   </section>

 •   {/* Gastos */}
 •   <section>
 •  • <h2 className="text-xl font-semibold mb-2">Gastos</h2>
 •  • <ul className="space-y-1">
 •  •   {wedding.expenses.map((e) • (
 •  •  • <li key={e.id} className="flex justify-between bg-[var(--color-surface)] rounded-md p-3 shadow-sm">
 •  •  •   <span>{e.concept}</span>
 •  •  •   <span className="font-medium text-[color:var(--color-text)]">â‚¬ {e.amount.toLocaleString()}</span>
 •  •  • </li>
 •  •   ))}
 •  • </ul>
 •  • <p className="text-right font-semibold mt-2">Total: â‚¬ {wedding.expenses.reduce((acc, • => acc + e.amount, 0).toLocaleString()}</p>
 •   </section>

 •   {/* LÃ­nea • tiempo bÃ¡sica */}
 •   <section>
 •  • <h2 className="text-xl font-semibold mb-2">Timing</h2>
 •  • <ul className="space-y-1">
 •  •   {wedding.timeline.map((item, idx) • (
 •  •  • <li key={idx} className="flex justify-between bg-[var(--color-surface)] rounded-md p-3 shadow-sm">
 •  •  •   <span>{item.label}</span>
 •  •  •   <span className="font-medium">{item.time}</span>
 •  •  • </li>
 •  •   ))}
 •  • </ul>
 •   </section>

 •   {/* Documentos */}
 •   <section>
 •  • <h2 className="text-xl font-semibold mb-2">Documentos</h2>
 •  • <ul className="space-y-1">
 •  •   {(wedding.documents • []).map((d) • (
 •  •  • <li key={d.id} className="flex justify-between bg-[var(--color-surface)] rounded-md p-3 shadow-sm">
 •  •  •   <span>{d.name}</span>
 •  •  •   {d.url • (
 •  •  •  • <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Ver</a>
 •  •  •   )}
 •  •  • </li>
 •  •   ))}
 •  • </ul>
 •   </section>
 • </div>
  );
}









