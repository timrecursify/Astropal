import React from 'react';
import { Routes, Route } from 'react-router-dom';
import NotFound from './components/NotFound';
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import Variant0 from './components/variants/Variant0';
import Variant1 from './components/variants/Variant1';
import Variant2 from './components/variants/Variant2';
import ABTestRouter from './components/ABTestRouter';

const App: React.FC = () => {
  return (
    <div>
      <Routes>
        {/* A/B Testing root route */}
        <Route path="/" element={<ABTestRouter />} />
        
        {/* Direct variant routes for testing/debugging */}
        <Route path="/variant0" element={<Variant0 />} />
        <Route path="/variant1" element={<Variant1 />} />
        <Route path="/variant2" element={<Variant2 />} />
        
        {/* Static pages */}
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;