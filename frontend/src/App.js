import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import './index.css';
import Login from './pages/login/Login';
import ResetPassword from './pages/login/lupapassword';
import Dashboard from './pages/dashboard';
import Register from './pages/login/Register'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/*" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
};

export default App;
