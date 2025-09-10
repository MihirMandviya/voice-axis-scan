import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, Play, Download, MoreHorizontal, TrendingUp, TrendingDown, Users, Phone, Star, AlertTriangle, Trash2 } from "lucide-react";
import { useDashboardStats, useRecordings, useAnalyses, useDeleteRecording } from "@/hooks/useSupabaseData";
import AddRecordingModal from "./AddRecordingModal";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAnalysisNotifications } from "@/hooks/useAnalysisNotifications";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Analysis } from "@/lib/supabase";

export default function Dashboard() {
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
  
  // Enable analysis notifications
  useAnalysisNotifications();

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
        return <Badge className="bg-yellow-100 text-yellow-700">Queued</Badge>;
      case "failed":
      case "error":
        return <Badge className="bg-destructive-light text-destructive">Failed</Badge>;
      case "cancelled":
        return <Badge className="bg-gray-100 text-gray-700">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
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

  const { kpiData, sentimentData, trendData, engagementData, objectionData, recentCalls } = dashboardData;

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Call Analysis Dashboard</h1>
            <p className="text-muted-foreground">Monitor and analyze your call performance</p>
          </div>
          <Button 
            variant="accent" 
            size="lg" 
            className="gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Add Recording
          </Button>
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
              Overview
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
              <BarChart className="h-4 w-4" />
              Analytics
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsContent value="overview" className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-success">
                      {(kpiData.conversionRate * 100).toFixed(0)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-success">+3%</span> from last month
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
                      {kpiData.avgConfidenceExecutive.toFixed(0)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Person: <span className="text-success">{kpiData.avgConfidencePerson.toFixed(0)}%</span>
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Row */}
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
                    <CardDescription>Daily performance over the last week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="sentiment" stroke="hsl(var(--success))" strokeWidth={2} />
                        <Line type="monotone" dataKey="engagement" stroke="hsl(var(--accent-blue))" strokeWidth={2} />
                      </LineChart>
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

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Engagement Levels</CardTitle>
                    <CardDescription>Distribution of engagement scores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={engagementData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="level" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--accent-blue))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Objection Handling Analysis</CardTitle>
                    <CardDescription>Types of objections successfully handled</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={objectionData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="category" type="category" width={80} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--warning))" />
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