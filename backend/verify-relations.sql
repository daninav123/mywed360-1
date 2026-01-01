-- Verificar que Guest y CraftWeb están relacionados correctamente con Wedding

-- 1. Mostrar bodas con su conteo de invitados
SELECT 
  w.id as wedding_id,
  w."coupleName",
  COUNT(DISTINCT g.id) as num_guests,
  COUNT(DISTINCT cw.id) as num_webs
FROM weddings w
LEFT JOIN guests g ON g."weddingId" = w.id
LEFT JOIN craft_webs cw ON cw."weddingId" = w.id
GROUP BY w.id, w."coupleName"
ORDER BY num_guests DESC
LIMIT 5;

-- 2. Ejemplo: Invitados de una boda específica
SELECT 
  'Wedding: ' || w."coupleName" as info,
  'Guest: ' || g.name as guest_name,
  g."weddingId"
FROM weddings w
JOIN guests g ON g."weddingId" = w.id
LIMIT 3;
