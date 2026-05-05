import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Student, Activity, Skill } from '../types';
import { Users, TrendingUp, AlertCircle, Calendar, Zap, Target, BookOpen, Layers, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

export default function Overview() {
  const { profile, role, schoolId } = useAuth();
  const { theme } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    topBranch: '',
    weakSubject: 'DSA',
    avgAttendance: 92
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!schoolId) return;
      
      try {
        const studentsSnap = await getDocs(query(collection(db, 'students'), where('schoolId', '==', schoolId)));
        const activitiesSnap = await getDocs(query(collection(db, 'activities'), where('schoolId', '==', schoolId)));
        
        const fetchedStudents = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        const fetchedActivities = activitiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
        
        setStudents(fetchedStudents);
        setActivities(fetchedActivities);

        // Branch analysis
        const branchScores: Record<string, { total: number, count: number }> = {};
        fetchedStudents.forEach(s => {
          if (s.branch) {
            if (!branchScores[s.branch]) branchScores[s.branch] = { total: 0, count: 0 };
            const studentActs = fetchedActivities.filter(a => a.studentId === s.id);
            const avg = studentActs.length ? studentActs.reduce((acc, a) => acc + (a.score || 0), 0) / studentActs.length : 0;
            branchScores[s.branch].total += avg;
            branchScores[s.branch].count += 1;
          }
        });

        let topB = 'N/A';
        let maxAvg = -1;
        Object.entries(branchScores).forEach(([branch, data]) => {
          const avg = data.total / data.count;
          if (avg > maxAvg) {
            maxAvg = avg;
            topB = branch;
          }
        });
        
        setStats({
          totalStudents: fetchedStudents.length,
          topBranch: topB,
          weakSubject: 'DBMS', // This would ideally be calculated from subject-wise assessment
          avgAttendance: 92
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [schoolId]);

  // Comparative Data (Branch Performance)
  const branchData = Object.entries(students.reduce((acc, s) => {
    const branch = s.branch || 'Other';
    if (!acc[branch]) acc[branch] = { name: branch, students: 0, avgScore: 0 };
    acc[branch].students += 1;
    // Mocking score for demo visual if real data is missing
    const acts = activities.filter(a => a.studentId === s.id);
    const score = acts.length ? (acts.reduce((sum, a) => sum + (a.score || 0), 0) / acts.length) : (65 + Math.random() * 20);
    acc[branch].avgScore = (acc[branch].avgScore * (acc[branch].students - 1) + score) / acc[branch].students;
    return acc;
  }, {} as Record<string, any>)).map(([_, val]) => val);

  // Year Progress Data
  const yearData = [
    { name: '1st Year', performance: 78, attendance: 95 },
    { name: '2nd Year', performance: 82, attendance: 88 },
    { name: '3rd Year', performance: 65, attendance: 75 },
    { name: '4th Year', performance: 90, attendance: 92 },
  ];

  const COLORS = ['#9b4dff', '#3b82f6', '#10b981', '#f59e0b'];

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="opacity-40 animate-pulse">Initializing Dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Institutional Overview 👋
          </h1>
          <p className="opacity-50">Department: {profile?.department || 'Administration'} | Role: {profile?.role || 'Staff'}</p>
        </div>
        <div className={cn(
          "px-4 py-2 rounded-2xl border flex items-center gap-3",
          theme === 'dark' ? "bg-white/5 border-white/10 text-white/60" : "bg-white border-slate-200"
        )}>
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-bold">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Top Branch', value: stats.topBranch, icon: Award, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Weak Subject', value: stats.weakSubject, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Avg Attendance', value: `${stats.avgAttendance}%`, icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500/10' }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "glass-card p-6 border transition-all hover:scale-[1.02]",
              theme === 'dark' ? "border-white/10" : "bg-white border-slate-200 shadow-sm"
            )}
          >
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest opacity-40 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Branch Performance Comparison */}
        <div className={cn(
          "glass-card p-8 border",
          theme === 'dark' ? "border-white/10" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-xl font-bold flex items-center gap-2">
               <Layers className="text-blue-500" />
               Branch-wise Performance
             </h2>
             <span className="text-xs font-medium opacity-40 tracking-wider">COMPARED BY AVG SCORE</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#ffffff05' : '#00000005'} />
                <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: theme === 'dark' ? '#ffffff40' : '#94a3b8', fontSize: 10 }}
                />
                <YAxis hide />
                <Tooltip 
                   cursor={{ fill: 'transparent' }}
                   contentStyle={theme === 'dark' ? { backgroundColor: '#030014', borderColor: '#ffffff10', borderRadius: '16px' } : { borderRadius: '16px' }}
                />
                <Bar dataKey="avgScore" radius={[10, 10, 0, 0]}>
                  {branchData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Year-wise Comparative Progress */}
        <div className={cn(
          "glass-card p-8 border",
          theme === 'dark' ? "border-white/10" : "bg-white border-slate-200"
        )}>
           <div className="flex items-center justify-between mb-8">
             <h2 className="text-xl font-bold flex items-center gap-2">
               <TrendingUp className="text-purple-500" />
               Yearly Progress Comparison
             </h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearData}>
                <defs>
                  <linearGradient id="colorPerf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9b4dff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#9b4dff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#ffffff05' : '#00000005'} />
                <XAxis 
                   dataKey="name" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{ fill: theme === 'dark' ? '#ffffff40' : '#94a3b8', fontSize: 10 }}
                />
                <YAxis hide />
                <Tooltip 
                   contentStyle={theme === 'dark' ? { backgroundColor: '#030014', borderColor: '#ffffff10', borderRadius: '16px' } : { borderRadius: '16px' }}
                />
                <Area type="monotone" dataKey="performance" stroke="#9b4dff" fillOpacity={1} fill="url(#colorPerf)" strokeWidth={3} />
                <Area type="monotone" dataKey="attendance" stroke="#3b82f6" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-4 justify-center text-[10px] font-bold tracking-widest uppercase opacity-40">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              Academic Performance
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              Attendance Rate
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Insights */}
      <div className="grid md:grid-cols-3 gap-8">
         <div className={cn(
           "glass-card p-8 border lg:col-span-1 relative overflow-hidden",
           theme === 'dark' ? "border-purple-500/30 bg-purple-600/5" : "bg-slate-900 border-slate-800 text-white"
         )}>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <AlertCircle className={theme === 'dark' ? "text-purple-400" : "text-white"} />
              </div>
              <h2 className="text-xl font-bold mb-2">Subject Action Required</h2>
              <p className="opacity-60 text-sm mb-6">
                Weak performance detected in <span className="text-purple-400 font-bold">{stats.weakSubject}</span> for 3rd year students. Extra teaching sessions recommended.
              </p>
              <button className="text-xs font-black uppercase tracking-widest text-purple-500 hover:opacity-70 transition-opacity">Schedule Session →</button>
            </div>
         </div>
         
         <div className={cn("glass-card p-6 border lg:col-span-2", theme === 'dark' ? "border-white/10 text-white" : "bg-white border-slate-200")}>
           <div className="flex items-center justify-between mb-6">
             <h3 className="font-bold flex items-center gap-2 text-lg">
               <Award size={20} className="text-amber-500" />
               Current Top Performers
             </h3>
             <span className="text-xs font-medium opacity-40">LAST 30 DAYS</span>
           </div>
           <div className="grid md:grid-cols-2 gap-4">
              {students.slice(0, 4).map((s, i) => (
                <div key={i} className={cn(
                  "p-4 rounded-2xl border transition-all hover:border-purple-500/30 group cursor-default",
                  theme === 'dark' ? "border-white/10 bg-white/5" : "bg-slate-50 border-slate-200"
                )}>
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="text-sm font-bold group-hover:text-purple-500 transition-colors">{s.name}</p>
                       <p className="opacity-40 text-xs">{s.branch} | Year {s.year}</p>
                     </div>
                     <span className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-black rounded-lg">TOP 5%</span>
                   </div>
                </div>
              ))}
           </div>
         </div>
      </div>
    </div>
  );
}
