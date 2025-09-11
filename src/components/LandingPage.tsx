import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Upload, BarChart3, Users, Zap, Shield, ArrowRight } from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {

  const features = [
    {
      icon: Upload,
      title: "Easy Upload",
      description: "Upload call recordings directly from Google Drive with one click"
    },
    {
      icon: BarChart3,
      title: "AI Analysis",
      description: "Advanced sentiment, engagement, and objection analysis powered by AI"
    },
    {
      icon: Users,
      title: "Team Insights",
      description: "Track performance across your entire sales team with detailed metrics"
    },
    {
      icon: Zap,
      title: "Real-time Processing",
      description: "Get analysis results in under 5 minutes with automated pipeline"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Enterprise-grade security with encrypted storage and access controls"
    }
  ];

  const benefits = [
    "Automate call quality monitoring",
    "Identify conversion levers and roadblocks",
    "Track sentiment and engagement trends",
    "Reduce manual review time by 90%",
    "Improve team performance with data insights",
    "Searchable transcript analysis"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-6 py-20 text-gray-900">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-6">
                <img 
                  src="/logo2.png" 
                  alt="Tasknova" 
                  className="h-12 w-auto mr-4"
                  onError={(e) => {
                    e.currentTarget.src = "/logo.png";
                  }}
                />
                <Badge className="bg-accent-blue/10 text-accent-blue border-accent-blue/20">
                  AI-Powered Call Analysis
                </Badge>
              </div>
              <h1 className="text-5xl font-bold leading-tight mb-6">
                <span className="text-accent-blue">Tasknova</span> Voice Analysis
                <br />
                Transform Your Call Performance with 
                <span className="text-accent-blue"> AI Insights</span>
              </h1>
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Upload call recordings from Google Drive and get detailed analysis reports 
                with sentiment scoring, engagement metrics, and actionable insights to boost your team's performance.
              </p>
              <div className="flex justify-start">
                <Button 
                  size="xl" 
                  variant="accent" 
                  onClick={onGetStarted}
                  className="bg-accent-blue text-white hover:bg-accent-blue/90 shadow-lg"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-3 rounded-full bg-success"></div>
                    <div className="text-sm text-gray-600">Live Analysis</div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-700 font-medium">
                    <span>Sentiment: 89%</span>
                    <span>Engagement: 92%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Powerful Features for Sales Teams</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to analyze, understand, and improve your call performance
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-accent-blue transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 bg-accent-blue-light rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-accent-blue" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-secondary px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Why Choose Our Platform?</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join hundreds of sales teams who have transformed their call performance with our AI-powered insights.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-accent-blue mb-2">90%</div>
                <div className="text-muted-foreground">Time Savings</div>
              </Card>
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-success mb-2">34%</div>
                <div className="text-muted-foreground">Conversion Boost</div>
              </Card>
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-warning mb-2">5 Min</div>
                <div className="text-muted-foreground">Analysis Time</div>
              </Card>
              <Card className="text-center p-6">
                <div className="text-3xl font-bold text-primary mb-2">500+</div>
                <div className="text-muted-foreground">Happy Teams</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Calls?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start analyzing your call recordings today and unlock insights that drive results.
          </p>
          <div className="flex justify-center">
            <Button size="xl" variant="accent" onClick={onGetStarted}>
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img 
                src="/logo.png" 
                alt="Tasknova" 
                className="h-8 w-auto"
                onError={(e) => {
                  e.currentTarget.src = "/logo2.png";
                }}
              />
              <div>
                <p className="font-semibold text-foreground">Tasknova</p>
                <p className="text-sm text-muted-foreground">Tasknova Voice Analysis</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-sm text-muted-foreground">
                © 2024 Tasknova. All rights reserved.
              </p>
              <p className="text-sm text-muted-foreground">
                Powered by AI • Built for Sales Excellence
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}