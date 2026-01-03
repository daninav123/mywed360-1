/**
 * Middleware de validación de esquemas Zod
 * Valida el body de la request contra un esquema Zod
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          error: 'validation_error',
          message: 'Datos de entrada inválidos',
          details: result.error.issues,
        });
      }
      
      req.body = result.data;
      next();
    } catch (error) {
      return res.status(500).json({
        error: 'validation_failed',
        message: 'Error al validar datos',
      });
    }
  };
};

export default validate;
