import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import FormPage from './pages/FormPage';
import Analytics from './pages/Analytics';
import SentEmails from './pages/SentEmails';
import Inbox from './pages/Inbox';
import NoEmail from './pages/NoEmail';

/**
 * Main App Component
 * Manages routing and layout for the application
 */
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<FormPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/sent" element={<SentEmails />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/no-email" element={<NoEmail />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
