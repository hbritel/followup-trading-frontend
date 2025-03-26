
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { 
  Search, 
  MoreHorizontal,
  UserPlus,
  Users,
  ShieldAlert,
  KeyRound,
  Settings,
  BarChart,
  Lock,
  Eye,
  Check,
  X,
  FileText,
  RefreshCw,
  AlertTriangle,
  Trash2,
  Edit
} from 'lucide-react';

// Define interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: string;
  createdAt: string;
  twoFactorEnabled: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
  createdAt: string;
  isSystem: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
  ip: string;
}

// Sample data
const mockUsers: User[] = [
  { 
    id: '1', 
    name: 'John Smith', 
    email: 'john@example.com', 
    role: 'admin',
    status: 'active',
    lastLogin: '2023-06-15 14:30',
    createdAt: '2023-01-10',
    twoFactorEnabled: true
  },
  { 
    id: '2', 
    name: 'Sarah Johnson', 
    email: 'sarah@example.com', 
    role: 'manager',
    status: 'active',
    lastLogin: '2023-06-14 10:15',
    createdAt: '2023-02-22',
    twoFactorEnabled: false
  },
  { 
    id: '3', 
    name: 'Michael Brown', 
    email: 'michael@example.com', 
    role: 'analyst',
    status: 'active',
    lastLogin: '2023-06-13 16:45',
    createdAt: '2023-03-05',
    twoFactorEnabled: true
  },
  { 
    id: '4', 
    name: 'Emily Wilson', 
    email: 'emily@example.com', 
    role: 'trader',
    status: 'inactive',
    lastLogin: '2023-05-28 09:20',
    createdAt: '2023-03-18',
    twoFactorEnabled: false
  },
  { 
    id: '5', 
    name: 'David Miller', 
    email: 'david@example.com', 
    role: 'analyst',
    status: 'suspended',
    lastLogin: '2023-05-22 11:05',
    createdAt: '2023-04-02',
    twoFactorEnabled: false
  },
];

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'admin',
    description: 'Full system access with all permissions',
    userCount: 1,
    permissions: ['users:read', 'users:write', 'roles:read', 'roles:write', 'trades:read', 'trades:write', 'settings:read', 'settings:write'],
    createdAt: '2023-01-01',
    isSystem: true
  },
  {
    id: '2',
    name: 'manager',
    description: 'Can manage trades and users but not system settings',
    userCount: 1,
    permissions: ['users:read', 'users:write', 'trades:read', 'trades:write', 'settings:read'],
    createdAt: '2023-01-01',
    isSystem: true
  },
  {
    id: '3',
    name: 'analyst',
    description: 'Can view and analyze trading data',
    userCount: 2,
    permissions: ['trades:read', 'settings:read'],
    createdAt: '2023-01-01',
    isSystem: true
  },
  {
    id: '4',
    name: 'trader',
    description: 'Can execute trades and view own data',
    userCount: 1,
    permissions: ['trades:read', 'trades:write'],
    createdAt: '2023-01-01',
    isSystem: true
  },
];

const mockPermissions: Permission[] = [
  { id: 'users:read', name: 'Read Users', description: 'View user information', category: 'Users' },
  { id: 'users:write', name: 'Modify Users', description: 'Create, update, and delete users', category: 'Users' },
  { id: 'roles:read', name: 'Read Roles', description: 'View roles and permissions', category: 'Roles' },
  { id: 'roles:write', name: 'Modify Roles', description: 'Create, update, and delete roles', category: 'Roles' },
  { id: 'trades:read', name: 'Read Trades', description: 'View trades and trading data', category: 'Trading' },
  { id: 'trades:write', name: 'Modify Trades', description: 'Create, update, and delete trades', category: 'Trading' },
  { id: 'settings:read', name: 'Read Settings', description: 'View system settings', category: 'Settings' },
  { id: 'settings:write', name: 'Modify Settings', description: 'Update system settings', category: 'Settings' },
];

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    userId: '1',
    userName: 'John Smith',
    action: 'LOGIN',
    resource: 'auth',
    details: 'User logged in successfully',
    timestamp: '2023-06-15 14:30',
    ip: '192.168.1.1'
  },
  {
    id: '2',
    userId: '1',
    userName: 'John Smith',
    action: 'CREATE',
    resource: 'user',
    details: 'Created user Sarah Johnson',
    timestamp: '2023-06-10 11:25',
    ip: '192.168.1.1'
  },
  {
    id: '3',
    userId: '2',
    userName: 'Sarah Johnson',
    action: 'UPDATE',
    resource: 'role',
    details: 'Updated role permissions for Analyst',
    timestamp: '2023-06-12 09:45',
    ip: '192.168.1.2'
  },
  {
    id: '4',
    userId: '3',
    userName: 'Michael Brown',
    action: 'CREATE',
    resource: 'trade',
    details: 'Created new trade #12345',
    timestamp: '2023-06-13 16:30',
    ip: '192.168.1.3'
  },
  {
    id: '5',
    userId: '5',
    userName: 'David Miller',
    action: 'FAILED_LOGIN',
    resource: 'auth',
    details: 'Failed login attempt',
    timestamp: '2023-06-14 10:15',
    ip: '192.168.1.5'
  },
];

// Admin page component
const Administration = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [permissions] = useState<Permission[]>(mockPermissions);
  const [auditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for dialogs
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);
  const [newRoleDialogOpen, setNewRoleDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  
  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    status: 'active',
    twoFactorEnabled: true
  });
  
  // New role form state
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  
  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter roles based on search query
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter audit logs based on search query
  const filteredAuditLogs = auditLogs.filter(log => 
    log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Toggle user status (active/inactive)
  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        return { ...user, status: newStatus };
      }
      return user;
    }));
    
    const user = users.find(u => u.id === userId);
    if (user) {
      toast({
        title: user.status === 'active' ? t('admin.userDeactivated') : t('admin.userActivated'),
        description: `${user.name} ${user.status === 'active' ? t('admin.hasBeenDeactivated') : t('admin.hasBeenActivated')}`,
      });
    }
  };
  
  // Delete user
  const deleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    setUsers(users.filter(user => user.id !== userId));
    
    if (userToDelete) {
      toast({
        title: t('admin.userDeleted'),
        description: `${userToDelete.name} ${t('admin.hasBeenDeleted')}`,
      });
    }
  };
  
  // Delete role
  const deleteRole = (roleId: string) => {
    const roleToDelete = roles.find(r => r.id === roleId);
    setRoles(roles.filter(role => role.id !== roleId));
    
    if (roleToDelete) {
      toast({
        title: t('admin.roleDeleted'),
        description: `${roleToDelete.name} ${t('admin.hasBeenDeleted')}`,
      });
    }
  };
  
  // Create new user
  const handleCreateUser = () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast({
        title: t('admin.missingFields'),
        description: t('admin.pleaseCompleteRequiredFields'),
        variant: 'destructive',
      });
      return;
    }
    
    const newUserId = (users.length + 1).toString();
    const createdUser: User = {
      id: newUserId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status as 'active' | 'inactive' | 'suspended',
      createdAt: new Date().toISOString().split('T')[0],
      twoFactorEnabled: newUser.twoFactorEnabled
    };
    
    setUsers([...users, createdUser]);
    setNewUserDialogOpen(false);
    
    // Reset form
    setNewUser({
      name: '',
      email: '',
      role: '',
      status: 'active',
      twoFactorEnabled: true
    });
    
    toast({
      title: t('admin.userCreated'),
      description: `${createdUser.name} ${t('admin.hasBeenCreated')}`,
    });
  };
  
  // Create new role
  const handleCreateRole = () => {
    if (!newRole.name || !newRole.description) {
      toast({
        title: t('admin.missingFields'),
        description: t('admin.pleaseCompleteRequiredFields'),
        variant: 'destructive',
      });
      return;
    }
    
    const newRoleId = (roles.length + 1).toString();
    const createdRole: Role = {
      id: newRoleId,
      name: newRole.name,
      description: newRole.description,
      userCount: 0,
      permissions: newRole.permissions,
      createdAt: new Date().toISOString().split('T')[0],
      isSystem: false
    };
    
    setRoles([...roles, createdRole]);
    setNewRoleDialogOpen(false);
    
    // Reset form
    setNewRole({
      name: '',
      description: '',
      permissions: []
    });
    
    toast({
      title: t('admin.roleCreated'),
      description: `${createdRole.name} ${t('admin.hasBeenCreated')}`,
    });
  };
  
  // Update user
  const handleUpdateUser = () => {
    if (!selectedUser) return;
    
    setUsers(users.map(user => 
      user.id === selectedUser.id ? selectedUser : user
    ));
    
    setEditUserDialogOpen(false);
    
    toast({
      title: t('admin.userUpdated'),
      description: `${selectedUser.name} ${t('admin.hasBeenUpdated')}`,
    });
  };
  
  // Update role
  const handleUpdateRole = () => {
    if (!selectedRole) return;
    
    setRoles(roles.map(role => 
      role.id === selectedRole.id ? selectedRole : role
    ));
    
    setEditRoleDialogOpen(false);
    
    toast({
      title: t('admin.roleUpdated'),
      description: `${selectedRole.name} ${t('admin.hasBeenUpdated')}`,
    });
  };
  
  // Toggle permission for new role
  const togglePermission = (permissionId: string) => {
    setNewRole(prev => {
      const permissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId];
      
      return { ...prev, permissions };
    });
  };
  
  // Toggle permission for existing role
  const toggleExistingPermission = (permissionId: string) => {
    if (!selectedRole) return;
    
    setSelectedRole(prev => {
      if (!prev) return null;
      
      const permissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId];
      
      return { ...prev, permissions };
    });
  };
  
  return (
    <DashboardLayout pageTitle={t('admin.administration')}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('admin.administration')}</h1>
            <p className="text-muted-foreground">{t('admin.administrationDescription')}</p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>{t('admin.systemManagement')}</CardTitle>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder={t('admin.search')} 
                  className="pl-8 w-full sm:w-[260px]" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="users" className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  {t('admin.users')}
                </TabsTrigger>
                <TabsTrigger value="roles" className="flex items-center">
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  {t('admin.roles')}
                </TabsTrigger>
                <TabsTrigger value="auditLog" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  {t('admin.auditLog')}
                </TabsTrigger>
              </TabsList>
              
              {/* Users Tab */}
              <TabsContent value="users" className="space-y-4">
                <div className="flex justify-end">
                  <Dialog open={newUserDialogOpen} onOpenChange={setNewUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        {t('admin.addUser')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px]">
                      <DialogHeader>
                        <DialogTitle>{t('admin.createNewUser')}</DialogTitle>
                        <DialogDescription>
                          {t('admin.createUserDescription')}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            {t('admin.name')}
                          </Label>
                          <Input
                            id="name"
                            className="col-span-3"
                            value={newUser.name}
                            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="email" className="text-right">
                            {t('admin.email')}
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            className="col-span-3"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="role" className="text-right">
                            {t('admin.role')}
                          </Label>
                          <Select 
                            value={newUser.role} 
                            onValueChange={(value) => setNewUser({...newUser, role: value})}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder={t('admin.selectRole')} />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role.id} value={role.name}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="status" className="text-right">
                            {t('admin.status')}
                          </Label>
                          <Select 
                            value={newUser.status} 
                            onValueChange={(value) => setNewUser({...newUser, status: value})}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder={t('admin.selectStatus')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">{t('admin.active')}</SelectItem>
                              <SelectItem value="inactive">{t('admin.inactive')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">
                            {t('admin.twoFactorAuth')}
                          </Label>
                          <div className="col-span-3 flex items-center space-x-2">
                            <Switch
                              id="2fa"
                              checked={newUser.twoFactorEnabled}
                              onCheckedChange={(checked) => setNewUser({...newUser, twoFactorEnabled: checked})}
                            />
                            <Label htmlFor="2fa">
                              {newUser.twoFactorEnabled ? t('admin.required') : t('admin.optional')}
                            </Label>
                          </div>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNewUserDialogOpen(false)}>
                          {t('common.cancel')}
                        </Button>
                        <Button onClick={handleCreateUser}>
                          {t('admin.createUser')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.name')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.email')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.role')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.status')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.lastLogin')}</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">{t('admin.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="border-b">
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium">{user.name}</div>
                              <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {user.email}
                              {user.twoFactorEnabled && (
                                <Badge variant="outline" className="ml-2">2FA</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge variant="outline">{user.role}</Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge 
                                variant={
                                  user.status === 'active' ? 'default' : 
                                  user.status === 'inactive' ? 'outline' : 
                                  'destructive'
                                }
                              >
                                {user.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {user.lastLogin || t('admin.neverLoggedIn')}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>{t('admin.userActions')}</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setEditUserDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    {t('common.edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => toggleUserStatus(user.id)}>
                                    {user.status === 'active' ? (
                                      <>
                                        <Lock className="mr-2 h-4 w-4" />
                                        {t('admin.deactivate')}
                                      </>
                                    ) : (
                                      <>
                                        <Check className="mr-2 h-4 w-4" />
                                        {t('admin.activate')}
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => deleteUser(user.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {t('common.delete')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            {searchQuery ? t('admin.noUsersFound') : t('admin.noUsers')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
                  <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle>{t('admin.editUser')}</DialogTitle>
                      <DialogDescription>
                        {t('admin.editUserDescription')}
                      </DialogDescription>
                    </DialogHeader>
                    
                    {selectedUser && (
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-name" className="text-right">
                            {t('admin.name')}
                          </Label>
                          <Input
                            id="edit-name"
                            className="col-span-3"
                            value={selectedUser.name}
                            onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-email" className="text-right">
                            {t('admin.email')}
                          </Label>
                          <Input
                            id="edit-email"
                            type="email"
                            className="col-span-3"
                            value={selectedUser.email}
                            onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-role" className="text-right">
                            {t('admin.role')}
                          </Label>
                          <Select 
                            value={selectedUser.role} 
                            onValueChange={(value) => setSelectedUser({...selectedUser, role: value})}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder={t('admin.selectRole')} />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role.id} value={role.name}>
                                  {role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-status" className="text-right">
                            {t('admin.status')}
                          </Label>
                          <Select 
                            value={selectedUser.status} 
                            onValueChange={(value) => setSelectedUser({...selectedUser, status: value as 'active' | 'inactive' | 'suspended'})}
                          >
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder={t('admin.selectStatus')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">{t('admin.active')}</SelectItem>
                              <SelectItem value="inactive">{t('admin.inactive')}</SelectItem>
                              <SelectItem value="suspended">{t('admin.suspended')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">
                            {t('admin.twoFactorAuth')}
                          </Label>
                          <div className="col-span-3 flex items-center space-x-2">
                            <Switch
                              id="edit-2fa"
                              checked={selectedUser.twoFactorEnabled}
                              onCheckedChange={(checked) => setSelectedUser({...selectedUser, twoFactorEnabled: checked})}
                            />
                            <Label htmlFor="edit-2fa">
                              {selectedUser.twoFactorEnabled ? t('admin.required') : t('admin.optional')}
                            </Label>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditUserDialogOpen(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button onClick={handleUpdateUser}>
                        {t('admin.saveChanges')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>
              
              {/* Roles Tab */}
              <TabsContent value="roles" className="space-y-4">
                <div className="flex justify-end">
                  <Dialog open={newRoleDialogOpen} onOpenChange={setNewRoleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        {t('admin.addRole')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px]">
                      <DialogHeader>
                        <DialogTitle>{t('admin.createNewRole')}</DialogTitle>
                        <DialogDescription>
                          {t('admin.createRoleDescription')}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="role-name" className="text-right">
                            {t('admin.name')}
                          </Label>
                          <Input
                            id="role-name"
                            className="col-span-3"
                            value={newRole.name}
                            onChange={(e) => setNewRole({...newRole, name: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="role-description" className="text-right">
                            {t('admin.description')}
                          </Label>
                          <Input
                            id="role-description"
                            className="col-span-3"
                            value={newRole.description}
                            onChange={(e) => setNewRole({...newRole, description: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label className="text-right pt-2">
                            {t('admin.permissions')}
                          </Label>
                          <div className="col-span-3 space-y-4">
                            {['Users', 'Roles', 'Trading', 'Settings'].map((category) => (
                              <div key={category} className="space-y-2">
                                <h4 className="text-sm font-medium">{category}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {permissions
                                    .filter(permission => permission.category === category)
                                    .map((permission) => (
                                      <div key={permission.id} className="flex items-start space-x-2">
                                        <Checkbox
                                          id={`perm-${permission.id}`}
                                          checked={newRole.permissions.includes(permission.id)}
                                          onCheckedChange={() => togglePermission(permission.id)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                          <Label
                                            htmlFor={`perm-${permission.id}`}
                                            className="font-medium"
                                          >
                                            {permission.name}
                                          </Label>
                                          <p className="text-xs text-muted-foreground">
                                            {permission.description}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setNewRoleDialogOpen(false)}>
                          {t('common.cancel')}
                        </Button>
                        <Button onClick={handleCreateRole}>
                          {t('admin.createRole')}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.roleName')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.description')}</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">{t('admin.userCount')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.created')}</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">{t('admin.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRoles.length > 0 ? (
                        filteredRoles.map((role) => (
                          <tr key={role.id} className="border-b">
                            <td className="px-4 py-3 text-sm">
                              <div className="font-medium">{role.name}</div>
                              {role.isSystem && (
                                <Badge variant="outline" className="mt-1">{t('admin.systemRole')}</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {role.description}
                            </td>
                            <td className="px-4 py-3 text-sm text-center">
                              {role.userCount}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {role.createdAt}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>{t('admin.roleActions')}</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedRole(role);
                                      setEditRoleDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    {t('common.edit')}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      // View users with this role
                                      toast({
                                        title: t('admin.viewUsers'),
                                        description: t('admin.viewUsersByRoleFeatureComingSoon'),
                                      });
                                    }}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    {t('admin.viewUsers')}
                                  </DropdownMenuItem>
                                  {!role.isSystem && (
                                    <DropdownMenuItem onClick={() => deleteRole(role.id)}>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      {t('common.delete')}
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            {searchQuery ? t('admin.noRolesFound') : t('admin.noRoles')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <Dialog open={editRoleDialogOpen} onOpenChange={setEditRoleDialogOpen}>
                  <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle>{t('admin.editRole')}</DialogTitle>
                      <DialogDescription>
                        {t('admin.editRoleDescription')}
                      </DialogDescription>
                    </DialogHeader>
                    
                    {selectedRole && (
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-role-name" className="text-right">
                            {t('admin.name')}
                          </Label>
                          <Input
                            id="edit-role-name"
                            className="col-span-3"
                            value={selectedRole.name}
                            onChange={(e) => setSelectedRole({...selectedRole, name: e.target.value})}
                            disabled={selectedRole.isSystem}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="edit-role-description" className="text-right">
                            {t('admin.description')}
                          </Label>
                          <Input
                            id="edit-role-description"
                            className="col-span-3"
                            value={selectedRole.description}
                            onChange={(e) => setSelectedRole({...selectedRole, description: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                          <Label className="text-right pt-2">
                            {t('admin.permissions')}
                          </Label>
                          <div className="col-span-3 space-y-4">
                            {['Users', 'Roles', 'Trading', 'Settings'].map((category) => (
                              <div key={category} className="space-y-2">
                                <h4 className="text-sm font-medium">{category}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {permissions
                                    .filter(permission => permission.category === category)
                                    .map((permission) => (
                                      <div key={permission.id} className="flex items-start space-x-2">
                                        <Checkbox
                                          id={`edit-perm-${permission.id}`}
                                          checked={selectedRole.permissions.includes(permission.id)}
                                          onCheckedChange={() => toggleExistingPermission(permission.id)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                          <Label
                                            htmlFor={`edit-perm-${permission.id}`}
                                            className="font-medium"
                                          >
                                            {permission.name}
                                          </Label>
                                          <p className="text-xs text-muted-foreground">
                                            {permission.description}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditRoleDialogOpen(false)}>
                        {t('common.cancel')}
                      </Button>
                      <Button onClick={handleUpdateRole}>
                        {t('admin.saveChanges')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </TabsContent>
              
              {/* Audit Log Tab */}
              <TabsContent value="auditLog" className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => {
                    // Refresh audit log
                    toast({
                      title: t('admin.auditLogRefreshed'),
                      description: t('admin.auditLogRefreshedDescription'),
                    });
                  }}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('admin.refresh')}
                  </Button>
                </div>
                
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.timestamp')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.user')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.action')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.resource')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.details')}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">{t('admin.ip')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditLogs.length > 0 ? (
                        filteredAuditLogs.map((log) => (
                          <tr key={log.id} className="border-b">
                            <td className="px-4 py-3 text-sm">
                              {log.timestamp}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {log.userName}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <Badge 
                                variant={
                                  log.action === 'LOGIN' ? 'default' : 
                                  log.action === 'CREATE' ? 'outline' : 
                                  log.action === 'UPDATE' ? 'secondary' : 
                                  log.action === 'DELETE' ? 'destructive' : 
                                  log.action === 'FAILED_LOGIN' ? 'destructive' : 
                                  'outline'
                                }
                              >
                                {log.action}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {log.resource}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {log.details}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {log.ip}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            {searchQuery ? t('admin.noLogsFound') : t('admin.noLogs')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Administration;
