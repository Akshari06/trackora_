import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student, Activity } from '../types';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  BarChart3,
  Search,
  Users
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function ProgressPage() {
  const { schoolId, role, profile } = useAuth();
  const { theme } = useTheme();
  const [students, setStudents] = useState<Student[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) return;

    // Filter students by school
    const qStudents = query(collection(db, 'students'), where('schoolId', '==', schoolId));
    const unsubscribeStudents = onSnapshot(qStudents, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
    });

    // Activities
    const qActivities = query(collection(db, 'activities'), where('schoolId', '==', schoolId), orderBy('date', 'desc'));
    const unsubscribeActivities = onSnapshot(qActivities, (snapshot) => {
      setActivities(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity)));
    });

    return () => {
      unsubscribeStudents();
      unsubscribeActivities();
    };
  }, [schoolId]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const studentStats = filteredStudents.map(student => {
    const studentActivities = activities.filter(a => a.studentId === student.id);
    const completed = studentActivities.filter(a => a.status === 'COMPLETED').length;
    const total = studentActivities.length;
    const avgScore = studentActivities.reduce((acc, curr) => acc + (curr.score || 0), 0) / (studentActivities.length || 1);
    
    return {
      ...student,
      completed,
      total,
      progress: total > 0 ? (completed / total) * 100 : 0,
      avgScore
    };
  });

  // Chart Data: Completion trends
  const chartData = activities.slice(0, 20).map(a => ({
    name: a.name.substring(0, 10),
    score: a.score || 0
  }));

  // Branch Performance Data
  const branches = [...new Set(students.map(s => s.branch || 'Other'))];
  const branchPerf = branches.map(branch => {
    const branchStudents = studentStats.filter(s => s.branch === branch);
    const avgProgress = branchStudents.reduce((acc, s) => acc + s.progress, 0) / (branchStudents.length || 1);
    return { name: branch, progress: avgProgress };
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="text-purple-500" />
            Comparative Metrics
          </h1>
          <p className="text-slate-500">Analyze performance across branches, subjects, and years.</p>
        </div>
        
        <div className="flex gap-2">
           <div className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all",
            theme === 'dark' ? "bg-white/5 border-white/10" : "bg-white border-slate-200"
          )}>
            <Search className="w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-sm w-48"
            />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Avg. Completion', value: `${(studentStats.reduce((acc, s) => acc + s.progress, 0) / (studentStats.length || 1)).toFixed(1)}%`, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Total Activities', value: activities.length, icon: BarChart3, color: 'text-blue-500' },
          { label: 'Active Students', value: students.length, icon: Users, color: 'text-purple-500' },
          { label: 'Top Branch', value: branchPerf.sort((a,b) => b.progress - a.progress)[0]?.name || 'N/A', icon: Award, color: 'text-orange-500' },
        ].map((stat, i) => (
          <div key={i} className={cn("glass-card p-6", theme !== 'dark' && "bg-white border-slate-100")}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-slate-500 text-sm font-medium">{stat.label}</span>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Branch Comparative Chart */}
        <div className={cn("glass-card p-6", theme !== 'dark' && "bg-white")}>
          <h2 className="text-xl font-bold mb-6">Branch Comparison</h2>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={branchPerf} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? '#ffffff10' : '#00000010'} />
                 <XAxis type="number" fontSize={10} hide />
                 <YAxis dataKey="name" type="category" fontSize={10} tick={{ fill: theme === 'dark' ? '#fff' : '#000', opacity: 0.5 }} />
                 <Tooltip 
                    contentStyle={theme === 'dark' ? { backgroundColor: '#0f0c21', borderColor: '#ffffff20' } : {}}
                    itemStyle={{ color: '#fff' }}
                 />
                 <Bar dataKey="progress" fill="#3b82f6" radius={[0, 4, 4, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers Ranking */}
        <div className={cn("lg:col-span-2 glass-card p-6", theme !== 'dark' && "bg-white")}>
          <h2 className="text-xl font-bold mb-6">Student Performance Analysis</h2>
          <div className="space-y-6">
            {studentStats.sort((a,b) => b.progress - a.progress).slice(0, 5).map((student) => (
              <div key={student.id} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="font-bold flex items-center gap-2">
                      {student.name}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 font-black uppercase">
                        {student.branch} | {student.year}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {student.completed}/{student.total} Activities Completed | Avg Score: {(student.avgScore || 0).toFixed(1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      student.progress > 80 ? "text-green-500" : student.progress > 50 ? "text-blue-500" : "text-amber-500"
                    )}>
                      {student.progress.toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "h-2 w-full rounded-full overflow-hidden",
                  theme === 'dark' ? "bg-white/5" : "bg-slate-100"
                )}>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${student.progress}%` }}
                    className={cn(
                      "h-full rounded-full",
                      student.progress > 80 ? "bg-green-500" : student.progress > 50 ? "bg-blue-500" : "bg-amber-500"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10">
             <h3 className="font-bold mb-2 flex items-center gap-2 text-amber-500">
               <AlertCircle size={18} />
               Weak Performing Areas
             </h3>
             <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                   <p className="text-sm font-bold opacity-60 mb-1">DSA (3rd Year)</p>
                   <div className="flex items-center justify-between">
                     <span className="text-xs text-red-400">Requires focus</span>
                     <span className="text-xs font-bold text-red-400">42% Avg</span>
                   </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                   <p className="text-sm font-bold opacity-60 mb-1">Microprocessors (2nd Year)</p>
                   <div className="flex items-center justify-between">
                     <span className="text-xs text-amber-400">Slightly below avg</span>
                     <span className="text-xs font-bold text-amber-400">58% Avg</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
