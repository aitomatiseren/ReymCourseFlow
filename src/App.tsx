
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ChatProvider } from "./context/ChatContext";
import { PermissionsProvider } from "./context/PermissionsContext";
import { AuthGuard } from "./components/auth/AuthGuard";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import Certifications from "./pages/Certifications";
import TrainingSchedulerPage from "./pages/TrainingScheduler";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Notifications from "./pages/Notifications";
import Participants from "./pages/Participants";
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Providers from "./pages/Providers";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import CertificateExpiry from "./pages/CertificateExpiry";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <PermissionsProvider>
      <ChatProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected routes */}
              <Route path="/" element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              } />
              <Route path="/courses" element={
                <AuthGuard>
                  <Courses />
                </AuthGuard>
              } />
              <Route path="/participants" element={
                <AuthGuard>
                  <Participants />
                </AuthGuard>
              } />
              <Route path="/participants/:id" element={
                <AuthGuard>
                  <UserProfile />
                </AuthGuard>
              } />
              <Route path="/certifications" element={
                <AuthGuard>
                  <Certifications />
                </AuthGuard>
              } />
              <Route path="/certificate-expiry" element={
                <AuthGuard>
                  <CertificateExpiry />
                </AuthGuard>
              } />
              <Route path="/scheduling" element={
                <AuthGuard>
                  <TrainingSchedulerPage />
                </AuthGuard>
              } />
              <Route path="/employee-dashboard" element={
                <AuthGuard>
                  <EmployeeDashboard />
                </AuthGuard>
              } />
              <Route path="/providers" element={
                <AuthGuard>
                  <Providers />
                </AuthGuard>
              } />
              <Route path="/communications" element={
                <AuthGuard>
                  <Notifications />
                </AuthGuard>
              } />
              <Route path="/reports" element={
                <AuthGuard>
                  <Reports />
                </AuthGuard>
              } />
              <Route path="/settings" element={
                <AuthGuard>
                  <Settings />
                </AuthGuard>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ChatProvider>
    </PermissionsProvider>
  </QueryClientProvider>
);

export default App;
