import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';

type BootstrapState = {
  isReady: boolean;
  error: Error | null;
};

export function useBootstrap(): BootstrapState {
  const [state, setState] = useState<BootstrapState>({ isReady: false, error: null });

  useEffect(() => {
    const run = async () => {
      try {
        // Configurar linking para deep links compartidos con la web
        const url = await Linking.getInitialURL();
        if (url) {
          console.log('[mobile] initial url', url);
        }
        setState({ isReady: true, error: null });
      } catch (error: any) {
        setState({ isReady: false, error });
      }
    };
    run();
  }, []);

  return state;
}
