import { useCallback } from 'react';

import {
  useToast as useGluestackToast,
  Toast,
  ToastTitle,
  ToastDescription,
} from '@/components/ui/toast';

/**
 * Toast adapter — the only place outside `components/ui/toast/` that touches
 * the Gluestack toast primitives. Exposes an app-shaped
 * `show({ id, title, description?, placement?, action? })` API so screens
 * never construct toast render functions themselves.
 *
 * Swapping the toast library is a one-file change (this hook) without
 * touching the screens.
 */

export type ToastAction = 'error' | 'warning' | 'success' | 'info' | 'muted';
export type ToastPlacement = 'top' | 'bottom';

export interface ShowToastOptions {
  id: string;
  title: string;
  description?: string;
  placement?: ToastPlacement;
  action?: ToastAction;
  durationMs?: number | null;
}

export function useToast() {
  const toast = useGluestackToast();

  const show = useCallback(
    (opts: ShowToastOptions): void => {
      if (toast.isActive(opts.id)) return;
      toast.show({
        id: opts.id,
        placement: opts.placement ?? 'top',
        duration: opts.durationMs ?? 3000,
        render: ({ id }) => (
          <Toast nativeID={`toast-${id}`} action={opts.action ?? 'muted'} variant="solid">
            <ToastTitle>{opts.title}</ToastTitle>
            {opts.description ? <ToastDescription>{opts.description}</ToastDescription> : null}
          </Toast>
        ),
      });
    },
    [toast]
  );

  return { show };
}
