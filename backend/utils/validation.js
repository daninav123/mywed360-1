// Simple Zod-based validation helpers for Express routes
import { z } from 'zod';

// Create a validator middleware for a given schema and source (body|query|params)
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = req?.[source] ?? {};
      const result = schema.safeParse(data);
      if (!result.success) {
        const issues = result.error.issues?.map((i) => ({
          path: i.path.join('.'),
          code: i.code,
          message: i.message,
        })) || [];
        return res.status(400).json({ success: false, error: { code: 'invalid_request', message: 'Validation failed', issues } });
      }
      // Overwrite the parsed source with the sanitized data
      req[source] = result.data;
      return next();
    } catch (e) {
      return res.status(400).json({ success: false, error: { code: 'invalid_request', message: 'Validation failed' } });
    }
  };
}

export { z, validate };

