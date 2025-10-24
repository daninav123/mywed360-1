import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { fetchSuppliers } from '../services/suppliersService';

type Supplier = {
  id: string;
  name: string;
  service: string;
  location?: string;
  match?: number;
};

type Props = NativeStackScreenProps<{ suppliers: undefined }, 'suppliers'>;

export function SuppliersScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSuppliers();
      setSuppliers(result);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar proveedores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  return (
    <View style={styles.root}>
      <Text style={styles.header}>Shortlist IA</Text>
      <Text style={styles.subtitle}>
        Consulta tus recomendaciones AI recientes. Estos datos se sincronizan con la web.
      </Text>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6a3df5" />
        </View>
      )}

      {error && !loading && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadSuppliers}>
            <Text style={styles.retryLabel}>Reintentar</Text>
          </Pressable>
        </View>
      )}

      {!loading && !error && (
        <FlatList
          data={suppliers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => {
                // TODO: navegación a detalle cuando exista pantalla
              }}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardMeta}>
                {item.service} • {item.location || 'Ubicación por confirmar'}
              </Text>
              {item.match !== undefined && (
                <View style={styles.badge}>
                  <Text style={styles.badgeLabel}>{Math.round(item.match * 100)}%</Text>
                </View>
              )}
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>
                Usa la web para generar tu primera shortlist IA. Se sincronizará automáticamente.
              </Text>
            </View>
          }
        />
      )}

      <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonLabel}>Volver</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f6f2ff',
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2b1062',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#5f527d',
    marginBottom: 18,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 15,
    color: '#c02626',
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6a3df5',
  },
  retryLabel: {
    color: '#6a3df5',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2b1062',
  },
  cardMeta: {
    marginTop: 6,
    fontSize: 14,
    color: '#5f527d',
  },
  badge: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#ebe2ff',
    borderRadius: 999,
  },
  badgeLabel: {
    fontSize: 12,
    color: '#4a2bc6',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 15,
    color: '#5f527d',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d7cfff',
  },
  backButtonLabel: {
    color: '#4a2bc6',
    fontSize: 16,
    fontWeight: '600',
  },
});
