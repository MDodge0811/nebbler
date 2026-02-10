import React from 'react';
import { ActivityIndicator, type ActivityIndicatorProps } from 'react-native';

type ISpinnerProps = ActivityIndicatorProps & {
  className?: string;
};

const Spinner = React.forwardRef<React.ComponentRef<typeof ActivityIndicator>, ISpinnerProps>(
  function Spinner({ className, ...props }, ref) {
    return <ActivityIndicator ref={ref} {...props} className={className} />;
  }
);

Spinner.displayName = 'Spinner';
export { Spinner };
