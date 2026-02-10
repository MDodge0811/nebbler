import React from 'react';
import { View, Text as RNText, type ViewProps, type TextProps } from 'react-native';

type AlertAction = 'error' | 'warning' | 'success' | 'info' | 'muted';

type IAlertProps = ViewProps & {
  className?: string;
  action?: AlertAction;
};

const actionClasses: Record<AlertAction, string> = {
  error: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  success: 'bg-green-50 border-green-200',
  info: 'bg-blue-50 border-blue-200',
  muted: 'bg-surface border-border',
};

const Alert = React.forwardRef<React.ComponentRef<typeof View>, IAlertProps>(function Alert(
  { className, action = 'muted', ...props },
  ref
) {
  const classes = [
    'flex-row items-center py-3 px-4 rounded-md border gap-2',
    actionClasses[action],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <View ref={ref} {...props} className={classes} />;
});

Alert.displayName = 'Alert';

type IAlertTextProps = TextProps & { className?: string };

const AlertText = React.forwardRef<React.ComponentRef<typeof RNText>, IAlertTextProps>(
  function AlertText({ className, ...props }, ref) {
    const classes = ['text-sm text-text-primary flex-1', className].filter(Boolean).join(' ');
    return <RNText ref={ref} {...props} className={classes} />;
  }
);

AlertText.displayName = 'AlertText';

export { Alert, AlertText };
