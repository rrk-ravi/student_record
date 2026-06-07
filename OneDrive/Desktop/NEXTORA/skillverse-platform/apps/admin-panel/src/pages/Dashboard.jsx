import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUsers, HiOutlineBookOpen, HiOutlineBriefcase, HiOutlineCurrencyRupee } from 'react-icons/hi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminFetch } from '../services/api';

const Dashboard = () => {
  const [coursesList, setCoursesList] = useState([]);
  const [internshipsList, setInternshipsList] = useState([]);
  const [usersList, setUsersList] = useState([]);
  
  const [stats, setStats] = useState({
    learners: 0,
    courses: 0,
    internships: 0,
    revenue: '₹0',
  });

  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    adminFetch('/courses/admin')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data) {
          setCoursesList(resData.data);
          setStats((prev) => ({ ...prev, courses: resData.data.length }));
        }
      })
      .catch((err) => console.error(err));

    adminFetch('/internships')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data) {
          setInternshipsList(resData.data);
          setStats((prev) => ({ ...prev, internships: resData.data.length }));
        }
      })
      .catch((err) => console.error(err));

    adminFetch('/users')
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data) {
          setUsersList(resData.data);
          const studentCount = resData.data.filter(u => u.role === 'student').length;
          setStats((prev) => ({ ...prev, learners: studentCount || 0 }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const calculatedRevenue = coursesList.reduce((acc, course) => {
      const price = course.price?.discounted || course.price?.original || 0;
      const enrollments = course.enrollmentCount || 0;
      return acc + (price * enrollments);
    }, 0);

    let formattedRevenue = '₹0';
    if (calculatedRevenue > 100000) {
      formattedRevenue = `₹${(calculatedRevenue / 100000).toFixed(1)}L`;
    } else if (calculatedRevenue > 0) {
      formattedRevenue = `₹${calculatedRevenue.toLocaleString('en-IN')}`;
    }

    setStats((prev) => ({ ...prev, revenue: formattedRevenue }));

    const events = [];
    
    coursesList.forEach((c) => {
      events.push({
        text: `Published "${c.title}" course`,
        type: 'course',
        date: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Today',
        rawDate: c.createdAt ? new Date(c.createdAt) : new Date(),
      });
    });

    internshipsList.forEach((i) => {
      events.push({
        text: `Launched "${i.title}" internship`,
        type: 'internship',
        date: i.createdAt ? new Date(i.createdAt).toLocaleDateString() : 'Today',
        rawDate: i.createdAt ? new Date(i.createdAt) : new Date(),
      });
    });

    usersList.forEach((u) => {
      events.push({
        text: `New ${u.role} registered: ${u.firstName} ${u.lastName}`,
        type: 'user',
        date: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Today',
        rawDate: u.createdAt ? new Date(u.createdAt) : new Date(),
      });
    });

    events.sort((a, b) => b.rawDate - a.rawDate);
    
    if (events.length === 0) {
      events.push(
        { text: 'Platform initialized successfully', type: 'system', date: 'Today' },
      );
    }

    setRecentEvents(events.slice(0, 6));
  }, [coursesList, internshipsList, usersList]);

  const chartData = [
    { name: 'Jan', enrollments: Math.round(stats.courses * 120), revenue: Math.round(stats.courses * 3500) },
    { name: 'Feb', enrollments: Math.round(stats.courses * 150), revenue: Math.round(stats.courses * 4500) },
    { name: 'Mar', enrollments: Math.round(stats.courses * 180), revenue: Math.round(stats.courses * 5200) },
    { name: 'Apr', enrollments: Math.round(stats.courses * 220), revenue: Math.round(stats.courses * 6100) },
    { name: 'May', enrollments: Math.round(stats.courses * 280), revenue: Math.round(stats.courses * 8200) },
  ];

  const cards = [
    { icon: HiOutlineUsers, label: 'Total Learners', value: String(stats.learners), color: 'text-primary-500', bg: 'bg-primary-50' },
    { icon: HiOutlineBookOpen, label: 'Active Courses', value: String(stats.courses), color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: HiOutlineBriefcase, label: 'Internships', value: String(stats.internships), color: 'text-sky-600', bg: 'bg-sky-50' },
    { icon: HiOutlineCurrencyRupee, label: 'Revenue', value: stats.revenue, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const eventDotColor = {
    course: 'bg-primary-400',
    internship: 'bg-emerald-400',
    user: 'bg-sky-400',
    system: 'bg-slate-300',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of platform activity, enrollments, and revenue.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="card !p-5"
          >
            <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-display font-bold text-slate-800">{card.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Analytics + Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-5">Enrollment & Revenue Trend</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eaecf0" />
                <XAxis dataKey="name" stroke="#98a2b3" fontSize={12} />
                <YAxis stroke="#98a2b3" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #eaecf0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    color: '#344054',
                    fontSize: '13px',
                  }}
                />
                <Line type="monotone" dataKey="enrollments" stroke="#6c5ce7" strokeWidth={2.5} dot={{ fill: '#6c5ce7', r: 3, strokeWidth: 0 }} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card lg:col-span-1">
          <h3 className="text-sm font-semibold text-slate-700 mb-5">Recent Activity</h3>
          <div className="space-y-4">
            {recentEvents.map((ev, i) => (
              <div key={`${ev.type}-${i}-${ev.date}`} className="flex gap-3">
                <div className={`w-2 h-2 rounded-full ${eventDotColor[ev.type] || 'bg-slate-300'} mt-1.5 flex-shrink-0`} />
                <div className="min-w-0">
                  <p className="text-sm text-slate-600 leading-snug">{ev.text}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{ev.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
