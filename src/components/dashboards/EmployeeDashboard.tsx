import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import EmployeeProfilePage from "@/components/EmployeeProfilePage";
import EmployeeReportsPage from "@/components/EmployeeReportsPage";
import PhoneDialer from "@/components/PhoneDialer";

const WEBHOOK_URL = "https://n8nautomation.site/webhook/b1df7b1a-d5df-4b49-b310-4a7e26d76417";

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
  Trash2,
  FileText
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
  outcome: 'interested' | 'not_interested' | 'follow_up' | 'converted' | 'lost' | 'completed' | 'not_answered' | 'failed';
  notes: string;
  call_date: string;
  next_follow_up?: string;
  created_at: string;
  exotel_recording_url?: string;
  exotel_call_sid?: string;
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
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [recordingUrl, setRecordingUrl] = useState("");
  const [callOutcome, setCallOutcome] = useState("");
  const [callOutcomeStatus, setCallOutcomeStatus] = useState<'follow_up' | 'completed' | 'not_interested'>('follow_up');
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [nextFollowUpTime, setNextFollowUpTime] = useState("");
  const [analysisFileName, setAnalysisFileName] = useState("");
  
  // Exotel calling state
  const [isExotelCallModalOpen, setIsExotelCallModalOpen] = useState(false);
  const [fromNumber, setFromNumber] = useState(""); // Will be set from company settings
  const [toNumber, setToNumber] = useState("");
  const [callerId, setCallerId] = useState(""); // Will be set from company settings
  const [isCallInProgress, setIsCallInProgress] = useState(false);
  const [currentCallSid, setCurrentCallSid] = useState("");
  const [callStatus, setCallStatus] = useState("");
  const [callPollingInterval, setCallPollingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Company settings state
  const [companySettings, setCompanySettings] = useState({
    caller_id: "09513886363",
    from_numbers: ["7887766008"],
  });
  
  // Remove lead modal state
  const [isRemoveLeadModalOpen, setIsRemoveLeadModalOpen] = useState(false);
  const [selectedLeadToRemove, setSelectedLeadToRemove] = useState<Lead | null>(null);
  const [removalReason, setRemovalReason] = useState("");
  const [isDialerModalOpen, setIsDialerModalOpen] = useState(false);
  const [processingCalls, setProcessingCalls] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userRole && company) {
      fetchData();
      fetchCompanySettings();
      
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

  // More frequent auto-refresh when there are processing analyses
  useEffect(() => {
    if (processingCalls.size === 0) return;

    const interval = setInterval(() => {
      console.log('Auto-refreshing to check processing analysis status...');
      fetchData(false);
    }, 5000); // Refresh every 5 seconds when processing

    return () => clearInterval(interval);
  }, [processingCalls.size]);

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
        // Categorize leads into 3 sections (exclude removed leads)
        const activeLeadsArray = leadsDataArray.filter(lead => lead.status !== 'removed');
        const allLeadsArray = activeLeadsArray; // Show ALL active leads in All Leads section
        const followUpLeadsArray = activeLeadsArray.filter(lead => 
          lead.status === 'contacted' || lead.status === 'follow_up'
        );
        const completedLeadsArray = activeLeadsArray.filter(lead => 
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

      // Fetch calls made by this employee from call_history table
      // Note: employee_id in call_history references employees.user_id (not employees.id)
      const { data: callsData, error: callsError } = await supabase
        .from('call_history')
        .select(`
          *,
          leads (
            name,
            email,
            contact
          )
        `)
        .eq('employee_id', userRole.user_id)
        .order('created_at', { ascending: false });

      if (callsError) {
        console.error('Calls error:', callsError);
        setCalls([]);
      } else {
        console.log('EmployeeDashboard - Fetched calls:', callsData?.length || 0, callsData);
        setCalls(callsData || []);
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
        
        // Remove calls from processing set if they now have completed/failed analyses
        if (analysesData && analysesData.length > 0) {
          setProcessingCalls(prev => {
            const newSet = new Set(prev);
            analysesData.forEach(analysis => {
              if (analysis.call_id && (analysis.status?.toLowerCase() === 'completed' || analysis.status?.toLowerCase() === 'failed')) {
                newSet.delete(analysis.call_id);
              }
            });
            return newSet;
          });
        }
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

  const handleStartExotelCall = (lead: Lead) => {
    setSelectedLead(lead);
    setToNumber(lead.contact); // Pre-fill the lead's contact number
    setIsExotelCallModalOpen(true);
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

  const handleGetAnalysis = async (call: Call) => {
    // Check if call has a recording URL
    if (!call.exotel_recording_url || call.exotel_recording_url.trim() === '') {
      toast({
        title: 'No Recording Available',
        description: 'This call does not have a recording URL. Please ensure the call was recorded.',
        variant: 'destructive',
      });
      return;
    }

    // Immediately add to processing set to show UI feedback
    setProcessingCalls(prev => new Set(prev).add(call.id));

    try {
      const recordingUrl = call.exotel_recording_url.trim();
      const fileName = `call_${call.id}_${new Date(call.created_at).toISOString().replace(/[:.]/g, '-')}`;

      // Step 1: Check if recording already exists for this call (auto-created by trigger)
      let { data: existingRecording, error: recordingCheckError } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', userRole?.user_id)
        .eq('stored_file_url', recordingUrl)
        .maybeSingle();

      if (recordingCheckError) {
        console.error('Error checking for existing recording:', recordingCheckError);
      }

      let recording = existingRecording;

      // If no recording exists, create one (backward compatibility)
      if (!recording) {
        const { data: newRecording, error: recordingError } = await supabase
          .from('recordings')
          .insert({
            user_id: userRole?.user_id,
            company_id: userRole?.company_id,
            stored_file_url: recordingUrl,
            file_name: fileName,
            status: 'pending',
            transcript: call.notes || '',
          })
          .select()
          .single();

        if (recordingError) throw recordingError;
        recording = newRecording;
      }

      // Step 2: Check if analysis already exists for this call
      let { data: existingAnalysis, error: analysisCheckError } = await supabase
        .from('analyses')
        .select('*')
        .eq('call_id', call.id)
        .maybeSingle();

      if (analysisCheckError) {
        console.error('Error checking for existing analysis:', analysisCheckError);
      }

      let analysis = existingAnalysis;

      // If no analysis exists, create one (backward compatibility)
      if (!analysis) {
        const { data: newAnalysis, error: analysisError } = await supabase
          .from('analyses')
          .insert({
            recording_id: recording.id,
            call_id: call.id,
            user_id: userRole?.user_id,
            company_id: userRole?.company_id,
            status: 'processing',
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
          setProcessingCalls(prev => {
            const newSet = new Set(prev);
            newSet.delete(call.id);
            return newSet;
          });
          throw analysisError;
        }
        analysis = newAnalysis;
      } else {
        // If analysis exists but isn't processing, update its status
        if (analysis.status !== 'processing') {
          const { error: updateError } = await supabase
            .from('analyses')
            .update({ status: 'processing' })
            .eq('id', analysis.id);

          if (updateError) {
            console.warn('Failed to update analysis status:', updateError);
          } else {
            analysis.status = 'processing';
          }
        }
      }

      // Immediately update the analyses state to show processing status
      if (analysis) {
        setAnalyses(prev => {
          const filtered = prev.filter(a => a.id !== analysis.id);
          return [...filtered, analysis];
        });
      }

      // Step 3: Send to webhook for analysis with accurate IDs
      const webhookPayload = {
        url: recordingUrl,
        name: fileName,
        recording_id: recording.id,
        analysis_id: analysis.id,
        user_id: userRole?.user_id,
        call_id: call.id,
        timestamp: new Date().toISOString(),
        source: 'voice-axis-scan-employee-dashboard',
        url_validated: true,
        validation_method: 'auto_submission'
      };

      console.log('🚀 Sending webhook POST request to:', WEBHOOK_URL);
      console.log('📦 Webhook payload (with accurate IDs):', webhookPayload);

      sendWebhookInBackground(webhookPayload);

      toast({
        title: 'Processing Started',
        description: 'Your call recording is being analyzed. This may take a few moments.',
      });
      
      // Refresh data after a short delay to get updated status
      setTimeout(() => {
        fetchData();
      }, 1000);
    } catch (error: any) {
      console.error('Error submitting analysis:', error);
      
      // Remove from processing set on error
      setProcessingCalls(prev => {
        const newSet = new Set(prev);
        newSet.delete(call.id);
        return newSet;
      });
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit analysis. Please try again.',
        variant: 'destructive',
      });
    }
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

  const handleDeleteFollowUp = async (leadId: string) => {
    if (window.confirm('Are you sure you want to delete this follow-up? This will remove the follow-up call record and the lead will return to the "All Leads" section.')) {
      try {
        // Find the follow-up call record for this lead
        // Look for calls that have next_follow_up set (indicating it's a follow-up call)
        const followUpCall = calls.find(call => 
          call.lead_id === leadId && 
          call.next_follow_up
        );

        if (!followUpCall) {
          // If no call record found, just update the lead status to 'active'
          console.log('No follow-up call record found, updating lead status only');
          
          const { error: leadError } = await supabase
            .from('leads')
            .update({ status: 'active' })
            .eq('id', leadId);

          if (leadError) throw leadError;

          toast({
            title: 'Follow-up Deleted',
            description: 'Follow-up has been removed successfully. The lead will return to "All Leads".',
          });

          // Refresh data
          fetchData(true);
          return;
        }

        // Delete the follow-up call record from call_history table
        const { error: historyError } = await supabase
          .from('call_history')
          .delete()
          .eq('id', followUpCall.id);

        if (historyError) throw historyError;

        // Also delete from call_outcomes table for backward compatibility
        const { error: outcomeError } = await supabase
          .from('call_outcomes')
          .delete()
          .eq('id', followUpCall.id);

        if (outcomeError) {
          console.warn('Warning: Failed to delete from call_outcomes table:', outcomeError);
          // Don't throw error here as call_history is the primary storage
        }

        // Update the lead status to 'active' so it returns to All Leads
        const { error: leadError } = await supabase
          .from('leads')
          .update({ status: 'active' })
          .eq('id', leadId);

        if (leadError) throw leadError;

        toast({
          title: 'Follow-up Deleted',
          description: 'Follow-up call has been removed successfully. The lead will return to "All Leads".',
        });

        // Refresh data
        fetchData(true);
      } catch (error: any) {
        console.error('Error deleting follow-up:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete follow-up. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleRemoveLead = (lead: Lead) => {
    setSelectedLeadToRemove(lead);
    setRemovalReason("");
    setIsRemoveLeadModalOpen(true);
  };

  const handleConfirmRemoveLead = async () => {
    if (!selectedLeadToRemove || !removalReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for removing this lead.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // First get the employee record to get the correct employee ID
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', userRole?.user_id)
        .single();

      if (employeeError || !employeeData) {
        console.error('Employee not found:', employeeError);
        return;
      }

      // Save to removed_leads table
      const { error: removeError } = await supabase
        .from('removed_leads')
        .insert({
          lead_id: selectedLeadToRemove.id,
          employee_id: employeeData.id,
          company_id: userRole?.company_id,
          lead_name: selectedLeadToRemove.name,
          lead_email: selectedLeadToRemove.email,
          lead_contact: selectedLeadToRemove.contact,
          lead_company: selectedLeadToRemove.company,
          removal_reason: removalReason.trim(),
        });

      if (removeError) throw removeError;

      // Update the lead status to 'removed'
      const { error: leadError } = await supabase
        .from('leads')
        .update({ status: 'removed' })
        .eq('id', selectedLeadToRemove.id);

      if (leadError) throw leadError;

      toast({
        title: 'Lead Removed',
        description: 'Lead has been removed successfully with the provided reason.',
      });

      // Close modal and refresh data
      setIsRemoveLeadModalOpen(false);
      setSelectedLeadToRemove(null);
      setRemovalReason("");
      fetchData(true);
    } catch (error: any) {
      console.error('Error removing lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove lead. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const fetchCompanySettings = async () => {
    if (!userRole?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .eq('company_id', userRole.company_id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error fetching company settings:', error);
        return;
      }

      if (data) {
        setCompanySettings({
          caller_id: data.caller_id || "09513886363",
          from_numbers: data.from_numbers || ["7887766008"],
        });
        
        // Set default values for the call modal
        if (data.from_numbers && data.from_numbers.length > 0) {
          setFromNumber(data.from_numbers[0]);
        }
        if (data.caller_id) {
          setCallerId(data.caller_id);
        }
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
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

  // Exotel API functions via Supabase Edge Function
  const initiateExotelCall = async (from: string, to: string, callerId: string) => {
    try {
      const response = await fetch('https://lsuuivbaemjqmtztrjqq.supabase.co/functions/v1/exotel-proxy/calls/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdXVpdmJhZW1qcW10enRyanFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTUzMjMsImV4cCI6MjA3MzA3MTMyM30.0geG3EgNNZ5wH2ClKzZ_lwUgJlHRXr1CxcXo80ehVGM'}`,
        },
        body: JSON.stringify({
          from: from,
          to: to,
          callerId: callerId,
          company_id: userRole?.company_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error initiating Exotel call:', error);
      throw error;
    }
  };

  const getExotelCallDetails = async (callSid: string) => {
    try {
      const response = await fetch(`https://lsuuivbaemjqmtztrjqq.supabase.co/functions/v1/exotel-proxy/calls/${callSid}?company_id=${userRole?.company_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdXVpdmJhZW1qcW10enRyanFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0OTUzMjMsImV4cCI6MjA3MzA3MTMyM30.0geG3EgNNZ5wH2ClKzZ_lwUgJlHRXr1CxcXo80ehVGM'}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting Exotel call details:', error);
      throw error;
    }
  };

  const startCallPolling = (callSid: string) => {
    const interval = setInterval(async () => {
      try {
        const callDetails = await getExotelCallDetails(callSid);
        console.log('📞 Call Details Response:', callDetails);
        
        const status = callDetails.Call.Status;
        setCallStatus(status);

        console.log(`📞 Call Status: ${status} for SID: ${callSid}`);

        if (status === 'completed') {
          // Call completed, stop polling and save recording URL
          clearInterval(interval);
          setCallPollingInterval(null);
          setIsCallInProgress(false);
          
          console.log('📞 Call completed! Full response:', callDetails);
          console.log('📞 Recording URL:', callDetails.Call.RecordingUrl);
          console.log('📞 Call Duration:', callDetails.Call.Duration);
          console.log('📞 Call End Time:', callDetails.Call.EndTime);
          
          // Save call details to database
          await saveCallToDatabase(callDetails.Call);
          
          // Close Exotel modal and open call outcome form
          setIsExotelCallModalOpen(false);
          setIsCallModalOpen(true);
          
          toast({
            title: 'Call Completed',
            description: 'Call has been completed successfully! Please fill in the call outcome.',
          });
        } else if (status === 'failed' || status === 'busy' || status === 'no-answer') {
          // Call failed, stop polling
          clearInterval(interval);
          setCallPollingInterval(null);
          setIsCallInProgress(false);
          
          console.log(`📞 Call not answered with status: ${status}`);
          
          // Save to call history with "Not Answered" status
          try {
            // Note: employee_id in call_history references employees.user_id (not employees.id)
            const { error: insertError } = await supabase.from('call_history').insert({
              lead_id: selectedLead?.id,
              employee_id: userRole.user_id,
              company_id: userRole?.company_id,
              outcome: 'not_answered',
              notes: 'Call was not answered by the recipient',
              exotel_call_sid: currentCallSid,
              exotel_status: status,
              exotel_from_number: fromNumber,
              exotel_to_number: toNumber,
              exotel_caller_id: callerId,
              exotel_response: {},
            });
            
            if (insertError) {
              console.error('❌ Error saving call to history:', insertError);
            } else {
              console.log('✅ Call recorded in history as "not_answered"');
              // Refresh data to show the new call in history
              fetchData();
            }
          } catch (error) {
            console.error('❌ Error saving call to history:', error);
          }
          
          toast({
            title: 'Call Not Answered',
            description: 'The call was not answered by the recipient.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error polling call status:', error);
      }
    }, 2000); // Poll every 2 seconds

    setCallPollingInterval(interval);
  };

  const saveCallToDatabase = async (callData: any) => {
    if (!selectedLead || !userRole?.company_id) return;

    try {
      console.log('📞 Saving call to database with data:', callData);
      
      // Note: employee_id in call_history references employees.user_id (not employees.id)
      // So we use userRole.user_id directly
      
      // Save to the new call_history table with complete Exotel response
      const callHistoryData = {
        lead_id: selectedLead.id,
        employee_id: userRole.user_id, // Fixed: Use userRole.user_id
        company_id: userRole.company_id,
        outcome: 'completed', // Mark as completed since call was answered
        notes: 'Call completed via Exotel',
        exotel_response: callData, // Store complete Exotel response as JSONB
        exotel_call_sid: callData.Sid,
        exotel_from_number: callData.From,
        exotel_to_number: callData.To,
        exotel_caller_id: callData.PhoneNumberSid,
        exotel_status: callData.Status,
        exotel_duration: callData.Duration,
        exotel_recording_url: callData.RecordingUrl,
        exotel_start_time: callData.StartTime,
        exotel_end_time: callData.EndTime,
        exotel_answered_by: callData.AnsweredBy,
        exotel_direction: callData.Direction,
      };

      console.log('📞 Call history data to insert:', callHistoryData);

      // Insert into call_history table
      const { error: historyError } = await supabase
        .from('call_history')
        .insert(callHistoryData);

      if (historyError) throw historyError;

      console.log('✅ Call saved to history successfully');

      // Refresh data to show the new call in history
      fetchData();

      // Also save to call_outcomes table for backward compatibility
      const callOutcomeData = {
        lead_id: selectedLead.id,
        employee_id: userRole.user_id, // Fixed: Use userRole.user_id
        company_id: userRole.company_id,
        outcome: 'completed', // Mark as completed since call was answered
        notes: 'Call completed via Exotel',
        exotel_call_sid: callData.Sid,
        exotel_from_number: callData.From,
        exotel_to_number: callData.To,
        exotel_caller_id: callData.PhoneNumberSid,
        exotel_status: callData.Status,
        exotel_duration: callData.Duration,
        exotel_recording_url: callData.RecordingUrl,
        exotel_start_time: callData.StartTime,
        exotel_end_time: callData.EndTime,
        call_in_progress: false,
      };

      const { error: outcomeError } = await supabase
        .from('call_outcomes')
        .insert(callOutcomeData);

      if (outcomeError) {
        console.warn('Warning: Failed to save to call_outcomes table:', outcomeError);
        // Don't throw error here as call_history is the primary storage
      }

      console.log('📞 Call successfully saved to database!');

      // Refresh data to show the new call
      fetchData();
    } catch (error: any) {
      console.error('Error saving call to database:', error);
      toast({
        title: 'Error',
        description: 'Failed to save call details. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExotelCall = async () => {
    if (!fromNumber.trim() || !toNumber.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide both from and to numbers.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsCallInProgress(true);
      setCallStatus('initiating');

      console.log('📞 Initiating call with:', { from: fromNumber, to: toNumber, callerId });

      // Initiate the call
      const callResponse = await initiateExotelCall(fromNumber, toNumber, callerId);
      console.log('📞 Call Initiation Response:', callResponse);
      
      const callSid = callResponse.Call.Sid;
      console.log('📞 Call SID:', callSid);
      
      setCurrentCallSid(callSid);
      setCallStatus('in-progress');

      // Start polling for call status
      startCallPolling(callSid);

      toast({
        title: 'Call Initiated',
        description: 'Call has been initiated successfully!',
      });

    } catch (error: any) {
      console.error('Error initiating call:', error);
      setIsCallInProgress(false);
      setCallStatus('');
      
      toast({
        title: 'Error',
        description: error.message || 'Failed to initiate call. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelCall = () => {
    if (callPollingInterval) {
      clearInterval(callPollingInterval);
      setCallPollingInterval(null);
    }
    setIsCallInProgress(false);
    setCallStatus('');
    setCurrentCallSid('');
    setIsExotelCallModalOpen(false);
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
    
    // Check if this is a follow-up call that still has next_follow_up set
    if (latestCallRecord.outcome === 'follow_up' && latestCallRecord.next_follow_up) {
      return { status: 'follow_up', label: 'Follow-up Added', variant: 'default' as const, color: 'text-orange-500' };
    }
    
    // If follow-up was deleted (no next_follow_up), show as called
    if (latestCallRecord.outcome === 'follow_up' && !latestCallRecord.next_follow_up) {
      return { status: 'called', label: 'Called', variant: 'default' as const, color: 'text-blue-500' };
    }
    
    switch (latestCallRecord.outcome) {
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
              variant={selectedTab === "reports" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("reports")}
            >
              <FileText className="h-4 w-4" />
              Reports
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
                    variant="default" 
                    size="sm"
                    onClick={() => setIsDialerModalOpen(true)}
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <PhoneCall className="h-4 w-4" />
                    Dial Number
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fetchData(true)}
                    className="gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh
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
                        {selectedLeadsSection === 'all' && 'No leads assigned to you yet'}
                        {selectedLeadsSection === 'followup' && 'No follow-up leads at the moment'}
                        {selectedLeadsSection === 'completed' && 'No completed leads yet'}
                      </p>
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
                                  onClick={() => handleStartExotelCall(lead)}
                              className="gap-2"
                            >
                                  <Phone className="h-4 w-4" />
                                  {selectedLeadsSection === 'followup' ? 'Follow-up Call' : 'Call'}
                            </Button>
                              )}
                              
                              {/* Show remove button for all leads */}
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveLead(lead)}
                                className="gap-1 text-orange-600 hover:text-orange-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </Button>
                              
                              {/* Show delete button for follow-up leads */}
                              {selectedLeadsSection === 'followup' && (
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteFollowUp(lead.id)}
                                  className="gap-1 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
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
                        const isProcessing = processingCalls.has(call.id);
                        
                        return (
                          <div key={call.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                call.outcome === 'not_answered' 
                                  ? 'bg-red-100' 
                                  : 'bg-blue-100'
                              }`}>
                                <Phone className={`h-5 w-5 ${
                                  call.outcome === 'not_answered' 
                                    ? 'text-red-600' 
                                    : 'text-blue-600'
                                }`} />
                              </div>
                              <div>
                                <h4 className="font-medium flex items-center gap-2">
                                  Call with {call.leads?.name || 'Lead'}
                                  {call.outcome === 'not_answered' && (
                                    <Badge variant="destructive" className="text-xs">Not Answered</Badge>
                                  )}
                                </h4>
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
                                  {isProcessing || (hasAnalysis && analysis?.status?.toLowerCase() === 'processing') ? (
                                    <div className="flex items-center gap-2">
                                      <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                                      <Badge variant="outline" className="text-xs bg-blue-50">
                                        Analyzing...
                                      </Badge>
                                    </div>
                                  ) : hasAnalysis && analysis?.status?.toLowerCase() === 'completed' ? (
                                    <>
                                      <Badge variant="outline" className="text-xs">
                                        Sentiment: {analysis?.sentiment_score}%
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        Engagement: {analysis?.engagement_score}%
                                      </Badge>
                                    </>
                                  ) : hasAnalysis && analysis?.status?.toLowerCase() === 'failed' ? (
                                    <Badge variant="destructive" className="text-xs">
                                      Analysis Failed
                                    </Badge>
                                  ) : hasAnalysis && analysis?.status?.toLowerCase() === 'pending' ? (
                                    <Badge variant="outline" className="text-xs">
                                      Ready for Analysis
                                    </Badge>
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
                              {!isProcessing && (!hasAnalysis || analysis?.status?.toLowerCase() === 'pending' || analysis?.status?.toLowerCase() === 'failed') && call.outcome !== 'not_answered' && call.outcome !== 'failed' && (
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
                              {call.outcome !== 'not_answered' && call.outcome !== 'failed' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => window.open(`/call/${call.id}`, '_blank')}
                                  className="gap-1"
                                >
                                  <Eye className="h-4 w-4" />
                                  Details
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
                <p className="text-muted-foreground">Your call performance and comprehensive insights</p>
              </div>

              {/* Call Performance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Total Calls</p>
                      <p className="text-3xl font-bold">{calls.length}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Completed</p>
                      <p className="text-3xl font-bold text-green-600">
                        {calls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {calls.length > 0 ? 
                          `${Math.round((calls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length / calls.length) * 100)}%` 
                          : '0%'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Follow-up</p>
                      <p className="text-3xl font-bold text-orange-600">
                        {calls.filter(c => c.outcome === 'follow_up').length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {calls.length > 0 ? 
                          `${Math.round((calls.filter(c => c.outcome === 'follow_up').length / calls.length) * 100)}%` 
                          : '0%'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Not Answered</p>
                      <p className="text-3xl font-bold text-red-600">
                        {calls.filter(c => c.outcome === 'not_answered').length}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {calls.length > 0 ? 
                          `${Math.round((calls.filter(c => c.outcome === 'not_answered').length / calls.length) * 100)}%` 
                          : '0%'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Analysis Quality Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Call Quality Analysis</CardTitle>
                  <CardDescription>
                    {(() => {
                      const completedAnalyses = analyses.filter(a => a.status?.toLowerCase() === 'completed');
                      return completedAnalyses.length > 0 
                        ? `Based on ${completedAnalyses.length} analyzed call${completedAnalyses.length > 1 ? 's' : ''}`
                        : 'No completed analyses yet';
                    })()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const completedAnalyses = analyses.filter(a => a.status?.toLowerCase() === 'completed');
                    
                    if (completedAnalyses.length === 0) {
                      return (
                        <div className="text-center py-8">
                          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">No analysis data available</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Complete a call and click "Get Analysis" to see insights
                          </p>
                        </div>
                      );
                    }

                    const avgSentiment = completedAnalyses.length > 0
                      ? Math.round(completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.sentiment_score) || 0), 0) / completedAnalyses.length)
                      : 0;
                    
                    const avgEngagement = completedAnalyses.length > 0
                      ? Math.round(completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.engagement_score) || 0), 0) / completedAnalyses.length)
                      : 0;
                    
                    const avgConfidenceExec = completedAnalyses.length > 0
                      ? Math.round(completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.confidence_score_executive) || 0), 0) / completedAnalyses.length)
                      : 0;
                    
                    const avgConfidencePerson = completedAnalyses.length > 0
                      ? Math.round(completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.confidence_score_person) || 0), 0) / completedAnalyses.length)
                      : 0;

                    const avgConfidence = Math.round((avgConfidenceExec + avgConfidencePerson) / 2);

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                          <div className="text-3xl font-bold text-blue-700 mb-1">{avgSentiment}%</div>
                          <p className="text-sm text-blue-600 font-medium">Avg Sentiment</p>
                          <p className="text-xs text-blue-500 mt-1">
                            {avgSentiment >= 70 ? '😊 Excellent' : avgSentiment >= 50 ? '😐 Good' : '😟 Needs Improvement'}
                          </p>
                        </div>
                        
                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                          <div className="text-3xl font-bold text-green-700 mb-1">{avgEngagement}%</div>
                          <p className="text-sm text-green-600 font-medium">Avg Engagement</p>
                          <p className="text-xs text-green-500 mt-1">
                            {avgEngagement >= 70 ? '🔥 High' : avgEngagement >= 50 ? '👍 Moderate' : '📉 Low'}
                          </p>
                        </div>
                        
                        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                          <div className="text-3xl font-bold text-purple-700 mb-1">{avgConfidence}/10</div>
                          <p className="text-sm text-purple-600 font-medium">Avg Confidence</p>
                          <p className="text-xs text-purple-500 mt-1">
                            {avgConfidence >= 7 ? '💪 Strong' : avgConfidence >= 5 ? '✓ Good' : '📚 Practice More'}
                          </p>
                        </div>
                        
                        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                          <div className="text-3xl font-bold text-orange-700 mb-1">{completedAnalyses.length}</div>
                          <p className="text-sm text-orange-600 font-medium">Analyzed Calls</p>
                          <p className="text-xs text-orange-500 mt-1">
                            {calls.length > 0 ? `${Math.round((completedAnalyses.length / calls.length) * 100)}% of total` : '0% of total'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Call Outcome Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Call Outcome Breakdown</CardTitle>
                  <CardDescription>Distribution of your call results</CardDescription>
                </CardHeader>
                <CardContent>
                  {calls.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">Completed/Converted</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">
                              {calls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length}
                            </span>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {calls.length > 0 ? Math.round((calls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length / calls.length) * 100) : 0}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{width: `${calls.length > 0 ? (calls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length / calls.length) * 100 : 0}%`}}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium">Follow-up Required</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">
                              {calls.filter(c => c.outcome === 'follow_up').length}
                            </span>
                            <Badge variant="outline" className="bg-orange-50 text-orange-700">
                              {calls.length > 0 ? Math.round((calls.filter(c => c.outcome === 'follow_up').length / calls.length) * 100) : 0}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-600 h-2 rounded-full" 
                            style={{width: `${calls.length > 0 ? (calls.filter(c => c.outcome === 'follow_up').length / calls.length) * 100 : 0}%`}}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">Interested</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">
                              {calls.filter(c => c.outcome === 'interested').length}
                            </span>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              {calls.length > 0 ? Math.round((calls.filter(c => c.outcome === 'interested').length / calls.length) * 100) : 0}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{width: `${calls.length > 0 ? (calls.filter(c => c.outcome === 'interested').length / calls.length) * 100 : 0}%`}}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-medium">Not Interested</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">
                              {calls.filter(c => c.outcome === 'not_interested').length}
                            </span>
                            <Badge variant="outline" className="bg-gray-50 text-gray-700">
                              {calls.length > 0 ? Math.round((calls.filter(c => c.outcome === 'not_interested').length / calls.length) * 100) : 0}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gray-600 h-2 rounded-full" 
                            style={{width: `${calls.length > 0 ? (calls.filter(c => c.outcome === 'not_interested').length / calls.length) * 100 : 0}%`}}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-red-600" />
                            <span className="text-sm font-medium">Not Answered</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold">
                              {calls.filter(c => c.outcome === 'not_answered').length}
                            </span>
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              {calls.length > 0 ? Math.round((calls.filter(c => c.outcome === 'not_answered').length / calls.length) * 100) : 0}%
                            </Badge>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{width: `${calls.length > 0 ? (calls.filter(c => c.outcome === 'not_answered').length / calls.length) * 100 : 0}%`}}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <PhoneCall className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No calls made yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start making calls to see your performance breakdown
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Insights & Tips</CardTitle>
                  <CardDescription>Personalized recommendations based on your data</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const completedAnalyses = analyses.filter(a => a.status?.toLowerCase() === 'completed');
                    const insights = [];

                    if (calls.length === 0) {
                      insights.push({
                        icon: <PhoneCall className="h-5 w-5 text-blue-600" />,
                        title: 'Get Started',
                        message: 'Start making calls to build your performance history and receive personalized insights.',
                        type: 'info'
                      });
                    } else {
                      // Completion rate insight
                      const completionRate = Math.round((calls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length / calls.length) * 100);
                      if (completionRate < 30) {
                        insights.push({
                          icon: <TrendingUp className="h-5 w-5 text-orange-600" />,
                          title: 'Improve Completion Rate',
                          message: `Your completion rate is ${completionRate}%. Try to focus on closing more calls successfully. Consider analyzing successful calls to identify patterns.`,
                          type: 'warning'
                        });
                      } else if (completionRate >= 60) {
                        insights.push({
                          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
                          title: 'Great Completion Rate!',
                          message: `Excellent work! You're completing ${completionRate}% of your calls. Keep up the great work!`,
                          type: 'success'
                        });
                      }

                      // Not answered insight
                      const notAnsweredRate = Math.round((calls.filter(c => c.outcome === 'not_answered').length / calls.length) * 100);
                      if (notAnsweredRate > 40) {
                        insights.push({
                          icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
                          title: 'High Not Answered Rate',
                          message: `${notAnsweredRate}% of your calls aren't being answered. Try calling at different times or consider multiple follow-up attempts.`,
                          type: 'error'
                        });
                      }

                      // Analysis insight
                      if (completedAnalyses.length === 0 && calls.filter(c => c.outcome === 'completed' || c.outcome === 'converted').length > 0) {
                        insights.push({
                          icon: <BarChart3 className="h-5 w-5 text-purple-600" />,
                          title: 'Get Call Analysis',
                          message: 'You have completed calls! Click "Get Analysis" on your calls to receive detailed insights on sentiment, engagement, and areas for improvement.',
                          type: 'info'
                        });
                      }

                      // Quality scores insight
                      if (completedAnalyses.length > 0) {
                        const avgSentiment = Math.round(completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.sentiment_score) || 0), 0) / completedAnalyses.length);
                        const avgEngagement = Math.round(completedAnalyses.reduce((sum, a) => sum + (parseFloat(a.engagement_score) || 0), 0) / completedAnalyses.length);
                        
                        if (avgSentiment < 50 || avgEngagement < 50) {
                          insights.push({
                            icon: <Star className="h-5 w-5 text-yellow-600" />,
                            title: 'Improve Call Quality',
                            message: 'Your sentiment or engagement scores could be higher. Focus on active listening, empathy, and maintaining an enthusiastic tone.',
                            type: 'warning'
                          });
                        } else if (avgSentiment >= 70 && avgEngagement >= 70) {
                          insights.push({
                            icon: <Star className="h-5 w-5 text-yellow-600" />,
                            title: 'Excellent Call Quality!',
                            message: 'Your sentiment and engagement scores are excellent! You\'re doing a great job connecting with leads.',
                            type: 'success'
                          });
                        }
                      }

                      // Follow-up insight
                      const followUpCount = calls.filter(c => c.outcome === 'follow_up').length;
                      if (followUpCount > 0) {
                        insights.push({
                          icon: <Calendar className="h-5 w-5 text-blue-600" />,
                          title: 'Follow-ups Pending',
                          message: `You have ${followUpCount} lead${followUpCount > 1 ? 's' : ''} requiring follow-up. Stay organized and follow up on time to increase conversion rates.`,
                          type: 'info'
                        });
                      }
                    }

                    return (
                      <div className="space-y-4">
                        {insights.length > 0 ? (
                          insights.map((insight, index) => (
                            <div 
                              key={index}
                              className={`flex gap-3 p-4 rounded-lg border ${
                                insight.type === 'success' ? 'bg-green-50 border-green-200' :
                                insight.type === 'warning' ? 'bg-orange-50 border-orange-200' :
                                insight.type === 'error' ? 'bg-red-50 border-red-200' :
                                'bg-blue-50 border-blue-200'
                              }`}
                            >
                              <div className="flex-shrink-0 mt-0.5">
                                {insight.icon}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                                <p className="text-sm text-muted-foreground">{insight.message}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">Looking good!</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Keep up the great work and continue making quality calls
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <EmployeeReportsPage />
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

      {/* Exotel Call Modal */}
      <Dialog open={isExotelCallModalOpen} onOpenChange={setIsExotelCallModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Make Call via Exotel
            </DialogTitle>
            <DialogDescription>
              Initiate a call to {selectedLead?.name} using Exotel
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="fromNumber">From Number *</Label>
              <Select value={fromNumber} onValueChange={setFromNumber}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a phone number" />
                </SelectTrigger>
                <SelectContent>
                  {companySettings.from_numbers.map((number) => (
                    <SelectItem key={number} value={number}>
                      {number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="toNumber">To Number *</Label>
              <Input
                id="toNumber"
                value={toNumber}
                onChange={(e) => setToNumber(e.target.value)}
                placeholder="Enter recipient phone number"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="callerId">Caller ID</Label>
              <Input
                id="callerId"
                value={callerId}
                readOnly
                className="bg-gray-50"
                placeholder="Caller ID set by admin"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This is set by your admin in Company Settings
              </p>
            </div>

            {/* Call Status Display */}
            {isCallInProgress && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-blue-700">
                    Call Status: {callStatus}
                  </span>
                </div>
                {currentCallSid && (
                  <p className="text-xs text-blue-600 mt-1">
                    Call ID: {currentCallSid}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button 
              variant="outline" 
              onClick={handleCancelCall}
              disabled={isCallInProgress}
            >
              {isCallInProgress ? 'Call in Progress...' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleExotelCall}
              disabled={isCallInProgress || !fromNumber.trim() || !toNumber.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCallInProgress ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Calling...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Make Call
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phone Dialer Modal */}
      <Dialog open={isDialerModalOpen} onOpenChange={setIsDialerModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-green-600" />
              Phone Dialer
            </DialogTitle>
            <DialogDescription>
              Dial a number to make a call
            </DialogDescription>
          </DialogHeader>
          <PhoneDialer onCallComplete={() => {
            fetchData(true);
            setIsDialerModalOpen(false);
          }} />
        </DialogContent>
      </Dialog>

      {/* Remove Lead Modal */}
      <Dialog open={isRemoveLeadModalOpen} onOpenChange={setIsRemoveLeadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Remove Lead
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for removing this lead. This action will move the lead to the removed leads list.
            </DialogDescription>
          </DialogHeader>
          
          {selectedLeadToRemove && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{selectedLeadToRemove.name}</h4>
                <p className="text-sm text-gray-600">{selectedLeadToRemove.email}</p>
                <p className="text-sm text-gray-600">{selectedLeadToRemove.contact}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="removal-reason">Reason for Removal *</Label>
                <Textarea
                  id="removal-reason"
                  placeholder="Please provide a reason for removing this lead..."
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsRemoveLeadModalOpen(false);
                    setSelectedLeadToRemove(null);
                    setRemovalReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmRemoveLead}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Remove Lead
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
