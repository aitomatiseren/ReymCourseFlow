
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CacheInvalidationService } from "@/services/ai/cache-invalidation";
import { ChatProvider } from "./context/ChatContext";
import { PermissionsProvider } from "./context/PermissionsContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthGuard } from "./components/auth/AuthGuard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ComponentErrorBoundary } from "./components/error-boundaries/ComponentErrorBoundary";

// Lazy load components for better bundle splitting
// Core pages (loaded immediately)
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Feature pages (lazy loaded)
const Courses = lazy(() => import("./pages/Courses"));
const CourseDetail = lazy(() => import("./pages/CourseDetail"));
const CourseProviders = lazy(() => import("./pages/CourseProviders"));
const TrainingSchedulerPage = lazy(() => import("./pages/TrainingScheduler"));
const TrainingDetail = lazy(() => import("./pages/TrainingDetail"));
const EmployeeDashboard = lazy(() => import("./pages/EmployeeDashboard"));
const EmployeePortal = lazy(() => import("./pages/EmployeePortal"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Participants = lazy(() => import("./pages/Participants"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const Settings = lazy(() => import("./pages/Settings"));
const Reports = lazy(() => import("./pages/Reports"));
const Providers = lazy(() => import("./pages/Providers"));
const ProviderProfile = lazy(() => import("./pages/ProviderProfile"));
const TrainingSetup = lazy(() => import("./pages/TrainingSetup"));
const CertificateDefinitions = lazy(() => import("./pages/CertificateDefinitions"));
const CertificateExpiry = lazy(() => import("./pages/CertificateExpiry"));
const PreliminaryPlanning = lazy(() => import("./pages/PreliminaryPlanning"));
const PersonalNotes = lazy(() => import("./pages/PersonalNotes"));

// Redirect components (smaller, can be lazy loaded)
const CoursesRedirect = lazy(() => import("./components/redirects/CoursesRedirect").then(m => ({ default: m.CoursesRedirect })));
const ProvidersRedirect = lazy(() => import("./components/redirects/ProvidersRedirect").then(m => ({ default: m.ProvidersRedirect })));
const CertificationsRedirect = lazy(() => import("./components/redirects/CertificationsRedirect").then(m => ({ default: m.CertificationsRedirect })));

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// HOC for lazy-loaded pages with error boundaries
const withLazyLoading = (Component: React.ComponentType) => (
  <ComponentErrorBoundary componentName="LazyPage">
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  </ComponentErrorBoundary>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error && typeof error === 'object' && 'status' in error && 
            typeof error.status === 'number' && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false,
    },
  },
});

// Initialize cache invalidation service for AI operations
CacheInvalidationService.setQueryClient(queryClient);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <PermissionsProvider>
        <ErrorBoundary>
          <LanguageProvider>
            <ErrorBoundary>
              <ChatProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      {/* Core Routes (not lazy loaded for immediate access) */}
                      <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
                      <Route path="/login" element={<Login />} />
                      
                      {/* Feature Routes (lazy loaded) */}
                      <Route path="/training-setup" element={<AuthGuard>{withLazyLoading(TrainingSetup)}</AuthGuard>} />
                      
                      {/* Backward compatibility redirects */}
                      <Route path="/courses" element={<AuthGuard>{withLazyLoading(CoursesRedirect)}</AuthGuard>} />
                      <Route path="/providers" element={<AuthGuard>{withLazyLoading(ProvidersRedirect)}</AuthGuard>} />
                      
                      {/* Detail pages */}
                      <Route path="/courses/:id" element={<AuthGuard>{withLazyLoading(CourseDetail)}</AuthGuard>} />
                      <Route path="/providers/:id" element={<AuthGuard>{withLazyLoading(ProviderProfile)}</AuthGuard>} />
                      
                      {/* User Management */}
                      <Route path="/participants" element={<AuthGuard>{withLazyLoading(Participants)}</AuthGuard>} />
                      <Route path="/participants/:id" element={<AuthGuard>{withLazyLoading(UserProfile)}</AuthGuard>} />
                      
                      {/* Certificates */}
                      <Route path="/certifications" element={<AuthGuard>{withLazyLoading(CertificationsRedirect)}</AuthGuard>} />
                      <Route path="/certificate-definitions" element={<AuthGuard>{withLazyLoading(CertificateDefinitions)}</AuthGuard>} />
                      <Route path="/certificate-expiry" element={<AuthGuard>{withLazyLoading(CertificateExpiry)}</AuthGuard>} />
                      
                      {/* Training & Scheduling */}
                      <Route path="/scheduling" element={<AuthGuard>{withLazyLoading(TrainingSchedulerPage)}</AuthGuard>} />
                      <Route path="/scheduling/:id" element={<AuthGuard>{withLazyLoading(TrainingDetail)}</AuthGuard>} />
                      <Route path="/preliminary-planning" element={<AuthGuard>{withLazyLoading(PreliminaryPlanning)}</AuthGuard>} />
                      
                      {/* Employee Features */}
                      <Route path="/employee-dashboard" element={<AuthGuard>{withLazyLoading(EmployeeDashboard)}</AuthGuard>} />
                      <Route path="/employee-portal" element={<AuthGuard>{withLazyLoading(EmployeePortal)}</AuthGuard>} />
                      <Route path="/communications" element={<AuthGuard>{withLazyLoading(Notifications)}</AuthGuard>} />
                      <Route path="/reports" element={<AuthGuard>{withLazyLoading(Reports)}</AuthGuard>} />
                      <Route path="/personal-notes" element={<AuthGuard>{withLazyLoading(PersonalNotes)}</AuthGuard>} />
                      <Route path="/settings" element={<AuthGuard>{withLazyLoading(Settings)}</AuthGuard>} />

                      {/* Public Routes */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </ChatProvider>
            </ErrorBoundary>
          </LanguageProvider>
        </ErrorBoundary>
      </PermissionsProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
