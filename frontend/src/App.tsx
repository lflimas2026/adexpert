import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PlatformAnalysis from './pages/PlatformAnalysis';
import Comparator from './pages/Comparator';
import Integrations from './pages/Integrations';
import Chat from './pages/Chat';
import History from './pages/History';
import Automations from './pages/Automations';
import Marketing from './pages/Marketing';
import CampaignDetail from './pages/CampaignDetail';
import DocsEditor from './pages/admin/docs-editor';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plataforma/:platform" element={<PlatformAnalysis />} />
            <Route path="/comparador" element={<Comparator />} />
            <Route path="/integracoes" element={<Integrations />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/historico" element={<History />} />
            <Route path="/automacoes" element={<Automations />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/marketing/:campaignId" element={<CampaignDetail />} />
            <Route path="/admin/docs-editor" element={<DocsEditor />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
