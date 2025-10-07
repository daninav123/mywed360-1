// Simple in-memory rate limiter (per key within a time window)
// Not for production multi-instance use; suitable for dev/small deployments.

const buckets = new Map();

export default function rateLimit({ windowMs = 60000, max = 30, keyGenerator } = {}) {
  return (req, res, next) => {
    try {
      const now = Date.now();
      const key = (typeof keyGenerator === 'function')
        ? keyGenerator(req)
        : `${req.method}:${req.originalUrl}:${req.ip}`;
      const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };
      if (now > bucket.resetAt) {
        bucket.count = 0;
        bucket.resetAt = now + windowMs;
      }
      bucket.count += 1;
      buckets.set(key, bucket);
      if (bucket.count > max) {
        res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
        return res.status(429).json({
          success: false,
          error: { code: 'rate-limit-exceeded', message: 'Too many requests', details: `${bucket.count}/${max}` }
        });
      }
      next();
    } catch (err) {
      // In case of limiter failure, do not block the request
      next();
    }
  };
}

