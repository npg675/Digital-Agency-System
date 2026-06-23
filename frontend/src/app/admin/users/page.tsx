"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCrossTabSync, useSyncStore } from "@/store/useSyncStore";
import { Plus, Search, Trash2, Edit2, UserCircle, MessageCircle, Phone, Check, X, UserCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CLIENT");
  const [managerId, setManagerId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [canManageUsers, setCanManageUsers] = useState(false);
  
  const [creationMode, setCreationMode] = useState<'FULL' | 'CONTACT_ONLY'>('FULL');
  
  const { token, user: currentUser } = useAuthStore();
  const syncVersion = useSyncStore(s => s.version);
  const { broadcastSync } = useCrossTabSync();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    if (currentUser?.role !== 'ADMIN') return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/handover-requests/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPendingRequests(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUsers();
      fetchPendingRequests();
    }
  }, [token, currentUser, syncVersion]);

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setEditingUserId(null);
    setEmail("");
    setPassword("");
    setRole("CLIENT");
    setManagerId("");
    setFirstName("");
    setLastName("");
    setCompanyName("");
    setPhoneNumber("");
    setAddress("");
    setCanManageUsers(false);
    setCreationMode('FULL');
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (user: any) => {
    setIsEditMode(true);
    setEditingUserId(user.id);
    setEmail(user.email);
    setPassword(""); // Keep blank to not change
    setRole(user.role);
    setManagerId(user.manager_id || "");
    setFirstName(user.first_name || "");
    setLastName(user.last_name || "");
    setCompanyName(user.company_name || "");
    setPhoneNumber(user.phone_number || "");
    setAddress(user.address || "");
    setCanManageUsers(user.can_manage_users || false);
    setCreationMode(!user.email ? 'CONTACT_ONLY' : 'FULL');
    setIsDialogOpen(true);
  };

  const handleSubmitUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser?.role === 'STAFF' && currentUser?.can_manage_users !== true) {
      alert("You do not have permission to manage users");
      return;
    }
    try {
      const url = isEditMode 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/${editingUserId}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users`;
        
      let finalEmail = email || undefined;
      let finalPassword = password || undefined;

      const payload: any = { 
        email: finalEmail, 
        role,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        company_name: role === 'CLIENT' ? (companyName || undefined) : undefined,
        phone_number: phoneNumber || undefined,
        address: address || undefined,
        can_manage_users: canManageUsers
      };
      
      if (finalPassword) payload.password = finalPassword;
      if (managerId) payload.manager_id = managerId;
      
      const res = await fetch(url, {
        method: isEditMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsDialogOpen(false);
        fetchUsers();
        broadcastSync();
      } else {
        const data = await res.json();
        alert(data.detail || `Failed to ${isEditMode ? 'update' : 'create'} user`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchUsers();
        broadcastSync();
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to delete user");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateManager = async (userId: string, newManagerId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ manager_id: newManagerId || null })
      });
      if (res.ok) {
        fetchUsers();
        broadcastSync();
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to update manager");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setActionLoading(`approve-${requestId}`);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/handover-requests/${requestId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchUsers();
        fetchPendingRequests();
        broadcastSync();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to approve request");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt("Optional rejection reason:");
    if (reason === null) return; // Cancelled
    setActionLoading(`reject-${requestId}`);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/users/handover-requests/${requestId}/reject?admin_note=${encodeURIComponent(reason)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPendingRequests();
        broadcastSync();
      } else {
        const err = await res.json();
        alert(err.detail || "Failed to reject request");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const staffUsers = users.filter(u => u.role === 'STAFF');

  if (!mounted) return null;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Users Management
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage your agency staff and client accounts
          </p>
        </div>
        
        {currentUser && (currentUser.role === 'ADMIN' || currentUser.can_manage_users === true) && (
          <Dialog 
            open={isDialogOpen} 
            onOpenChange={(open, eventDetails) => {
              if (eventDetails.reason === 'outside-press' || eventDetails.reason === 'escape-key') {
                eventDetails.cancel();
                return;
              }
              setIsDialogOpen(open);
            }}
          >
            <DialogTrigger render={<Button onClick={handleOpenCreate} />}>
              <Plus className="w-4 h-4 mr-2" />
              New User
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Edit User" : "Create New User"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitUser} className="space-y-4 pt-4">
                
                <div className="flex gap-2 mb-4 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
                    <button 
                      type="button" 
                      onClick={() => setCreationMode('FULL')}
                      className={`flex-1 text-xs py-2 rounded-md transition-colors font-medium ${creationMode === 'FULL' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'}`}
                    >
                      Full Account (Login Access)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        setCreationMode('CONTACT_ONLY');
                        setRole('CLIENT');
                      }}
                      className={`flex-1 text-xs py-2 rounded-md transition-colors font-medium ${creationMode === 'CONTACT_ONLY' ? 'bg-indigo-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'}`}
                    >
                      Contact Only (No Login)
                    </button>
                  </div>
                {creationMode === 'FULL' && (
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="role">Role</Label>
                    <select 
                      id="role"
                      className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="CLIENT">CLIENT (View-only for assigned pages)</option>
                      {currentUser?.role === 'ADMIN' && (
                        <option value="STAFF">STAFF (Manage pages & templates)</option>
                      )}
                      {currentUser?.role === 'ADMIN' && (
                        <option value="ADMIN">ADMIN (Full access)</option>
                      )}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {role === 'CLIENT' && (
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company</Label>
                      <Input 
                        id="companyName" 
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </div>
                  )}
                  <div className={`space-y-2 ${role !== 'CLIENT' ? 'col-span-2' : ''}`}>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input 
                      id="phoneNumber" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 123 Business Rd, City, Country"
                  />
                </div>

                {creationMode === 'FULL' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">{isEditMode ? "New Password (Optional)" : "Temporary Password *"}</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        required={!isEditMode} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {creationMode === 'CONTACT_ONLY' && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Leave blank if unknown"
                    />
                  </div>
                )}



                {role === 'CLIENT' && currentUser?.role === 'ADMIN' && (
                  <div className="space-y-2">
                    <Label htmlFor="manager">Account Manager (Staff)</Label>
                    <select 
                      id="manager"
                      className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                      value={managerId}
                      onChange={(e) => setManagerId(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {staffUsers.map(staff => (
                        <option key={staff.id} value={staff.id}>{staff.email}</option>
                      ))}
                    </select>
                  </div>
                )}
                {role === 'STAFF' && currentUser?.role === 'ADMIN' && (
                  <div className="flex items-center space-x-2 pt-2 pb-2">
                    <input 
                      type="checkbox" 
                      id="canManageUsers" 
                      className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
                      checked={canManageUsers}
                      onChange={(e) => setCanManageUsers(e.target.checked)}
                    />
                    <Label htmlFor="canManageUsers">Can Manage Clients? (Allow this staff to create/edit clients)</Label>
                  </div>
                )}
                <Button type="submit" className="w-full">{isEditMode ? "Save Changes" : "Create User"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          <Input
            type="search"
            placeholder="Search users by name, email, or company..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <select 
            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-800 dark:bg-zinc-950"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">All Roles</option>
            {currentUser?.role === 'ADMIN' && <option value="ADMIN">Admin</option>}
            {currentUser?.role === 'ADMIN' && <option value="STAFF">Staff</option>}
            <option value="CLIENT">Clients</option>
          </select>
        </div>
      </div>

      {currentUser?.role === 'ADMIN' && pendingRequests.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            <h3 className="font-semibold text-amber-900 dark:text-amber-500">Pending Handover Requests</h3>
            <span className="bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200 text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingRequests.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendingRequests.map(req => (
              <div key={req.id} className="bg-white dark:bg-zinc-900 border border-amber-100 dark:border-zinc-800 rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">
                    <span className="font-semibold">{req.requested_by_name}</span> wants to hand over <span className="font-semibold">{req.client_name}</span> to <span className="font-semibold">{req.new_manager_name}</span>.
                  </p>
                  {req.reason && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 italic">
                      " {req.reason} "
                    </p>
                  )}
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 sm:flex-none border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/50 dark:text-green-400 dark:hover:bg-green-900/20"
                    onClick={() => handleApproveRequest(req.id)}
                    disabled={actionLoading === `approve-${req.id}`}
                  >
                    {actionLoading === `approve-${req.id}` ? "..." : <><Check className="w-4 h-4 mr-1.5" /> Approve</>}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                    onClick={() => handleRejectRequest(req.id)}
                    disabled={actionLoading === `reject-${req.id}`}
                  >
                    {actionLoading === `reject-${req.id}` ? "..." : <><X className="w-4 h-4 mr-1.5" /> Reject</>}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : (() => {
              const filteredUsers = users.filter(u => {
                const query = searchQuery.toLowerCase();
                const matchesSearch = 
                  (u.first_name || "").toLowerCase().includes(query) || 
                  (u.last_name || "").toLowerCase().includes(query) || 
                  (u.email || "").toLowerCase().includes(query) ||
                  (u.company_name || "").toLowerCase().includes(query);
                const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
                return matchesSearch && matchesRole;
              });

              if (filteredUsers.length === 0) {
                return (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                      No users found.
                    </TableCell>
                  </TableRow>
                );
              }

              return filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : 'No Name'}</div>
                  </TableCell>
                  <TableCell>
                    {!u.email ? (
                      <span className="text-sm text-zinc-400 italic">No Email (Guest)</span>
                    ) : u.email.endsWith('@system.example.com') ? (
                      <span className="text-sm text-zinc-400 italic">No Login Account</span>
                    ) : (
                      <a href={`mailto:${u.email}`} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">{u.email}</a>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                    {u.phone_number ? (
                      <div className="flex items-center gap-2">
                        <a 
                          href={`tel:${u.phone_number}`} 
                          className="hover:underline flex items-center gap-1"
                          title="Call"
                        >
                          <Phone className="h-3.5 w-3.5 text-zinc-400" />
                          {u.phone_number}
                        </a>
                        <a 
                          href={`https://wa.me/${u.phone_number.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          title="Open in WhatsApp"
                          className="inline-flex items-center justify-center rounded-full p-1 bg-green-100 hover:bg-green-200 text-green-700 transition-colors dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-600 dark:text-zinc-400">
                    {u.company_name || '—'}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {u.role === 'CLIENT' ? (
                      currentUser?.role === 'ADMIN' ? (
                        <select
                          className="flex h-8 w-[200px] rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950"
                          value={u.manager_id || ""}
                          onChange={(e) => handleUpdateManager(u.id, e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {staffUsers.map(staff => (
                            <option key={staff.id} value={staff.id}>{staff.email}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-zinc-500">
                          {u.manager_id ? users.find(x => x.id === u.manager_id)?.email : 'Unassigned'}
                        </span>
                      )
                    ) : (
                      <span className="text-zinc-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/users/${u.id}`}>
                        <Button variant="ghost" size="icon" className="text-indigo-600 hover:text-indigo-700" title="View Profile & Notes">
                          <UserCircle className="h-4 w-4" />
                        </Button>
                      </Link>
                      {currentUser && (currentUser.role === 'ADMIN' || currentUser.can_manage_users === true) && (
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(u)} className="text-zinc-500 hover:text-zinc-900">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {currentUser?.role === 'ADMIN' && currentUser.id !== u.id && (
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ));
            })()}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
