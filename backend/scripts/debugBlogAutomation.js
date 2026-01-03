import { runBlogAutomationCycle } from '../services/blogAutomationService.js';

console.log('[debugBlogAutomation] starting test run…');

runBlogAutomationCycle({ lookaheadDays: 2, postStatus: 'scheduled' })
  .then((result) => {
    console.log('[debugBlogAutomation] result:', JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error('[debugBlogAutomation] error:', error?.message || error);
    if (error?.stack) {
      console.error(error.stack);
    }
  })
  .finally(() => {
    console.log('[debugBlogAutomation] done');
    process.exit(0);
  });
