// Updated ManagerDashboard - Fixed data fetching and employee creation
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import CallHistoryManager from "@/components/CallHistoryManager";
import ManagerProfilePage from "@/components/ManagerProfilePage";
import { 
  Users, 
  UserPlus, 
  Phone, 
  TrendingUp, 
  Settings, 
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  BarChart3,
  PhoneCall,
  User,
  LogOut,
  Upload,
  Play,
  Download,
  History
} from "lucide-react";

interface Employee {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  user?: {
    id: string;
    email: string;
    user_metadata: any;
  };
}

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
  recording_id: string;
  sentiment_score: number;
  engagement_score: number;
  confidence_score_executive: number;
  confidence_score_person: number;
  detailed_call_analysis: any;
  created_at: string;
}

export default function ManagerDashboard() {
  const { user, userRole, company, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [manager, setManager] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState(false);
  const [isEditLeadModalOpen, setIsEditLeadModalOpen] = useState(false);
  const [isAssignLeadModalOpen, setIsAssignLeadModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [createdEmployeeCredentials, setCreatedEmployeeCredentials] = useState<{email: string, password: string, fullName: string} | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedItems, setCopiedItems] = useState<{
    email: boolean;
    password: boolean;
  }>({ email: false, password: false });
  const [newEmployee, setNewEmployee] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
  });
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    contact: "",
    company: "",
    description: "",
    assignedTo: "",
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

      // First, get the manager's data
      const { data: managerData, error: managerError } = await supabase
        .from('managers')
        .select('*')
        .eq('user_id', userRole.user_id)
        .eq('company_id', userRole.company_id)
        .single();

      if (managerError) throw managerError;
      
      // Set manager data
      setManager(managerData);

      // Fetch employees under this manager
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', userRole.company_id)
        .eq('manager_id', managerData.id)
        .eq('is_active', true);

      if (employeesError) throw employeesError;

      const formattedEmployees = employeesData?.map(emp => ({
        id: emp.id,
        user_id: emp.user_id,
        email: emp.email,
        full_name: emp.full_name,
        phone: emp.phone,
        is_active: emp.is_active,
        created_at: emp.created_at,
        updated_at: emp.updated_at
      })) || [];

      setEmployees(formattedEmployees);

      // Fetch leads for this manager's company
      // This includes:
      // 1. Leads assigned to employees under this manager
      // 2. Unassigned leads (assigned_to is null) that belong to the company
      const employeeUserIds = formattedEmployees.map(emp => emp.user_id);
      console.log('Employee user IDs for leads:', employeeUserIds);
      
      let leadsData = [];
      let leadsError = null;
      
      // Fetch leads assigned to employees under this manager
      if (employeeUserIds.length > 0) {
        const { data: assignedLeads, error: assignedError } = await supabase
          .from('leads')
          .select('*')
          .in('assigned_to', employeeUserIds)
          .eq('company_id', userRole.company_id);
        
        if (assignedError) {
          console.error('Error fetching assigned leads:', assignedError);
          leadsError = assignedError;
        } else {
          leadsData = assignedLeads || [];
        }
      }
      
      // Also fetch unassigned leads (assigned_to is null) for this company
      const { data: unassignedLeads, error: unassignedError } = await supabase
        .from('leads')
        .select('*')
        .is('assigned_to', null)
        .eq('company_id', userRole.company_id);
      
      if (unassignedError) {
        console.error('Error fetching unassigned leads:', unassignedError);
        leadsError = unassignedError;
      } else {
        // Combine assigned and unassigned leads
        leadsData = [...leadsData, ...(unassignedLeads || [])];
      }

      if (leadsError) {
        console.error('Leads error:', leadsError);
      setLeads([]);
      } else {
        setLeads(leadsData || []);
      }

      // Fetch call outcomes made by employees under this manager
      console.log('Employee IDs for call outcomes:', employees.map(emp => emp.id));
      
      let callsData = [];
      let callsError = null;
      
      if (employees.length > 0) {
        const employeeIds = employees.map(emp => emp.id);
        console.log('Manager Dashboard - Fetching calls for employee IDs:', employeeIds);
        const { data, error } = await supabase
          .from('call_history')
          .select('*, leads(name, email, contact), employees(full_name, email)')
          .in('employee_id', employeeIds)
          .eq('company_id', userRole.company_id)
          .order('created_at', { ascending: false });
        callsData = data;
        callsError = error;
        console.log('Manager Dashboard - Calls fetch result:', { data: callsData, error: callsError });
      } else {
        console.log('No employees found, skipping call outcomes fetch');
      }

      if (callsError) {
        console.error('Calls error:', callsError);
        setCalls([]);
      } else {
        setCalls(callsData || []);
      }

      // Fetch analyses for calls made by employees under this manager
      let analysesData = [];
      let analysesError = null;
      
      if (callsData && callsData.length > 0) {
        const callIds = callsData.map(call => call.id);
        console.log('Manager Dashboard - Fetching analyses for call IDs:', callIds);
        const { data, error } = await supabase
          .from('analyses')
          .select('*')
          .in('call_id', callIds);
        analysesData = data;
        analysesError = error;
        console.log('Manager Dashboard - Analyses fetch result:', { data: analysesData, error: analysesError });
      } else {
        console.log('Manager Dashboard - No calls found, skipping analyses fetch');
      }

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

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRole?.company_id) return;

    try {
      console.log('Creating employee with new method (not Supabase Auth)');
      const demoUserId = crypto.randomUUID();
      
      // Get manager's table ID
      const { data: managerData, error: managerError } = await supabase
        .from('managers')
        .select('id')
        .eq('user_id', userRole.user_id)
        .eq('company_id', userRole.company_id)
        .single();

      if (managerError) throw managerError;

      // Create employee in employees table
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          user_id: demoUserId,
          company_id: userRole.company_id,
          manager_id: managerData.id,
          full_name: newEmployee.fullName,
        email: newEmployee.email,
          phone: newEmployee.phone || null,
        password: newEmployee.password,
          is_active: true,
      });

      if (employeeError) throw employeeError;

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: demoUserId,
          company_id: userRole.company_id,
          role: 'employee',
          manager_id: userRole.user_id,
          is_active: true,
        });

      if (roleError) throw roleError;

      // Store credentials to show to user
      setCreatedEmployeeCredentials({
        email: newEmployee.email,
        password: newEmployee.password,
        fullName: newEmployee.fullName
      });

      // Reset form and close modal
      setNewEmployee({
        email: "",
        password: "",
        fullName: "",
        phone: "",
      });
      setIsAddEmployeeModalOpen(false);
      setIsCredentialsModalOpen(true);
      fetchData();
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create employee. Please try again.',
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
          user_id: userRole.user_id,
          company_id: userRole.company_id,
          name: newLead.name,
          email: newLead.email,
          contact: newLead.contact,
          description: newLead.description || null,
          assigned_to: newLead.assignedTo === 'unassigned' ? null : newLead.assignedTo || null,
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
        assignedTo: "",
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

  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', employeeId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Employee deactivated successfully!',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete employee. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsEditLeadModalOpen(true);
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingLead) return;

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          name: editingLead.name,
          email: editingLead.email,
          contact: editingLead.contact,
          description: editingLead.description,
          assigned_to: editingLead.assigned_to === "unassigned" ? null : editingLead.assigned_to,
        })
        .eq('id', editingLead.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lead updated successfully!',
      });

      setEditingLead(null);
      setIsEditLeadModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update lead. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lead deleted successfully!',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lead. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAssignLead = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setEditingLead(lead);
      setIsAssignLeadModalOpen(true);
    }
  };

  const copyToClipboard = async (text: string, type: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => ({ ...prev, [type]: true }));
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [type]: false }));
      }, 2000);
      
      toast({
        title: 'Copied!',
        description: `${type === 'email' ? 'Email' : 'Password'} copied to clipboard`,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
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
              <h1 className="text-2xl font-bold text-foreground">Manager Dashboard</h1>
              <p className="text-muted-foreground">Welcome, {manager?.full_name || 'Manager'} • {company?.name}</p>
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
              variant={selectedTab === "employees" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("employees")}
            >
              <Users className="h-4 w-4" />
              Employees
            </Button>
            <Button 
              variant={selectedTab === "leads" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("leads")}
            >
              <Phone className="h-4 w-4" />
              Leads
            </Button>
            <Button 
              variant={selectedTab === "call-history" ? "accent" : "ghost"} 
              className="w-full justify-start"
              onClick={() => setSelectedTab("call-history")}
            >
              <History className="h-4 w-4" />
              Call History
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
              {/* Welcome Message */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold">Welcome back!</h1>
                <p className="text-muted-foreground">Here's an overview of your team's performance</p>
              </div>

              {/* Team Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{employees.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Active employees
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{leads.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Assigned leads
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

              {/* Team Performance Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Call Quality Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Team Call Quality Stats
                    </CardTitle>
                    <CardDescription>Average performance metrics across your team</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {(() => {
                            // Only calculate if we have data
                            if (!calls || calls.length === 0 || !analyses || analyses.length === 0) {
                              return 0;
                            }
                            
                            // Filter analyses for calls made by employees under this manager
                            const employeeCallIds = calls.map(c => c.id);
                            const employeeAnalyses = analyses.filter(a => employeeCallIds.includes(a.call_id));
                            const completedAnalyses = employeeAnalyses.filter(a => a.status?.toLowerCase() === 'completed');
                            
                            console.log('Manager Dashboard - Team Call Quality Stats Debug:');
                            console.log('Total calls:', calls.length);
                            console.log('Total analyses:', analyses.length);
                            console.log('Employee call IDs:', employeeCallIds);
                            console.log('Employee analyses:', employeeAnalyses.length);
                            console.log('Completed analyses:', completedAnalyses.length);
                            console.log('Completed analyses data:', completedAnalyses);
                            
                            const avgSentiment = completedAnalyses.length > 0
                              ? Math.round(completedAnalyses.reduce((sum, a) => sum + (parseInt(a.sentiment_score) || 0), 0) / completedAnalyses.length)
                              : 0;
                            return avgSentiment;
                          })()}%
                        </div>
                        <p className="text-sm text-blue-600 font-medium">Avg Sentiment</p>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            // Only calculate if we have data
                            if (!calls || calls.length === 0 || !analyses || analyses.length === 0) {
                              return 0;
                            }
                            
                            // Filter analyses for calls made by employees under this manager
                            const employeeCallIds = calls.map(c => c.id);
                            const employeeAnalyses = analyses.filter(a => employeeCallIds.includes(a.call_id));
                            const completedAnalyses = employeeAnalyses.filter(a => a.status?.toLowerCase() === 'completed');
                            const avgEngagement = completedAnalyses.length > 0
                              ? Math.round(completedAnalyses.reduce((sum, a) => sum + (parseInt(a.engagement_score) || 0), 0) / completedAnalyses.length)
                              : 0;
                            return avgEngagement;
                          })()}%
                        </div>
                        <p className="text-sm text-green-600 font-medium">Avg Engagement</p>
                      </div>
                      
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {(() => {
                            // Filter analyses for calls made by employees under this manager
                            const employeeCallIds = calls.map(c => c.id);
                            const employeeAnalyses = analyses.filter(a => employeeCallIds.includes(a.call_id));
                            const completedAnalyses = employeeAnalyses.filter(a => a.status?.toLowerCase() === 'completed');
                            const avgConfidence = completedAnalyses.length > 0
                              ? Math.round((completedAnalyses.reduce((sum, a) => sum + ((parseInt(a.confidence_score_executive) + parseInt(a.confidence_score_person)) / 2 || 0), 0) / completedAnalyses.length))
                              : 0;
                            return `${avgConfidence}/10`;
                          })()}
                        </div>
                        <p className="text-sm text-purple-600 font-medium">Avg Confidence</p>
                      </div>
                      
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {(() => {
                            // Filter analyses for calls made by employees under this manager
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

                {/* Lead Management Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Lead Management Stats
                    </CardTitle>
                    <CardDescription>Overview of lead distribution and status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-700">
                          {(() => {
                            // Count only leads assigned to employees under this manager
                            const employeeUserIds = employees.map(emp => emp.user_id);
                            return leads.filter(lead => employeeUserIds.includes(lead.assigned_to)).length;
                          })()}
                        </div>
                        <p className="text-sm text-gray-600 font-medium">Total Leads</p>
                      </div>
                      
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {(() => {
                            // Count unique leads that have been called by employees under this manager
                            const calledLeadIds = [...new Set(calls.map(call => call.lead_id))];
                            return calledLeadIds.length;
                          })()}
                        </div>
                        <p className="text-sm text-blue-600 font-medium">Called Leads</p>
                      </div>
                      
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">
                          {(() => {
                            // Count leads assigned to employees under this manager that haven't been called yet
                            const employeeUserIds = employees.map(emp => emp.user_id);
                            const managerLeads = leads.filter(lead => employeeUserIds.includes(lead.assigned_to));
                            const calledLeadIds = [...new Set(calls.map(call => call.lead_id))];
                            return managerLeads.filter(lead => !calledLeadIds.includes(lead.id)).length;
                          })()}
                        </div>
                        <p className="text-sm text-yellow-600 font-medium">Pending Calls</p>
                      </div>
                      
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {calls.filter(c => c.outcome === 'converted' || c.outcome === 'completed').length}
                        </div>
                        <p className="text-sm text-green-600 font-medium">Converted</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest calls and lead assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {calls.slice(0, 5).map((call) => {
                      const analysis = analyses.find(a => a.recording_id === call.id);
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

              {/* Employee Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Employee Performance</CardTitle>
                  <CardDescription>Individual performance metrics for your team members</CardDescription>
                </CardHeader>
                <CardContent>
                  {employees.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No employees to display performance data</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employees.map((employee) => {
                        // Get employee's leads
                        const employeeLeads = leads.filter(lead => lead.assigned_to === employee.user_id);
                        
                        // Get employee's calls (using employee_id from call_history table)
                        const employeeCalls = calls.filter(call => call.employee_id === employee.id);
                        
                        // Get unique leads that have been called by this employee
                        const calledLeadIds = [...new Set(employeeCalls.map(call => call.lead_id))];
                        const calledLeads = employeeLeads.filter(lead => calledLeadIds.includes(lead.id));
                        
                        // Get pending leads (not called yet)
                        const pendingLeads = employeeLeads.filter(lead => !calledLeadIds.includes(lead.id));
                        
                        // Get follow-up calls
                        const followUpCalls = employeeCalls.filter(call => call.outcome === 'follow_up');
                        
                        // Get completed calls
                        const completedCalls = employeeCalls.filter(call => 
                          call.outcome === 'converted' || call.outcome === 'completed' || call.outcome === 'interested'
                        );

                        return (
                          <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-purple-500" />
                              </div>
                              <div>
                                <h4 className="font-medium">{employee.full_name}</h4>
                                <p className="text-sm text-muted-foreground">{employee.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="text-center">
                                <div className="font-semibold">{employeeLeads.length}</div>
                                <div className="text-muted-foreground">Total Leads</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold">{calledLeads.length}</div>
                                <div className="text-muted-foreground">Called</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold">{pendingLeads.length}</div>
                                <div className="text-muted-foreground">Pending</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold">{followUpCalls.length}</div>
                                <div className="text-muted-foreground">Follow-ups</div>
                              </div>
                              <div className="text-center">
                                <div className="font-semibold">{completedCalls.length}</div>
                                <div className="text-muted-foreground">Completed</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="employees" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Employee Management</h2>
                  <p className="text-muted-foreground">Manage your team members</p>
                </div>
                <Button onClick={() => setIsAddEmployeeModalOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>My Team ({employees.length})</CardTitle>
                  <CardDescription>
                    Employees under your management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {employees.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No employees found</p>
                      <Button 
                        className="mt-4" 
                        onClick={() => setIsAddEmployeeModalOpen(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add First Employee
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employees.map((employee) => (
                        <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                              <h4 className="font-medium">{employee.full_name}</h4>
                              <p className="text-sm text-muted-foreground">{employee.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">Employee</Badge>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setEditingEmployee(employee);
                                setIsEditEmployeeModalOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteEmployee(employee.user_id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="leads" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Lead Management</h2>
                  <p className="text-muted-foreground">Manage and assign leads to your team</p>
                </div>
                <Button onClick={() => setIsAddLeadModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Leads ({leads.length})</CardTitle>
                  <CardDescription>
                    Leads assigned to your team
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
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

                  {leads.length === 0 ? (
                    <div className="text-center py-8">
                      <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No leads found</p>
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
                      {leads
                        .filter(lead => 
                          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.contact.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((lead) => {
                          const assignedEmployee = employees.find(emp => emp.user_id === lead.assigned_to);
                          const isAssigned = !!assignedEmployee;
                          
                          return (
                            <div 
                              key={lead.id} 
                              className={`flex items-center justify-between p-4 border rounded-lg ${
                                isAssigned 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-orange-50 border-orange-200'
                              }`}
                            >
                              <div className="flex items-center space-x-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  isAssigned 
                                    ? 'bg-green-100' 
                                    : 'bg-orange-100'
                                }`}>
                                  <Phone className={`h-5 w-5 ${
                                    isAssigned 
                                      ? 'text-green-500' 
                                      : 'text-orange-500'
                                  }`} />
                                </div>
                                <div>
                                  <h4 className="font-medium">{lead.name}</h4>
                                  <p className="text-sm text-muted-foreground">{lead.email}</p>
                                  <p className="text-sm text-muted-foreground">{lead.contact}</p>
                                  {lead.company && (
                                    <p className="text-xs text-muted-foreground">{lead.company}</p>
                                  )}
                                  {isAssigned ? (
                                    <p className="text-xs text-green-600 font-medium">✓ Assigned to: {assignedEmployee.full_name}</p>
                                  ) : (
                                    <p className="text-xs text-orange-600 font-medium">⚠ Unassigned</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge 
                                  variant={isAssigned ? "default" : "secondary"}
                                  className={isAssigned ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
                                >
                                  {isAssigned ? "Assigned" : "Unassigned"}
                                </Badge>
                                {!isAssigned && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleAssignLead(lead.id)}
                                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                                  >
                                    Assign
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditLead(lead)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
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


            <TabsContent value="call-history" className="space-y-6">
              <CallHistoryManager 
                companyId={userRole?.company_id || ''} 
                managerId={manager?.id} 
              />
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <ManagerProfilePage onBack={() => setSelectedTab("overview")} />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Add Employee Modal */}
      <Dialog open={isAddEmployeeModalOpen} onOpenChange={setIsAddEmployeeModalOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>
                    Create a new employee under your management.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddEmployee} className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={newEmployee.fullName}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmployee.email}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={newEmployee.password}
                        onChange={(e) => setNewEmployee(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Enter password"
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newEmployee.phone}
                      onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddEmployeeModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!newEmployee.fullName || !newEmployee.email || !newEmployee.password}>
                      Create Employee
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
              Add a new lead and assign it to an employee.
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
                        <div>
              <Label htmlFor="assignedTo">Assign to Employee</Label>
              <Select value={newLead.assignedTo} onValueChange={(value) => setNewLead(prev => ({ ...prev, assignedTo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">No assignment</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.user_id} value={employee.user_id}>
                      {employee.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* Edit Lead Modal */}
      <Dialog open={isEditLeadModalOpen} onOpenChange={setIsEditLeadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update lead information and assignment.
            </DialogDescription>
          </DialogHeader>
          {editingLead && (
            <form onSubmit={handleUpdateLead} className="space-y-4">
              <div>
                <Label htmlFor="editLeadName">Name *</Label>
                <Input
                  id="editLeadName"
                  value={editingLead.name}
                  onChange={(e) => setEditingLead(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Enter lead name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editLeadEmail">Email *</Label>
                <Input
                  id="editLeadEmail"
                  type="email"
                  value={editingLead.email}
                  onChange={(e) => setEditingLead(prev => prev ? { ...prev, email: e.target.value } : null)}
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editLeadContact">Contact *</Label>
                <Input
                  id="editLeadContact"
                  value={editingLead.contact}
                  onChange={(e) => setEditingLead(prev => prev ? { ...prev, contact: e.target.value } : null)}
                  placeholder="Enter contact number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editLeadDescription">Description</Label>
                <Input
                  id="editLeadDescription"
                  value={editingLead.description || ""}
                  onChange={(e) => setEditingLead(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Enter description"
                />
              </div>
              <div>
                <Label htmlFor="editAssignedTo">Assign to Employee</Label>
                <Select 
                  value={editingLead.assigned_to || "unassigned"} 
                  onValueChange={(value) => setEditingLead(prev => prev ? { ...prev, assigned_to: value === "unassigned" ? null : value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No assignment</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.user_id} value={employee.user_id}>
                        {employee.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditLeadModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!editingLead.name || !editingLead.email || !editingLead.contact}>
                  Update Lead
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Lead Modal */}
      <Dialog open={isAssignLeadModalOpen} onOpenChange={setIsAssignLeadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Lead</DialogTitle>
            <DialogDescription>
              Assign this lead to an employee.
            </DialogDescription>
          </DialogHeader>
          {editingLead && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{editingLead.name}</h4>
                <p className="text-sm text-muted-foreground">{editingLead.email}</p>
                <p className="text-sm text-muted-foreground">{editingLead.contact}</p>
              </div>
              <div>
                <Label htmlFor="assignTo">Assign to Employee</Label>
                <Select 
                  value={editingLead.assigned_to || "unassigned"} 
                  onValueChange={(value) => setEditingLead(prev => prev ? { ...prev, assigned_to: value === "unassigned" ? null : value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No assignment</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.user_id} value={employee.user_id}>
                        {employee.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAssignLeadModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    if (!editingLead) return;
                    try {
                      const { error } = await supabase
                        .from('leads')
                        .update({
                          assigned_to: editingLead.assigned_to === "unassigned" ? null : editingLead.assigned_to,
                        })
                        .eq('id', editingLead.id);

                      if (error) throw error;

                      toast({
                        title: 'Success',
                        description: 'Lead assigned successfully!',
                      });

                      setEditingLead(null);
                      setIsAssignLeadModalOpen(false);
                      fetchData();
                    } catch (error: any) {
                      console.error('Error assigning lead:', error);
                      toast({
                        title: 'Error',
                        description: error.message || 'Failed to assign lead. Please try again.',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  Assign Lead
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Employee Credentials Modal */}
      <Dialog open={isCredentialsModalOpen} onOpenChange={setIsCredentialsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Created Successfully!</DialogTitle>
            <DialogDescription>
              Here are the login credentials for the new employee. Please save these details.
            </DialogDescription>
          </DialogHeader>
          {createdEmployeeCredentials && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-3">Employee Credentials</h4>
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium text-green-700">Full Name:</Label>
                    <p className="text-green-800 font-medium">{createdEmployeeCredentials.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-green-700">Email:</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-green-800 font-medium flex-1">{createdEmployeeCredentials.email}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(createdEmployeeCredentials.email, 'email')}
                        className="h-8 w-8 p-0 hover:bg-green-100"
                      >
                        {copiedItems.email ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-green-700">Password:</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-green-800 font-medium font-mono bg-green-100 px-2 py-1 rounded flex-1">
                        {createdEmployeeCredentials.password}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(createdEmployeeCredentials.password, 'password')}
                        className="h-8 w-8 p-0 hover:bg-green-100"
                      >
                        {copiedItems.password ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Please share these credentials with the employee securely. 
                  They can use these to log in to their dashboard.
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setIsCredentialsModalOpen(false)}>
                  Got it
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
