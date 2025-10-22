import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { RefreshCw, DollarSign, Database, AlertCircle } from 'lucide-react';

import { get as apiGet } from '../../services/apiClient';
import { getAdminFetchOptions } from '../../services/adminSession';

const AdminDebugPayments = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchPaymentsDebug = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet(
        '/api/admin/dashboard/debug/payments?limit=10',
        getAdminFetchOptions({ auth: false, silent: true })
      );
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error('[AdminDebugPayments] Error:', err);
      setError(err.message || 'Error al cargar datos de pagos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Box className="flex items-center justify-between">
        <Box>
          <Typography variant="h4" className="font-medium">
            Diagnóstico de Pagos
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Inspecciona los datos de facturación en Firestore
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshCw size={16} />}
          onClick={fetchPaymentsDebug}
          disabled={loading}
        >
          {loading ? 'Consultando...' : 'Consultar Pagos'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" icon={<AlertCircle size={20} />}>
          {error}
        </Alert>
      )}

      {data && (
        <>
          {/* Recomendaciones */}
          <Card>
            <CardHeader
              title="Diagnóstico"
              avatar={<Database size={24} />}
            />
            <CardContent>
              <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Box className="bg-gray-50 p-4 rounded">
                  <Typography variant="overline" color="textSecondary">
                    Pagos en colección raíz
                  </Typography>
                  <Typography variant="h5">
                    {data.rootCollection?.count || 0}
                  </Typography>
                  {data.recommendations?.hasRootPayments ? (
                    <Chip size="small" label="✓ Disponible" color="success" className="mt-2" />
                  ) : (
                    <Chip size="small" label="✗ Vacío" color="default" className="mt-2" />
                  )}
                </Box>

                <Box className="bg-gray-50 p-4 rounded">
                  <Typography variant="overline" color="textSecondary">
                    Pagos en subcolecciones
                  </Typography>
                  <Typography variant="h5">
                    {data.collectionGroup?.count || 0}
                  </Typography>
                  {data.recommendations?.hasGroupPayments ? (
                    <Chip size="small" label="✓ Disponible" color="success" className="mt-2" />
                  ) : (
                    <Chip size="small" label="✗ Vacío" color="default" className="mt-2" />
                  )}
                </Box>

                <Box className="bg-gray-50 p-4 rounded">
                  <Typography variant="overline" color="textSecondary">
                    Estado general
                  </Typography>
                  <Typography variant="h5">
                    {data.recommendations?.needsIndexes ? '⚠️' : '✅'}
                  </Typography>
                  {data.recommendations?.needsIndexes ? (
                    <Chip size="small" label="Crear índices" color="warning" className="mt-2" />
                  ) : (
                    <Chip size="small" label="Configurado" color="success" className="mt-2" />
                  )}
                </Box>
              </Box>

              {data.recommendations?.needsIndexes && (
                <Alert severity="warning" className="mt-4">
                  <Typography variant="body2" className="font-semibold mb-2">
                    No se encontraron pagos en Firestore
                  </Typography>
                  <Typography variant="body2" className="mb-2">
                    Opciones:
                  </Typography>
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    <li>Ejecuta <code className="bg-gray-100 px-1 rounded">node scripts/seedPayments.js</code> para crear datos de prueba</li>
                    <li>Integra Stripe para pagos reales</li>
                    <li>Revisa <code className="bg-gray-100 px-1 rounded">docs/firestore-indexes-needed.md</code> para crear índices</li>
                  </ol>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Muestra de datos */}
          {data.rootCollection?.count > 0 && (
            <Card>
              <CardHeader
                title="Pagos en Colección Raíz"
                subheader={`${data.rootCollection.count} documentos encontrados`}
                avatar={<DollarSign size={24} />}
              />
              <CardContent>
                <Box className="space-y-3">
                  {data.rootCollection.sample.map((payment, idx) => (
                    <Box
                      key={idx}
                      className="border border-gray-200 rounded p-3 bg-gray-50"
                    >
                      <Box className="flex justify-between items-start mb-2">
                        <Typography variant="subtitle2" className="font-mono">
                          {payment.id}
                        </Typography>
                        <Chip
                          size="small"
                          label={payment.status || 'unknown'}
                          color={
                            payment.status === 'paid' || payment.status === 'succeeded'
                              ? 'success'
                              : payment.status === 'pending'
                              ? 'warning'
                              : 'default'
                          }
                        />
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        Monto: <strong>{payment.amount || 0} {payment.currency || 'EUR'}</strong>
                      </Typography>
                      {payment.createdAt && (
                        <Typography variant="caption" color="textSecondary">
                          Creado: {new Date(payment.createdAt._seconds * 1000).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {data.collectionGroup?.count > 0 && (
            <Card>
              <CardHeader
                title="Pagos en Subcolecciones"
                subheader={`${data.collectionGroup.count} documentos encontrados`}
              />
              <CardContent>
                <Box className="space-y-3">
                  {data.collectionGroup.sample.map((payment, idx) => (
                    <Box
                      key={idx}
                      className="border border-gray-200 rounded p-3 bg-gray-50"
                    >
                      <Typography variant="caption" color="textSecondary" className="font-mono">
                        {payment.path}
                      </Typography>
                      <Box className="flex justify-between items-center mt-2">
                        <Typography variant="body2">
                          {payment.amount || 0} {payment.currency || 'EUR'}
                        </Typography>
                        <Chip size="small" label={payment.status || 'unknown'} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!data && !loading && (
        <Card>
          <CardContent className="text-center py-10">
            <Database size={48} className="mx-auto mb-4 text-gray-400" />
            <Typography variant="h6" color="textSecondary">
              Haz clic en "Consultar Pagos" para empezar
            </Typography>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDebugPayments;
