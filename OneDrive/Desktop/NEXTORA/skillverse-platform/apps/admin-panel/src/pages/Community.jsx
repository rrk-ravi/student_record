import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineUserGroup, HiOutlinePlus, HiOutlineTrash, HiOutlineX } from 'react-icons/hi';
import * as Icons from 'react-icons/hi';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import { adminFetch } from '../services/api';

const getIcon = (name) => {
  const IconComponent = Icons[name];
  return IconComponent || Icons.HiOutlineChatAlt;
};

const Community = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    title: '',
    description: '',
    iconName: 'HiOutlineChatAlt',
    colorGradient: 'from-primary-500/20 to-primary-400/10',
  });
  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminFetch('/community/rooms');
      const resData = await res.json();
      if (resData.success && resData.data && resData.data.rooms) {
        setRooms(resData.data.rooms);
      } else {
        setError(resData.message || 'Failed to fetch rooms');
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleToggleActive = async (room) => {
    // optimistic UI
    setRooms((prev) => prev.map((r) => (r._id === room._id ? { ...r, isActive: !r.isActive } : r)));
    try {
      await adminFetch(`/community/rooms/${room._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !room.isActive }),
      });
    } catch (err) {
      console.error('Error toggling room active:', err);
      // rollback
      setRooms((prev) => prev.map((r) => (r._id === room._id ? { ...r, isActive: room.isActive } : r)));
    }
    // refresh list to sync with server
    fetchRooms();
  };

  const handleDelete = async (id) => {
    // optimistic remove
    setRooms((prev) => prev.filter((r) => r._id !== id));
    try {
      await adminFetch(`/community/rooms/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting room:', err);
      // refetch if delete failed
      fetchRooms();
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    try {
      const res = await adminFetch('/community/rooms', {
        method: 'POST',
        body: JSON.stringify(newRoom),
      });
      const resData = await res.json();
      if (resData.success) {
        fetchRooms();
        setIsModalOpen(false);
        setNewRoom({ title: '', description: '', iconName: 'HiOutlineChatAlt', colorGradient: 'from-primary-500/20 to-primary-400/10' });
      } else {
        console.error('Create room failed', resData.message);
        setError(resData.message || 'Failed to create room');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to create room');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Community Spaces Architect</h1>
          <p className="text-dark-300 mt-1">Publish new interactive chatrooms, manage details, and track active members.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={<HiOutlinePlus className="w-5 h-5" />}>
          Create Room
        </Button>
      </div>

      {/* Grid */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">{error}</div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room, i) => {
          const IconComponent = getIcon(room.iconName);
          return (
            <motion.div
              key={room._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card flex flex-col justify-between h-full group"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${room.colorGradient || 'from-primary-500/20 to-primary-400/10'} flex items-center justify-center`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <span className={`badge ${room.isActive ? 'badge-success' : 'bg-dark-600 text-dark-300'} uppercase text-[9px]`}>
                    {room.isActive ? 'Active' : 'Archived'}
                  </span>
                </div>
                <h3 className="text-lg font-display font-bold text-white group-hover:text-primary-300 transition-colors capitalize">
                  {room.title}
                </h3>
                <p className="text-sm text-dark-300 mt-2 leading-relaxed">{room.description}</p>
                <p className="text-xs text-dark-300 mt-4 font-semibold">👥 {room.memberCount || 0} Members Active</p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <Button
                  variant="ghost"
                  className="!py-1.5 px-3 text-xs border border-white/5 hover:border-white/10 text-white"
                  onClick={() => handleToggleActive(room)}
                >
                  {room.isActive ? 'Archive' : 'Activate'}
                </Button>
                <Button
                  variant="ghost"
                  className="!py-1.5 px-3 text-xs border border-white/5 hover:border-accent-coral/20 text-accent-coral"
                  onClick={() => handleDelete(room._id)}
                  icon={<HiOutlineTrash className="w-3.5 h-3.5" />}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-dark-900 border border-white/5 rounded-3xl p-6 relative shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-display font-bold text-white">Create Community Space</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-dark-300 hover:text-white transition-colors">
                  <HiOutlineX className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-5">
                <Input
                  label="Room Title"
                  placeholder="e.g. Mobile Development Hub"
                  value={newRoom.title}
                  onChange={(e) => setNewRoom({ ...newRoom, title: e.target.value })}
                  required
                />

                <div className="space-y-2">
                  <label htmlFor="room-description" className="block text-sm font-medium text-dark-100">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide a detailed description of what the chatroom covers..."
                    value={newRoom.description}
                    id="room-description"
                    onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    className="input-field w-full rounded-2xl p-4 text-sm bg-dark-800 text-white border-0 focus:ring-2 focus:ring-primary-500 resize-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="room-icon" className="block text-sm font-medium text-dark-100">Icon Type</label>
                    <select
                      id="room-icon"
                      value={newRoom.iconName}
                      onChange={(e) => setNewRoom({ ...newRoom, iconName: e.target.value })}
                      className="input-field w-full rounded-2xl p-4 text-sm bg-dark-800 text-white border-0 focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="HiOutlineChatAlt">💬 Chat bubble</option>
                      <option value="HiOutlineGlobe">🌐 Globe</option>
                      <option value="HiOutlineBookOpen">📖 Book</option>
                      <option value="HiOutlineSparkles">✨ Sparkles</option>
                      <option value="HiOutlineUserGroup">👥 Users</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="room-gradient" className="block text-sm font-medium text-dark-100">Gradient Theme</label>
                    <select
                      id="room-gradient"
                      value={newRoom.colorGradient}
                      onChange={(e) => setNewRoom({ ...newRoom, colorGradient: e.target.value })}
                      className="input-field w-full rounded-2xl p-4 text-sm bg-dark-800 text-white border-0 focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="from-primary-500/20 to-primary-400/10">Purple/Indigo</option>
                      <option value="from-secondary-500/20 to-secondary-400/10">Mint/Emerald</option>
                      <option value="from-accent-sky/20 to-accent-sky/10">Sky/Blue</option>
                      <option value="from-accent-peach/20 to-accent-coral/10">Orange/Peach</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn-secondary !py-2 px-4 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary !py-2 px-6 text-sm"
                  >
                    Publish Space
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Community;
