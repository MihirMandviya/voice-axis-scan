import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  PhoneCall, 
  Search,
  RefreshCw,
  Eye,
  BarChart3,
  Trash2,
  Loader2,
  User,
  Calendar,
  Filter,
  ChevronDown,
  Clock
} from "lucide-react";

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
  exotel_call_sid?: string;
  exotel_recording_url?: string;
  leads?: {
    name: string;
    email: string;
    contact: string;
  };
  employees?: {
    full_name: string;
    email: string;
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

interface CallHistoryManagerProps {
  companyId: string;
  managerId?: string;
}

export default function CallHistoryManager({ companyId, managerId }: CallHistoryManagerProps) {
  const { userRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [calls, setCalls] = useState<Call[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedOutcome, setSelectedOutcome] = useState<string>("all");
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [analysisFileName, setAnalysisFileName] = useState("");
  const [expandedFollowUps, setExpandedFollowUps] = useState<Set<string>>(new Set());

  const WEBHOOK_URL = "https://n8nautomation.site/webhook/a2025371-8955-4ef4-8a74-0686456b3003";

  // Function to send webhook in background
  const sendWebhookInBackground = async (webhookPayload: any) => {
    try {
      console.log('🔄 Attempting webhook call...');
      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!webhookResponse.ok) {
        throw new Error(`HTTP error! status: ${webhookResponse.status}`);
      }

      const responseData = await webhookResponse.json();
      console.log('✅ Webhook response:', responseData);
      return responseData;
    } catch (error) {
      console.error('❌ Webhook error:', error);
      throw error;
    }
  };

  const fetchData = async () => {
    if (!userRole?.company_id) return;

    try {
      setLoading(true);

      let callsData = [];
      let callsError = null;

      if (managerId) {
        // Fetch employees under this manager first
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, user_id')
          .eq('manager_id', managerId)
          .eq('is_active', true);

        if (employeesError) {
          console.error('Error fetching employees:', employeesError);
          callsError = employeesError;
        } else if (employeesData && employeesData.length > 0) {
          const employeeIds = employeesData.map(emp => emp.id);
          
          // Fetch calls from these employees
          const { data: callsResult, error: callsResultError } = await supabase
            .from('call_history')
            .select(`
              *,
              leads (
                name,
                email,
                contact
              ),
              employees (
                full_name,
                email
              )
            `)
            .in('employee_id', employeeIds)
            .order('created_at', { ascending: false });

          if (callsResultError) {
            console.error('Calls error:', callsResultError);
            callsError = callsResultError;
          } else {
            callsData = callsResult || [];
          }
        }
      } else {
        // Fallback: fetch all calls from employees in the company
        const { data: callsResult, error: callsResultError } = await supabase
          .from('call_history')
          .select(`
            *,
            leads (
              name,
              email,
              contact
            ),
            employees (
              full_name,
              email
            )
          `)
          .eq('company_id', userRole.company_id)
          .order('created_at', { ascending: false });

        if (callsResultError) {
          console.error('Calls error:', callsResultError);
          callsError = callsResultError;
        } else {
          callsData = callsResult || [];
        }
      }

      if (callsError) {
        console.error('Calls error:', callsError);
        setCalls([]);
      } else {
        setCalls(callsData || []);
      }

      // Fetch all analyses for the company
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
        .eq('company_id', userRole.company_id);

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

  useEffect(() => {
    fetchData();
  }, [userRole?.company_id]);

  const handleViewCallDetails = (callId: string) => {
    window.open(`/call/${callId}`, '_blank');
  };

  const handleViewAnalysis = (analysisId: string) => {
    window.open(`/analysis/${analysisId}`, '_blank');
  };

  const handleGetAnalysis = (call: Call) => {
    setSelectedCall(call);
    setIsAnalysisModalOpen(true);
  };

  const toggleFollowUpDetails = (callId: string) => {
    setExpandedFollowUps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(callId)) {
        newSet.delete(callId);
      } else {
        newSet.add(callId);
      }
      return newSet;
    });
  };

  const handleDeleteCall = async (callId: string) => {
    if (window.confirm('Are you sure you want to delete this call?')) {
      try {
        const { error } = await supabase
          .from('call_history')
          .delete()
          .eq('id', callId);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Call deleted successfully!',
        });

        fetchData();
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
          user_id: selectedCall.employee_id,
          company_id: userRole?.company_id,
          stored_file_url: recordingUrl.trim(),
          file_name: analysisFileName.trim(),
          status: 'pending',
          transcript: selectedCall.notes,
        })
        .select()
        .single();

      if (recordingError) throw recordingError;

      // Step 2: Create analysis record immediately
      const { data: analysis, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          recording_id: recording.id,
          call_id: selectedCall.id,
          user_id: selectedCall.employee_id,
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
        user_id: selectedCall.employee_id,
        call_id: selectedCall.id,
        timestamp: new Date().toISOString(),
        source: 'voice-axis-scan-manager-dashboard',
        url_validated: true,
        validation_method: 'manager_submission'
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

  // Filter calls based on search and filters
  const filteredCalls = calls.filter(call => {
    const matchesSearch = searchTerm === "" || 
      call.leads?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.leads?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.employees?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEmployee = selectedEmployee === "all" || call.employee_id === selectedEmployee;
    
    // Map outcome values to the new filter options
    let matchesOutcome = selectedOutcome === "all";
    if (selectedOutcome === "completed") {
      matchesOutcome = call.outcome === 'converted' || call.outcome === 'interested';
    } else if (selectedOutcome === "follow_up") {
      matchesOutcome = call.outcome === 'follow_up';
    } else if (selectedOutcome === "not_interested") {
      matchesOutcome = call.outcome === 'not_interested' || call.outcome === 'lost';
    }

    return matchesSearch && matchesEmployee && matchesOutcome;
  });


  // Get all employees under this manager for filter
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  
  // Fetch all employees under this manager
  useEffect(() => {
    const fetchAllEmployees = async () => {
      if (!managerId) return;
      
      try {
        const { data: employeesData, error: employeesError } = await supabase
          .from('employees')
          .select('id, full_name, email')
          .eq('manager_id', managerId)
          .eq('is_active', true);

        if (employeesError) {
          console.error('Error fetching all employees:', employeesError);
        } else {
          setAllEmployees(employeesData || []);
        }
      } catch (error) {
        console.error('Error fetching all employees:', error);
      }
    };

    fetchAllEmployees();
  }, [managerId]);

  // Use all employees for filter, not just those who made calls
  const employees = allEmployees.map(emp => ({
    id: emp.id,
    name: emp.full_name || 'Unknown Employee'
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading call history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Call History Management</h2>
          <p className="text-muted-foreground">Manage and monitor all employee calls</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchData}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search calls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Employee Filter */}
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">All Employees</option>
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>

            {/* Outcome Filter */}
            <select
              value={selectedOutcome}
              onChange={(e) => setSelectedOutcome(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">All Outcomes</option>
              <option value="completed">Completed</option>
              <option value="follow_up">Follow-ups</option>
              <option value="not_interested">Not Interested</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center text-sm text-muted-foreground">
              {filteredCalls.length} call{filteredCalls.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call History */}
      <Card>
        <CardHeader>
          <CardTitle>All Calls ({filteredCalls.length})</CardTitle>
          <CardDescription>
            Complete history of all employee calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCalls.length === 0 ? (
            <div className="text-center py-8">
              <PhoneCall className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No calls found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCalls.map((call) => {
                // Find analysis for this call using call_id
                const analysis = analyses.find(a => a.call_id === call.id);
                const hasAnalysis = !!analysis;
                
                return (
                  <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">Call with {call.leads?.name || 'Lead'}</h4>
                          <Badge variant="outline" className="text-xs">
                            <User className="h-3 w-3 mr-1" />
                            {call.employees?.full_name || 'Unknown Employee'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {call.leads?.email} • {call.leads?.contact}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {call.notes}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(call.created_at).toLocaleDateString()}
                          </p>
                          <Badge variant={
                            call.outcome === 'converted' ? 'default' : 
                            call.outcome === 'interested' ? 'default' :
                            call.outcome === 'follow_up' ? 'secondary' :
                            'destructive'
                          } className="text-xs">
                            {call.outcome.replace('_', ' ').toUpperCase()}
                          </Badge>
                          
                          {/* Follow-up Details Dropdown */}
                          {call.outcome === 'follow_up' && call.next_follow_up && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFollowUpDetails(call.id)}
                              className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Follow-up Details
                              <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${expandedFollowUps.has(call.id) ? 'rotate-180' : ''}`} />
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewCallDetails(call.id)}
                        className="gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        Details
                      </Button>
                      {hasAnalysis && analysis?.status?.toLowerCase() === 'completed' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewAnalysis(analysis.id)}
                          className="gap-1"
                        >
                          <BarChart3 className="h-4 w-4" />
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
                    
                    {/* Expanded Follow-up Details */}
                    {call.outcome === 'follow_up' && call.next_follow_up && expandedFollowUps.has(call.id) && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Follow-up Details
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Follow-up Date:</span>
                            <span>{new Date(call.next_follow_up).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Follow-up Time:</span>
                            <span>{new Date(call.next_follow_up).toLocaleTimeString()}</span>
                          </div>
                          {call.notes && (
                            <div className="flex items-start gap-2">
                              <span className="font-medium text-blue-600 mt-1">Notes:</span>
                              <span className="text-gray-700">{call.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

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
                <BarChart3 className="h-4 w-4 mr-2" />
                Get Analysis
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
