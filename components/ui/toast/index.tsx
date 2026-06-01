import { useCallback } from 'react';
import { Alert } from 'react-native';

interface ToastOptions {
  id: string;
  title: string;
  description?: string;
  placement?: 'top' | 'bottom';
}

export function useToast() {
  const show = useCallback((opts: ToastOptions) => {
    Alert.alert('', opts.title);
  }, []);
  return { show };
}
