import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';

type RootStackParamList = {
  home: undefined;
  suppliers: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'home'> & {
  isReady: boolean;
};

export function HomeScreen({ navigation, isReady }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>MaLove App</Text>
      <Text style={styles.subtitle}>
        Gestión de bodas y experiencias desde tu móvil. Acceso rápido a proveedores, checklist y
        seating.
      </Text>

      <Pressable
        disabled={!isReady}
        style={({ pressed }) => [
          styles.primaryButton,
          !isReady && styles.buttonDisabled,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => navigation.navigate('suppliers')}
      >
        {isReady ? (
          <Text style={styles.primaryButtonLabel}>Explorar proveedores IA</Text>
        ) : (
          <ActivityIndicator color="#ffffff" />
        )}
      </Pressable>

      <View style={styles.links}>
        <Text style={styles.linksTitle}>Atajos</Text>
        <Text style={styles.linkItem}>• Checklist inteligente</Text>
        <Text style={styles.linkItem}>• Seating plan móvil</Text>
        <Text style={styles.linkItem}>• Captura Momentos</Text>
        <Text style={styles.linkItem}>• Notificaciones push</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#faf6ff',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2b1062',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#4a4a68',
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#6a3df5',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  primaryButtonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  links: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },
  linksTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8a7aa6',
    marginBottom: 10,
  },
  linkItem: {
    fontSize: 15,
    color: '#44345f',
    marginBottom: 6,
  },
});
