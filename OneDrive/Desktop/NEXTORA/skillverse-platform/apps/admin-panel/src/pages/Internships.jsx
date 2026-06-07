import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBriefcase, HiOutlinePlus, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { adminFetch } from '../services/api';

const Internships = () => {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInternship, setNewInternship] = useState({
    title: '',
    domain: 'Web Development',
    weeks: '',
    tasks: '',
    originalPrice: '',
  });

  const fetchInternships = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFetch('/internships');
      const resData = await res.json();
      if (resData.success && resData.data) {
        setInternships(resData.data);
      } else {
        setError(resData.message || 'Failed to fetch programs');
      }
    } catch (err) {
      console.error('Error fetching internships:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  const handleToggleStatus = async (id) => {
    const intern = internships.find((it) => it._id === id);
    if (!intern) return;
    const newStatus = intern.status === 'open' ? 'draft' : 'open';
    try {
      const res = await adminFetch(`/internships/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setInternships(internships.map((it) => (it._id === id ? resData.data : it)));
      } else {
        // fallback local update
        setInternships(internships.map((it) => (it._id === id ? { ...it, status: newStatus } : it)));
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      setInternships(internships.map((it) => (it._id === id ? { ...it, status: newStatus } : it)));
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminFetch(`/internships/${id}`, { method: 'DELETE' });
      // remove locally to keep UI responsive
      setInternships(internships.filter((intern) => intern._id !== id));
    } catch (err) {
      console.error('Error deleting internship:', err);
      setInternships(internships.filter((intern) => intern._id !== id));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const createdPayload = {
      title: newInternship.title,
      domain: newInternship.domain,
      description: `Structured Virtual Internship covering ${newInternship.title} domain operations. Expert guided milestones.`,
      duration: { weeks: Number(newInternship.weeks), hoursPerWeek: 10 },
      price: { original: Number(newInternship.originalPrice), discounted: Number(newInternship.originalPrice) },
      totalTasks: Number(newInternship.tasks) || 0,
    };

    try {
      const res = await adminFetch('/internships', {
        method: 'POST',
        body: JSON.stringify(createdPayload),
      });
      const resData = await res.json();
      if (resData.success && resData.data) {
        setInternships([...internships, resData.data]);
      } else {
        setError(resData.message || 'Failed to create program');
      }
    } catch (err) {
      console.error('Error creating internship:', err);
      setError('Failed to create program');
    }

    setIsModalOpen(false);
    setNewInternship({ title: '', domain: 'Web Development', weeks: '', tasks: '', originalPrice: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Programs</h1>
          <p className="text-slate-400 text-sm mt-1">Manage professional programs, tasks, and pricing.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<HiOutlinePlus className="w-4 h-4" />}>
          Add Program
        </Button>
      </div>

      {/* Grid */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {internships.map((intern, i) => (
          <motion.div
            key={intern._id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="card flex flex-col justify-between h-full"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                  <HiOutlineBriefcase className="w-5 h-5 text-sky-600" />
                </div>
                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                  intern.status === 'open'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {intern.status === 'open' ? 'Open' : 'Draft'}
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-800 capitalize leading-snug">
                {intern.title}
              </h3>
              <div className="flex items-center gap-2 mt-2.5">
                <span className="badge text-[11px]">{intern.domain}</span>
                <span className="badge bg-sky-50 text-sky-600 text-[11px]">{intern.duration.weeks} weeks</span>
              </div>
              <p className="text-xs text-slate-400 mt-3 font-medium">
                {intern.totalTasks} tasks included
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-700">₹{intern.price.discounted || intern.price.original}</span>
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleToggleStatus(intern._id)}
                >
                  {intern.status === 'open' ? 'Close' : 'Open'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-red-500 hover:bg-red-50"
                  onClick={() => handleDelete(intern._id)}
                  icon={<HiOutlineTrash className="w-3.5 h-3.5" />}
                />
              </div>
            </div>
          </motion.div>
        ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && internships.length === 0 && (
        <div className="text-center py-16">
          <HiOutlineBriefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No programs yet. Click "Add Program" to create one.</p>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-display font-bold text-slate-800">New Program</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <Input
                  label="Program Title"
                  placeholder="e.g. Flutter Mobile Engineering Program"
                  value={newInternship.title}
                  onChange={(e) => setNewInternship({ ...newInternship, title: e.target.value })}
                  required
                />

                <div className="space-y-1.5">
                  <label htmlFor="program-domain" className="block text-sm font-medium text-slate-600">Domain</label>
                    <select
                      id="program-domain"
                      value={newInternship.domain}
                      onChange={(e) => setNewInternship({ ...newInternship, domain: e.target.value })}
                      className="input-field"
                    >
                    {['Web Development', 'Data Science', 'Cloud Computing', 'UI/UX Design', 'Mobile Development'].map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Duration (Weeks)"
                    type="number"
                    placeholder="8"
                    value={newInternship.weeks}
                    onChange={(e) => setNewInternship({ ...newInternship, weeks: e.target.value })}
                    required
                  />
                  <Input
                    label="Task Count"
                    type="number"
                    placeholder="10"
                    value={newInternship.tasks}
                    onChange={(e) => setNewInternship({ ...newInternship, tasks: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Program Fee (₹)"
                  type="number"
                  placeholder="999"
                  value={newInternship.originalPrice}
                  onChange={(e) => setNewInternship({ ...newInternship, originalPrice: e.target.value })}
                  required
                />

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Program
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Internships;
