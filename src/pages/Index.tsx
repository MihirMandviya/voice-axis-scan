import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import LandingPage from "@/components/LandingPage";
import Dashboard from "@/components/Dashboard";

const Index = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [searchParams] = useSearchParams();

  // Check if we should show dashboard based on URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      // If there's a tab parameter, show the dashboard
      setShowDashboard(true);
    }
  }, [searchParams]);

  if (showDashboard) {
    return <Dashboard />;
  }

  return <LandingPage onGetStarted={() => setShowDashboard(true)} />;
};

export default Index;
