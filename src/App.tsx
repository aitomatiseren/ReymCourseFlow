
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
import CourseProviders from "./pages/CourseProviders";
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
              <Route path="/" element={<Dashboard />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/participants" element={<Participants />} />
              <Route path="/participants/:id" element={<UserProfile />} />
              <Route path="/certifications" element={<Certifications />} />
              <Route path="/scheduling" element={<TrainingSchedulerPage />} />
              <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
              <Route path="/providers" element={<Dashboard />} />
              <Route path="/communications" element={<Notifications />} />
              <Route path="/reports" element={<Dashboard />} />
              <Route path="/settings" element={<Dashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ChatProvider>
    </PermissionsProvider>
  </QueryClientProvider>
);

export default App;
