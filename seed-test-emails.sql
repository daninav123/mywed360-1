-- Emails de prueba para usuario dd2a27f5-f4f1-4f1a-b9ad-752a7d139b88
INSERT INTO mails (id, "userId", subject, "from", "to", body, folder, read, starred, "sentAt", "createdAt", "updatedAt")
VALUES 
  ('test-mail-1', 'dd2a27f5-f4f1-4f1a-b9ad-752a7d139b88', 'Bienvenido a MyWed360', 'info@planivia.net', ARRAY['test@test.com'], 'Bienvenido a nuestra plataforma.', 'inbox', false, false, NOW() - INTERVAL '1 hour', NOW(), NOW()),
  ('test-mail-2', 'dd2a27f5-f4f1-4f1a-b9ad-752a7d139b88', 'Confirmación de registro', 'noreply@planivia.net', ARRAY['test@test.com'], 'Tu cuenta ha sido creada.', 'inbox', true, false, NOW() - INTERVAL '2 hours', NOW(), NOW()),
  ('test-mail-3', 'dd2a27f5-f4f1-4f1a-b9ad-752a7d139b88', 'Nuevo proveedor disponible', 'proveedores@planivia.net', ARRAY['test@test.com'], 'Nuevo proveedor de flores.', 'inbox', false, true, NOW() - INTERVAL '3 hours', NOW(), NOW()),
  ('test-mail-4', 'dd2a27f5-f4f1-4f1a-b9ad-752a7d139b88', 'Recordatorio checklist', 'reminders@planivia.net', ARRAY['test@test.com'], 'Revisa tu checklist.', 'inbox', false, false, NOW() - INTERVAL '5 hours', NOW(), NOW()),
  ('test-mail-5', 'dd2a27f5-f4f1-4f1a-b9ad-752a7d139b88', 'Presupuesto actualizado', 'finance@planivia.net', ARRAY['test@test.com'], 'Presupuesto modificado.', 'inbox', true, false, NOW() - INTERVAL '1 day', NOW(), NOW()),
  ('test-mail-sent-1', 'dd2a27f5-f4f1-4f1a-b9ad-752a7d139b88', 'Consulta sobre menú', 'test@test.com', ARRAY['catering@example.com'], 'Solicito información de menú.', 'sent', true, false, NOW() - INTERVAL '6 hours', NOW(), NOW()),
  ('test-mail-sent-2', 'dd2a27f5-f4f1-4f1a-b9ad-752a7d139b88', 'Cotización fotografía', 'test@test.com', ARRAY['foto@studio.com'], 'Buscamos fotógrafo.', 'sent', true, false, NOW() - INTERVAL '1 day', NOW(), NOW()),
  ('test-mail-trash-1', 'dd2a27f5-f4f1-4f1a-b9ad-752a7d139b88', 'Email viejo', 'old@example.com', ARRAY['test@test.com'], 'Email en papelera.', 'trash', true, false, NOW() - INTERVAL '7 days', NOW(), NOW());
