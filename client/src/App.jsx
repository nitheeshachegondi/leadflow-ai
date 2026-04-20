// src/App.jsx – Root application with routing
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/UI/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import LeadsPage from './pages/LeadsPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import AdminPage from './pages/AdminPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="chat/:leadId?" element={<ChatPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
