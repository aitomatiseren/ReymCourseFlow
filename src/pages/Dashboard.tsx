
import { Layout } from "@/components/layout/Layout";
import { useLocation } from "react-router-dom";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingCourses } from "@/components/dashboard/UpcomingCourses";
import { ReportsScreen } from "@/components/reports/ReportsScreen";
import { Users, BookOpen, Award, Calendar } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useCourses } from "@/hooks/useCourses";
import { useTrainings } from "@/hooks/useTrainings";
import { useCertificates } from "@/hooks/useCertificates";

export default function Dashboard() {
  const location = useLocation();

  // Fetch real data from database
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const { data: trainings = [], isLoading: trainingsLoading } = useTrainings();
  const { data: certificates = [], isLoading: certificatesLoading } = useCertificates();

  // Calculate real statistics
  const totalEmployees = employees.length;
  const activeCourses = courses.filter(course => course.title).length;
  const validCertificates = certificates.filter(cert => cert.status === 'valid').length;
  const expiredCertificates = certificates.filter(cert => cert.status === 'expired').length;
  const upcomingTrainings = trainings.filter(training =>
    training.status === 'scheduled' || training.status === 'confirmed'
  ).length;

  // Show reports screen when on /reports route
  if (location.pathname === "/reports") {
    return (
      <Layout>
        <ReportsScreen />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your course management.</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Employees"
            value={totalEmployees}
            icon={Users}
            trend={{
              value: employeesLoading ? "Loading..." : `${totalEmployees} total`,
              isPositive: true
            }}
            color="blue"
            isLoading={employeesLoading}
            href="/participants"
          />
          <StatsCard
            title="Active Courses"
            value={activeCourses}
            icon={BookOpen}
            trend={{
              value: coursesLoading ? "Loading..." : `${activeCourses} available`,
              isPositive: true
            }}
            color="green"
            isLoading={coursesLoading}
            href="/courses"
          />
          <StatsCard
            title="Valid Certificates"
            value={validCertificates}
            icon={Award}
            trend={{
              value: certificatesLoading ? "Loading..." : expiredCertificates > 0 ? `${expiredCertificates} expired` : "All current",
              isPositive: expiredCertificates === 0
            }}
            color="purple"
            isLoading={certificatesLoading}
            href="/certifications"
          />
          <StatsCard
            title="Scheduled Trainings"
            value={upcomingTrainings}
            icon={Calendar}
            trend={{
              value: trainingsLoading ? "Loading..." : `${upcomingTrainings} upcoming`,
              isPositive: true
            }}
            color="orange"
            isLoading={trainingsLoading}
            href="/scheduling"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <UpcomingCourses />
          </div>
          <div>
            <RecentActivity />
          </div>
        </div>
      </div>
    </Layout>
  );
}
