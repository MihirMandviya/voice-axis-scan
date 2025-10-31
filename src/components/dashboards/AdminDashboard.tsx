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
import CallHistoryManager from "@/components/CallHistoryManager";
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
  RefreshCw,
  Edit2,
  History,
  BarChart3,
  Clock,
  Upload
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
  const [leadGroups, setLeadGroups] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSidebarItem, setActiveSidebarItem] = useState('overview');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [isViewUserModalOpen, setIsViewUserModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isAddLeadGroupModalOpen, setIsAddLeadGroupModalOpen] = useState(false);
  const [isUploadCSVModalOpen, setIsUploadCSVModalOpen] = useState(false);
  const [isViewLeadModalOpen, setIsViewLeadModalOpen] = useState(false);
  const [isEditLeadModalOpen, setIsEditLeadModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leadsSection, setLeadsSection] = useState<'leads' | 'groups'>('leads');
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
  });
  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    industry: '',
  });
  const [isPasswordEditing, setIsPasswordEditing] = useState(false);
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: '',
  });
  
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
    groupId: "",
  });
  const [newLeadGroup, setNewLeadGroup] = useState({
    groupName: "",
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

  // Settings state
  const [companySettings, setCompanySettings] = useState({
    caller_id: "09513886363",
    from_numbers: ["7887766008"],
  });
  const [newFromNumber, setNewFromNumber] = useState("");

  useEffect(() => {
    if (userRole && company) {
      fetchUsers();
      fetchCompanySettings();
    }
  }, [userRole, company]);

  // Initialize profile and company data
  useEffect(() => {
    if (user && company) {
      setProfileData({
        full_name: user.user_metadata?.full_name || '',
        email: user.email || '',
      });
      setCompanyData({
        name: company.name || '',
        email: company.email || '',
        industry: company.industry || '',
      });
    }
  }, [user, company]);

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
        .select('*')
        .eq('company_id', userRole.company_id);

      if (leadsError) {
        console.error('Error fetching leads:', leadsError);
      } else {
        // Manually join with employees and managers tables
        const leadsWithAssignments = await Promise.all(
          (leadsData || []).map(async (lead) => {
            let assignedEmployee = null;
            let assignedManager = null;

            // Check if assigned_to exists (employee)
            if (lead.assigned_to) {
              const { data: empData } = await supabase
                .from('employees')
                .select('full_name, email')
                .eq('user_id', lead.assigned_to)
                .single();
              assignedEmployee = empData;
            }

            // Check if user_id exists (manager or creator)
            if (lead.user_id) {
              // Try to find in managers table
              const { data: mgrData } = await supabase
                .from('managers')
                .select('full_name, email')
                .eq('user_id', lead.user_id)
                .single();
              
              if (mgrData) {
                assignedManager = mgrData;
              } else {
                // Try to find in employees table
                const { data: empData } = await supabase
                  .from('employees')
                  .select('full_name, email')
                  .eq('user_id', lead.user_id)
                  .single();
                assignedEmployee = empData;
              }
            }

            return {
              ...lead,
              assigned_employee: assignedEmployee,
              assigned_manager: assignedManager,
            };
          })
        );

        setLeads(leadsWithAssignments);
        console.log('Fetched leads:', leadsWithAssignments);
      }

      // Fetch all lead groups for this company
      const { data: leadGroupsData, error: leadGroupsError } = await supabase
        .from('lead_groups')
        .select('*')
        .eq('company_id', userRole.company_id)
        .order('created_at', { ascending: false });

      if (leadGroupsError) {
        console.error('Error fetching lead groups:', leadGroupsError);
      } else {
        setLeadGroups(leadGroupsData || []);
        console.log('Fetched lead groups:', leadGroupsData);
      }

      // Fetch all calls for this company
      const { data: callsData, error: callsError } = await supabase
        .from('call_history')
        .select('*, leads(name, email, contact), employees(full_name, email)')
        .eq('company_id', userRole.company_id)
        .order('created_at', { ascending: false });

      if (callsError) {
        console.error('Error fetching calls:', callsError);
      } else {
        setCalls(callsData || []);
        console.log('Fetched calls:', callsData);
      }

      // Fetch all analyses for this company
      const { data: analysesData, error: analysesError } = await supabase
        .from('analyses')
        .select('*')
        .in('call_id', callsData?.map(call => call.id) || []);

      if (analysesError) {
        console.error('Error fetching analyses:', analysesError);
      } else {
        setAnalyses(analysesData || []);
        console.log('Fetched analyses:', analysesData);
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
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
    }
  };

  const updateCompanySettings = async () => {
    if (!userRole?.company_id) return;

    try {
      const { error } = await supabase
        .from('company_settings')
        .upsert({
          company_id: userRole.company_id,
          caller_id: companySettings.caller_id,
          from_numbers: companySettings.from_numbers,
        }, {
          onConflict: 'company_id'
        });

      if (error) throw error;
      toast({
        title: 'Settings Updated',
        description: 'Company settings have been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating company settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const addFromNumber = () => {
    if (newFromNumber.trim() && !companySettings.from_numbers.includes(newFromNumber.trim())) {
      setCompanySettings(prev => ({
        ...prev,
        from_numbers: [...prev.from_numbers, newFromNumber.trim()]
      }));
      setNewFromNumber("");
    }
  };

  const removeFromNumber = (index: number) => {
    setCompanySettings(prev => ({
      ...prev,
      from_numbers: prev.from_numbers.filter((_, i) => i !== index)
    }));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userRole?.company_id) return;

    try {
      // Validate email uniqueness within the SAME role only
      const emailToCheck = newUser.email.toLowerCase().trim();
      
      if (addUserType === 'manager') {
        // Check if email already exists as MANAGER
        const { data: existingManagers } = await supabase
          .from('managers')
          .select('email, full_name')
          .eq('company_id', userRole.company_id)
          .eq('email', emailToCheck)
          .eq('is_active', true);

        if (existingManagers && existingManagers.length > 0) {
          toast({
            title: 'Email Already Exists',
            description: `A manager with email ${newUser.email} already exists in your company.`,
            variant: 'destructive',
          });
          return;
        }
      } else if (addUserType === 'employee') {
        // Check if email already exists as EMPLOYEE
        const { data: existingEmployees } = await supabase
          .from('employees')
          .select('email, full_name')
          .eq('company_id', userRole.company_id)
          .eq('email', emailToCheck)
          .eq('is_active', true);

        if (existingEmployees && existingEmployees.length > 0) {
          toast({
            title: 'Email Already Exists',
            description: `An employee with email ${newUser.email} already exists in your company.`,
            variant: 'destructive',
          });
          return;
        }
      }

      // Note: Additional validation for admin emails will happen at the database level via triggers

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
            email: emailToCheck,
            department: newUser.department,
            phone: newUser.phone,
            password: newUser.password,
            is_active: true,
          });

        if (managerError) {
          // Check if it's a unique constraint violation
          if (managerError.code === '23505') {
            toast({
              title: 'Email Already Exists',
              description: `A manager with email ${newUser.email} already exists in your company.`,
              variant: 'destructive',
            });
            return;
          }
          throw managerError;
        }

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
        // Delete the manager record
        const { error } = await supabase
          .from('managers')
          .delete()
          .eq('id', selectedUser.id);

        if (error) throw error;

        // Also delete the user_role if it exists
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.user_id)
          .eq('company_id', userRole?.company_id);

      } else {
        // Delete the employee record
        const { error } = await supabase
          .from('employees')
          .delete()
          .eq('id', selectedUser.id);

        if (error) throw error;

        // Also delete the user_role if it exists
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.user_id)
          .eq('company_id', userRole?.company_id);
      }

      toast({
        title: 'Success',
        description: 'User deleted successfully!',
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
      // Check if email already exists as EMPLOYEE only (same person can be both manager and employee)
      const { data: existingUsers, error: checkError } = await supabase
        .from('employees')
        .select('email, full_name')
        .eq('company_id', userRole.company_id)
        .eq('email', newEmployee.email.toLowerCase().trim())
        .eq('is_active', true);

      if (checkError) {
        console.error('Error checking email:', checkError);
      }

      if (existingUsers && existingUsers.length > 0) {
        toast({
          title: 'Email Already Exists',
          description: `An employee with email ${newEmployee.email} already exists in your company.`,
          variant: 'destructive',
        });
        return;
      }

      // Note: Additional validation for admin emails will happen at the database level via triggers

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
          email: newEmployee.email.toLowerCase().trim(),
          phone: newEmployee.phone,
          password: newEmployee.password,
          is_active: true,
        });

      if (employeeError) {
        // Check if it's a unique constraint violation
        if (employeeError.code === '23505') {
          toast({
            title: 'Email Already Exists',
            description: `An employee with email ${newEmployee.email} already exists in your company.`,
            variant: 'destructive',
          });
          return;
        }
        throw employeeError;
      }

      // Create user role for employee
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: demoUserId,
          company_id: userRole.company_id,
          role: 'employee',
          manager_id: newEmployee.managerId,
          is_active: true,
        });

      if (roleError) throw roleError;

      toast({
        title: 'Employee Created',
        description: `${newEmployee.fullName} has been successfully added as an employee.`,
      });

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
          status: newLead.assignedTo === "unassigned" ? 'unassigned' : 'assigned', // Set proper status based on assignment
          group_id: newLead.groupId || null, // Add group assignment
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
        groupId: "",
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

  const handleViewLead = (lead: any) => {
    setSelectedLead(lead);
    setIsViewLeadModalOpen(true);
  };

  const handleEditLead = (lead: any) => {
    setSelectedLead(lead);
    setIsEditLeadModalOpen(true);
  };

  const handleDeleteLead = async (lead: any) => {
    if (!confirm(`Are you sure you want to delete ${lead.name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lead deleted successfully!',
      });

      fetchUsers(); // Refresh data
    } catch (error: any) {
      console.error('Error deleting lead:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete lead. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setIsUpdating(true);

      // Update user metadata in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name,
        }
      });

      if (authError) throw authError;

      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
      });

      setIsEditingProfile(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!userRole?.company_id) return;

    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from('companies')
        .update({
          name: companyData.name,
          email: companyData.email,
          industry: companyData.industry,
        })
        .eq('id', userRole.company_id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Company information updated successfully!',
      });

      setIsEditingCompany(false);
      // Refresh company data
      window.location.reload(); // Simple refresh to get updated company data
    } catch (error: any) {
      console.error('Error updating company:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update company information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast({
        title: 'Error',
        description: 'New passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUpdating(true);
      
      // Update password using Supabase Auth (since admin uses Supabase Auth)
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      });

      if (error) {
        throw error;
      }

      setPasswordData({
        new_password: '',
        confirm_password: '',
      });
      setIsPasswordEditing(false);
      
      toast({
        title: 'Password updated',
        description: 'Your password has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
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
              <p className="text-muted-foreground">Welcome, {user?.user_metadata?.full_name || 'Admin'} • {company?.name}</p>
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
              variant={activeSidebarItem === 'call-history' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('call-history')}
            >
              <History className="h-4 w-4" />
              Call History
            </Button>
            <Button 
              variant={activeSidebarItem === 'performance' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('performance')}
            >
              <BarChart3 className="h-4 w-4" />
              Performance
            </Button>
            <Button 
              variant={activeSidebarItem === 'settings' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('settings')}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button 
              variant={activeSidebarItem === 'profile' ? 'accent' : 'ghost'} 
              className="w-full justify-start"
              onClick={() => setActiveSidebarItem('profile')}
            >
              <User className="h-4 w-4" />
              Profile
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeSidebarItem === 'overview' && (
            <>
              {/* Company Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                    <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                    <PhoneCall className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{calls.length}</div>
                    <p className="text-xs text-muted-foreground">
                      All time calls
                </p>
              </CardContent>
            </Card>
          </div>

              {/* Team Call Quality Stats */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Team Call Quality Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analyses.length > 0 
                          ? Math.round(analyses.reduce((sum, a) => sum + (a.sentiment_score || 0), 0) / analyses.length)
                          : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Average sentiment score
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analyses.length > 0 
                          ? Math.round(analyses.reduce((sum, a) => sum + (a.engagement_score || 0), 0) / analyses.length)
                          : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Average engagement score
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
                      <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analyses.length > 0 
                          ? `${Math.round(analyses.reduce((sum, a) => sum + ((a.confidence_score_executive + a.confidence_score_person) / 2 || 0), 0) / analyses.length)}/10`
                          : '0/10'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Average confidence score
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Completed Analyses</CardTitle>
                      <Check className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analyses.filter(a => a.status?.toLowerCase() === 'completed').length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Out of {analyses.length} total
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Lead Management Stats */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Lead Management Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{leads.length}</div>
                      <p className="text-xs text-muted-foreground">
                        All leads in system
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Called Leads</CardTitle>
                      <PhoneCall className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {[...new Set(calls.map(call => call.lead_id))].length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Unique leads called
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Calls</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {leads.length - [...new Set(calls.map(call => call.lead_id))].length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Leads not yet called
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {leads.length > 0 
                          ? Math.round((leads.filter(lead => lead.status === 'converted').length / leads.length) * 100)
                          : 0}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Lead to customer rate
                      </p>
                    </CardContent>
                  </Card>
                </div>
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
                              Delete
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
                              Delete
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
                              Delete
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
                              Delete
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
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsAddLeadGroupModalOpen(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    Add Lead Group
                  </Button>
                  <Button variant="outline" onClick={() => setIsUploadCSVModalOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </Button>
                <Button onClick={() => setIsAddLeadModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
                </div>
              </div>
              
              {/* Tabs for Leads and Lead Groups */}
              <Tabs value={leadsSection} onValueChange={(value) => setLeadsSection(value as 'leads' | 'groups')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="leads">All Leads</TabsTrigger>
                  <TabsTrigger value="groups">Lead Groups</TabsTrigger>
                </TabsList>
                
                <TabsContent value="leads" className="space-y-6">
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

              {/* All Leads Section - Now on Top */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                        All Leads ({leads.length})
                  </CardTitle>
                  <CardDescription>
                        Complete list of all leads in your system
                  </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search leads..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {leads.length === 0 ? (
                    <div className="text-center py-8">
                      <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No leads found</p>
                      <Button className="mt-4" onClick={() => setIsAddLeadModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Lead
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {leads
                        .filter(lead => 
                          lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          lead.contact?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((lead) => (
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
                                <p className="text-xs text-green-600">Assigned to Employee: {lead.assigned_employee.full_name}</p>
                              ) : lead.assigned_manager ? (
                                <p className="text-xs text-blue-600">Assigned to Manager: {lead.assigned_manager.full_name}</p>
                              ) : (
                                <p className="text-xs text-orange-600">Unassigned</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">{lead.status}</Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewLead(lead)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditLead(lead)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Lead
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteLead(lead)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Lead
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                      {leads.filter(lead => 
                        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        lead.contact?.toLowerCase().includes(searchTerm.toLowerCase())
                      ).length === 0 && searchTerm && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No leads found matching your search.</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
                </TabsContent>

                <TabsContent value="groups" className="space-y-6">
                  {/* Lead Groups Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Lead Groups
                      </CardTitle>
                      <CardDescription>
                        Organize your leads into groups for better management
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {leadGroups.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No lead groups found</p>
                          <Button className="mt-4" onClick={() => setIsAddLeadGroupModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Lead Group
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {leadGroups.map((group) => (
                            <div key={group.id} className="flex items-center justify-between p-4 border rounded-lg">
                              <div>
                                <h3 className="font-medium">{group.group_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Created {new Date(group.created_at).toLocaleDateString()}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {leads.filter(lead => lead.group_id === group.id).length} leads
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeSidebarItem === 'call-history' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Call History</h2>
                <p className="text-muted-foreground">View all calls made by your team members.</p>
              </div>
              <CallHistoryManager 
                companyId={userRole?.company_id || ''} 
                managerId={null} // null means show all calls for the company
              />
            </div>
          )}

          {activeSidebarItem === 'performance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Manager & Employee Performance</h2>
                <p className="text-muted-foreground">Track performance metrics for all managers and their teams.</p>
              </div>
              
              {/* Manager Performance Section */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Manager Performance</h3>
                <div className="grid gap-6">
                  {managers.map((manager) => {
                    const managerEmployees = employees.filter(emp => emp.manager_id === manager.id);
                    const managerEmployeeIds = managerEmployees.map(emp => emp.id);
                    const managerCalls = calls.filter(call => managerEmployeeIds.includes(call.employee_id));
                    const managerCallIds = managerCalls.map(call => call.id);
                    const managerAnalyses = analyses.filter(analysis => managerCallIds.includes(analysis.call_id));
                    const completedAnalyses = managerAnalyses.filter(a => a.status?.toLowerCase() === 'completed');
                    
                    // Calculate manager's team stats
                    const managerEmployeeUserIds = managerEmployees.map(emp => emp.user_id);
                    const totalLeads = leads.filter(lead => managerEmployeeUserIds.includes(lead.assigned_to)).length;
                    const calledLeads = [...new Set(managerCalls.map(call => call.lead_id))].length;
                    const pendingLeads = totalLeads - calledLeads;
                    const followUpCalls = managerCalls.filter(call => call.outcome === 'follow_up').length;
                    const completedCalls = managerCalls.filter(call => 
                      call.outcome === 'converted' || call.outcome === 'completed' || call.outcome === 'interested'
                    ).length;
                    
                    return (
                      <Card key={manager.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                {manager.profile?.full_name || `Manager ${manager.user_id.slice(0, 8)}`}
                              </CardTitle>
                              <CardDescription>
                                {manager.profile?.department && `Department: ${manager.profile.department}`}
                              </CardDescription>
                            </div>
                            <Badge variant="secondary">Manager</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{totalLeads}</div>
                              <div className="text-sm text-muted-foreground">Total Leads</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">{calledLeads}</div>
                              <div className="text-sm text-muted-foreground">Called</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-orange-600">{pendingLeads}</div>
                              <div className="text-sm text-muted-foreground">Pending</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-purple-600">{completedCalls}</div>
                              <div className="text-sm text-muted-foreground">Completed</div>
                            </div>
                          </div>
                          
                          {/* Team Members */}
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">Team Members ({managerEmployees.length})</h4>
                            <div className="space-y-2">
                              {managerEmployees.map((employee) => {
                                const employeeCalls = calls.filter(call => call.employee_id === employee.id);
                                const employeeCallIds = employeeCalls.map(call => call.id);
                                const employeeAnalyses = analyses.filter(analysis => employeeCallIds.includes(analysis.call_id));
                                const completedEmployeeAnalyses = employeeAnalyses.filter(a => a.status?.toLowerCase() === 'completed');
                                
                                const employeeLeads = leads.filter(lead => lead.assigned_to === employee.user_id);
                                const calledEmployeeLeads = [...new Set(employeeCalls.map(call => call.lead_id))].length;
                                const pendingEmployeeLeads = employeeLeads.length - calledEmployeeLeads;
                                const followUpEmployeeCalls = employeeCalls.filter(call => call.outcome === 'follow_up').length;
                                const completedEmployeeCalls = employeeCalls.filter(call => 
                                  call.outcome === 'converted' || call.outcome === 'completed' || call.outcome === 'interested'
                                ).length;
                                
                                return (
                                  <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                        <UserPlus className="h-4 w-4 text-purple-500" />
                                      </div>
                                      <div>
                                        <div className="font-medium">{employee.profile?.full_name || `Employee ${employee.user_id.slice(0, 8)}`}</div>
                                        <div className="text-sm text-muted-foreground">{employee.profile?.email}</div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                      <div className="text-center">
                                        <div className="font-medium text-blue-600">{employeeLeads.length}</div>
                                        <div className="text-xs text-muted-foreground">Leads</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="font-medium text-green-600">{calledEmployeeLeads}</div>
                                        <div className="text-xs text-muted-foreground">Called</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="font-medium text-orange-600">{pendingEmployeeLeads}</div>
                                        <div className="text-xs text-muted-foreground">Pending</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="font-medium text-purple-600">{completedEmployeeCalls}</div>
                                        <div className="text-xs text-muted-foreground">Completed</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="font-medium text-yellow-600">{followUpEmployeeCalls}</div>
                                        <div className="text-xs text-muted-foreground">Follow-ups</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="font-medium text-indigo-600">{completedEmployeeAnalyses.length}</div>
                                        <div className="text-xs text-muted-foreground">Analyses</div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeSidebarItem === 'settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Company Settings</h2>
                <p className="text-muted-foreground">Manage Exotel calling settings for your company.</p>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Exotel Calling Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure the Caller ID and From Numbers that will be used for all calls made by employees.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Caller ID Setting */}
                  <div className="space-y-2">
                    <Label htmlFor="caller-id">Caller ID</Label>
                    <Input
                      id="caller-id"
                      value={companySettings.caller_id}
                      onChange={(e) => setCompanySettings(prev => ({ ...prev, caller_id: e.target.value }))}
                      placeholder="Enter Caller ID (e.g., 09513886363)"
                    />
                    <p className="text-sm text-muted-foreground">
                      This is the number that will appear as the caller ID for all outgoing calls.
                    </p>
                  </div>

                  {/* From Numbers Management */}
                  <div className="space-y-4">
                    <div>
                      <Label>From Numbers</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Add phone numbers that employees can select as their "from" number when making calls.
                      </p>
                    </div>

                    {/* Add New From Number */}
                    <div className="flex gap-2">
                      <Input
                        value={newFromNumber}
                        onChange={(e) => setNewFromNumber(e.target.value)}
                        placeholder="Enter phone number (e.g., 7887766008)"
                        className="flex-1"
                      />
                      <Button onClick={addFromNumber} disabled={!newFromNumber.trim()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    {/* Display Current From Numbers */}
                    <div className="space-y-2">
                      <Label>Current From Numbers ({companySettings.from_numbers.length})</Label>
                      {companySettings.from_numbers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No from numbers added yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {companySettings.from_numbers.map((number, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono">{number}</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromNumber(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button onClick={updateCompanySettings} className="gap-2">
                      <Save className="h-4 w-4" />
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSidebarItem === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Admin Profile</h2>
                <p className="text-muted-foreground">Manage your admin account settings and information.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Personal Information
                        </CardTitle>
                        <CardDescription>
                          Your basic account information
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                      >
                        {isEditingProfile ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                      {isEditingProfile ? (
                        <Input
                          value={profileData.full_name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="Enter full name"
                        />
                      ) : (
                        <p className="text-lg font-medium">{user?.user_metadata?.full_name || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-lg">{user?.email || 'Not provided'}</p>
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                      <Badge variant="secondary" className="capitalize">Admin</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Company</Label>
                      <p className="text-lg">{company?.name || 'Not provided'}</p>
                    </div>
                    {isEditingProfile && (
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingProfile(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Company Information */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Building className="h-5 w-5" />
                          Company Information
                        </CardTitle>
                        <CardDescription>
                          Your company details
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingCompany(!isEditingCompany)}
                      >
                        {isEditingCompany ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Company Name</Label>
                      {isEditingCompany ? (
                        <Input
                          value={companyData.name}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter company name"
                        />
                      ) : (
                        <p className="text-lg font-medium">{company?.name || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Company Email</Label>
                      {isEditingCompany ? (
                        <Input
                          type="email"
                          value={companyData.email}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter company email"
                        />
                      ) : (
                        <p className="text-lg">{company?.email || 'Not provided'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Industry</Label>
                      {isEditingCompany ? (
                        <Input
                          value={companyData.industry}
                          onChange={(e) => setCompanyData(prev => ({ ...prev, industry: e.target.value }))}
                          placeholder="Enter industry"
                        />
                      ) : (
                        <p className="text-lg">{company?.industry || 'Not specified'}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                      <p className="text-lg">{company?.created_at ? new Date(company.created_at).toLocaleDateString() : 'Not available'}</p>
                    </div>
                    {isEditingCompany && (
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingCompany(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveCompany}
                          disabled={isUpdating}
                        >
                          {isUpdating ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Account Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Account Statistics
                  </CardTitle>
                  <CardDescription>
                    Overview of your admin account activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{managers.length}</div>
                      <div className="text-sm text-muted-foreground">Managers Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{employees.length}</div>
                      <div className="text-sm text-muted-foreground">Employees Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{leads.length}</div>
                      <div className="text-sm text-muted-foreground">Leads Added</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{calls.length}</div>
                      <div className="text-sm text-muted-foreground">Total Calls</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Password Management */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Password Management
                    </CardTitle>
                    <CardDescription>
                      Update your account password
                    </CardDescription>
                  </div>
                  {!isPasswordEditing ? (
                    <Button onClick={() => setIsPasswordEditing(true)} size="sm" variant="outline">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handlePasswordChange} size="sm" disabled={isUpdating}>
                        {isUpdating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Update
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsPasswordEditing(false);
                          setPasswordData({
                            new_password: '',
                            confirm_password: '',
                          });
                        }} 
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardHeader>
                {isPasswordEditing && (
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="new_password">New Password</Label>
                      <Input
                        id="new_password"
                        type="password"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm_password">Confirm New Password</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                        placeholder="Confirm new password"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> Please save these credentials. The {generatedCredentials?.role} will need them to log in.
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
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.full_name}? This action will permanently remove them from the database and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteUserModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
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
            <div>
              <Label htmlFor="groupId">Lead Group</Label>
              <Select value={newLead.groupId || "none"} onValueChange={(value) => setNewLead(prev => ({ ...prev, groupId: value === "none" ? "" : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No group</SelectItem>
                  {leadGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.group_name}
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

      {/* Add Lead Group Modal */}
      <Dialog open={isAddLeadGroupModalOpen} onOpenChange={setIsAddLeadGroupModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Lead Group</DialogTitle>
            <DialogDescription>
              Create a new lead group to organize your leads.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!userRole?.company_id) return;

            try {
              const { error } = await supabase
                .from('lead_groups')
                .insert({
                  user_id: user?.id,
                  group_name: newLeadGroup.groupName,
                  company_id: userRole.company_id,
                });

              if (error) throw error;

              toast({
                title: 'Success',
                description: 'Lead group created successfully!',
              });

              setNewLeadGroup({
                groupName: '',
              });
              setIsAddLeadGroupModalOpen(false);
              fetchUsers(); // Refresh data
            } catch (error: any) {
              console.error('Error adding lead group:', error);
              toast({
                title: 'Error',
                description: error.message || 'Failed to create lead group. Please try again.',
                variant: 'destructive',
              });
            }
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  value={newLeadGroup.groupName}
                  onChange={(e) => setNewLeadGroup(prev => ({ ...prev, groupName: e.target.value }))}
                  placeholder="Enter group name"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={() => setIsAddLeadGroupModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newLeadGroup.groupName}>
                Create Group
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload CSV Modal */}
      <Dialog open={isUploadCSVModalOpen} onOpenChange={setIsUploadCSVModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload CSV File</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple leads at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">Drop your CSV file here or click to browse</p>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="csv-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Handle CSV upload logic here
                    console.log('CSV file selected:', file);
                    toast({
                      title: 'File Selected',
                      description: `Selected file: ${file.name}`,
                    });
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('csv-upload')?.click()}
              >
                Choose File
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              <p><strong>CSV Format:</strong></p>
              <p>Name, Email, Contact, Description</p>
              <p className="mt-2">Example:</p>
              <p>John Doe, john@example.com, +1234567890, Interested in premium plan</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={() => setIsUploadCSVModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled>
              Upload CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Lead Modal */}
      <Dialog open={isViewLeadModalOpen} onOpenChange={setIsViewLeadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
            <DialogDescription>
              View details for {selectedLead?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <p className="text-sm font-medium">{selectedLead.name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm font-medium">{selectedLead.email}</p>
              </div>
              <div>
                <Label>Contact</Label>
                <p className="text-sm font-medium">{selectedLead.contact}</p>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm font-medium">{selectedLead.description || 'No description'}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant="secondary">{selectedLead.status}</Badge>
              </div>
              <div>
                <Label>Assignment</Label>
                {selectedLead.assigned_employee ? (
                  <p className="text-sm text-green-600">Assigned to Employee: {selectedLead.assigned_employee.full_name}</p>
                ) : selectedLead.assigned_manager ? (
                  <p className="text-sm text-blue-600">Assigned to Manager: {selectedLead.assigned_manager.full_name}</p>
                ) : (
                  <p className="text-sm text-orange-600">Unassigned</p>
                )}
              </div>
              <div>
                <Label>Created</Label>
                <p className="text-sm font-medium">{new Date(selectedLead.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsViewLeadModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewLeadModalOpen(false);
              handleEditLead(selectedLead);
            }}>
              Edit Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Modal */}
      <Dialog open={isEditLeadModalOpen} onOpenChange={setIsEditLeadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update details for {selectedLead?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const { error } = await supabase
                  .from('leads')
                  .update({
                    name: selectedLead.name,
                    email: selectedLead.email,
                    contact: selectedLead.contact,
                    description: selectedLead.description,
                    user_id: selectedLead.user_id,
                    status: selectedLead.user_id ? 'assigned' : 'unassigned',
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', selectedLead.id);

                if (error) throw error;

                toast({
                  title: 'Success',
                  description: 'Lead updated successfully!',
                });

                setIsEditLeadModalOpen(false);
                fetchUsers(); // Refresh data
              } catch (error: any) {
                console.error('Error updating lead:', error);
                toast({
                  title: 'Error',
                  description: error.message || 'Failed to update lead. Please try again.',
                  variant: 'destructive',
                });
              }
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedLead.name}
                    onChange={(e) => setSelectedLead(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedLead.email}
                    onChange={(e) => setSelectedLead(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contact">Contact</Label>
                  <Input
                    id="edit-contact"
                    value={selectedLead.contact}
                    onChange={(e) => setSelectedLead(prev => ({ ...prev, contact: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={selectedLead.description || ''}
                    onChange={(e) => setSelectedLead(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter lead description"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-assignment">Assignment</Label>
                  <Select value={selectedLead.user_id || "unassigned"} onValueChange={(value) => setSelectedLead(prev => ({ ...prev, user_id: value === "unassigned" ? null : value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
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
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditLeadModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update Lead
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
