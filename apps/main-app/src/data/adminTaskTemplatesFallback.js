export const adminTaskTemplatesFallback = [
  {
    "id": "plan_porcentajes_dependencias_v1",
    "version": "1.0",
    "status": "draft",
    "name": "Plan de boda por porcentajes con dependencias",
    "notes": "Las tareas pueden ejecutarse en paralelo siempre que no tengan dependencias pendientes.",
    "source": "fallback",
    "blocks": [
      {
        "id": "c1",
        "name": "Definicion del proyecto",
        "category": "C1",
        "startPct": 0,
        "endPct": 0.1,
        "items": [
          {
            "id": "T001",
            "title": "Definir presupuesto total y prioridades",
            "description": "Fijar presupuesto marco y partidas clave.",
            "startPct": 0,
            "endPct": 0.1,
            "percentRange": "0-10",
            "categoryId": "C1",
            "category": "Definicion del proyecto",
            "tags": [],
            "checklist": []
          },
          {
            "id": "T002",
            "title": "Lista preliminar de invitados",
            "description": "Estimacion de asistentes para dimensionar espacios/catering.",
            "startPct": 0,
            "endPct": 0.1,
            "percentRange": "0-10",
            "categoryId": "C1",
            "category": "Definicion del proyecto",
            "tags": [],
            "checklist": []
          },
          {
            "id": "T003",
            "title": "Decidir tipo de boda",
            "description": "Civil, religiosa o simbolica.",
            "startPct": 0,
            "endPct": 0.1,
            "percentRange": "0-10",
            "categoryId": "C1",
            "category": "Definicion del proyecto",
            "tags": [],
            "checklist": []
          },
          {
            "id": "T004",
            "title": "Elegir rango de fechas posibles",
            "description": "1-3 opciones de fecha.",
            "startPct": 0,
            "endPct": 0.1,
            "percentRange": "0-10",
            "categoryId": "C1",
            "category": "Definicion del proyecto",
            "tags": [],
            "checklist": []
          },
          {
            "id": "T005",
            "title": "Definir estilo/tematica y paleta general",
            "description": "Boho, clasica, moderna, etc.",
            "startPct": 0,
            "endPct": 0.1,
            "percentRange": "0-10",
            "categoryId": "C1",
            "category": "Definicion del proyecto",
            "tags": [],
            "checklist": []
          },
          {
            "id": "T006",
            "title": "Contratar wedding planner (opcional)",
            "description": "Si se desea delegar coordinacion.",
            "startPct": 0,
            "endPct": 0.1,
            "percentRange": "0-10",
            "categoryId": "C1",
            "category": "Definicion del proyecto",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 0,
                "itemIndex": 0
              }
            ]
          }
        ]
      },
      {
        "id": "c2",
        "name": "Espacios",
        "category": "C2",
        "startPct": 0.1,
        "endPct": 0.95,
        "items": [
          {
            "id": "T101",
            "title": "Investigar y preseleccionar espacios",
            "description": "Lista corta de 3-5 venues.",
            "startPct": 0.1,
            "endPct": 0.25,
            "percentRange": "10-25",
            "categoryId": "C2",
            "category": "Espacios",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 0,
                "itemIndex": 3
              },
              {
                "blockIndex": 0,
                "itemIndex": 1
              }
            ]
          },
          {
            "id": "T102",
            "title": "Visitar y comparar espacios",
            "description": "Visitas, aforos, planos, restricciones.",
            "startPct": 0.1,
            "endPct": 0.25,
            "percentRange": "10-25",
            "categoryId": "C2",
            "category": "Espacios",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 1,
                "itemIndex": 0
              }
            ]
          },
          {
            "id": "T103",
            "title": "Seleccionar espacio principal",
            "description": "Elegir venue acorde a presupuesto.",
            "startPct": 0.1,
            "endPct": 0.25,
            "percentRange": "10-25",
            "categoryId": "C2",
            "category": "Espacios",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 1,
                "itemIndex": 1
              },
              {
                "blockIndex": 0,
                "itemIndex": 0
              }
            ]
          },
          {
            "id": "T104",
            "title": "Reservar fecha y firmar contrato del espacio",
            "description": "Pago de senal, condiciones y timings.",
            "startPct": 0.1,
            "endPct": 0.25,
            "percentRange": "10-25",
            "categoryId": "C2",
            "category": "Espacios",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 1,
                "itemIndex": 2
              }
            ]
          },
          {
            "id": "T105",
            "title": "Definir Plan B por clima y logistica del venue",
            "description": "Carpas, interiores, redistribuciones.",
            "startPct": 0.8,
            "endPct": 0.95,
            "percentRange": "80-95",
            "categoryId": "C2",
            "category": "Espacios",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 1,
                "itemIndex": 3
              }
            ]
          }
        ]
      },
      {
        "id": "c3",
        "name": "Proveedores principales",
        "category": "C3",
        "startPct": 0.1,
        "endPct": 0.6,
        "items": [
          {
            "id": "T201",
            "title": "Preseleccion de catering",
            "description": "Candidatos y propuestas.",
            "startPct": 0.1,
            "endPct": 0.25,
            "percentRange": "10-25",
            "categoryId": "C3",
            "category": "Proveedores principales",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 0,
                "itemIndex": 0
              },
              {
                "blockIndex": 1,
                "itemIndex": 2
              }
            ]
          },
          {
            "id": "T202",
            "title": "Degustacion de menu",
            "description": "Prueba y ajustes de menu.",
            "startPct": 0.4,
            "endPct": 0.6,
            "percentRange": "40-60",
            "categoryId": "C3",
            "category": "Proveedores principales",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 2,
                "itemIndex": 0
              },
              {
                "blockIndex": 1,
                "itemIndex": 3
              }
            ]
          },
          {
            "id": "T203",
            "title": "Confirmar menu y bebidas",
            "description": "Definir dietas especiales y tiempos.",
            "startPct": 0.4,
            "endPct": 0.6,
            "percentRange": "40-60",
            "categoryId": "C3",
            "category": "Proveedores principales",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 2,
                "itemIndex": 1
              }
            ]
          },
          {
            "id": "T204",
            "title": "Contratar fotografia y video",
            "description": "Estilo y entregables.",
            "startPct": 0.1,
            "endPct": 0.25,
            "percentRange": "10-25",
            "categoryId": "C3",
            "category": "Proveedores principales",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 0,
                "itemIndex": 0
              },
              {
                "blockIndex": 0,
                "itemIndex": 3
              },
              {
                "blockIndex": 0,
                "itemIndex": 4
              }
            ]
          },
          {
            "id": "T205",
            "title": "Contratar musica (DJ/grupo)",
            "description": "Rider tecnico y repertorio base.",
            "startPct": 0.1,
            "endPct": 0.25,
            "percentRange": "10-25",
            "categoryId": "C3",
            "category": "Proveedores principales",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 0,
                "itemIndex": 0
              },
              {
                "blockIndex": 0,
                "itemIndex": 3
              }
            ]
          },
          {
            "id": "T206",
            "title": "Contratar florista/decorador",
            "description": "Lineamientos de diseno con venue.",
            "startPct": 0.25,
            "endPct": 0.4,
            "percentRange": "25-40",
            "categoryId": "C3",
            "category": "Proveedores principales",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 0,
                "itemIndex": 4
              },
              {
                "blockIndex": 1,
                "itemIndex": 3
              }
            ]
          },
          {
            "id": "T207",
            "title": "Reservar maquillaje y peluqueria",
            "description": "Pruebas mas adelante.",
            "startPct": 0.25,
            "endPct": 0.4,
            "percentRange": "25-40",
            "categoryId": "C3",
            "category": "Proveedores principales",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 0,
                "itemIndex": 3
              }
            ]
          },
          {
            "id": "T208",
            "title": "Contratar transporte (novios/invitados)",
            "description": "Rutas y horarios.",
            "startPct": 0.4,
            "endPct": 0.6,
            "percentRange": "40-60",
            "categoryId": "C3",
            "category": "Proveedores principales",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 1,
                "itemIndex": 3
              },
              {
                "blockIndex": 0,
                "itemIndex": 1
              }
            ]
          }
        ]
      },
      {
        "id": "c4",
        "name": "Legal y documentacion",
        "category": "C4",
        "startPct": 0.1,
        "endPct": 0.8,
        "items": [
          {
            "id": "T301",
            "title": "Iniciar expediente matrimonial",
            "description": "Cita y requisitos segun tipo de boda.",
            "startPct": 0.1,
            "endPct": 0.25,
            "percentRange": "10-25",
            "categoryId": "C4",
            "category": "Legal y documentacion",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 0,
                "itemIndex": 2
              },
              {
                "blockIndex": 0,
                "itemIndex": 3
              }
            ]
          },
          {
            "id": "T302",
            "title": "Reunir y presentar documentacion",
            "description": "Certificados, DNI, etc.",
            "startPct": 0.1,
            "endPct": 0.25,
            "percentRange": "10-25",
            "categoryId": "C4",
            "category": "Legal y documentacion",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 3,
                "itemIndex": 0
              }
            ]
          },
          {
            "id": "T303",
            "title": "Confirmar fecha/hora oficial de la ceremonia",
            "description": "Coordinado con venue y autoridad.",
            "startPct": 0.6,
            "endPct": 0.8,
            "percentRange": "60-80",
            "categoryId": "C4",
            "category": "Legal y documentacion",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 3,
                "itemIndex": 0
              },
              {
                "blockIndex": 1,
                "itemIndex": 3
              }
            ]
          }
        ]
      },
      {
        "id": "c5",
        "name": "Vestuario",
        "category": "C5",
        "startPct": 0.25,
        "endPct": 0.95,
        "items": [
          {
            "id": "T401",
            "title": "Busqueda y seleccion de vestido",
            "description": "Agenda de ateliers y estilos.",
            "startPct": 0.25,
            "endPct": 0.4,
            "percentRange": "25-40",
            "categoryId": "C5",
            "category": "Vestuario",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 0,
                "itemIndex": 4
              }
            ]
          },
          {
            "id": "T402",
            "title": "Busqueda y seleccion de traje",
            "description": "Sastreria y complementos base.",
            "startPct": 0.25,
            "endPct": 0.4,
            "percentRange": "25-40",
            "categoryId": "C5",
            "category": "Vestuario",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 0,
                "itemIndex": 4
              }
            ]
          },
          {
            "id": "T403",
            "title": "Pruebas y ajustes de vestido",
            "description": "Calendario de arreglos.",
            "startPct": 0.4,
            "endPct": 0.6,
            "percentRange": "40-60",
            "categoryId": "C5",
            "category": "Vestuario",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 4,
                "itemIndex": 0
              }
            ]
          },
          {
            "id": "T404",
            "title": "Pruebas y ajustes de traje",
            "description": "Citas de ajustes.",
            "startPct": 0.4,
            "endPct": 0.6,
            "percentRange": "40-60",
            "categoryId": "C5",
            "category": "Vestuario",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 4,
                "itemIndex": 1
              }
            ]
          },
          {
            "id": "T405",
            "title": "Prueba final de vestido y maquillaje",
            "description": "Look final con tiempos del dia.",
            "startPct": 0.8,
            "endPct": 0.95,
            "percentRange": "80-95",
            "categoryId": "C5",
            "category": "Vestuario",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 4,
                "itemIndex": 2
              },
              {
                "blockIndex": 2,
                "itemIndex": 6
              }
            ]
          },
          {
            "id": "T406",
            "title": "Prueba final de traje",
            "description": "Verificacion de fit y accesorios.",
            "startPct": 0.8,
            "endPct": 0.95,
            "percentRange": "80-95",
            "categoryId": "C5",
            "category": "Vestuario",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 4,
                "itemIndex": 3
              }
            ]
          }
        ]
      },
      {
        "id": "c6",
        "name": "Diseno y decoracion",
        "category": "C6",
        "startPct": 0.25,
        "endPct": 0.8,
        "items": [
          {
            "id": "T501",
            "title": "Moodboard y linea visual",
            "description": "Referencias, tipografias, senaletica.",
            "startPct": 0.25,
            "endPct": 0.4,
            "percentRange": "25-40",
            "categoryId": "C6",
            "category": "Diseno y decoracion",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 0,
                "itemIndex": 4
              }
            ]
          },
          {
            "id": "T502",
            "title": "Disenar invitaciones y papeleria",
            "description": "Save the date, invitacion, carteleria.",
            "startPct": 0.25,
            "endPct": 0.4,
            "percentRange": "25-40",
            "categoryId": "C6",
            "category": "Diseno y decoracion",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 5,
                "itemIndex": 0
              }
            ]
          },
          {
            "id": "T503",
            "title": "Enviar invitaciones",
            "description": "Fisicas o digitales, con RSVP.",
            "startPct": 0.4,
            "endPct": 0.6,
            "percentRange": "40-60",
            "categoryId": "C6",
            "category": "Diseno y decoracion",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 5,
                "itemIndex": 1
              },
              {
                "blockIndex": 1,
                "itemIndex": 3
              }
            ]
          },
          {
            "id": "T504",
            "title": "Diseno final de seating plan y carteleria",
            "description": "Planos de mesas y senaletica final.",
            "startPct": 0.6,
            "endPct": 0.8,
            "percentRange": "60-80",
            "categoryId": "C6",
            "category": "Diseno y decoracion",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 6,
                "itemIndex": 3
              },
              {
                "blockIndex": 2,
                "itemIndex": 5
              }
            ]
          }
        ]
      },
      {
        "id": "c7",
        "name": "Invitados",
        "category": "C7",
        "startPct": 0.4,
        "endPct": 0.8,
        "items": [
          {
            "id": "T701",
            "title": "Lista definitiva de invitados",
            "description": "Confirmar agregados/claves.",
            "startPct": 0.4,
            "endPct": 0.6,
            "percentRange": "40-60",
            "categoryId": "C7",
            "category": "Invitados",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 0,
                "itemIndex": 1
              }
            ]
          },
          {
            "id": "T702",
            "title": "Gestion de RSVPs",
            "description": "Recoger confirmaciones y dietas.",
            "startPct": 0.4,
            "endPct": 0.6,
            "percentRange": "40-60",
            "categoryId": "C7",
            "category": "Invitados",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 5,
                "itemIndex": 2
              }
            ]
          },
          {
            "id": "T703",
            "title": "Alojamiento para invitados (si aplica)",
            "description": "Bloqueos de habitaciones y transfers.",
            "startPct": 0.4,
            "endPct": 0.6,
            "percentRange": "40-60",
            "categoryId": "C7",
            "category": "Invitados",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 6,
                "itemIndex": 0
              },
              {
                "blockIndex": 1,
                "itemIndex": 3
              }
            ]
          },
          {
            "id": "T704",
            "title": "Asignacion de mesas",
            "description": "Criterios de afinidad y logistica.",
            "startPct": 0.6,
            "endPct": 0.8,
            "percentRange": "60-80",
            "categoryId": "C7",
            "category": "Invitados",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 6,
                "itemIndex": 1
              }
            ]
          }
        ]
      },
      {
        "id": "c8",
        "name": "Ceremonia",
        "category": "C8",
        "startPct": 0.6,
        "endPct": 0.8,
        "items": [
          {
            "id": "T801",
            "title": "Guion de ceremonia y votos",
            "description": "Lecturas, musica y entrada/salida.",
            "startPct": 0.6,
            "endPct": 0.8,
            "percentRange": "60-80",
            "categoryId": "C8",
            "category": "Ceremonia",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 3,
                "itemIndex": 2
              },
              {
                "blockIndex": 2,
                "itemIndex": 4
              }
            ]
          },
          {
            "id": "T802",
            "title": "Ensayo general de la ceremonia",
            "description": "Con oficiante y equipo clave.",
            "startPct": 0.6,
            "endPct": 0.8,
            "percentRange": "60-80",
            "categoryId": "C8",
            "category": "Ceremonia",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 7,
                "itemIndex": 0
              }
            ]
          },
          {
            "id": "T803",
            "title": "Musica detallada de ceremonia",
            "description": "Listas y cues con tiempos.",
            "startPct": 0.6,
            "endPct": 0.8,
            "percentRange": "60-80",
            "categoryId": "C8",
            "category": "Ceremonia",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 2,
                "itemIndex": 4
              }
            ]
          }
        ]
      },
      {
        "id": "c9",
        "name": "Banquete y fiesta",
        "category": "C9",
        "startPct": 0.6,
        "endPct": 0.95,
        "items": [
          {
            "id": "T901",
            "title": "Timeline completo del dia",
            "description": "Secuencia desde montaje a fiesta.",
            "startPct": 0.6,
            "endPct": 0.8,
            "percentRange": "60-80",
            "categoryId": "C9",
            "category": "Banquete y fiesta",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 2,
                "itemIndex": 4
              },
              {
                "blockIndex": 2,
                "itemIndex": 5
              },
              {
                "blockIndex": 2,
                "itemIndex": 2
              },
              {
                "blockIndex": 3,
                "itemIndex": 2
              },
              {
                "blockIndex": 1,
                "itemIndex": 3
              }
            ]
          },
          {
            "id": "T902",
            "title": "Confirmacion de proveedores y horarios",
            "description": "Contact sheet, telefonos, plan A/B.",
            "startPct": 0.6,
            "endPct": 0.8,
            "percentRange": "60-80",
            "categoryId": "C9",
            "category": "Banquete y fiesta",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 8,
                "itemIndex": 0
              }
            ]
          },
          {
            "id": "T903",
            "title": "Prueba tecnica de sonido/luces",
            "description": "Revision riders y pruebas finales.",
            "startPct": 0.8,
            "endPct": 0.95,
            "percentRange": "80-95",
            "categoryId": "C9",
            "category": "Banquete y fiesta",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 8,
                "itemIndex": 1
              }
            ]
          },
          {
            "id": "T904",
            "title": "Montaje y revision in situ",
            "description": "Recepcion de materiales y set final.",
            "startPct": 0.8,
            "endPct": 0.95,
            "percentRange": "80-95",
            "categoryId": "C9",
            "category": "Banquete y fiesta",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 8,
                "itemIndex": 1
              }
            ]
          }
        ]
      },
      {
        "id": "c10",
        "name": "Logistica",
        "category": "C10",
        "startPct": 0.4,
        "endPct": 0.95,
        "items": [
          {
            "id": "T1001",
            "title": "Transporte de novios",
            "description": "Coche nupcial/alternativas.",
            "startPct": 0.4,
            "endPct": 0.6,
            "percentRange": "40-60",
            "categoryId": "C10",
            "category": "Logistica",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 1,
                "itemIndex": 3
              }
            ]
          },
          {
            "id": "T1002",
            "title": "Transporte de invitados",
            "description": "Buses, horarios y rutas.",
            "startPct": 0.4,
            "endPct": 0.6,
            "percentRange": "40-60",
            "categoryId": "C10",
            "category": "Logistica",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 6,
                "itemIndex": 0
              },
              {
                "blockIndex": 1,
                "itemIndex": 3
              }
            ]
          },
          {
            "id": "T1003",
            "title": "Materiales y detalles para invitados",
            "description": "Regalos, welcome bags, misales.",
            "startPct": 0.6,
            "endPct": 0.8,
            "percentRange": "60-80",
            "categoryId": "C10",
            "category": "Logistica",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 2,
                "itemIndex": 5
              },
              {
                "blockIndex": 5,
                "itemIndex": 0
              }
            ]
          },
          {
            "id": "T1004",
            "title": "Kit de emergencia y backups",
            "description": "Costurero, maquillaje, medicacion, etc.",
            "startPct": 0.8,
            "endPct": 0.95,
            "percentRange": "80-95",
            "categoryId": "C10",
            "category": "Logistica",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 4,
                "itemIndex": 0
              },
              {
                "blockIndex": 4,
                "itemIndex": 1
              }
            ]
          }
        ]
      },
      {
        "id": "c11",
        "name": "Postboda",
        "category": "C11",
        "startPct": 0.95,
        "endPct": 1,
        "items": [
          {
            "id": "T1101",
            "title": "Agradecimientos a invitados",
            "description": "Mensajes y/o tarjetas postboda.",
            "startPct": 0.95,
            "endPct": 1,
            "percentRange": "95-100",
            "categoryId": "C11",
            "category": "Postboda",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 8,
                "itemIndex": 3
              }
            ]
          },
          {
            "id": "T1102",
            "title": "Pagos finales a proveedores",
            "description": "Cierre de facturas y propinas.",
            "startPct": 0.95,
            "endPct": 1,
            "percentRange": "95-100",
            "categoryId": "C11",
            "category": "Postboda",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 8,
                "itemIndex": 1
              }
            ]
          },
          {
            "id": "T1103",
            "title": "Seleccion de fotos y video/album",
            "description": "Entrega de materiales y album.",
            "startPct": 0.95,
            "endPct": 1,
            "percentRange": "95-100",
            "categoryId": "C11",
            "category": "Postboda",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 2,
                "itemIndex": 3
              }
            ]
          },
          {
            "id": "T1104",
            "title": "Devoluciones y alquileres",
            "description": "Inventario y estado de materiales.",
            "startPct": 0.95,
            "endPct": 1,
            "percentRange": "95-100",
            "categoryId": "C11",
            "category": "Postboda",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 8,
                "itemIndex": 3
              }
            ]
          },
          {
            "id": "T1105",
            "title": "Registro civil/gestiones posteriores",
            "description": "Inscripcion y certificados finales.",
            "startPct": 0.95,
            "endPct": 1,
            "percentRange": "95-100",
            "categoryId": "C11",
            "category": "Postboda",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 3,
                "itemIndex": 2
              }
            ]
          }
        ]
      },
      {
        "id": "c12",
        "name": "Extras (opcionales)",
        "category": "C12",
        "startPct": 0,
        "endPct": 0.4,
        "items": [
          {
            "id": "T1201",
            "title": "Web o app de la boda (opcional)",
            "description": "Info, mapas, RSVPs.",
            "startPct": 0,
            "endPct": 0.1,
            "percentRange": "0-10",
            "categoryId": "C12",
            "category": "Extras (opcionales)",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 0,
                "itemIndex": 4
              }
            ]
          },
          {
            "id": "T1202",
            "title": "Photocall/cabina de fotos",
            "description": "Diseno y contratacion.",
            "startPct": 0.25,
            "endPct": 0.4,
            "percentRange": "25-40",
            "categoryId": "C12",
            "category": "Extras (opcionales)",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 2,
                "itemIndex": 5
              }
            ]
          },
          {
            "id": "T1203",
            "title": "Planificacion de luna de miel",
            "description": "Reservas y documentacion viaje.",
            "startPct": 0.1,
            "endPct": 0.25,
            "percentRange": "10-25",
            "categoryId": "C12",
            "category": "Extras (opcionales)",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 0,
                "itemIndex": 0
              },
              {
                "blockIndex": 0,
                "itemIndex": 3
              }
            ]
          },
          {
            "id": "T1204",
            "title": "Contratar coordinador de dia",
            "description": "Si no hay wedding planner.",
            "startPct": 0.1,
            "endPct": 0.25,
            "percentRange": "10-25",
            "categoryId": "C12",
            "category": "Extras (opcionales)",
            "tags": [],
            "checklist": [],
            "dependsOn": [
              {
                "blockIndex": 0,
                "itemIndex": 0
              },
              {
                "blockIndex": 0,
                "itemIndex": 3
              }
            ]
          }
        ]
      }
    ],
    "totals": {
      "blocks": 12,
      "subtasks": 56
    },
    "metadata": {
      "categories": [
        {
          "id": "C1",
          "name": "Definicion del proyecto"
        },
        {
          "id": "C2",
          "name": "Espacios"
        },
        {
          "id": "C3",
          "name": "Proveedores principales"
        },
        {
          "id": "C4",
          "name": "Legal y documentacion"
        },
        {
          "id": "C5",
          "name": "Vestuario"
        },
        {
          "id": "C6",
          "name": "Diseno y decoracion"
        },
        {
          "id": "C7",
          "name": "Invitados"
        },
        {
          "id": "C8",
          "name": "Ceremonia"
        },
        {
          "id": "C9",
          "name": "Banquete y fiesta"
        },
        {
          "id": "C10",
          "name": "Logistica"
        },
        {
          "id": "C11",
          "name": "Postboda"
        },
        {
          "id": "C12",
          "name": "Extras (opcionales)"
        }
      ],
      "generatedAt": "2025-10-28T01:40:44.040Z"
    }
  }
];

export default adminTaskTemplatesFallback;
