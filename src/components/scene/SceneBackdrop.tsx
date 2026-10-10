'use client';

import type { CSSProperties } from 'react';
import { SceneMount } from './SceneMount';

export type SceneBackdropProps = {
  className?: string;
};

const SKELETON_STYLE: CSSProperties = {
  backgroundImage: [
    'radial-gradient(58% 54% at 68% 46%, rgba(47, 230, 200, 0.11) 0%, rgba(47, 230, 200, 0.045) 36%, rgba(47, 230, 200, 0) 72%)',
    'radial-gradient(44% 40% at 26% 78%, rgba(15, 181, 161, 0.07) 0%, rgba(15, 181, 161, 0) 70%)',
    'radial-gradient(30% 26% at 84% 14%, rgba(47, 230, 200, 0.05) 0%, rgba(47, 230, 200, 0) 75%)',
  ].join(', '),
};

export function SceneBackdrop({ className }: SceneBackdropProps) {
  const classes = ['fixed inset-0 -z-20 pointer-events-none', className].filter(Boolean).join(' ');

  return (
    <div className={classes} aria-hidden="true" style={SKELETON_STYLE}>
      <SceneMount />
    </div>
  );
}

export default SceneBackdrop;
