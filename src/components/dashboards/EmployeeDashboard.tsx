import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  PhoneCall, 
  TrendingUp, 
  Settings, 
  Search,
  MoreHorizontal,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  User,
  LogOut,
  Plus,
  BarChart3,
  Upload,
  Download,
  Eye,
  Star,
  AlertTriangle
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  contact: string;
  company?: string;
  status: string;
  assigned_to?: string;
  created_at: string;
  description?: string;
}

interface Call {
  id: string;
  lead_id: string;
  employee_id: string;
  recording_url: string;
  status: 'completed' | 'in_progress' | 'failed';
  outcome?: string;
  created_at: string;
}

interface Analysis {
  id: string;
  call_id: string;
  sentiment_score: number;
  engagement_score: number;
  confidence_score_executive: number;
  confidence_score_person: number;
  detailed_call_analysis: any;
  created_at: string;
}

export default function EmployeeDashboard() {
  const { user, userRole, company, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [callOutcome, setCallOutcome] = useState("");
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    contact: "",
    company: "",
    description: "",
  });

  useEffect(() => {
    if (userRole && company) {
      fetchData();
    }
  }, [userRole, company]);

  const fetchData = async () => {
    if (!userRole?.company_id) return;

    try {
      setLoading(true);

      // Fetch leads assigned to this employee
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', userRole.user_id);

      if (leadsError) {
        console.error('Leads error:', leadsError);
        setLeads([]);
      } else {
        setLeads(leadsData || []);
      }

      // Fetch calls made by this employee
      const { data: callsData, error: callsError } = await supabase
        .from('calls')
        .select('*')
        .eq('employee_id', userRole.user_id);

      if (callsError) {
        console.error('Calls error:', callsError);
        setCalls([]);
      } else {
        setCalls(callsData || []);
      }

      // Fetch analyses for calls made by this employee
      const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select('*')
        .in('call_id', calls.map(call => call.id));

      if (analysesError) {
        console.error('Analyses error:', analysesError);
        setAnalyses([]);
      } else {
        setAnalyses(analysesData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCall = (lead: Lead) => {
    setSelectedLead(lead);
    setIsCallModalOpen(true);
  };

  const handleSubmitCall = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLead || !recordingUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a recording URL.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Save the call to the database
      const { error } = await supabase
        .from('calls')
        .insert({
          lead_id: selectedLead.id,
          employee_id: userRole?.user_id,
          recording_url: recordingUrl.trim(),
          status: 'completed',
          outcome: callOutcome.trim() || null,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Call recorded successfully!',
      });

      // Reset form and close modal
      setRecordingUrl("");
      setCallOutcome("");
      setSelectedLead(null);
      setIsCallModalOpen(false);
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error('Error recording call:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to record call. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRole?.company_id) return;

    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          name: newLead.name,
          email: newLead.email,
          contact: newLead.contact,
          company: newLead.company || null,
          description: newLead.description || null,
          assigned_to: userRole.user_id,
          status: 'assigned',
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lead added successfully!',
      });

      // Reset form and close modal
      setNewLead({
        name: "",
        email: "",
        contact: "",
        company: "",
        description: "",
      });
      setIsAddLeadModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error adding lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add lead. Please try again.',
        variant: 'destructive',
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

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

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
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Employee Dashboard</h1>
              <p className="text-muted-foreground">{company?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
              Overview
            </Button>
            <Button 
              variant={selectedTab === "leads" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("leads")}
            >
              <Phone className="h-4 w-4" />
              My Leads
            </Button>
            <Button 
              variant={selectedTab === "calls" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("calls")}
            >
              <PhoneCall className="h-4 w-4" />
              Call History
            </Button>
            <Button 
              variant={selectedTab === "analytics" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("analytics")}
            >
              <BarChart3 className="h-4 w-4" />
              Performance
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Assigned Leads</CardTitle>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{leads.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Total leads
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Calls Made</CardTitle>
                    <PhoneCall className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{calls.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Total calls
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {calls.length > 0 ? Math.round((calls.filter(c => c.status === 'completed').length / calls.length) * 100) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Call success rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Analyses</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyses.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Completed analyses
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest calls and analyses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {calls.slice(0, 5).map((call) => {
                      const analysis = analyses.find(a => a.call_id === call.id);
                      return (
                        <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <PhoneCall className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">Call completed</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(call.created_at).toLocaleDateString()}
                              </p>
                              {analysis && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    Sentiment: {analysis.sentiment_score}%
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    Engagement: {analysis.engagement_score}%
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                              {call.status}
                            </Badge>
                            {analysis && (
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {calls.length === 0 && (
                      <div className="text-center py-8">
                        <PhoneCall className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No recent activity</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leads" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">My Leads</h2>
                  <p className="text-muted-foreground">Leads assigned to you for calling</p>
                </div>
                <Button onClick={() => setIsAddLeadModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    My Assigned Leads ({filteredLeads.length})
                  </CardTitle>
                  <CardDescription>
                    Leads assigned to you for calling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredLeads.length === 0 ? (
                    <div className="text-center py-8">
                      <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No leads assigned</p>
                      <Button 
                        className="mt-4" 
                        onClick={() => setIsAddLeadModalOpen(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Lead
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredLeads.map((lead) => (
                        <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Phone className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <h4 className="font-medium">{lead.name}</h4>
                              <p className="text-sm text-muted-foreground">{lead.email}</p>
                              <p className="text-sm text-muted-foreground">{lead.contact}</p>
                              {lead.company && (
                                <p className="text-xs text-muted-foreground">{lead.company}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{lead.status}</Badge>
                            <Button 
                              onClick={() => handleStartCall(lead)}
                              className="gap-2"
                            >
                              <Play className="h-4 w-4" />
                              Call
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calls" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Call History</h2>
                <p className="text-muted-foreground">Your call records and outcomes</p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Calls ({calls.length})</CardTitle>
                  <CardDescription>
                    Complete history of your calls
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {calls.length === 0 ? (
                    <div className="text-center py-8">
                      <PhoneCall className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No calls made yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {calls.map((call) => {
                        const analysis = analyses.find(a => a.call_id === call.id);
                        return (
                          <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <PhoneCall className="h-5 w-5 text-green-500" />
                              </div>
                              <div>
                                <h4 className="font-medium">Call #{call.id.slice(-6)}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(call.created_at).toLocaleDateString()}
                                </p>
                                {call.outcome && (
                                  <p className="text-sm text-muted-foreground">{call.outcome}</p>
                                )}
                                {analysis && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      Sentiment: {analysis.sentiment_score}%
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      Engagement: {analysis.engagement_score}%
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                                {call.status}
                              </Badge>
                              {analysis && (
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
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
              <div>
                <h2 className="text-2xl font-bold">Performance Analytics</h2>
                <p className="text-muted-foreground">Your call performance and insights</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Call Performance</CardTitle>
                    <CardDescription>Your call statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Calls</span>
                        <span className="text-2xl font-bold">{calls.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Completed Calls</span>
                        <span className="text-2xl font-bold text-green-600">
                          {calls.filter(c => c.status === 'completed').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Success Rate</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {calls.length > 0 ? Math.round((calls.filter(c => c.status === 'completed').length / calls.length) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Analysis Insights</CardTitle>
                    <CardDescription>Your call analysis results</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyses.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Avg Sentiment</span>
                            <span className="text-2xl font-bold text-green-600">
                              {Math.round(analyses.reduce((acc, a) => acc + a.sentiment_score, 0) / analyses.length)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Avg Engagement</span>
                            <span className="text-2xl font-bold text-blue-600">
                              {Math.round(analyses.reduce((acc, a) => acc + a.engagement_score, 0) / analyses.length)}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Analyses</span>
                            <span className="text-2xl font-bold">{analyses.length}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">No analysis data yet</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Call Modal */}
      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-blue-600" />
              Record Call
            </DialogTitle>
            <DialogDescription>
              Record the call with {selectedLead?.name} and provide the outcome.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCall} className="space-y-4">
            <div>
              <Label htmlFor="recordingUrl">Recording URL *</Label>
              <Input
                id="recordingUrl"
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
                placeholder="Enter recording URL"
                required
              />
            </div>
            <div>
              <Label htmlFor="callOutcome">Call Outcome</Label>
              <Input
                id="callOutcome"
                value={callOutcome}
                onChange={(e) => setCallOutcome(e.target.value)}
                placeholder="Brief description of call outcome"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCallModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!recordingUrl.trim()}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Record Call
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Lead Modal */}
      <Dialog open={isAddLeadModalOpen} onOpenChange={setIsAddLeadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Add a new lead to your list.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddLead} className="space-y-4">
            <div>
              <Label htmlFor="leadName">Name *</Label>
              <Input
                id="leadName"
                value={newLead.name}
                onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter lead name"
                required
              />
            </div>
            <div>
              <Label htmlFor="leadEmail">Email *</Label>
              <Input
                id="leadEmail"
                type="email"
                value={newLead.email}
                onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <Label htmlFor="leadContact">Contact *</Label>
              <Input
                id="leadContact"
                value={newLead.contact}
                onChange={(e) => setNewLead(prev => ({ ...prev, contact: e.target.value }))}
                placeholder="Enter phone number"
                required
              />
            </div>
            <div>
              <Label htmlFor="leadCompany">Company</Label>
              <Input
                id="leadCompany"
                value={newLead.company}
                onChange={(e) => setNewLead(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Enter company name"
              />
            </div>
            <div>
              <Label htmlFor="leadDescription">Description</Label>
              <Input
                id="leadDescription"
                value={newLead.description}
                onChange={(e) => setNewLead(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddLeadModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newLead.name || !newLead.email || !newLead.contact}>
                Add Lead
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
