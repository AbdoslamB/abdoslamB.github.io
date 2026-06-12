import { useEffect, useState } from 'react';

import { Buttons, Content, Particles, Toggle } from 'components';

import './App.scss';
import { AppProvider } from './AppContext';
import { config } from './config';

export const App = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery =
      '(max-device-width: 820px) and (-webkit-min-device-pixel-ratio: 2)';
    const mediaQueryList = window.matchMedia(mediaQuery);

    const updateIsMobile = () => {
      setIsMobile(mediaQueryList.matches);
    };

    updateIsMobile();

    mediaQueryList.addEventListener('change', updateIsMobile);

    return () => {
      mediaQueryList.removeEventListener('change', updateIsMobile);
    };
  }, []);

  useEffect(() => {
    document.title = config.name.display;
  }, []);

  return (
    <AppProvider config={config} isMobile={isMobile}>
      <main className="app">
        <Toggle />
        <Content />
        <Buttons />
        <Particles />
      </main>
    </AppProvider>
  );
};
