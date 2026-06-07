import { useState, useEffect } from 'react';
// motion not used here
import { HiOutlineSearch, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineUserRemove } from 'react-icons/hi';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { adminFetch } from '../services/api';

const Students = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await adminFetch('/users');
        const resData = await res.json();
        if (resData.success && resData.data) {
          setUsers(resData.data);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  const handleToggleActive = (id) => {
    // optimistic update + backend
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isActive: !u.isActive } : u)));
    adminFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify({ isActive: !users.find(u => u._id === id)?.isActive }) })
      .catch((err) => console.error('Error toggling user active:', err));
  };

  const handleVerifyEmail = (id) => {
    setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, isEmailVerified: true } : u)));
    adminFetch(`/users/${id}`, { method: 'PUT', body: JSON.stringify({ isEmailVerified: true }) })
      .catch((err) => console.error('Error verifying email:', err));
  };

  const filteredUsers = users.filter((u) => {
    const nameMatch = `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const roleMatch = selectedRole === 'All' || u.role === selectedRole.toLowerCase();
    return nameMatch && roleMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-800">Students & Mentors</h1>
        <p className="text-slate-400 text-sm mt-1">Manage accounts, verify emails, and control access.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:max-w-sm">
          <Input
            icon={HiOutlineSearch}
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 bg-slate-75 p-1 rounded-lg">
          {['All', 'Student', 'Mentor'].map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedRole === role
                  ? 'bg-white text-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Name</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Email</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Role</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Verification</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredUsers.map((user) => (
              <tr key={user._id} className="hover:bg-slate-25 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-700 capitalize">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-6 py-4 text-slate-500">{user.email}</td>
                <td className="px-6 py-4">
                  {(() => {
                    let roleClass = '';
                    if (user.role === 'mentor') roleClass = 'badge-success';
                    else if (user.role === 'admin') roleClass = 'badge-warning';
                    return (
                      <span className={`badge ${roleClass} text-[11px] capitalize`}>
                        {user.role}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-6 py-4">
                  {user.isEmailVerified ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <HiOutlineCheckCircle className="w-4 h-4" /> Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                      <HiOutlineXCircle className="w-4 h-4" /> Pending
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {user.isActive ? (
                    <span className="badge badge-success text-[11px]">Active</span>
                  ) : (
                    <span className="badge bg-slate-100 text-slate-400 text-[11px]">Inactive</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {!user.isEmailVerified && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary-500 hover:bg-primary-50"
                      onClick={() => handleVerifyEmail(user._id)}
                    >
                      Verify
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-xs ${user.isActive ? 'text-red-500 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                    onClick={() => handleToggleActive(user._id)}
                    icon={<HiOutlineUserRemove className="w-3.5 h-3.5" />}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;
