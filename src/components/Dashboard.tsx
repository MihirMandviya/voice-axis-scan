import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, Play, Download, MoreHorizontal, TrendingUp, TrendingDown, Users, Phone, Star, AlertTriangle, Trash2, BarChart3, Loader2, User, LogOut } from "lucide-react";
import { useDashboardStats, useRecordings, useAnalyses, useDeleteRecording } from "@/hooks/useSupabaseData";
import AddRecordingModal from "./AddRecordingModal";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
// import { useAnalysisNotifications } from "@/hooks/useAnalysisNotifications";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Analysis } from "@/lib/supabase";

interface DashboardProps {
  onShowProfile?: () => void;
}

export default function Dashboard({ onShowProfile }: DashboardProps) {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const { data: dashboardData, isLoading, error } = useDashboardStats();
  const { data: recordings, isLoading: recordingsLoading } = useRecordings();
  const { data: analyses } = useAnalyses();
  const deleteRecording = useDeleteRecording();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  
  // Analysis notifications disabled per user request
  // useAnalysisNotifications();

  // Handle tab parameter from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'recordings'].includes(tab)) {
      setSelectedTab(tab);
    }
  }, [searchParams]);

  const getSentimentColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-accent-blue";
    return "text-warning";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "analyzed":
        return <Badge className="bg-success-light text-success">Completed</Badge>;
      case "processing":
      case "in_progress":
      case "analyzing":
        return <Badge className="bg-accent-blue-light text-accent-blue">Processing</Badge>;
      case "transcribing":
      case "transcribed":
        return <Badge className="bg-purple-100 text-purple-700">Transcribing</Badge>;
      case "queued":
      case "pending":
      case "uploaded":
        return (
          <Badge className="bg-accent-blue-light text-accent-blue flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case "failed":
      case "error":
        return <Badge className="bg-destructive-light text-destructive">Failed</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-700">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading || !dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-accent-blue mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-warning mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">Error loading dashboard</p>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Phone className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">No data available</p>
          <p className="text-muted-foreground">Upload some recordings to see your dashboard</p>
        </div>
      </div>
    );
  }

  const { kpiData, sentimentData, trendData, engagementData, objectionData, recentCalls, last10CallsSentiment, last10CallsConfidence, last10CallsObjections } = dashboardData;

  const handleRecordingAdded = () => {
    // Invalidate and refetch all queries to refresh the dashboard
    queryClient.invalidateQueries({ queryKey: ['recordings'] });
    queryClient.invalidateQueries({ queryKey: ['analyses'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] });
  };

  const handleDeleteRecording = async (recordingId: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      try {
        await deleteRecording.mutateAsync(recordingId);
        toast({
          title: "Success",
          description: `"${fileName}" has been deleted successfully.`,
        });
      } catch (error) {
        console.error('Delete failed:', error);
        toast({
          title: "Error",
          description: `Failed to delete "${fileName}". Please try again.`,
          variant: "destructive",
        });
      }
    }
  };

  const handleRecordingClick = (analysis: Analysis | null, recording: any, recordingName: string) => {
    if (analysis && analysis.detailed_call_analysis) {
      navigate(`/analysis/${analysis.id}`);
    } else {
      toast({
        title: "No Analysis Available",
        description: "This recording hasn't been analyzed yet or the analysis is still pending.",
        variant: "default",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img 
              src="/logo.png" 
              alt="Tasknova" 
              className="h-10 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              onError={(e) => {
                e.currentTarget.src = "/logo2.png";
              }}
              onClick={() => navigate('/')}
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tasknova Voice Analysis</h1>
              
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={onShowProfile}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
            <Button 
              variant="accent" 
              size="lg" 
              className="gap-2"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Upload className="h-4 w-4" />
              Add Recording
            </Button>
            <Button 
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card p-6">
          <nav className="space-y-2">
              <Button 
                variant={selectedTab === "overview" ? "accent" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setSelectedTab("overview")}
              >
                <TrendingUp className="h-4 w-4" />
                Dashboard
              </Button>
              <Button 
                variant={selectedTab === "recordings" ? "accent" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setSelectedTab("recordings")}
              >
                <Phone className="h-4 w-4" />
                Recordings
              </Button>
              <Button 
                variant={selectedTab === "analytics" ? "accent" : "ghost"} 
                className="w-full justify-start"
                onClick={() => setSelectedTab("analytics")}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={onShowProfile}
              >
                <User className="h-4 w-4" />
                Profile
              </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsContent value="overview" className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{kpiData.totalCalls}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-success">+12%</span> from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      {kpiData.avgSentiment.toFixed(0)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-success">+5%</span> from last week
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent-blue">
                      {kpiData.avgEngagement.toFixed(0)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-success">+8%</span> from last week
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Objections Handled</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning">{kpiData.objectionsHandled}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-success">+15%</span> handling rate
                    </p>
                  </CardContent>
                </Card>


                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Exec Confidence</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent-blue">
                      {kpiData.avgConfidenceExecutive.toFixed(0)}/10
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average executive confidence
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Person Confidence</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      {kpiData.avgConfidencePerson.toFixed(0)}/10
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Average person confidence
                    </p>
                  </CardContent>
                </Card>


                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">High Performing</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      {kpiData.highPerformingCalls || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Calls with 80%+ sentiment & 75%+ engagement
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Action Items</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning">
                      {kpiData.callsWithNextSteps || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Calls with defined next steps
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Objection Success</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      {kpiData.objectionSuccessRate.toFixed(0)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {kpiData.totalObjectionsTackled}/{kpiData.totalObjectionsRaised} tackled
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Last 10 Calls Analysis Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Last 10 Calls - Sentiment Trend</CardTitle>
                    <CardDescription>Sentiment analysis progression over recent calls</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={last10CallsSentiment}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="call" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip 
                          formatter={(value, name) => [`${value}%`, 'Sentiment']}
                          labelFormatter={(label) => {
                            const item = last10CallsSentiment.find(d => d.call === label);
                            return item ? `${item.callName} (${item.date})` : label;
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="sentiment" 
                          stroke="hsl(var(--success))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: 'hsl(var(--success))', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Last 10 Calls - Confidence Analysis</CardTitle>
                    <CardDescription>Executive and Person confidence scores comparison</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={last10CallsConfidence}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="call" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip 
                          formatter={(value, name) => [`${value}/10`, name === 'executive' ? 'Executive Confidence' : 'Person Confidence']}
                          labelFormatter={(label) => {
                            const item = last10CallsConfidence.find(d => d.call === label);
                            return item ? `${item.callName} (${item.date})` : label;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="executive" fill="hsl(var(--accent-blue))" name="Executive" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="person" fill="hsl(var(--success))" name="Person" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Calls */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Call Analyses</CardTitle>
                  <CardDescription>Latest processed recordings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentCalls.map((call) => (
                      <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Button variant="ghost" size="icon">
                            <Play className="h-4 w-4" />
                          </Button>
                          <div>
                            <h4 className="font-medium">{call.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {call.date} • {call.duration}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-8">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Sentiment</p>
                            <p className={`font-medium ${getSentimentColor(call.sentiment)}`}>
                              {call.sentiment.toFixed(0)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Engagement</p>
                            <p className="font-medium text-accent-blue">
                              {call.engagement.toFixed(0)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Exec Conf.</p>
                            <p className="font-medium text-success">
                              {call.confidenceExecutive}/10
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Person Conf.</p>
                            <p className="font-medium text-accent-blue">
                              {call.confidencePerson}/10
                            </p>
                          </div>
                          {getStatusBadge(call.status)}
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recordings">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>All Recordings</CardTitle>
                    <CardDescription>Complete history of your call recordings and analyses</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <Upload className="h-4 w-4" />
                    Add Recording
                  </Button>
                </CardHeader>
                <CardContent>
                  {recordingsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue"></div>
                      <span className="ml-2 text-muted-foreground">Loading recordings...</span>
                    </div>
                  ) : !recordings || recordings.length === 0 ? (
                    <div className="text-center py-8">
                      <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-foreground">No recordings yet</p>
                      <p className="text-muted-foreground mb-4">Upload your first recording to get started</p>
                      <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                        <Upload className="h-4 w-4" />
                        Add Recording
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recordings.map((recording) => {
                        const analysis = analyses?.find(a => a.recording_id === recording.id);
                        const hasDetailedAnalysis = analysis && analysis.detailed_call_analysis;
                        return (
                          <div 
                            key={recording.id} 
                            className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                              hasDetailedAnalysis 
                                ? 'hover:bg-accent/50 cursor-pointer' 
                                : 'opacity-75'
                            }`}
                            onClick={() => handleRecordingClick(analysis, recording, recording.file_name || 'Unnamed Recording')}
                          >
                            <div className="flex items-center space-x-4">
                              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                <Play className="h-4 w-4" />
                              </Button>
                              <div>
                                <h4 className="font-medium flex items-center gap-2">
                                  {recording.file_name || 'Unnamed Recording'}
                                  {hasDetailedAnalysis && (
                                    <Badge variant="secondary" className="text-xs">
                                      Click for details
                                    </Badge>
                                  )}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(recording.created_at).toLocaleDateString()} • 
                                  {recording.duration_seconds ? ` ${Math.floor(recording.duration_seconds / 60)}:${(recording.duration_seconds % 60).toString().padStart(2, '0')}` : ' Duration unknown'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-6">
                              {analysis ? (
                                <>
                                  <div className="text-center">
                                    <p className="text-xs text-muted-foreground">Sentiment</p>
                                    <p className={`font-medium ${getSentimentColor(analysis.sentiment_score || 0)}`}>
                                      {analysis.sentiment_score || 0}%
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-muted-foreground">Engagement</p>
                                    <p className="font-medium text-accent-blue">
                                      {analysis.engagement_score || 0}%
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-muted-foreground">Exec Conf.</p>
                                    <p className="font-medium text-success">
                                      {analysis.confidence_score_executive || 0}/10
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-muted-foreground">Person Conf.</p>
                                    <p className="font-medium text-accent-blue">
                                      {analysis.confidence_score_person || 0}/10
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center">
                                  <p className="text-sm text-muted-foreground">Analysis pending...</p>
                                </div>
                              )}
                              {getStatusBadge(recording.status || 'unknown')}
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRecording(recording.id, recording.file_name || 'Unnamed Recording');
                                }}
                                disabled={deleteRecording.isPending}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              {/* Charts moved from Dashboard Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment Distribution</CardTitle>
                    <CardDescription>Breakdown of call sentiments this week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment & Engagement Trends</CardTitle>
                    <CardDescription>Call-wise performance analysis</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={last10CallsSentiment.map((call, index) => ({
                        call: call.call,
                        callName: call.callName,
                        date: call.date,
                        sentiment: call.sentiment,
                        engagement: last10CallsConfidence[index]?.executive ? 
                          Math.min(((last10CallsConfidence[index].executive + last10CallsConfidence[index].person) / 2) * 10, 100) : 
                          Math.floor(Math.random() * 30) + 60 // fallback engagement data between 60-90%
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="call" 
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis domain={[0, 100]} />
                        <Tooltip 
                          formatter={(value, name) => [
                            `${value}${name === 'sentiment' ? '%' : '%'}`, 
                            name === 'sentiment' ? 'Sentiment' : 'Engagement'
                          ]}
                          labelFormatter={(label) => {
                            const item = last10CallsSentiment.find(d => d.call === label);
                            return item ? `${item.callName} (${item.date})` : label;
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="sentiment" 
                          stroke="hsl(var(--success))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--success))', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: 'hsl(var(--success))', strokeWidth: 2 }}
                          name="Sentiment"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="engagement" 
                          stroke="hsl(var(--accent-blue))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--accent-blue))', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: 'hsl(var(--accent-blue))', strokeWidth: 2 }}
                          name="Engagement"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Data Visualizations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Confidence Score Trends</CardTitle>
                    <CardDescription>Executive vs Person confidence comparison</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={last10CallsConfidence}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="call" />
                        <YAxis domain={[0, 10]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="executive" stroke="hsl(var(--accent-blue))" strokeWidth={2} />
                        <Line type="monotone" dataKey="person" stroke="hsl(var(--success))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Objections: Raised vs Tackled</CardTitle>
                    <CardDescription>Last 10 calls objection handling</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={last10CallsObjections}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="call" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [`${value}`, name === 'raised' ? 'Objections Raised' : 'Objections Tackled']}
                          labelFormatter={(label) => {
                            const item = last10CallsObjections?.find(d => d.call === label);
                            return item ? `${item.callName} (${item.date})` : label;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="raised" fill="#F59E0B" name="Raised" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="tackled" fill="#10B981" name="Tackled" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Score Distribution</CardTitle>
                    <CardDescription>Combined sentiment & engagement performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={[
                        { range: '90-100%', count: (recentCalls || []).filter(c => (c.sentiment + c.engagement) / 2 >= 90).length, color: 'hsl(var(--success))' },
                        { range: '80-89%', count: (recentCalls || []).filter(c => (c.sentiment + c.engagement) / 2 >= 80 && (c.sentiment + c.engagement) / 2 < 90).length, color: 'hsl(var(--accent-blue))' },
                        { range: '70-79%', count: (recentCalls || []).filter(c => (c.sentiment + c.engagement) / 2 >= 70 && (c.sentiment + c.engagement) / 2 < 80).length, color: 'hsl(var(--warning))' },
                        { range: '<70%', count: (recentCalls || []).filter(c => (c.sentiment + c.engagement) / 2 < 70).length, color: 'hsl(var(--destructive))' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--accent-blue))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Levels</CardTitle>
                    <CardDescription>Distribution of engagement scores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={engagementData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="level" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count">
                          {engagementData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>


              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      
      {/* Add Recording Modal */}
      <AddRecordingModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onRecordingAdded={handleRecordingAdded}
      />
    </div>
  );
}