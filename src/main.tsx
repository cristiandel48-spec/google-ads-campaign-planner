import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import LandingPage from './LandingPage.tsx';
import LegalPage from './LegalPage.tsx';
import './index.css';

// Lightweight path-based routing (no router dependency needed):
//  - /lp            -> landing page for the default product
//  - /lp/:productId -> landing page for a specific product (the URL used in Meta ads)
//  - /privacy       -> public privacy policy required by Meta
//  - /data-deletion -> public data deletion instructions required by Meta
//  - everything else -> the admin/strategist dashboard (App)
function Root() {
  const path = window.location.pathname;
  if (path === '/privacy') return <LegalPage type="privacy" />;
  if (path === '/data-deletion') return <LegalPage type="data-deletion" />;
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
