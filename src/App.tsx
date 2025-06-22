import Box from '@mui/material/Box';
import AppBar from './components/AppBar';
import { useState, useEffect } from 'react';
import PushManagementCard from './components/PushManagementCard';
import RakutenSecurityExporterCard from './components/RakutenSecurityExporterCard';

function App() {
  const [serviceWorker, setServiceWorker] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(
        import.meta.env.MODE === 'production' ? '/sw.js' : '/dev-sw.js?dev-sw',
        {
          scope: '/', type: import.meta.env.MODE === 'production' ? 'classic' : 'module'
        }
      ).then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        setServiceWorker(registration)
      }
      ).catch((err: any) => {
        console.log('ServiceWorker registration failed: ', err);
      });
    }

    return () => {
      if (serviceWorker) {
        serviceWorker.unregister().then((success) => {
          console.log('ServiceWorker unregistered: ', success);
        })
      }
    }
  });

  return (
    <Box>
      <AppBar />
      <Box sx={{ paddingY: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <PushManagementCard serviceWorker={serviceWorker} />
        <RakutenSecurityExporterCard />
      </Box>
    </Box>
  )
}

export default App
