
import React from 'react';
import { ICONS, IconName } from '../constants';

interface IconProps {
  name: IconName;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, className }) => {
  const SvgComponent = ICONS[name];
  if (!SvgComponent) {
    return null; // Or a default icon
  }
  return <SvgComponent className={className} />;
};
