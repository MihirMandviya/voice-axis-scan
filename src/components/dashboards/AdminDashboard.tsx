import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Building, 
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
  LogOut,
  User,
  Mail,
  PhoneCall,
  Calendar,
  Shield,
  AlertTriangle,
  Save,
  X,
  RefreshCw
} from "lucide-react";

interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  department?: string;
  phone?: string;
  profile?: { full_name: string; email: string; department?: string; password?: string } | null;
}

interface Manager extends User {
  employees: User[];
}

interface UserCredentials {
  email: string;
  password: string;
  role: string;
  name: string;
}

export default function AdminDashboard() {
  const { user, userRole, company, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSidebarItem, setActiveSidebarItem] = useState('overview');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isViewUserModalOpen, setIsViewUserModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [addUserType, setAddUserType] = useState<'manager' | 'employee'>('manager');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [generatedCredentials, setGeneratedCredentials] = useState<UserCredentials | null>(null);
  const [copiedItems, setCopiedItems] = useState<{
    email: boolean;
    password: boolean;
  }>({ email: false, password: false });
  const [selectedManagerFilter, setSelectedManagerFilter] = useState<string>('all');
  const [showPassword, setShowPassword] = useState(false);
  const [showEmployeePassword, setShowEmployeePassword] = useState(false);
  const [showUserDetailsPassword, setShowUserDetailsPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "manager" as "manager" | "employee",
    managerId: "",
    department: "",
    phone: "",
  });
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    contact: "",
    description: "",
    assignedTo: "",
  });

  const [editUser, setEditUser] = useState({
    id: "",
    email: "",
    password: "",
    fullName: "",
    role: "manager" as "manager" | "employee",
    managerId: "",
    department: "",
    phone: "",
    is_active: true,
  });

  const [newEmployee, setNewEmployee] = useState({
    email: "",
    password: "",
    fullName: "",
    managerId: "",
    phone: "",
  });

  useEffect(() => {
    if (userRole && company) {
      fetchUsers();
    }
  }, [userRole, company]);

  // Track addUserType changes
  useEffect(() => {
    console.log('addUserType changed to:', addUserType);
  }, [addUserType]);

  // Reset form when modal opens
  useEffect(() => {
    if (isAddUserModalOpen) {
      setNewUser({
        email: "",
        password: "",
        fullName: "",
        role: addUserType || "manager",
        managerId: "",
        department: "",
      });
      setShowPassword(false);
      console.log('Modal opened, addUserType should be:', addUserType);
    }
  }, [isAddUserModalOpen, addUserType]);

  const fetchUsers = async () => {
    if (!userRole?.company_id) return;

    try {
      setLoading(true);
      console.log('Fetching users for company:', userRole.company_id);

      // Fetch managers from managers table
      const { data: managersData, error: managersError } = await supabase
        .from('managers')
        .select('*')
        .eq('company_id', userRole.company_id)
        .eq('is_active', true);

      if (managersError) {
        console.error('Error fetching managers:', managersError);
        throw managersError;
      }
      
      console.log('Fetched managers data:', managersData);
      console.log('Manager passwords:', managersData?.map(m => ({ name: m.full_name, password: m.password })));

      // Fetch employees from employees table
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select(`
          *,
          manager:managers!manager_id(full_name, department)
        `)
        .eq('company_id', userRole.company_id)
        .eq('is_active', true);

      if (employeesError) throw employeesError;

      console.log('Managers found:', managersData);
      console.log('Employees found:', employeesData);
      console.log('Employee passwords:', employeesData?.map(e => ({ name: e.full_name, password: e.password })));

      // Transform managers data to match expected format
      const managersWithEmployees = managersData?.map(manager => {
        console.log('Transforming manager:', manager.full_name, 'Password:', manager.password);
        return {
          id: manager.id,
          user_id: manager.user_id,
          company_id: manager.company_id,
          role: 'manager',
          manager_id: null,
          is_active: manager.is_active,
          created_at: manager.created_at,
          updated_at: manager.updated_at,
          profile: {
            full_name: manager.full_name,
            email: manager.email,
            department: manager.department,
            password: manager.password
          },
          employees: employeesData?.filter(emp => emp.manager_id === manager.id) || []
        };
      }) || [];

      // Transform employees data to match expected format
      const employeesWithProfiles = employeesData?.map(employee => {
        console.log('Transforming employee:', employee.full_name, 'Password:', employee.password);
        return {
          id: employee.id,
          user_id: employee.user_id,
          company_id: employee.company_id,
          role: 'employee',
          manager_id: employee.manager_id,
          is_active: employee.is_active,
          created_at: employee.created_at,
          updated_at: employee.updated_at,
          profile: {
            full_name: employee.full_name,
            email: employee.email,
            department: null,
            password: employee.password
          }
        };
      }) || [];

      setManagers(managersWithEmployees);
      setEmployees(employeesWithProfiles);

      // Fetch all leads for this company
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          assigned_employee:employees!assigned_to(full_name, email),
          created_by_manager:managers!user_id(full_name, email)
        `)
        .eq('company_id', userRole.company_id);

      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
      } else {
        setLeads(leadsData || []);
        console.log('Fetched leads:', leadsData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRole?.company_id) return;

    try {
      const demoUserId = crypto.randomUUID();
      
      console.log('Creating user with ID:', demoUserId);

      if (addUserType === 'manager') {
        // Create manager
        const { error: managerError } = await supabase
          .from('managers')
          .insert({
            user_id: demoUserId,
            company_id: userRole.company_id,
            full_name: newUser.fullName,
            email: newUser.email,
            department: newUser.department,
            phone: newUser.phone,
            password: newUser.password,
            is_active: true,
          });

        if (managerError) throw managerError;

        // Create user role for manager
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: demoUserId,
            company_id: userRole.company_id,
            role: 'manager',
            manager_id: null,
            is_active: true,
          });

        if (roleError) throw roleError;

      } else if (addUserType === 'employee') {
        // Create employee
        const { error: employeeError } = await supabase
          .from('employees')
          .insert({
            user_id: demoUserId,
            company_id: userRole.company_id,
            manager_id: newUser.managerId,
            full_name: newUser.fullName,
            email: newUser.email,
            phone: newUser.phone,
            password: newUser.password,
            is_active: true,
          });

        if (employeeError) throw employeeError;

        // Create user role for employee
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: demoUserId,
            company_id: userRole.company_id,
            role: 'employee',
            manager_id: newUser.managerId,
            is_active: true,
          });

        if (roleError) throw roleError;
      }

      // Show credentials modal
      setGeneratedCredentials({
        email: newUser.email,
        password: newUser.password,
        role: addUserType,
        name: newUser.fullName,
      });
      setCopiedItems({ email: false, password: false });
      setIsCredentialsModalOpen(true);

      // Reset form and close modal
      setNewUser({
        email: "",
        password: "",
        fullName: "",
        role: "manager",
        managerId: "",
        department: "",
        phone: "",
      });
      setShowPassword(false);
      setIsAddUserModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      setIsUpdating(true);

      if (editUser.role === 'manager') {
        const { error } = await supabase
          .from('managers')
          .update({
            full_name: editUser.fullName,
            email: editUser.email,
            department: editUser.department,
            phone: editUser.phone,
            is_active: editUser.is_active,
            ...(editUser.password && { password: editUser.password }),
          })
          .eq('id', selectedUser.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('employees')
          .update({
            full_name: editUser.fullName,
            email: editUser.email,
            phone: editUser.phone,
            manager_id: editUser.managerId,
            is_active: editUser.is_active,
            ...(editUser.password && { password: editUser.password }),
          })
          .eq('id', selectedUser.id);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'User updated successfully!',
      });

      setIsEditUserModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      if (selectedUser.role === 'manager') {
        const { error } = await supabase
          .from('managers')
          .update({ is_active: false })
          .eq('id', selectedUser.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('employees')
          .update({ is_active: false })
          .eq('id', selectedUser.id);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'User deactivated successfully!',
      });

      setIsDeleteUserModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleViewUser = (user: User) => {
    console.log('Viewing user:', user);
    console.log('User profile:', user.profile);
    console.log('User password from profile:', user.profile?.password);
    console.log('User password direct:', user.password);
    setSelectedUser(user);
    setShowUserDetailsPassword(false); // Reset password visibility
    setIsViewUserModalOpen(true);
  };

  const handleEditUserClick = (user: User) => {
    setSelectedUser(user);
    setEditUser({
      id: user.id,
      email: user.profile?.email || user.email,
      password: "",
      fullName: user.profile?.full_name || user.full_name,
      role: user.role as "manager" | "employee",
      managerId: user.manager_id || "",
      department: user.profile?.department || user.department || "",
      phone: user.phone || "",
      is_active: user.is_active,
    });
    setIsEditUserModalOpen(true);
  };

  const handleDeleteUserClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteUserModalOpen(true);
  };

  const handleShowCredentials = (user: User) => {
    setSelectedUser(user);
    setGeneratedCredentials({
      email: user.profile?.email || user.email,
      password: user.profile?.password || user.password || "Not available",
      role: user.role,
      name: user.profile?.full_name || user.full_name,
    });
    setCopiedItems({ email: false, password: false });
    setIsCredentialsModalOpen(true);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRole?.company_id) return;

    try {
      const demoUserId = crypto.randomUUID();
      
      console.log('Creating employee with ID:', demoUserId);

      // Create employee
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          user_id: demoUserId,
          company_id: userRole.company_id,
          manager_id: newEmployee.managerId,
          full_name: newEmployee.fullName,
          email: newEmployee.email,
          phone: newEmployee.phone,
          password: newEmployee.password,
          is_active: true,
        });

      if (employeeError) throw employeeError;

      // Show credentials modal
      setGeneratedCredentials({
        email: newEmployee.email,
        password: newEmployee.password,
        role: 'employee',
        name: newEmployee.fullName,
      });
      setCopiedItems({ email: false, password: false });
      setIsCredentialsModalOpen(true);

      // Reset form and close modal
      setNewEmployee({
        email: "",
        password: "",
        fullName: "",
        managerId: "",
        phone: "",
      });
      setShowEmployeePassword(false);
      setIsAddEmployeeModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create employee. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filteredManagers = managers.filter(manager =>
    manager.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.user_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesManager = selectedManagerFilter === 'all' || employee.manager_id === selectedManagerFilter;
    return matchesSearch && matchesManager;
  });

  const copyToClipboard = async (text: string, type: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => ({ ...prev, [type]: true }));
      toast({
        title: 'Copied!',
        description: `${type === 'email' ? 'Email' : 'Password'} copied to clipboard.`,
      });
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('Starting sign out process...');
      await signOut();
      toast({
        title: 'Success',
        description: 'Signed out successfully.',
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
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
          description: newLead.description || null,
          assigned_to: null, // Only employees should be in assigned_to
          user_id: newLead.assignedTo === "unassigned" ? null : newLead.assignedTo || null, // Admin assigns to manager
          company_id: userRole.company_id,
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
        description: "",
        assignedTo: "",
      });
      setIsAddLeadModalOpen(false);
      fetchUsers(); // Refresh data
    } catch (error: any) {
      console.error('Error adding lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add lead. Please try again.',
        variant: 'destructive',
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
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground">{company?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2"
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
              variant={activeSidebarItem === 'overview' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('overview')}
            >
              <Building className="h-4 w-4" />
              Overview
            </Button>
            <Button 
              variant={activeSidebarItem === 'managers' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('managers')}
            >
              <Users className="h-4 w-4" />
              Managers
            </Button>
            <Button 
              variant={activeSidebarItem === 'employees' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('employees')}
            >
              <UserPlus className="h-4 w-4" />
              Employees
            </Button>
            <Button 
              variant={activeSidebarItem === 'leads' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('leads')}
            >
              <Phone className="h-4 w-4" />
              Leads
            </Button>
            <Button 
              variant={activeSidebarItem === 'analytics' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('analytics')}
            >
              <TrendingUp className="h-4 w-4" />
              Analytics
            </Button>
            <Button 
              variant={activeSidebarItem === 'settings' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('settings')}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeSidebarItem === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Managers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{managers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active managers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
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
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{managers.length + employees.length}</div>
                <p className="text-xs text-muted-foreground">
                  All company users
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Managers Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Managers ({filteredManagers.length})
              </CardTitle>
              <CardDescription>
                Team leaders who manage employees and assign leads
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredManagers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No managers found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredManagers.map((manager) => (
                    <div key={manager.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">{manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}</h4>
                          <p className="text-sm text-muted-foreground">{manager.profile?.email || `ID: ${manager.user_id}`}</p>
                          {!manager.profile?.full_name && (
                            <p className="text-xs text-orange-600">Profile data missing - please update user</p>
                          )}
                          {manager.profile?.department && (
                            <p className="text-xs text-blue-600 font-medium">{manager.profile.department}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {manager.employees.length} employee{manager.employees.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Manager</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(manager)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUserClick(manager)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShowCredentials(manager)}>
                              <Shield className="h-4 w-4 mr-2" />
                              View Credentials
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUserClick(manager)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Employees Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Employees ({filteredEmployees.length})
              </CardTitle>
              <CardDescription>
                Team members who handle assigned leads and make calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No employees found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredEmployees.map((employee) => (
                    <div key={employee.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">{employee.profile?.full_name || `Employee ${employee.user_id.slice(0, 8)}`}</h4>
                          <p className="text-sm text-muted-foreground">{employee.profile?.email || `ID: ${employee.user_id}`}</p>
                          {!employee.profile?.full_name && (
                            <p className="text-xs text-orange-600">Profile data missing - please update user</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Managed by: {managers.find(m => m.id === employee.manager_id)?.profile?.full_name || 
                                       managers.find(m => m.id === employee.manager_id)?.user_id?.slice(0, 8) || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Employee</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(employee)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUserClick(employee)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShowCredentials(employee)}>
                              <Shield className="h-4 w-4 mr-2" />
                              View Credentials
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUserClick(employee)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
            </>
          )}

          {activeSidebarItem === 'managers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Managers</h2>
                  <p className="text-muted-foreground">Manage your team leaders and their responsibilities.</p>
                </div>
                <Button onClick={() => {
                  console.log('Setting addUserType to manager');
                  setAddUserType('manager');
                  setShowPassword(false);
                  // Use setTimeout to ensure state is updated before opening modal
                  setTimeout(() => {
                    console.log('Opening modal with addUserType:', 'manager');
                    setIsAddUserModalOpen(true);
                  }, 100); // Increased timeout to ensure state update
                }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Manager
                </Button>
              </div>
              
              {/* Search Bar */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search managers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              {managers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No managers found</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsAddUserModalOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Manager
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredManagers.map((manager) => (
                    <div key={manager.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">{manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}</h4>
                          <p className="text-sm text-muted-foreground">{manager.profile?.email || `ID: ${manager.user_id}`}</p>
                          {!manager.profile?.full_name && (
                            <p className="text-xs text-orange-600">Profile data missing - please update user</p>
                          )}
                          {manager.profile?.department && (
                            <p className="text-xs text-blue-600 font-medium">{manager.profile.department}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {manager.employees.length} employee{manager.employees.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">Manager</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(manager)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUserClick(manager)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShowCredentials(manager)}>
                              <Shield className="h-4 w-4 mr-2" />
                              View Credentials
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUserClick(manager)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSidebarItem === 'employees' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Employees</h2>
                  <p className="text-muted-foreground">Manage your team members and their assignments.</p>
                </div>
                <Button onClick={() => {
                  console.log('Opening separate employee modal');
                  console.log('Setting isAddEmployeeModalOpen to true');
                  setIsAddEmployeeModalOpen(true);
                  console.log('Employee modal should now be open');
                }}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </div>
              
              {/* Search and Filter */}
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-64">
                  <Label htmlFor="managerFilter">Filter by Manager</Label>
                  <Select value={selectedManagerFilter} onValueChange={setSelectedManagerFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All managers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All managers</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {employees.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No employees found</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => {
                      console.log('Add First Employee clicked - opening separate modal');
                      setIsAddEmployeeModalOpen(true);
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Employee
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredEmployees.map((employee) => (
                    <div key={employee.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <UserPlus className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <h4 className="font-medium">{employee.profile?.full_name || `Employee ${employee.user_id.slice(0, 8)}`}</h4>
                          <p className="text-sm text-muted-foreground">{employee.profile?.email || `ID: ${employee.user_id}`}</p>
                          {!employee.profile?.full_name && (
                            <p className="text-xs text-orange-600">Profile data missing - please update user</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Managed by: {managers.find(m => m.id === employee.manager_id)?.profile?.full_name || 
                                       managers.find(m => m.id === employee.manager_id)?.user_id?.slice(0, 8) || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Employee</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewUser(employee)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditUserClick(employee)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShowCredentials(employee)}>
                              <Shield className="h-4 w-4 mr-2" />
                              View Credentials
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUserClick(employee)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


          {activeSidebarItem === 'leads' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Lead Management</h2>
                  <p className="text-muted-foreground">Track and manage your company's leads.</p>
                </div>
                <Button onClick={() => setIsAddLeadModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </div>
              
              {/* Lead Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{leads.length}</div>
                    <p className="text-xs text-muted-foreground">
                      All time leads
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{leads.filter(lead => lead.status === 'active' || lead.status === 'assigned').length}</div>
                    <p className="text-xs text-muted-foreground">
                      Currently active
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Converted</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{leads.filter(lead => lead.status === 'converted').length}</div>
                    <p className="text-xs text-muted-foreground">
                      Successfully converted
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {leads.length > 0 ? Math.round((leads.filter(lead => lead.status === 'converted').length / leads.length) * 100) : 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Lead to customer rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Lead Groups Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Lead Groups
                  </CardTitle>
                  <CardDescription>
                    Organize your leads into groups for better management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No lead groups found</p>
                    <Button className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Lead Group
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Leads Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Leads
                  </CardTitle>
                  <CardDescription>
                    Latest leads added to your system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {leads.length === 0 ? (
                    <div className="text-center py-8">
                      <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No leads found</p>
                      <Button className="mt-4">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Lead
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {leads.slice(0, 5).map((lead) => (
                        <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Phone className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <h4 className="font-medium">{lead.name}</h4>
                              <p className="text-sm text-muted-foreground">{lead.email}</p>
                              <p className="text-sm text-muted-foreground">{lead.contact}</p>
                              {lead.assigned_employee ? (
                                <p className="text-xs text-green-600">Assigned to: {lead.assigned_employee.full_name}</p>
                              ) : lead.created_by_manager ? (
                                <p className="text-xs text-blue-600">Created by: {lead.created_by_manager.full_name}</p>
                              ) : (
                                <p className="text-xs text-orange-600">Unassigned</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{lead.status}</Badge>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {leads.length > 5 && (
                        <div className="text-center pt-4">
                          <Button variant="outline">
                            View All Leads ({leads.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSidebarItem === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Analytics</h2>
              <p className="text-muted-foreground">View performance metrics and insights.</p>
              {/* Analytics content will be added here */}
            </div>
          )}

          {activeSidebarItem === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Settings</h2>
              <p className="text-muted-foreground">Configure your company settings.</p>
              {/* Settings content will be added here */}
            </div>
          )}
        </main>
      </div>

      {/* Credentials Modal */}
      <Dialog open={isCredentialsModalOpen} onOpenChange={setIsCredentialsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-green-600" />
              User Created Successfully!
            </DialogTitle>
            <DialogDescription>
              Here are the login credentials for the new {generatedCredentials?.role}:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Login Credentials</h4>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-green-800">Name:</label>
                  <p className="text-green-700">{generatedCredentials?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-800">Email:</label>
                  <div className="flex items-center gap-2">
                    <p className="text-green-700 font-mono flex-1">{generatedCredentials?.email}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedCredentials?.email || '', 'email')}
                      className="h-8 w-8 p-0"
                    >
                      {copiedItems.email ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-800">Password:</label>
                  <div className="flex items-center gap-2">
                    <p className="text-green-700 font-mono flex-1">{generatedCredentials?.password}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(generatedCredentials?.password || '', 'password')}
                      className="h-8 w-8 p-0"
                    >
                      {copiedItems.password ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-green-800">Role:</label>
                  <p className="text-green-700 capitalize">{generatedCredentials?.role}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Demo Note:</strong> This creates a user role using your current user ID for demonstration purposes. 
                In production, you would create a real auth user first, then assign the role.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsCredentialsModalOpen(false)}>
                Got it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add User Modal */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen} key={addUserType}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New {addUserType === 'manager' ? 'Manager' : 'Employee'} - OLD SHARED MODAL</DialogTitle>
            <DialogDescription>
              Create a new {addUserType} for your company.
            </DialogDescription>
            {console.log('OLD Modal addUserType:', addUserType)}
            {console.log('OLD Modal is open:', isAddUserModalOpen)}
            {console.log('Modal title should be:', addUserType === 'manager' ? 'Manager' : 'Employee')}
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={newUser.fullName}
                onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
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
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
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
                value={newUser.phone}
                onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            {addUserType === 'manager' && (
              <div>
                {console.log('Rendering manager department field, addUserType:', addUserType)}
                <Label htmlFor="department">Department *</Label>
                <Input
                  id="department"
                  value={newUser.department}
                  onChange={(e) => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="Enter department name"
                  required
                />
              </div>
            )}
            {addUserType === 'employee' && (
              <div>
                {console.log('Rendering employee manager selection, addUserType:', addUserType)}
                <Label htmlFor="managerId">Manager *</Label>
                <Select
                  value={newUser.managerId}
                  onValueChange={(value) => setNewUser(prev => ({ ...prev, managerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                    <SelectContent>
                      {console.log('Rendering manager dropdown, managers:', managers)}
                      {managers.length === 0 ? (
                        <SelectItem value="no-managers" disabled>
                          No managers available - create a manager first
                        </SelectItem>
                      ) : (
                        managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                </Select>
                {managers.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    You need to create a manager first before adding employees.
                  </p>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newUser.fullName || !newUser.email || !newUser.password || (addUserType === 'manager' && !newUser.department) || (addUserType === 'employee' && !newUser.managerId)}>
                Create {addUserType === 'manager' ? 'Manager' : 'Employee'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Employee Modal - Separate Form */}
      <Dialog open={isAddEmployeeModalOpen} onOpenChange={setIsAddEmployeeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee - SEPARATE FORM</DialogTitle>
            <DialogDescription>
              Create a new employee for your company.
            </DialogDescription>
            {console.log('Employee modal is open:', isAddEmployeeModalOpen)}
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div>
              <Label htmlFor="employeeFullName">Full Name *</Label>
              <Input
                id="employeeFullName"
                value={newEmployee.fullName}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="employeeEmail">Email *</Label>
              <Input
                id="employeeEmail"
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
                required
              />
            </div>
            <div>
              <Label htmlFor="employeePassword">Password *</Label>
              <div className="relative">
                <Input
                  id="employeePassword"
                  type={showEmployeePassword ? "text" : "password"}
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
                  onClick={() => setShowEmployeePassword(!showEmployeePassword)}
                >
                  {showEmployeePassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="employeePhone">Phone</Label>
              <Input
                id="employeePhone"
                value={newEmployee.phone || ""}
                onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label htmlFor="employeeManagerId">Manager *</Label>
              <Select
                value={newEmployee.managerId}
                onValueChange={(value) => setNewEmployee(prev => ({ ...prev, managerId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.length === 0 ? (
                    <SelectItem value="no-managers" disabled>
                      No managers available - create a manager first
                    </SelectItem>
                  ) : (
                    managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {managers.length === 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  You need to create a manager first before adding employees.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddEmployeeModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newEmployee.fullName || !newEmployee.email || !newEmployee.password || !newEmployee.managerId}>
                Create Employee
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View User Modal */}
      <Dialog open={isViewUserModalOpen} onOpenChange={setIsViewUserModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Details
            </DialogTitle>
            <DialogDescription>
              Complete information about {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="text-lg font-medium">{selectedUser.profile?.full_name || selectedUser.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="text-lg">{selectedUser.profile?.email || selectedUser.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Password</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-mono bg-gray-100 px-3 py-1 rounded border">
                        {showUserDetailsPassword ? (selectedUser.profile?.password || selectedUser.password || 'Not available') : '••••••••'}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowUserDetailsPassword(!showUserDetailsPassword)}
                        className="h-8"
                      >
                        {showUserDetailsPassword ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                        {showUserDetailsPassword ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                    <Badge variant="secondary" className="capitalize">{selectedUser.role}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <Badge variant={selectedUser.is_active ? "default" : "destructive"}>
                      {selectedUser.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  {(selectedUser.department || selectedUser.profile?.department) && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                      <p className="text-lg">{selectedUser.profile?.department || selectedUser.department}</p>
                    </div>
                  )}
                  {selectedUser.phone && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <p className="text-lg">{selectedUser.phone}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                    <p className="text-lg">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p className="text-lg">{new Date(selectedUser.updated_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              {selectedUser.role === 'manager' && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Team Members</Label>
                  <p className="text-lg">{managers.find(m => m.id === selectedUser.id)?.employees.length || 0} employees</p>
                </div>
              )}
              {selectedUser.role === 'employee' && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Manager</Label>
                  <p className="text-lg">
                    {managers.find(m => m.id === selectedUser.manager_id)?.profile?.full_name || 'Unassigned'}
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsViewUserModalOpen(false);
              setShowUserDetailsPassword(false);
            }}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewUserModalOpen(false);
              setShowUserDetailsPassword(false);
              handleEditUserClick(selectedUser!);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditUserModalOpen} onOpenChange={setIsEditUserModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update information for {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFullName">Full Name *</Label>
                <Input
                  id="editFullName"
                  value={editUser.fullName}
                  onChange={(e) => setEditUser(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder={selectedUser?.profile?.full_name || selectedUser?.full_name || "Enter full name"}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editEmail">Email *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={selectedUser?.profile?.email || selectedUser?.email || "Enter email address"}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={editUser.phone}
                  onChange={(e) => setEditUser(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={selectedUser?.phone || "Enter phone number"}
                />
              </div>
              <div>
                <Label htmlFor="editPassword">New Password (optional)</Label>
                <div className="relative">
                  <Input
                    id="editPassword"
                    type={showPassword ? "text" : "password"}
                    value={editUser.password}
                    onChange={(e) => setEditUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Leave blank to keep current password"
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
            </div>

            {editUser.role === 'manager' && (
              <div>
                <Label htmlFor="editDepartment">Department *</Label>
                <Input
                  id="editDepartment"
                  value={editUser.department}
                  onChange={(e) => setEditUser(prev => ({ ...prev, department: e.target.value }))}
                  placeholder={selectedUser?.profile?.department || selectedUser?.department || "Enter department name"}
                  required
                />
              </div>
            )}

            {editUser.role === 'employee' && (
              <div>
                <Label htmlFor="editManagerId">Manager *</Label>
                <Select
                  value={editUser.managerId}
                  onValueChange={(value) => setEditUser(prev => ({ ...prev, managerId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={editUser.is_active}
                onChange={(e) => setEditUser(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="editIsActive">Active User</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditUserModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating || !editUser.fullName || !editUser.email}>
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update User
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Modal */}
      <Dialog open={isDeleteUserModalOpen} onOpenChange={setIsDeleteUserModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Deactivate User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate {selectedUser?.full_name}? This action will prevent them from logging in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteUserModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              <Trash2 className="h-4 w-4 mr-2" />
              Deactivate User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Lead Modal */}
      <Dialog open={isAddLeadModalOpen} onOpenChange={setIsAddLeadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Add a new lead and assign it to a manager.
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
                placeholder="Enter contact number"
                required
              />
            </div>
            <div>
              <Label htmlFor="leadDescription">Description</Label>
              <Textarea
                id="leadDescription"
                value={newLead.description}
                onChange={(e) => setNewLead(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter description"
              />
            </div>
            <div>
              <Label htmlFor="assignedTo">Assign to Manager</Label>
              <Select value={newLead.assignedTo} onValueChange={(value) => setNewLead(prev => ({ ...prev, assignedTo: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">No assignment</SelectItem>
                  {managers.map((manager) => (
                    <SelectItem key={manager.user_id} value={manager.user_id}>
                      {manager.profile?.full_name || manager.full_name}
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
    </div>
  );
}
