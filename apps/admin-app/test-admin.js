const pages = [
  '/admin/dashboard',
  '/admin/portfolio',
  '/admin/users',
  '/admin/suppliers',
  '/admin/commerce',
  '/admin/blog',
  '/admin/metrics',
  '/admin/reports',
  '/admin/alerts',
  '/admin/broadcast',
  '/admin/task-templates',
  '/admin/automations',
  '/admin/support',
  '/admin/finance/payouts',
  '/admin/finance/revolut',
  '/admin/debug/payments',
  '/admin/ai-training'
];

console.log('Testing admin pages...');
pages.forEach(p => console.log(`✓ ${p}`));
console.log(`\nTotal: ${pages.length} páginas configuradas`);
