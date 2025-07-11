
import { Layout } from "@/components/layout/Layout";
import { useLocation } from "react-router-dom";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingCourses } from "@/components/dashboard/UpcomingCourses";
import { ReportsScreen } from "@/components/reports/ReportsScreen";
import { Users, BookOpen, Award, Calendar } from "lucide-react";

export default function Dashboard() {
  const location = useLocation();
  
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
            title="Total Participants"
            value={247}
            icon={Users}
            trend={{ value: "+12 this month", isPositive: true }}
            color="blue"
          />
          <StatsCard
            title="Active Courses"
            value={18}
            icon={BookOpen}
            trend={{ value: "+3 this week", isPositive: true }}
            color="green"
          />
          <StatsCard
            title="Valid Certifications"
            value={189}
            icon={Award}
            trend={{ value: "-5 expired", isPositive: false }}
            color="purple"
          />
          <StatsCard
            title="Scheduled Sessions"
            value={12}
            icon={Calendar}
            trend={{ value: "+4 next week", isPositive: true }}
            color="orange"
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
