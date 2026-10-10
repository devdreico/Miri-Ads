'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { ScrollDirector } from './ScrollDirector';
import { hasWebGL } from './utils';

function renderSceneFallback() {
  return null;
}

const GlobeExperience = dynamic(() => import('./GlobeExperience'), {
  ssr: false,
  loading: renderSceneFallback,
});

export type SceneMountProps = {
  className?: string;
};

type MountStatus = 'pending' | 'ready' | 'unsupported';

export function SceneMount({ className }: SceneMountProps) {
  const [status, setStatus] = useState<MountStatus>('pending');

  useEffect(() => {
    let cancelled = false;

    const mount = () => {
      if (cancelled) return;
      if (!hasWebGL()) {
        setStatus('unsupported');
        document.removeEventListener('visibilitychange', mount);
        return;
      }
      if (document.visibilityState !== 'visible') return;
      setStatus('ready');
      document.removeEventListener('visibilitychange', mount);
    };

    const frame = window.requestAnimationFrame(mount);
    document.addEventListener('visibilitychange', mount);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', mount);
    };
  }, []);

  const classes = ['absolute inset-0', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {status === 'ready' ? (
        <>
          <GlobeExperience />
          <ScrollDirector />
        </>
      ) : null}
    </div>
  );
}

export default SceneMount;
