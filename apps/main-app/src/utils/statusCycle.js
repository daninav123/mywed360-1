// Utility to cycle RSVP status between 'pending' → 'confirmed' → 'declined'
// and back to 'pending'.
export default function statusCycle(current) {
  if (current === 'pending' || current === 'Pendiente') return 'confirmed';
  if (current === 'confirmed' || current === 'Sí') return 'declined';
  return 'pending';
}
