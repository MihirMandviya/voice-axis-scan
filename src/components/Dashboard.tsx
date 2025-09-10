import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, Play, Download, MoreHorizontal, TrendingUp, TrendingDown, Users, Phone, Star, AlertTriangle } from "lucide-react";

// Mock data for the dashboard
const kpiData = {
  totalCalls: 156,
  avgSentiment: 0.72,
  avgEngagement: 0.85,
  objections: 23,
  conversionRate: 0.34,
  avgConfidence: 0.91
};

const sentimentData = [
  { name: 'Positive', value: 68, color: 'hsl(var(--success))' },
  { name: 'Neutral', value: 52, color: 'hsl(var(--accent-blue))' },
  { name: 'Negative', value: 36, color: 'hsl(var(--warning))' }
];

const trendData = [
  { date: 'Mon', sentiment: 0.65, engagement: 0.78 },
  { date: 'Tue', sentiment: 0.72, engagement: 0.82 },
  { date: 'Wed', sentiment: 0.69, engagement: 0.75 },
  { date: 'Thu', sentiment: 0.75, engagement: 0.89 },
  { date: 'Fri', sentiment: 0.78, engagement: 0.91 },
  { date: 'Sat', sentiment: 0.73, engagement: 0.85 },
  { date: 'Sun', sentiment: 0.76, engagement: 0.88 }
];

const engagementData = [
  { level: 'High', count: 89 },
  { level: 'Medium', count: 45 },
  { level: 'Low', count: 22 }
];

const objectionData = [
  { category: 'Price', count: 12 },
  { category: 'Timeline', count: 8 },
  { category: 'Competition', count: 6 },
  { category: 'Authority', count: 4 },
  { category: 'Need', count: 3 }
];

const recentCalls = [
  {
    id: 1,
    name: "Sales Call - Acme Corp",
    date: "2024-01-15",
    duration: "24:30",
    sentiment: 0.85,
    engagement: 0.92,
    status: "completed",
    objections: 2
  },
  {
    id: 2,
    name: "Demo Call - TechStart",
    date: "2024-01-15",
    duration: "18:45",
    sentiment: 0.67,
    engagement: 0.78,
    status: "completed",
    objections: 4
  },
  {
    id: 3,
    name: "Follow-up - BigCorp",
    date: "2024-01-14",
    duration: "12:15",
    sentiment: 0.71,
    engagement: 0.84,
    status: "processing",
    objections: 1
  },
  {
    id: 4,
    name: "Discovery - StartupXYZ",
    date: "2024-01-14",
    duration: "31:20",
    sentiment: 0.89,
    engagement: 0.95,
    status: "completed",
    objections: 0
  }
];

export default function Dashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");

  const getSentimentColor = (score: number) => {
    if (score >= 0.8) return "text-success";
    if (score >= 0.6) return "text-accent-blue";
    return "text-warning";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success-light text-success">Completed</Badge>;
      case "processing":
        return <Badge className="bg-accent-blue-light text-accent-blue">Processing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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
          <Button variant="accent" size="lg" className="gap-2">
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
                      {(kpiData.avgSentiment * 100).toFixed(0)}%
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
                      {(kpiData.avgEngagement * 100).toFixed(0)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-success">+8%</span> from last week
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Objections</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-warning">{kpiData.objections}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-success">-15%</span> from last month
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
                    <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-accent-blue">
                      {(kpiData.avgConfidence * 100).toFixed(0)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-success">+2%</span> from last week
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
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Sentiment</p>
                            <p className={`font-medium ${getSentimentColor(call.sentiment)}`}>
                              {(call.sentiment * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Engagement</p>
                            <p className="font-medium text-accent-blue">
                              {(call.engagement * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Objections</p>
                            <p className="font-medium">{call.objections}</p>
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
                <CardHeader>
                  <CardTitle>All Recordings</CardTitle>
                  <CardDescription>Complete history of your call analyses</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Recording management interface coming soon...</p>
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
                    <CardTitle>Objection Categories</CardTitle>
                    <CardDescription>Most common objection types</CardDescription>
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
    </div>
  );
}