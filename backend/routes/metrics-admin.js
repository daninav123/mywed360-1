import express from 'express';
import fs from 'fs';
import path from 'path';

// Admin metrics API
// Mounted at /api/metrics with requireAdmin in index.js
const router = express.Router();

// Helper: read last N lines from a file (best-effort)
function readLastLines(filePath, maxLines = 500) {
  try {
    if (!fs.existsSync(filePath)) return [];
    const data = fs.readFileSync(filePath, 'utf8');
    const lines = data.split(/\r?\n/).filter(Boolean);
    return lines.slice(-maxLines);
  } catch {
    return [];
  }
}

// GET /api/metrics/dashboard
// Returns a minimal JSON payload for the Admin MetricsDashboard
router.get('/dashboard', async (_req, res) => {
  try {
    // Build error distribution from logs/error.log (if available)
    const errorLogPath = path.resolve(process.cwd(), 'logs', 'error.log');
    const lines = readLastLines(errorLogPath, 1000);
    const errorBuckets = new Map();
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        const key = (obj && (obj.code || obj.message || obj.stack || 'error'));
        const name = typeof key === 'string' ? key.slice(0, 60) : 'error';
        errorBuckets.set(name, (errorBuckets.get(name) || 0) + 1);
      } catch {
        // non-JSON line, bucket as generic
        errorBuckets.set('error', (errorBuckets.get('error') || 0) + 1);
      }
    }
    const errorData = Array.from(errorBuckets.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    // Server usage: minimal health metrics
    const mem = process.memoryUsage();
    const usedMb = Math.round((mem.rss || 0) / (1024 * 1024));
    const heapMb = Math.round((mem.heapUsed || 0) / (1024 * 1024));
    const uptimeMin = Math.round((process.uptime() || 0) / 60);
    const usageData = [
      { name: 'Memoria RSS (MB)', value: usedMb },
      { name: 'Heap usado (MB)', value: heapMb },
      { name: 'Uptime (min)', value: uptimeMin },
    ];

    // Time series placeholder to avoid breaking charts
    const now = Date.now();
    const timeSeriesData = [
      { date: new Date(now - 3600000).toLocaleTimeString(), emailSent: 0, emailReceived: 0, searchCount: 0, eventsDetected: 0 },
      { date: new Date(now).toLocaleTimeString(), emailSent: 0, emailReceived: 0, searchCount: 0, eventsDetected: 0 },
    ];

    // Performance placeholder (can be filled by domain metrics later)
    const performanceData = {
      emailSendAvgMs: 0,
      emailSearchAvgMs: 0,
      notificationDispatchMs: 0,
      eventDetectionMs: 0,
    };

    res.json({
      timeSeriesData,
      performanceData,
      errorData,
      usageData,
      timestamp: now,
    });
  } catch (e) {
    res.status(500).json({ error: 'metrics-dashboard-failed' });
  }
});

export default router;

