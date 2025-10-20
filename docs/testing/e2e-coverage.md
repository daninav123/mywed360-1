# Matriz de Cobertura E2E

Generado automáticamente por `scripts/aggregateRoadmap.js`. Actualiza este archivo ejecutando el script cuando cambie la documentación o los tests.

| Flujo | Specs declaradas | Specs faltantes | Estado |
|-------|------------------|-----------------|--------|
| 0. Administracion Global (estado 2025-10-14) | cypress/e2e/admin/admin-flow.cy.js | — | OK |
| 11. Protocolo y Ceremonias (visión global) | cypress/e2e/protocolo/ceremony-tabs-flow.cy.js | — | OK |
| 11A. Momentos Especiales de la Boda | cypress/e2e/protocolo/protocolo-flows.cy.js | — | OK |
| 11B. Timeline Global del Día B | cypress/e2e/protocolo/protocolo-flows.cy.js | — | OK |
| 11C. Checklist de Última Hora | cypress/e2e/protocolo/protocolo-flows.cy.js | — | OK |
| 11D. Guía de Documentación Legal | cypress/e2e/protocolo/protocolo-flows.cy.js | — | OK |
| 11E. Ayuda a Lecturas y Votos | cypress/e2e/email/smart-composer.cy.js<br>cypress/e2e/email/ai-provider-email.cy.js | — | OK |
| 15. Contratos y Documentos (estado 2025-10-07) | cypress/e2e/contracts/contracts-flow.cy.js | — | OK |
| 17. Gamificacion y Progreso (estado 2025-10-13) | cypress/e2e/gamification/gamification-progress-happy.cy.js<br>cypress/e2e/gamification/gamification-milestone-unlock.cy.js<br>cypress/e2e/gamification/gamification-history.cy.js | — | OK |
| 18. Generador de Documentos Legales (estado 2025-10-07) | cypress/e2e/protocolo/legal-docs-generator.cy.js<br>cypress/e2e/protocolo/legal-docs-validation.cy.js<br>cypress/e2e/protocolo/legal-docs-versioning.cy.js | — | OK |
| 19. Diseno de Invitaciones (estado 2025-10-07) | cypress/e2e/invitaciones_rsvp.cy.js | — | OK |
| 20. Buzon Interno y Estadisticas (estado 2025-10-07) | cypress/e2e/email_inbox_smoke.cy.js<br>cypress/e2e/email/read-email.cy.js<br>cypress/e2e/email/send-email.cy.js<br>cypress/e2e/email/folders-management.cy.js<br>cypress/e2e/email/tags-filters.cy.js<br>cypress/e2e/compose_quick_replies.cy.js<br>cypress/e2e/email/smart-composer.cy.js | — | OK |
| 21. Sitio Publico (estado 2025-10-07) | cypress/e2e/inspiration/inspiration-flow.cy.js<br>cypress/e2e/inspiration_smoke.cy.js<br>cypress/e2e/news/news-flow.cy.js | — | OK |
| 23. Metricas del Proyecto (estado 2025-10-14) | cypress/e2e/performance/email-performance.cy.js<br>cypress/e2e/finance/finance-analytics.cy.js<br>cypress/e2e/gamification/gamification-history.cy.js<br>cypress/e2e/budget_flow.cy.js<br>cypress/e2e/finance/finance-flow-full.cy.js | — | OK |
| 25. Planes y Suscripciones (estado 2025-10-13) | cypress/e2e/subscriptions/subscription-flow.cy.js | — | OK |
| 26. Blog de Tendencias (estado 2025-10-12) | cypress/e2e/blog/blog-article.cy.js<br>cypress/e2e/blog/blog-listing.cy.js<br>cypress/e2e/blog/blog-subscription.cy.js | — | OK |
| 27. Momentos (Álbum Compartido) — estado 2025-10-15 | cypress/e2e/moments/moments-empty-state.cy.js | — | OK |
| 28. Dashboard Wedding Planner (estado 2025-10-13) | cypress/e2e/dashboard/diagnostic-panel.cy.js<br>cypress/e2e/dashboard/global-search-shortcuts.cy.js<br>cypress/e2e/dashboard/main-navigation.cy.js<br>cypress/e2e/dashboard/planner-dashboard.cy.js | — | OK |
| 29. Upgrade de Rol (Owner ? Assistant ? Planner) (estado 2025-10-13) | cypress/e2e/account/role-upgrade-flow.cy.js | — | OK |
| 2B. Asistente Conversacional para Crear Bodas/Eventos · estado 2025-10-11 | cypress/e2e/onboarding/assistant-conversation-happy.cy.js<br>cypress/e2e/onboarding/assistant-context-switch.cy.js<br>cypress/e2e/onboarding/assistant-followups.cy.js<br>cypress/e2e/onboarding/create-event-assistant.cy.js | — | OK |
| 2C. Personalización IA Continua (estado 2025-10-14) | cypress/e2e/personalization/personalization-preferences.cy.js | — | OK |
| 30. Pagina de inicio (estado 2025-10-13) | cypress/e2e/home/home-greeting-names.cy.js | — | OK |
| 31. Estilo Global (estado 2025-10-13) | cypress/e2e/style/style-global.cy.js | — | OK |
| 4. Invitados – Plan de Asientos (estado 2025-10-12) | — | — | Sin specs en doc |
| 5b. Timeline y Tareas (estado 2025-10-07) | cypress/e2e/tasks/all_subtasks_modal.cy.js | — | OK |
| 7. Comunicaciones y Email (estado 2025-10-13) | cypress/e2e/email/send-email.cy.js<br>cypress/e2e/email/read-email.cy.js<br>cypress/e2e/email/folders-management.cy.js<br>cypress/e2e/email/tags-filters.cy.js<br>cypress/e2e/email/smart-composer.cy.js<br>cypress/e2e/email/ai-provider-email.cy.js<br>cypress/e2e/compose_quick_replies.cy.js<br>cypress/e2e/email_inbox_smoke.cy.js<br>cypress/e2e/email/read-email-attachments.cy.js<br>cypress/e2e/email/read-email-list.cy.js<br>cypress/e2e/email/read-email-open.cy.js<br>cypress/e2e/email/read-email-unread-status.cy.js<br>cypress/e2e/email/send-email-attachment.cy.js<br>cypress/e2e/email/send-email-validation.cy.js | — | OK |
| 8. Diseno Web y Personalizacion (estado 2025-10-08) | cypress/e2e/web/diseno-web-flow.cy.js | — | OK |
| 9. RSVP y Confirmaciones (estado 2025-10-07) | cypress/e2e/rsvp/rsvp_confirm_by_token.cy.js<br>cypress/e2e/rsvp/rsvp_invalid_token.cy.js<br>cypress/e2e/rsvp/rsvp_reminders.cy.js<br>cypress/e2e/rsvp/rsvp_confirm.cy.js<br>cypress/e2e/invitaciones_rsvp.cy.js<br>cypress/e2e/rsvp_confirm.cy.js | — | OK |
| Flujo 13: E2E del Seating Plan | cypress/e2e/seating/seating_smoke.cy.js<br>cypress/e2e/seating/seating_assign_unassign.cy.js<br>cypress/e2e/seating/seating_capacity_limit.cy.js<br>cypress/e2e/seating/seating_no_overlap.cy.js<br>cypress/e2e/seating/seating_obstacles_no_overlap.cy.js<br>cypress/e2e/seating/seating_template_circular.cy.js<br>cypress/e2e/seating/seating_template_u_l_imperial.cy.js<br>cypress/e2e/seating/seating_ceremony.cy.js<br>cypress/e2e/seating/seating_fit.cy.js<br>cypress/e2e/seating/seating_aisle_min.cy.js<br>cypress/e2e/seating/seating_toasts.cy.js<br>cypress/e2e/seating/seating_auto_ai.cy.js<br>cypress/e2e/seating/seating_area_type.cy.js<br>cypress/e2e/seating/seating_delete_duplicate.cy.js<br>cypress/e2e/seating/seating-content-flow.cy.js<br>cypress/e2e/seating/seating-basic.cy.js<br>cypress/e2e/seating/seating-conflicts.cy.js<br>cypress/e2e/seating/seating_ui_panels.cy.js<br>cypress/e2e/seating/seating-export.cy.js | — | OK |
| flujo-1-registro-autenticacion.md | cypress/e2e/auth/flow1-signup.cy.js<br>cypress/e2e/auth/flow1-social-login.cy.js<br>cypress/e2e/auth/flow1-password-reset.cy.js<br>cypress/e2e/auth/flow1-verify-email.cy.js<br>cypress/e2e/auth/auth-flow.cy.js | — | OK |
| flujo-10-gestion-bodas-multiples.md | cypress/e2e/weddings/multi-weddings-flow.cy.js<br>cypress/e2e/weddings/wedding-team-flow.cy.js | — | OK |
| flujo-12-notificaciones-configuracion.md | cypress/e2e/notifications/preferences-flow.cy.js | — | OK |
| flujo-14-checklist-avanzado.md | cypress/e2e/tasks/all_subtasks_modal.cy.js | — | OK |
| flujo-16-asistente-virtual-ia.md | cypress/e2e/email/ai-provider-email.cy.js<br>cypress/e2e/email/smart-composer.cy.js<br>cypress/e2e/assistant/chat-fallback-context.cy.js | — | OK |
| flujo-2-creacion-boda-ia.md | cypress/e2e/onboarding/create-event-flow.cy.js<br>cypress/e2e/onboarding/create-event-cta.cy.js | — | OK |
| flujo-2-descubrimiento-personalizado.md | cypress/e2e/onboarding/discovery-personalized.cy.js<br>cypress/e2e/onboarding/onboarding-mode-selector.cy.js | — | OK |
| flujo-22-dashboard-navegacion.md | — | — | Sin specs en doc |
| flujo-24-galeria-inspiracion.md | cypress/e2e/inspiration/inspiration-gallery.cy.js<br>cypress/e2e/inspiration/inspiration-home-gallery.cy.js<br>cypress/e2e/inspiration/inspiration-save-board.cy.js<br>cypress/e2e/inspiration/inspiration-share.cy.js | — | OK |
| flujo-3-gestion-invitados.md | cypress/e2e/guests/guests_flow.cy.js<br>cypress/e2e/guests/guests_crud.cy.js<br>cypress/e2e/guests/guests_import_rsvp.cy.js<br>cypress/e2e/guests/guests_messaging.cy.js | — | OK |
| flujo-5-proveedores-ia.md | cypress/e2e/proveedores_flow.cy.js<br>cypress/e2e/proveedores_compare.cy.js<br>cypress/e2e/proveedores_smoke.cy.js | — | OK |
| flujo-6-presupuesto.md | cypress/e2e/finance/finance-flow.cy.js<br>cypress/e2e/finance/finance-flow-full.cy.js<br>cypress/e2e/finance/finance-budget.cy.js<br>cypress/e2e/finance/finance-transactions.cy.js<br>cypress/e2e/finance/finance-contributions.cy.js<br>cypress/e2e/finance/finance-analytics.cy.js<br>cypress/e2e/budget_flow.cy.js<br>cypress/e2e/finance/finance-advisor-chat.cy.js | — | OK |

_Nota:_ La matriz refleja lo declarado en la documentación de cada flujo (`## Cobertura E2E implementada`). Si el flujo no menciona ninguna spec, aparecerá como “Sin specs en doc”.