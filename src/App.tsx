import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import AddProduct from '@/pages/AddProduct';
import EditProduct from '@/pages/EditProduct';
import InvoiceBuilder from '@/pages/InvoiceBuilder';
import Settings from '@/pages/Settings';
import Store from '@/pages/Store';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/store/:storeHandle" element={<Store />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute>
                    <Products />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/add"
                element={
                  <ProtectedRoute>
                    <AddProduct />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products/edit/:id"
                element={
                  <ProtectedRoute>
                    <EditProduct />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoice-builder"
                element={
                  <ProtectedRoute>
                    <InvoiceBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster />
          </div>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
