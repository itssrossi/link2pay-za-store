
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import AddProduct from '@/pages/AddProduct';
import InvoiceBuilder from '@/pages/InvoiceBuilder';
import InvoicePreview from '@/pages/InvoicePreview';
import BillingSetup from '@/pages/BillingSetup';
import SubscriptionPayment from '@/pages/SubscriptionPayment';
import Settings from '@/pages/Settings';
import Storefront from '@/pages/Storefront';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OnboardingProvider>
          <SubscriptionProvider>
            <div className="min-h-screen bg-background">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/store/:username" element={<Storefront />} />
                <Route path="/invoice/:invoiceId" element={<InvoicePreview />} />
                <Route
                  path="/billing-setup"
                  element={
                    <ProtectedRoute>
                      <BillingSetup />
                    </ProtectedRoute>
                  }
                />
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
                  path="/invoice-builder"
                  element={
                    <ProtectedRoute>
                      <InvoiceBuilder />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/subscription-payment"
                  element={
                    <ProtectedRoute>
                      <SubscriptionPayment />
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
        </OnboardingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
