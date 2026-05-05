import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Lesson, Class } from '../types';
import { BookOpen, Calendar, Clock, Plus, Book, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function LessonsPage() {
  const { teacher } = useAuth();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newLesson, setNewLesson] = useState({ classId: '', topic: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });

  useEffect(() => {
    async function fetchData() {
      if (!teacher?.schoolId) return;
      try {
        // Fetch classes to select from
        const classesQ = query(collection(db, 'classes'), where('schoolId', '==', teacher.schoolId));
        const classesSnap = await getDocs(classesQ);
        const classesData = classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
        setClasses(classesData);
        if (classesData.length > 0) setNewLesson(prev => ({ ...prev, classId: classesData[0].id || '' }));

        // Fetch lessons
        const lessonsQ = query(
          collection(db, 'lessons'), 
          where('schoolId', '==', teacher.schoolId),
          where('loggedBy', '==', teacher.id || ''),
          orderBy('date', 'desc')
        );
        const lessonsSnap = await getDocs(lessonsQ);
        setLessons(lessonsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson)));
      } catch (err) {
        // handleFirestoreError(err, OperationType.LIST, 'lessons');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [teacher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher?.id || !teacher.schoolId) return;
    
    try {
      await addDoc(collection(db, 'lessons'), {
        ...newLesson,
        schoolId: teacher.schoolId,
        loggedBy: teacher.id,
        createdAt: serverTimestamp()
      });
      setShowForm(false);
      setNewLesson({ classId: classes[0]?.id || '', topic: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
      // Refresh logic here
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'lessons');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lesson Logs</h1>
          <p className="text-slate-500">Keep track of what topics have been covered in each class.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          {showForm ? 'Cancel' : 'Log New Lesson'}
        </button>
      </div>

      {showForm && (
        <div className="card p-8 bg-slate-50 animate-in fade-in slide-in-from-top-4">
           <h2 className="text-xl font-bold mb-6">Log Daily Lesson</h2>
           <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Class</label>
                 <select 
                    value={newLesson.classId}
                    onChange={e => setNewLesson({...newLesson, classId: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 focus:outline-none"
                    required
                 >
                    {classes.length === 0 ? <option value="">No classes found</option> : classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>
              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</label>
                 <input 
                   type="date" 
                   value={newLesson.date}
                   onChange={e => setNewLesson({...newLesson, date: e.target.value})}
                   className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3"
                   required
                 />
              </div>
              <div className="md:col-span-2 space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Topic Covered</label>
                 <input 
                   type="text" 
                   value={newLesson.topic}
                   onChange={e => setNewLesson({...newLesson, topic: e.target.value})}
                   placeholder="e.g. Introduction to Fractions"
                   className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3"
                   required
                 />
              </div>
              <div className="md:col-span-2 space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notes (Optional)</label>
                 <textarea 
                   value={newLesson.notes}
                   onChange={e => setNewLesson({...newLesson, notes: e.target.value})}
                   placeholder="Any observations or homework assigned..."
                   className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-3 h-24 resize-none"
                 />
              </div>
              <div className="md:col-span-2 flex justify-end">
                 <button type="submit" className="btn-primary">Save Lesson Log</button>
              </div>
           </form>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading logs...</div>
        ) : lessons.length === 0 ? (
          <div className="card p-20 flex flex-col items-center gap-4 text-center">
             <Book className="w-16 h-16 text-slate-200" />
             <p className="text-slate-500 max-w-xs italic serif">You haven't logged any lessons yet. Start logging to build your teaching history!</p>
          </div>
        ) : (
          lessons.map((lesson) => (
            <div key={lesson.id} className="card p-6 flex flex-col md:flex-row md:items-center gap-6 group hover:border-brand-primary/20 transition-all">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-brand-primary">
                  <BookOpen className="w-8 h-8" />
               </div>
               <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                     <span className="text-[10px] font-bold text-brand-primary bg-brand-secondary px-2 py-0.5 rounded uppercase tracking-wider">
                        {classes.find(c => c.id === lesson.classId)?.name || 'Class'}
                     </span>
                     <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {lesson.date}
                     </div>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{lesson.topic}</h3>
                  {lesson.notes && <p className="text-sm text-slate-500 mt-1 line-clamp-1">{lesson.notes}</p>}
               </div>
               <button className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all">
                  <Trash2 className="w-5 h-5" />
               </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
