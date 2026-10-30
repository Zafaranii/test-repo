import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { detectSystemTheme } from './store/slices/themeSlice';
import { initializeMasterAuth } from './store/slices/masterAuthSlice';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/common/ErrorBoundary/ErrorBoundary';
import { QueryClient, QueryClientProvider, HydrationBoundary } from '@tanstack/react-query';
import LandingPage from './pages/customer/Landing page/LandingPage';
import StudiosListPage from './pages/customer/StudiosListPage/StudiosListPage';
import StudioDetailsPage from './pages/customer/StudioDetailsPage/StudioDetailsPage';
import BuyApartmentPage from './pages/customer/BuyApartmentPage/BuyApartmentPage';
import ApartmentSaleDetailsPage from './pages/customer/ApartmentSaleDetailsPage/ApartmentSaleDetailsPage';
import AdminApartmentSaleDetailsPage from './pages/admin/ApartmentSaleDetailsPage/ApartmentSaleDetailsPage';
import ApartmentDetailPage from './pages/admin/ApartmentDetailPage/ApartmentDetailPage';
import AdminLanding from './pages/admin/AdminLanding/AdminLanding';
import AdminDashboard from './pages/admin/AdminDashboard/AdminDashboard';
import RentalAlertsPage from './pages/admin/RentalAlertsPage/RentalAlertsPage';
import AdminLoginPage from './pages/auth/AdminLoginPage/AdminLoginPage';
import MasterAdminLoginForm from './components/forms/MasterAdminLoginForm';
import MasterAdminDashboard from './pages/masterAdmin/MasterAdminDashboard/MasterAdminDashboard';
import ReportsPage from './pages/masterAdmin/ReportsPage/ReportsPage';
import ProfileEditPage from './pages/masterAdmin/ProfileEditPage/ProfileEditPage';
import AdminManagementPage from './pages/masterAdmin/AdminManagementPage/AdminManagementPage';
import MasterAdminRentalAlertsPage from './pages/masterAdmin/MasterAdminRentalAlertsPage/MasterAdminRentalAlertsPage';
import ProtectedRoute from './components/common/ProtectedRoute/ProtectedRoute';
import AdminProtectedRoute from './components/common/ProtectedRoute/AdminProtectedRoute';
import DemoBanner from './demo/DemoBanner';
import { DEMO_MODE } from './demo/config';
import { useMemo } from 'react';

const SEO_BASE_URL =
  (typeof window !== 'undefined' && window.location.origin) ||
  import.meta.env.VITE_SITE_URL ||
  'http://localhost:3000';

function Seo({
  title,
  description,
  canonicalPath = '/',
  image = '/AYG.png',
  noIndex = false,
  structuredData,
}) {
  const canonical = `${SEO_BASE_URL}${canonicalPath}`;
  const imageUrl = image.startsWith('http') ? image : `${SEO_BASE_URL}${image}`;

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.title = title;

    const setMeta = (name, content, property = false) => {
      const selector = property
        ? `meta[property="${name}"]`
        : `meta[name="${name}"]`;
      let tag = document.head.querySelector(selector);
      if (!tag) {
        tag = document.createElement('meta');
        if (property) {
          tag.setAttribute('property', name);
        } else {
          tag.setAttribute('name', name);
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    const setCanonical = (href) => {
      let link = document.head.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    setMeta('description', description);
    setMeta('og:title', title, true);
    setMeta('og:description', description, true);
    setMeta('og:type', 'website', true);
    setMeta('og:url', canonical, true);
    setMeta('og:image', imageUrl, true);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', imageUrl);
    setMeta('robots', noIndex || DEMO_MODE ? 'noindex,nofollow' : 'index,follow');
    setCanonical(canonical);

    const scriptId = 'route-structured-data';
    const previousScript = document.getElementById(scriptId);
    if (previousScript) {
      previousScript.remove();
    }

    if (structuredData) {
      const scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.type = 'application/ld+json';
      scriptTag.text = JSON.stringify(structuredData);
      document.head.appendChild(scriptTag);
    }
  }, [title, description, canonical, imageUrl, noIndex, structuredData]);

  return null;
}

const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'AYG',
  url: SEO_BASE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SEO_BASE_URL}/studios`,
    'query-input': 'required name=search_term_string',
  },
};

// App content component to access Redux hooks
function AppContent({ RouterComponent, routerProps }) {
  const dispatch = useDispatch();

  useEffect(() => {
    // Initialize theme detection
    dispatch(detectSystemTheme());
    
    // Initialize Master Admin authentication state to persist login across page refreshes
    // This will restore the session from JWT token in localStorage/sessionStorage
    dispatch(initializeMasterAuth());
    
    // Initialize Regular Admin authentication state to persist login across page refreshes
    // This will verify the JWT token with the API and restore the admin session
    const initAdminAuth = async () => {
      const { initializeAdminAuth } = await import('./hooks/useAdminAuth');
      // Note: We can't use the hook directly here, so we check token and restore session
      const token = localStorage.getItem('api_access_token');
      if (token) {

      }
    };
    initAdminAuth();

  }, [dispatch]);

  return (
    <ErrorBoundary showDetails={import.meta.env.DEV}>
      <ToastProvider>
        <RouterComponent {...routerProps}>
          <div>
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <Seo
                      title="AYG"
                      description="Find furnished studios for rent and apartments for sale in Maadi and Mokattam with AYG real estate."
                      canonicalPath="/"
                      structuredData={websiteStructuredData}
                    />
                    <LandingPage />
                  </>
                }
              />
              <Route
                path="/studios"
                element={
                  <>
                    <Seo
                      title="AYG"
                      description="Browse available studios for rent with verified amenities, photos, and pricing details."
                      canonicalPath="/studios"
                    />
                    <StudiosListPage />
                  </>
                }
              />
              <Route
                path="/studio/:id"
                element={
                  <>
                    <Seo
                      title="AYG"
                      description="View full studio details including location, furnishing, and rent terms."
                      canonicalPath="/studios"
                    />
                    <StudioDetailsPage />
                  </>
                }
              />
              <Route
                path="/buy-apartments"
                element={
                  <>
                    <Seo
                      title="AYG"
                      description="Explore apartments for sale with up-to-date prices and neighborhood highlights."
                      canonicalPath="/buy-apartments"
                    />
                    <BuyApartmentPage />
                  </>
                }
              />
              <Route
                path="/apartment-sale/:id"
                element={
                  <>
                    <Seo
                      title="AYG"
                      description="Check apartment sale details, photos, and location information before booking a visit."
                      canonicalPath="/buy-apartments"
                    />
                    <ApartmentSaleDetailsPage />
                  </>
                }
              />
              <Route
                path="/admin"
                element={
                  <>
                    <Seo title="AYG" description="Admin dashboard" noIndex />
                    <AdminLanding />
                  </>
                }
              />
              <Route
                path="/admin/login"
                element={
                  <>
                    <Seo title="AYG" description="Admin sign in" noIndex />
                    <AdminLoginPage />
                  </>
                }
              />
              <Route 
                path="/admin/dashboard" 
                element={
                  <>
                    <Seo title="AYG" description="Admin dashboard" noIndex />
                    <AdminProtectedRoute>
                      <AdminDashboard />
                    </AdminProtectedRoute>
                  </>
                } 
              />
              <Route 
                path="/admin/rental-alerts" 
                element={
                  <>
                    <Seo title="AYG" description="Admin rental alerts" noIndex />
                    <AdminProtectedRoute>
                      <RentalAlertsPage />
                    </AdminProtectedRoute>
                  </>
                } 
              />
              <Route
                path="/admin/apartment-sale/:id"
                element={
                  <>
                    <Seo title="AYG" description="Admin sale details" noIndex />
                    <AdminApartmentSaleDetailsPage />
                  </>
                }
              />
              <Route
                path="/apartment/:id"
                element={
                  <>
                    <Seo title="AYG" description="Apartment detail page" noIndex />
                    <ApartmentDetailPage />
                  </>
                }
              />
              <Route
                path="/master-admin/login"
                element={
                  <>
                    <Seo title="AYG" description="Master admin sign in" noIndex />
                    <MasterAdminLoginForm />
                  </>
                }
              />
              <Route path="/master-admin" element={<Navigate to="/master-admin/login" replace />} />
              <Route 
                path="/master-admin/dashboard" 
                element={
                  <>
                    <Seo title="AYG" description="Master admin dashboard" noIndex />
                    <ProtectedRoute>
                      <MasterAdminDashboard />
                    </ProtectedRoute>
                  </>
                } 
              />
              <Route 
                path="/master-admin/reports" 
                element={
                  <>
                    <Seo title="AYG" description="Master admin reports" noIndex />
                    <ProtectedRoute>
                      <ReportsPage />
                    </ProtectedRoute>
                  </>
                } 
              />
              <Route 
                path="/master-admin/profile" 
                element={
                  <>
                    <Seo title="AYG" description="Master admin profile" noIndex />
                    <ProtectedRoute>
                      <ProfileEditPage />
                    </ProtectedRoute>
                  </>
                } 
              />
              <Route 
                path="/master-admin/manage-admins" 
                element={
                  <>
                    <Seo title="AYG" description="Master admin management" noIndex />
                    <ProtectedRoute>
                      <AdminManagementPage />
                    </ProtectedRoute>
                  </>
                } 
              />
              <Route 
                path="/master-admin/rental-alerts" 
                element={
                  <>
                    <Seo title="AYG" description="Master admin alerts" noIndex />
                    <ProtectedRoute>
                      <MasterAdminRentalAlertsPage />
                    </ProtectedRoute>
                  </>
                } 
              />
            </Routes>
          </div>
          <DemoBanner />
        </RouterComponent>
      </ToastProvider>
    </ErrorBoundary>
  );
}

function App({
  RouterComponent = BrowserRouter,
  routerProps = {},
  dehydratedState,
}) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60000,
            gcTime: 5 * 60000,
            retry: 1,
          },
        },
      }),
    []
  );

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={dehydratedState}>
          <AppContent RouterComponent={RouterComponent} routerProps={routerProps} />
        </HydrationBoundary>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;


