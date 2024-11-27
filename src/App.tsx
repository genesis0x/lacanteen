import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PointOfSale from './pages/PointOfSale';
import LunchService from './pages/LunchService';
import History from './pages/History';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import CreateStudent from './pages/CreateStudent';
import Products from './pages/Products';
import BulkUpload from './pages/BulkUpload';
import BulkUpdate from './pages/BulkUpdate';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<PointOfSale />} />
          <Route path="/lunch" element={<LunchService />} />
          <Route path="/history" element={<History />} />
          <Route path="/cstudent" element={<CreateStudent />} />
          <Route path="/products" element={<Products />} />
          <Route path="/bulk-upload" element={<BulkUpload />} />
          <Route path="/bulk-update" element={<BulkUpdate />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;