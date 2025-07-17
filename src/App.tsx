
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatProvider } from "./context/ChatContext";
import { PermissionsProvider } from "./context/PermissionsContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthGuard } from "./components/auth/AuthGuard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import CourseProviders from "./pages/CourseProviders";
import TrainingSchedulerPage from "./pages/TrainingScheduler";
import TrainingDetail from "./pages/TrainingDetail";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeePortal from "./pages/EmployeePortal";
import Notifications from "./pages/Notifications";
import Participants from "./pages/Participants";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Providers from "./pages/Providers";
import ProviderProfile from "./pages/ProviderProfile";
import TrainingSetup from "./pages/TrainingSetup";
import CertificateDefinitions from "./pages/CertificateDefinitions";
import { CoursesRedirect } from "./components/redirects/CoursesRedirect";
import { ProvidersRedirect } from "./components/redirects/ProvidersRedirect";
import { CertificationsRedirect } from "./components/redirects/CertificationsRedirect";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import CertificateExpiry from "./pages/CertificateExpiry";
import PreliminaryPlanning from "./pages/PreliminaryPlanning";

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
                      {/* Protected Routes */}
                      <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
                      <Route path="/training-setup" element={<AuthGuard><TrainingSetup /></AuthGuard>} />
                      
                      {/* Backward compatibility redirects */}
                      <Route path="/courses" element={<AuthGuard><CoursesRedirect /></AuthGuard>} />
                      <Route path="/providers" element={<AuthGuard><ProvidersRedirect /></AuthGuard>} />
                      
                      {/* Keep detail pages for deep linking */}
                      <Route path="/courses/:id" element={<AuthGuard><CourseDetail /></AuthGuard>} />
                      <Route path="/providers/:id" element={<AuthGuard><ProviderProfile /></AuthGuard>} />
                      
                      <Route path="/participants" element={<AuthGuard><Participants /></AuthGuard>} />
                      <Route path="/participants/:id" element={<AuthGuard><UserProfile /></AuthGuard>} />
                      {/* Backward compatibility redirect */}
                      <Route path="/certifications" element={<AuthGuard><CertificationsRedirect /></AuthGuard>} />
                      <Route path="/certificate-definitions" element={<AuthGuard><CertificateDefinitions /></AuthGuard>} />
                      <Route path="/certificate-expiry" element={<AuthGuard><CertificateExpiry /></AuthGuard>} />
                      <Route path="/scheduling" element={<AuthGuard><TrainingSchedulerPage /></AuthGuard>} />
                      <Route path="/scheduling/:id" element={<AuthGuard><TrainingDetail /></AuthGuard>} />
                      <Route path="/preliminary-planning" element={<AuthGuard><PreliminaryPlanning /></AuthGuard>} />
                      <Route path="/employee-dashboard" element={<AuthGuard><EmployeeDashboard /></AuthGuard>} />
                      <Route path="/employee-portal" element={<AuthGuard><EmployeePortal /></AuthGuard>} />
                      <Route path="/communications" element={<AuthGuard><Notifications /></AuthGuard>} />
                      <Route path="/reports" element={<AuthGuard><Reports /></AuthGuard>} />
                      <Route path="/settings" element={<AuthGuard><Settings /></AuthGuard>} />

                      {/* Public Routes */}
                      <Route path="/login" element={<Login />} />
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
