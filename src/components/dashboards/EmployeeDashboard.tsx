import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import EmployeeProfilePage from "@/components/EmployeeProfilePage";

const WEBHOOK_URL = "https://n8nautomation.site/webhook/a2025371-8955-4ef4-8a74-0686456b3003";

// Function to send webhook in background without blocking UI
const sendWebhookInBackground = async (webhookPayload: any) => {
  try {
    console.log('🔄 Attempting webhook call...');
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    console.log('✅ Webhook response status:', webhookResponse.status);
    console.log('✅ Webhook response headers:', Object.fromEntries(webhookResponse.headers.entries()));
    
    if (webhookResponse.ok) {
      const responseText = await webhookResponse.text();
      console.log('✅ Webhook response body:', responseText);
      console.log('🎉 Webhook call successful!');
    } else {
      console.warn(`⚠️ Webhook returned ${webhookResponse.status}: ${webhookResponse.statusText}`);
    }
    
  } catch (corsError) {
    console.warn('❌ CORS error, trying no-cors mode:', corsError);
    
    // Second attempt: No-CORS mode
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });
      
      console.log('✅ Webhook request sent via no-cors mode');
      
    } catch (noCorsError) {
      console.error('❌ Both webhook attempts failed:', noCorsError);
      
      // Third attempt: Using XMLHttpRequest as fallback
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', WEBHOOK_URL, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(webhookPayload));
        console.log('✅ Webhook sent via XMLHttpRequest fallback');
      } catch (xhrError) {
        console.error('❌ All webhook attempts failed:', xhrError);
      }
    }
  }
};

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
  AlertTriangle,
  Calendar,
  Check,
  Loader2,
  RefreshCw,
  Trash2
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
  company_id?: string;
  outcome: 'interested' | 'not_interested' | 'follow_up' | 'converted' | 'lost' | 'completed';
  notes: string;
  call_date: string;
  next_follow_up?: string;
  created_at: string;
  leads?: {
    name: string;
    email: string;
    contact: string;
  };
}

interface Analysis {
  id: string;
  recording_id: string;
  call_id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sentiment_score: number;
  engagement_score: number;
  confidence_score_executive: number;
  confidence_score_person: number;
  detailed_call_analysis: any;
  created_at: string;
  recordings?: {
    id: string;
    file_name: string;
    stored_file_url: string;
  };
}

export default function EmployeeDashboard() {
  const { user, userRole, company, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [followUpLeads, setFollowUpLeads] = useState<Lead[]>([]);
  const [completedLeads, setCompletedLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeadsSection, setSelectedLeadsSection] = useState<'all' | 'followup' | 'completed'>('all');
  const [completedLeadIds, setCompletedLeadIds] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [callOutcome, setCallOutcome] = useState("");
  const [callOutcomeStatus, setCallOutcomeStatus] = useState<'follow_up' | 'completed' | 'not_interested'>('follow_up');
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [nextFollowUpTime, setNextFollowUpTime] = useState("");
  const [analysisFileName, setAnalysisFileName] = useState("");
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
      
      // Set up automatic refresh every 10 seconds to check for analysis updates
      const dataInterval = setInterval(() => {
        fetchData(false); // Don't show loading spinner on automatic refresh
      }, 10000); // Refresh data every 10 seconds
      
      // Set up time update every second for countdown timers
      const timeInterval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000); // Update time every second
      
      return () => {
        clearInterval(dataInterval);
        clearInterval(timeInterval);
      };
    }
  }, [userRole, company]);

  const fetchData = async (showLoading = true) => {
    if (!userRole?.company_id) return;

    try {
      if (showLoading) {
        setLoading(true);
      }

      // Fetch leads assigned to this employee
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('assigned_to', userRole.user_id);

      if (leadsError) {
        console.error('Leads error:', leadsError);
        setAllLeads([]);
        setFollowUpLeads([]);
        setCompletedLeads([]);
      } else {
        const leadsDataArray = leadsData || [];
        console.log('EmployeeDashboard - Fetched leads:', leadsDataArray.length, leadsDataArray);
        // Categorize leads into 3 sections
        const allLeadsArray = leadsDataArray; // Show ALL leads in All Leads section
        const followUpLeadsArray = leadsDataArray.filter(lead => 
          lead.status === 'contacted' || lead.status === 'follow_up'
        );
        const completedLeadsArray = leadsDataArray.filter(lead => 
          lead.status === 'converted' || lead.status === 'completed'
        );
        
        console.log('EmployeeDashboard - Categorized leads:', {
          all: allLeadsArray.length,
          followUp: followUpLeadsArray.length,
          completed: completedLeadsArray.length
        });
        
        setAllLeads(allLeadsArray);
        setFollowUpLeads(followUpLeadsArray);
        setCompletedLeads(completedLeadsArray);
      }

      // First get the employee ID for this user
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userRole.user_id)
        .single();

      if (employeeError || !employeeData) {
        console.error('Employee not found:', employeeError);
        setCalls([]);
      } else {
        // Fetch calls made by this employee
        const { data: callsData, error: callsError } = await supabase
          .from('call_outcomes')
          .select(`
            *,
            leads (
              name,
              email,
              contact
            )
          `)
          .eq('employee_id', employeeData.id)
          .order('created_at', { ascending: false });

        if (callsError) {
          console.error('Calls error:', callsError);
          setCalls([]);
        } else {
          console.log('EmployeeDashboard - Fetched calls:', callsData?.length || 0, callsData);
          setCalls(callsData || []);
        }
      }

      // Fetch analyses for recordings made by this employee
      const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select(`
          *,
          recordings (
            id,
            file_name,
            stored_file_url
          )
        `)
        .eq('user_id', userRole.user_id);

      console.log('EmployeeDashboard - Fetching analyses for user_id:', userRole.user_id);
      console.log('EmployeeDashboard - Analyses data:', analysesData);
      console.log('EmployeeDashboard - Analyses error:', analysesError);

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
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleStartCall = (lead: Lead) => {
    setSelectedLead(lead);
    setIsCallModalOpen(true);
  };

  const handleMarkAsComplete = (leadId: string) => {
    setCompletedLeadIds(prev => new Set([...prev, leadId]));
    toast({
      title: 'Success',
      description: 'Lead marked as complete!',
    });
  };

  const handleViewAnalysis = (analysisId: string) => {
    // Navigate to analysis detail page
    window.open(`/analysis/${analysisId}`, '_blank');
  };

  const handleGetAnalysis = (call: Call) => {
    setSelectedCall(call);
    setIsAnalysisModalOpen(true);
  };

  const handleDeleteCall = async (callId: string) => {
    if (window.confirm('Are you sure you want to delete this call? This will also delete any related analysis records.')) {
      try {
        // Delete the call record - related analysis records will be automatically deleted due to CASCADE
        const { error } = await supabase
          .from('call_outcomes')
          .delete()
          .eq('id', callId);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Call and related analysis deleted successfully!',
        });

        fetchData(true); // Show loading after user action
      } catch (error: any) {
        console.error('Error deleting call:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete call. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSubmitAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCall || !recordingUrl.trim() || !analysisFileName.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide recording URL and file name.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Step 1: Save the recording to the database
      const { data: recording, error: recordingError } = await supabase
        .from('recordings')
        .insert({
          user_id: userRole?.user_id,
          company_id: userRole?.company_id,
          stored_file_url: recordingUrl.trim(),
          file_name: analysisFileName.trim(),
          status: 'pending',
          transcript: selectedCall.notes,
        })
        .select()
        .single();

      if (recordingError) throw recordingError;

      // Step 2: Create analysis record immediately (n8n will update it with results)
      const { data: analysis, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          recording_id: recording.id,
          call_id: selectedCall.id,
          user_id: userRole?.user_id,
          company_id: userRole?.company_id,
          status: 'pending',
          sentiment_score: null,
          engagement_score: null,
          confidence_score_executive: null,
          confidence_score_person: null,
          objections_handled: null,
          next_steps: null,
          improvements: null,
          call_outcome: null,
          detailed_call_analysis: null,
          short_summary: null
        })
        .select()
        .single();

      if (analysisError) {
        console.warn('Failed to create analysis record:', analysisError);
      }

      // Step 3: Send to webhook for analysis
      const webhookPayload = {
        url: recordingUrl.trim(),
        name: analysisFileName.trim(),
        recording_id: recording.id,
        analysis_id: analysis?.id || null,
        user_id: userRole?.user_id,
        call_id: selectedCall.id,
        timestamp: new Date().toISOString(),
        source: 'voice-axis-scan-employee-dashboard',
        url_validated: true,
        validation_method: 'employee_submission'
      };

      console.log('🚀 Sending webhook POST request to:', WEBHOOK_URL);
      console.log('📦 Webhook payload:', webhookPayload);

      sendWebhookInBackground(webhookPayload);

      toast({
        title: 'Success',
        description: 'Recording submitted for analysis!',
      });

      // Reset form and close modal
      setRecordingUrl("");
      setAnalysisFileName("");
      setSelectedCall(null);
      setIsAnalysisModalOpen(false);
      
      fetchData();
    } catch (error: any) {
      console.error('Error submitting analysis:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit analysis. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitCall = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLead || !callOutcome.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide call notes.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // First, get the employee ID from the employees table
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userRole?.user_id)
        .single();

      if (employeeError || !employeeData) {
        throw new Error('Employee not found');
      }

      // Prepare next follow-up datetime
      let nextFollowUpDateTime = null;
      if (callOutcomeStatus === 'follow_up' && nextFollowUpDate && nextFollowUpTime) {
        nextFollowUpDateTime = new Date(`${nextFollowUpDate}T${nextFollowUpTime}`).toISOString();
      }

      // Automatically set lead status based on call outcome
      let newLeadStatus = 'contacted';
      if (callOutcomeStatus === 'completed') {
        newLeadStatus = 'converted';
      } else if (callOutcomeStatus === 'not_interested') {
        newLeadStatus = 'not_interested';
      } else if (callOutcomeStatus === 'follow_up') {
        newLeadStatus = 'follow_up';
      }

      // Save the call to the database
      const { data: call, error: callError } = await supabase
        .from('call_outcomes')
        .insert({
          lead_id: selectedLead.id,
          employee_id: employeeData.id,
          company_id: userRole?.company_id,
          outcome: callOutcomeStatus,
          notes: callOutcome.trim(),
          call_date: new Date().toISOString(),
          next_follow_up: nextFollowUpDateTime,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (callError) throw callError;

      // Update the lead status
      const { error: leadError } = await supabase
        .from('leads')
        .update({ 
          status: newLeadStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedLead.id);

      if (leadError) {
        console.warn('Failed to update lead status:', leadError);
      }

      toast({
        title: 'Success',
        description: 'Call notes saved successfully!',
      });

      // Reset form and close modal
      setCallOutcome("");
      setCallOutcomeStatus('follow_up');
      setNextFollowUpDate("");
      setNextFollowUpTime("");
      setSelectedLead(null);
      setIsCallModalOpen(false);
      
      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error('Error saving call:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save call. Please try again.',
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

  // Get current leads based on selected section
  const getCurrentLeads = () => {
    switch (selectedLeadsSection) {
      case 'all':
        return allLeads;
      case 'followup':
        return followUpLeads;
      case 'completed':
        return completedLeads;
      default:
        return allLeads;
    }
  };

  const filteredLeads = getCurrentLeads().filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to get lead status indicator
  const getLeadStatusIndicator = (lead: Lead) => {
    // Find the latest call record for this lead (most recent)
    const callRecords = calls.filter(call => call.lead_id === lead.id);
    const latestCallRecord = callRecords.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    
    if (!latestCallRecord) {
      return { status: 'not_called', label: 'Not Called', variant: 'secondary' as const, color: 'text-gray-500' };
    }
    
    switch (latestCallRecord.outcome) {
      case 'follow_up':
        return { status: 'follow_up', label: 'Follow-up Added', variant: 'default' as const, color: 'text-orange-500' };
      case 'completed':
        return { status: 'completed', label: 'Called', variant: 'default' as const, color: 'text-green-500' };
      case 'not_interested':
        return { status: 'not_interested', label: 'Not Interested', variant: 'destructive' as const, color: 'text-red-500' };
      case 'interested':
        return { status: 'called', label: 'Called', variant: 'default' as const, color: 'text-blue-500' };
      case 'converted':
        return { status: 'completed', label: 'Called', variant: 'default' as const, color: 'text-green-500' };
      case 'lost':
        return { status: 'not_interested', label: 'Not Interested', variant: 'destructive' as const, color: 'text-red-500' };
      default:
        return { status: 'called', label: 'Called', variant: 'default' as const, color: 'text-blue-500' };
    }
  };

  // Function to calculate time remaining until follow-up
  const getTimeRemaining = (followUpDateTime: string) => {
    const now = currentTime;
    const followUp = new Date(followUpDateTime);
    const diffMs = followUp.getTime() - now.getTime();
    
    if (diffMs < 0) {
      // Overdue
      const overdueMs = Math.abs(diffMs);
      const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
      const overdueHours = Math.floor((overdueMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const overdueMinutes = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));
      const overdueSeconds = Math.floor((overdueMs % (1000 * 60)) / 1000);
      
      return {
        isOverdue: true,
        days: overdueDays,
        hours: overdueHours,
        minutes: overdueMinutes,
        seconds: overdueSeconds,
        text: `Overdue by ${overdueDays}d ${overdueHours}h ${overdueMinutes}m`
      };
    } else {
      // Not yet due
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      return {
        isOverdue: false,
        days,
        hours,
        minutes,
        seconds,
        text: `${days}d ${hours}h ${minutes}m remaining`
      };
    }
  };

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
              <p className="text-sm text-blue-600 font-medium">Welcome, {user?.user_metadata?.full_name || 'Employee'}!</p>
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
            <Button 
              variant={selectedTab === "profile" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("profile")}
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
              {/* Call Quality Stats Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Call Quality Stats
                  </CardTitle>
                  <CardDescription>Analysis metrics and call performance indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {(() => {
                          // Filter analyses for calls made by this employee
                          const employeeCallIds = calls.map(c => c.id);
                          const employeeAnalyses = analyses.filter(a => employeeCallIds.includes(a.call_id));
                          const completedAnalyses = employeeAnalyses.filter(a => a.status?.toLowerCase() === 'completed');
                          const avgSentiment = completedAnalyses.length > 0 
                            ? Math.round(completedAnalyses.reduce((sum, a) => sum + (a.sentiment_score || 0), 0) / completedAnalyses.length)
                            : 0;
                          return avgSentiment;
                        })()}%
                      </div>
                      <p className="text-sm text-blue-600 font-medium">Avg Sentiment Score</p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {(() => {
                          // Filter analyses for calls made by this employee
                          const employeeCallIds = calls.map(c => c.id);
                          const employeeAnalyses = analyses.filter(a => employeeCallIds.includes(a.call_id));
                          const completedAnalyses = employeeAnalyses.filter(a => a.status?.toLowerCase() === 'completed');
                          const avgConfidence = completedAnalyses.length > 0 
                            ? Math.round(completedAnalyses.reduce((sum, a) => sum + ((a.confidence_score_executive + a.confidence_score_person) / 2 || 0), 0) / completedAnalyses.length)
                            : 0;
                          return `${avgConfidence}/10`;
                        })()}
                      </div>
                      <p className="text-sm text-green-600 font-medium">Avg Confidence Score</p>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {(() => {
                          // Filter analyses for calls made by this employee
                          const employeeCallIds = calls.map(c => c.id);
                          const employeeAnalyses = analyses.filter(a => employeeCallIds.includes(a.call_id));
                          const completedAnalyses = employeeAnalyses.filter(a => a.status?.toLowerCase() === 'completed');
                          const avgEngagement = completedAnalyses.length > 0 
                            ? Math.round(completedAnalyses.reduce((sum, a) => sum + (a.engagement_score || 0), 0) / completedAnalyses.length)
                            : 0;
                          return avgEngagement;
                        })()}%
                      </div>
                      <p className="text-sm text-purple-600 font-medium">Avg Engagement Score</p>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {(() => {
                          // Filter analyses for calls made by this employee
                          const employeeCallIds = calls.map(c => c.id);
                          const employeeAnalyses = analyses.filter(a => employeeCallIds.includes(a.call_id));
                          return employeeAnalyses.filter(a => a.status?.toLowerCase() === 'completed').length;
                        })()}
                      </div>
                      <p className="text-sm text-orange-600 font-medium">Completed Analyses</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leads Stats Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Leads Stats
                  </CardTitle>
                  <CardDescription>Lead management and call activity metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-700">
                        {/* allLeads already contains all leads assigned to this employee */}
                        {allLeads.length}
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Total Leads</p>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {/* Count only calls for leads assigned to this employee */}
                        {(() => {
                          const assignedLeadIds = [...allLeads, ...followUpLeads, ...completedLeads].map(l => l.id);
                          return calls.filter(c => assignedLeadIds.includes(c.lead_id)).length;
                        })()}
                      </div>
                      <p className="text-sm text-blue-600 font-medium">Total Called</p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {/* completedLeads is already filtered by current employee */}
                        {completedLeads.length}
                      </div>
                      <p className="text-sm text-green-600 font-medium">Total Completed</p>
                    </div>
                    
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {/* Count only leads that haven't been called yet */}
                        {(() => {
                          const calledLeadIds = calls.map(c => c.lead_id);
                          return allLeads.filter(lead => !calledLeadIds.includes(lead.id)).length;
                        })()}
                      </div>
                      <p className="text-sm text-yellow-600 font-medium">Pending Calls</p>
                    </div>
                    
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {/* followUpLeads is already filtered by current employee */}
                        {followUpLeads.length}
                      </div>
                      <p className="text-sm text-orange-600 font-medium">Follow-ups Remaining</p>
                    </div>
                    
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {(() => {
                          // Count only calls for leads assigned to this employee
                          const assignedLeadIds = [...allLeads, ...followUpLeads, ...completedLeads].map(l => l.id);
                          const notInterestedCalls = calls.filter(c => 
                            c.outcome === 'not_interested' && assignedLeadIds.includes(c.lead_id)
                          );
                          return notInterestedCalls.length;
                        })()}
                      </div>
                      <p className="text-sm text-red-600 font-medium">Not Interested</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                      console.log('EmployeeDashboard - Recent Activity - Call:', call.id, 'Analysis found:', !!analysis, analysis);
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
                                  {analysis.status?.toLowerCase() === 'pending' || analysis.status?.toLowerCase() === 'processing' ? (
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                                      <Badge variant="outline" className="text-xs">
                                        {analysis.status?.toLowerCase() === 'pending' ? 'Analysis Pending' : 'Processing...'}
                                      </Badge>
                                    </div>
                                  ) : analysis.status?.toLowerCase() === 'completed' ? (
                                    <>
                                      <Badge variant="outline" className="text-xs">
                                        Sentiment: {analysis.sentiment_score}%
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        Engagement: {analysis.engagement_score}%
                                      </Badge>
                                    </>
                                  ) : (
                                    <Badge variant="destructive" className="text-xs">
                                      Analysis Failed
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              call.outcome === 'converted' ? 'default' : 
                              call.outcome === 'interested' ? 'default' :
                              call.outcome === 'follow_up' ? 'secondary' :
                              'destructive'
                            }>
                              {call.outcome.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {analysis && analysis.status?.toLowerCase() === 'completed' && (
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
                  <p className="text-muted-foreground">Manage your assigned leads</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fetchData(true)}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                  <Button onClick={() => setIsAddLeadModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
                  </Button>
                </div>
              </div>

              {/* Section Tabs */}
              <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                <Button
                  variant={selectedLeadsSection === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedLeadsSection('all')}
                  className="flex-1"
                >
                  All Leads ({allLeads.length})
                </Button>
                <Button
                  variant={selectedLeadsSection === 'followup' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedLeadsSection('followup')}
                  className="flex-1"
                >
                  Follow-up ({followUpLeads.length})
                </Button>
                <Button
                  variant={selectedLeadsSection === 'completed' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedLeadsSection('completed')}
                  className="flex-1"
                >
                  Completed ({completedLeads.length})
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
                    {selectedLeadsSection === 'all' && <Phone className="h-5 w-5" />}
                    {selectedLeadsSection === 'followup' && <Calendar className="h-5 w-5" />}
                    {selectedLeadsSection === 'completed' && <Check className="h-5 w-5" />}
                    {selectedLeadsSection === 'all' && `All Leads (${filteredLeads.length})`}
                    {selectedLeadsSection === 'followup' && `Follow-up Leads (${filteredLeads.length})`}
                    {selectedLeadsSection === 'completed' && `Completed Leads (${filteredLeads.length})`}
                  </CardTitle>
                  <CardDescription>
                    {selectedLeadsSection === 'all' && 'All your leads with call status indicators'}
                    {selectedLeadsSection === 'followup' && 'Leads that need follow-up calls'}
                    {selectedLeadsSection === 'completed' && 'Leads that have been completed or converted'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredLeads.length === 0 ? (
                    <div className="text-center py-8">
                      {selectedLeadsSection === 'all' && <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                      {selectedLeadsSection === 'followup' && <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                      {selectedLeadsSection === 'completed' && <Check className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
                      <p className="text-muted-foreground">
                        {selectedLeadsSection === 'all' && 'No leads found'}
                        {selectedLeadsSection === 'followup' && 'No follow-up leads at the moment'}
                        {selectedLeadsSection === 'completed' && 'No completed leads yet'}
                      </p>
                      {selectedLeadsSection === 'all' && (
                        <Button 
                          className="mt-4" 
                          onClick={() => setIsAddLeadModalOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add First Lead
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredLeads.map((lead) => {
                        // Find the latest call record for this lead to get follow-up time
                        const callRecords = calls.filter(call => call.lead_id === lead.id);
                        const latestCallRecord = callRecords.sort((a, b) => 
                          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        )[0];
                        const followUpTime = latestCallRecord?.next_follow_up;
                        const statusIndicator = getLeadStatusIndicator(lead);
                        
                        return (
                          <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                selectedLeadsSection === 'all' ? 'bg-blue-100' :
                                selectedLeadsSection === 'followup' ? 'bg-orange-100' :
                                'bg-green-100'
                              }`}>
                                {selectedLeadsSection === 'all' && <Phone className="h-5 w-5 text-blue-500" />}
                                {selectedLeadsSection === 'followup' && <Calendar className="h-5 w-5 text-orange-500" />}
                                {selectedLeadsSection === 'completed' && <Check className="h-5 w-5 text-green-500" />}
                              </div>
                              <div>
                                <h4 className="font-medium">{lead.name}</h4>
                                <p className="text-sm text-muted-foreground">{lead.email}</p>
                                <p className="text-sm text-muted-foreground">{lead.contact}</p>
                                {lead.company && (
                                  <p className="text-xs text-muted-foreground">{lead.company}</p>
                                )}
                                {selectedLeadsSection === 'all' && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant={statusIndicator.variant} className="text-xs">
                                      {statusIndicator.label}
                                    </Badge>
                                    {statusIndicator.status === 'follow_up' && followUpTime && (
                                      <Badge variant="outline" className="text-xs">
                                        {new Date(followUpTime).toLocaleDateString()} at {new Date(followUpTime).toLocaleTimeString()}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                {selectedLeadsSection === 'followup' && followUpTime && (
                                  <div className="flex flex-col gap-2 mt-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        Follow-up: {new Date(followUpTime).toLocaleDateString()} at {new Date(followUpTime).toLocaleTimeString()}
                                      </Badge>
                                    </div>
                                    {(() => {
                                      const timeRemaining = getTimeRemaining(followUpTime);
                                      return (
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-1">
                                            <div className={`px-2 py-1 rounded text-xs font-mono ${
                                              timeRemaining.isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                              {timeRemaining.days.toString().padStart(2, '0')}
                                            </div>
                                            <span className="text-xs text-muted-foreground">Days</span>
                                            <div className={`px-2 py-1 rounded text-xs font-mono ${
                                              timeRemaining.isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                              {timeRemaining.hours.toString().padStart(2, '0')}
                                            </div>
                                            <span className="text-xs text-muted-foreground">Hrs</span>
                                            <div className={`px-2 py-1 rounded text-xs font-mono ${
                                              timeRemaining.isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                              {timeRemaining.minutes.toString().padStart(2, '0')}
                                            </div>
                                            <span className="text-xs text-muted-foreground">Min</span>
                                            <div className={`px-2 py-1 rounded text-xs font-mono ${
                                              timeRemaining.isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                                            }`}>
                                              {timeRemaining.seconds.toString().padStart(2, '0')}
                                            </div>
                                            <span className="text-xs text-muted-foreground">Sec</span>
                                          </div>
                                          {timeRemaining.isOverdue && (
                                            <Badge variant="destructive" className="text-xs w-fit">
                                              Overdue
                                            </Badge>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">
                                {lead.status}
                              </Badge>
                              
                              {/* Show call button for all leads and follow-up leads */}
                              {(selectedLeadsSection === 'all' || selectedLeadsSection === 'followup') && (
                                <Button 
                                  onClick={() => handleStartCall(lead)}
                                  className="gap-2"
                                >
                                  <Phone className="h-4 w-4" />
                                  {selectedLeadsSection === 'followup' ? 'Follow-up Call' : 'Call'}
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
                        // Find analysis for this call using call_id
                        const analysis = analyses.find(a => a.call_id === call.id);
                        const hasAnalysis = !!analysis;
                        
                        return (
                          <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Phone className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium">Call with {call.leads?.name || 'Lead'}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {call.leads?.email} • {call.leads?.contact}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {call.notes}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(call.created_at).toLocaleDateString()}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {hasAnalysis ? (
                                    analysis?.status?.toLowerCase() === 'pending' || analysis?.status?.toLowerCase() === 'processing' ? (
                                      <div className="flex items-center gap-2">
                                        <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                                        <Badge variant="outline" className="text-xs">
                                          {analysis?.status?.toLowerCase() === 'pending' ? 'Analysis Pending' : 'Processing...'}
                                        </Badge>
                                      </div>
                                    ) : analysis?.status?.toLowerCase() === 'completed' ? (
                                      <>
                                        <Badge variant="outline" className="text-xs">
                                          Sentiment: {analysis?.sentiment_score}%
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                          Engagement: {analysis?.engagement_score}%
                                        </Badge>
                                      </>
                                    ) : (
                                      <Badge variant="destructive" className="text-xs">
                                        Analysis Failed
                                      </Badge>
                                    )
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">
                                      No Analysis
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {hasAnalysis && analysis?.status?.toLowerCase() === 'completed' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleViewAnalysis(analysis.id)}
                                  className="gap-1"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Analysis
                                </Button>
                              )}
                              {!hasAnalysis && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleGetAnalysis(call)}
                                  className="gap-1"
                                >
                                  <BarChart3 className="h-4 w-4" />
                                  Get Analysis
                                </Button>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteCall(call.id)}
                                className="gap-1 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
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
                          {calls.filter(c => c.outcome === 'converted' || c.outcome === 'interested').length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Success Rate</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {calls.length > 0 ? Math.round((calls.filter(c => c.outcome === 'converted' || c.outcome === 'interested').length / calls.length) * 100) : 0}%
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

            <TabsContent value="profile" className="space-y-6">
              <EmployeeProfilePage onBack={() => setSelectedTab("overview")} />
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
              Add Call Notes
            </DialogTitle>
            <DialogDescription>
              Add call notes for {selectedLead?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCall} className="space-y-4">
            <div>
              <Label htmlFor="callOutcomeStatus">Call Outcome *</Label>
              <Select value={callOutcomeStatus} onValueChange={(value: 'follow_up' | 'completed' | 'not_interested') => {
                setCallOutcomeStatus(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select call outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="callOutcome">Call Notes *</Label>
              <Input
                id="callOutcome"
                value={callOutcome}
                onChange={(e) => setCallOutcome(e.target.value)}
                placeholder="How was the call? What was discussed?"
                required
              />
            </div>
            {callOutcomeStatus === 'follow_up' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nextFollowUpDate">Follow-up Date *</Label>
                  <Input
                    id="nextFollowUpDate"
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nextFollowUpTime">Follow-up Time *</Label>
                  <Input
                    id="nextFollowUpTime"
                    type="time"
                    value={nextFollowUpTime}
                    onChange={(e) => setNextFollowUpTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setCallOutcome("");
                setCallOutcomeStatus('follow_up');
                setNextFollowUpDate("");
                setNextFollowUpTime("");
                setSelectedLead(null);
                setIsCallModalOpen(false);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={!callOutcome.trim()}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Call
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

      {/* Analysis Modal */}
      <Dialog open={isAnalysisModalOpen} onOpenChange={setIsAnalysisModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Get Analysis
            </DialogTitle>
            <DialogDescription>
              Submit a recording for analysis of call with {selectedCall?.leads?.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAnalysis} className="space-y-4">
            <div>
              <Label htmlFor="analysisFileName">File Name *</Label>
              <Input
                id="analysisFileName"
                value={analysisFileName}
                onChange={(e) => setAnalysisFileName(e.target.value)}
                placeholder="Enter file name for the recording"
                required
              />
            </div>
            <div>
              <Label htmlFor="recordingUrl">Recording URL *</Label>
              <Input
                id="recordingUrl"
                value={recordingUrl}
                onChange={(e) => setRecordingUrl(e.target.value)}
                placeholder="Enter recording URL for analysis"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAnalysisModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!recordingUrl.trim() || !analysisFileName.trim()}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Get Analysis
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
