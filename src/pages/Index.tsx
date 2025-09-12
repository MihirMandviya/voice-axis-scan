import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, UserProfile } from "@/lib/supabase";
import LandingPage from "@/components/LandingPage";
import Dashboard from "@/components/Dashboard";
import ProfilePage from "@/components/ProfilePage";
import OnboardingFlow from "@/components/OnboardingFlow";
import AuthModal from "@/components/AuthModal";

type ViewType = 'landing' | 'auth' | 'onboarding' | 'dashboard' | 'profile';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [searchParams] = useSearchParams();

  // Check if we should show dashboard based on URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && user) {
      setCurrentView('dashboard');
    }
  }, [searchParams, user]);

  // Handle authentication state changes
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setCurrentView('landing');
      return;
    }

    // User is authenticated, check if they need onboarding
    fetchUserProfile();
  }, [user, authLoading]);

  const fetchUserProfile = async () => {
    if (!user) return;

    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no record exists

      if (error) {
        console.error('Error fetching profile:', error);
        // If it's a 406 or other error, still proceed to onboarding
        setCurrentView('onboarding');
        return;
      }

      setUserProfile(data);

      if (!data || !data.onboarding_completed) {
        setCurrentView('onboarding');
      } else {
        setCurrentView('dashboard');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // On any error, default to onboarding
      setCurrentView('onboarding');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleGetStarted = () => {
    setCurrentView('auth');
  };

  const handleOnboardingComplete = () => {
    fetchUserProfile(); // Refetch profile and navigate to dashboard
  };

  const handleShowProfile = () => {
    setCurrentView('profile');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  // Show loading spinner while checking auth state
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Render based on current view
  switch (currentView) {
    case 'landing':
      return <LandingPage onGetStarted={handleGetStarted} />;
    
    case 'auth':
      return (
        <>
          <LandingPage onGetStarted={handleGetStarted} />
          <AuthModal 
            isOpen={true} 
            onClose={() => setCurrentView('landing')} 
          />
        </>
      );
    
    case 'onboarding':
      return <OnboardingFlow onComplete={handleOnboardingComplete} />;
    
    case 'profile':
      return <ProfilePage onBack={handleBackToDashboard} />;
    
    case 'dashboard':
      return <Dashboard onShowProfile={handleShowProfile} />;
    
    default:
      return <LandingPage onGetStarted={handleGetStarted} />;
  }
};

export default Index;
