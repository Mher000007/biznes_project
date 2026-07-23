"use client";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import UserProfileDashboard from "@/components/dashboard/UserProfileDashboard";

export default function PersonalProfilePage() {
  return (
    <ProtectedRoute>
      <div className="pt-16 min-h-screen">
        <UserProfileDashboard />
      </div>
    </ProtectedRoute>
  );
}
