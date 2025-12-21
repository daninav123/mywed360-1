import { runBlogAutomationCycle } from '../services/blogAutomationService.js';

const DEFAULT_INTERVAL_MS = Number(process.env.BLOG_AUTOMATION_INTERVAL_MS || 60 * 60 * 1000);
const DEFAULT_INITIAL_DELAY_MS = Number(process.env.BLOG_AUTOMATION_INITIAL_DELAY_MS || 10 * 1000);

export function startBlogAutomationWorker() {
  if (process.env.BLOG_AUTOMATION_DISABLED === '1') {
    console.log('[blog-automation] Worker disabled via BLOG_AUTOMATION_DISABLED=1');
    return () => {};
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const enabledExplicitly = process.env.BLOG_AUTOMATION_ENABLED === '1';
  if (!isProduction && !enabledExplicitly) {
    console.log(
      '[blog-automation] Worker not started (set BLOG_AUTOMATION_ENABLED=1 to enable outside production)'
    );
    return () => {};
  }

  if (process.env.NODE_ENV === 'test') {
    return () => {};
  }

  if (!Number.isFinite(DEFAULT_INTERVAL_MS) || DEFAULT_INTERVAL_MS <= 0) {
    console.warn('[blog-automation] Invalid interval. Worker not started.');
    return () => {};
  }

  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await runBlogAutomationCycle();
      if (result.processed) {
        console.log(
          `[blog-automation] Generated ${result.processed} article(s) (plan ${result.planDate || 'unknown'}).`
        );
      }
    } catch (error) {
      console.error('[blog-automation] Cycle failed:', error?.message || error);
    } finally {
      running = false;
    }
  };

  const intervalHandle = setInterval(tick, DEFAULT_INTERVAL_MS);
  if (typeof intervalHandle.unref === 'function') {
    intervalHandle.unref();
  }

  const initialHandle = setTimeout(tick, Math.max(0, DEFAULT_INITIAL_DELAY_MS));
  if (typeof initialHandle.unref === 'function') {
    initialHandle.unref();
  }

  return () => {
    clearInterval(intervalHandle);
    clearTimeout(initialHandle);
  };
}
