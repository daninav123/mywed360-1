import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { HomeScreen } from './src/screens/HomeScreen';
import { SuppliersScreen } from './src/screens/SuppliersScreen';
import { useBootstrap } from './src/services/bootstrap';

const Stack = createNativeStackNavigator();

export default function App() {
  const { isReady, error } = useBootstrap();

  useEffect(() => {
    if (error) {
      console.error('[mobile] bootstrap error', error);
    }
  }, [error]);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="home">
            {(props) => <HomeScreen {...props} isReady={isReady} />}
          </Stack.Screen>
          <Stack.Screen
            name="suppliers"
            component={SuppliersScreen}
            options={{ headerShown: true, title: 'Proveedores' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
