import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, User, ArrowRight } from "lucide-react";

interface LandingPageProps {
  onAdminLogin: () => void;
  onManagerLogin: () => void;
  onEmployeeLogin: () => void;
}

export default function LandingPage({ onAdminLogin, onManagerLogin, onEmployeeLogin }: LandingPageProps) {
  const loginOptions = [
    {
      id: 'admin',
      title: 'Admin Login',
      description: 'Company administrator with full access',
      icon: Building,
      color: 'blue',
      action: onAdminLogin,
    },
    {
      id: 'manager',
      title: 'Manager Login',
      description: 'Team leader who manages employees',
      icon: Users,
      color: 'green',
      action: onManagerLogin,
    },
    {
      id: 'employee',
      title: 'Employee Login',
      description: 'Team member who handles leads',
      icon: User,
      color: 'purple',
      action: onEmployeeLogin,
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-500',
          button: 'bg-blue-500 hover:bg-blue-600',
          border: 'border-blue-200'
        };
      case 'green':
        return {
          bg: 'bg-green-50',
          iconBg: 'bg-green-100',
          iconColor: 'text-green-500',
          button: 'bg-green-500 hover:bg-green-600',
          border: 'border-green-200'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-500',
          button: 'bg-purple-500 hover:bg-purple-600',
          border: 'border-purple-200'
        };
      default:
        return {
          bg: 'bg-gray-50',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-500',
          button: 'bg-gray-500 hover:bg-gray-600',
          border: 'border-gray-200'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-center items-center h-16">
              <img 
              src="/Bricspac_Logo-tr.png" 
              alt="Bricspac" 
                className="h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.location.href = '/'}
              />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-6 py-12">
        <div className="max-w-4xl w-full">
          {/* Branding Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <img 
                src="/Bricspac_Logo-tr.png" 
                alt="Bricspac" 
                className="h-20 w-auto"
              />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Welcome to Bricspac
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your complete call analysis and lead management platform
            </p>
          </div>
          
          {/* Login Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loginOptions.map((option) => {
              const colors = getColorClasses(option.color);
              const IconComponent = option.icon;
              
              return (
                <Card key={option.id} className={`h-full shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${colors.border} hover:scale-105`}>
                  <CardHeader className="text-center pb-4">
                    <div className={`w-20 h-20 ${colors.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className={`h-10 w-10 ${colors.iconColor}`} />
                </div>
                    <CardTitle className="text-2xl text-gray-900">{option.title}</CardTitle>
                    <CardDescription className="text-base text-gray-600">
                      {option.description}
                  </CardDescription>
              </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      onClick={option.action}
                      className={`w-full h-12 text-base ${colors.button} text-white`}
                    >
                      {option.title}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
            </Card>
              );
            })}
          </div>
        </div>
        </div>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm px-6 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-gray-600">
            © 2025 Bricspac. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
