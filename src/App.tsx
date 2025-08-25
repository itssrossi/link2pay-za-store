
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';

// Lazy load pages for better performance
const Index = lazy(() => import('@/pages/Index'));
const NailTech = lazy(() => import('@/pages/NailTech'));
const Auth = lazy(() => import('@/pages/Auth'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Products = lazy(() => import('@/pages/Products'));
const AddProduct = lazy(() => import('@/pages/AddProduct'));
const EditProduct = lazy(() => import('@/pages/EditProduct'));
const InvoiceBuilder = lazy(() => import('@/pages/InvoiceBuilder'));
const InvoicePreview = lazy(() => import('@/pages/InvoicePreview'));
const BillingSetup = lazy(() => import('@/pages/BillingSetup'));
const BillingSuccess = lazy(() => import('@/pages/BillingSuccess'));
const BillingCancelled = lazy(() => import('@/pages/BillingCancelled'));
const BookingPaymentSuccess = lazy(() => import('@/pages/BookingPaymentSuccess'));
const BookingPaymentCancelled = lazy(() => import('@/pages/BookingPaymentCancelled'));
const Settings = lazy(() => import('@/pages/Settings'));
const Storefront = lazy(() => import('@/pages/Storefront'));
const ProtectedRoute = lazy(() => import('@/components/ProtectedRoute'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4C9F70]"></div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OnboardingProvider>
          <SubscriptionProvider>
            <div className="min-h-screen bg-background">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/nailtech" element={<NailTech />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/store/:username" element={<Storefront />} />
                  <Route path="/invoice/:invoiceId" element={<InvoicePreview />} />
                  <Route path="/booking-payment-success" element={<BookingPaymentSuccess />} />
                  <Route path="/booking-payment-cancelled" element={<BookingPaymentCancelled />} />
                  <Route
                    path="/billing/setup"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedRoute>
                          <BillingSetup />
                        </ProtectedRoute>
                      </Suspense>
                    }
                  />
                  <Route
                    path="/billing/success"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <BillingSuccess />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/billing/cancelled"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <BillingCancelled />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      </Suspense>
                    }
                  />
                  <Route
                    path="/products"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedRoute>
                          <Products />
                        </ProtectedRoute>
                      </Suspense>
                    }
                  />
                  <Route
                    path="/products/add"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedRoute>
                          <AddProduct />
                        </ProtectedRoute>
                      </Suspense>
                    }
                  />
                  <Route
                    path="/products/edit/:id"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedRoute>
                          <EditProduct />
                        </ProtectedRoute>
                      </Suspense>
                    }
                  />
                  <Route
                    path="/invoice-builder"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedRoute>
                          <InvoiceBuilder />
                        </ProtectedRoute>
                      </Suspense>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <Suspense fallback={<PageLoader />}>
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      </Suspense>
                    }
                  />
                </Routes>
              </Suspense>
              <Toaster />
            </div>
          </SubscriptionProvider>
        </OnboardingProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
