import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/layout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import ValidarFactura from './pages/ValidarFactura';
import ValidarGuiaRemision from './pages/ValidarGuiaRemision';
import ValidarOrdenCompra from './pages/ValidarOrdenCompra';
import CrearNotaEntrega from './pages/CrearNotaEntrega';
import ListaNotasEntrega from './pages/ListaNotasEntrega';
import ListaDocumentos from './pages/ListaDocumentos';
import Pendientes from './pages/Pendientes';
import ListaExpedientes from './pages/ListaExpedientes';
import VerExpediente from './pages/VerExpediente';
import VerNotaEntrega from './pages/VerNotaEntrega';

function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<Upload />} />
          <Route path="validar/:id" element={<ValidarFactura />} />
          <Route path="validar-guia/:id" element={<ValidarGuiaRemision />} />
          <Route path="/validar-orden/:id" element={<ValidarOrdenCompra />} />
          <Route path="/notas-entrega" element={<ListaNotasEntrega />} />
          <Route path="/notas-entrega/crear" element={<CrearNotaEntrega />} />
          <Route path="/notas-entrega/:id" element={<VerNotaEntrega />} />
          <Route path="/expedientes" element={<ListaExpedientes />} />
          <Route path="/expedientes/:id" element={<VerExpediente />} />
          <Route path="facturas" element={<ListaDocumentos />} />
          <Route path="pendientes" element={<Pendientes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;