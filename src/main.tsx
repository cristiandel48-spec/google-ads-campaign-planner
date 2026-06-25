import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import LandingPage from './LandingPage.tsx';
import './index.css';

// Lightweight path-based routing (no router dependency needed):
//  - /lp            -> landing page for the default product
//  - /lp/:productId -> landing page for a specific product (the URL used in Meta ads)
//  - everything else -> the admin/strategist dashboard (App)
function Root() {
  const path = window.location.pathname;
  if (path === '/lp' || path.startsWith('/lp/')) {
    const productId = path.replace(/^\/lp\/?/, '').split('/')[0] || 'lemme-burn';
    return <LandingPage productId={productId} />;
  }
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
