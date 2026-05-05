import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { Student, Attendance } from '../types';
import { cn } from '../lib/utils';
import { Check, X, Minus, Save, Calendar, CheckSquare, Square } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';

export default function AttendancePage() {
  const { teacher } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchStudents() {
      if (!teacher?.schoolId) return;
      try {
        const q = query(collection(db, 'students'), where('schoolId', '==', teacher.schoolId));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
        setStudents(data);
        
        // Initial state: all present
        const initialStates: Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE'> = {};
        data.forEach(s => {
          if (s.id) initialStates[s.id] = 'PRESENT';
        });
        setAttendanceData(initialStates);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'students');
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [teacher]);

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LEAVE') => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const batch = writeBatch(db);
      Object.entries(attendanceData).forEach(([studentId, status]) => {
        const attendanceRef = doc(collection(db, 'attendance'), `${studentId}_${date}`);
        batch.set(attendanceRef, {
          studentId,
          schoolId: teacher.schoolId,
          date,
          status,
          recordedAt: serverTimestamp()
        });
      });
      await batch.commit();
      alert('Attendance saved successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'attendance');
    } finally {
      setSaving(false);
    }
  };

  const bulkMark = (status: 'PRESENT' | 'ABSENT' | 'LEAVE') => {
    const newState = { ...attendanceData };
    students.forEach(s => {
      if (s.id) newState[s.id] = status;
    });
    setAttendanceData(newState);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Attendance</h1>
          <p className="text-slate-500">Mark daily attendance for your students.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-2xl">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="text-sm font-medium focus:outline-none" 
              />
           </div>
           <button 
             onClick={handleSave}
             disabled={saving || students.length === 0}
             className="btn-primary flex items-center gap-2 shadow-lg shadow-brand-primary/20"
           >
             <Save className="w-5 h-5" />
             {saving ? 'Saving...' : 'Save Records'}
           </button>
        </div>
      </div>

      {students.length > 0 && (
         <div className="flex gap-4">
            <button onClick={() => bulkMark('PRESENT')} className="text-xs font-bold bg-green-50 text-green-700 px-4 py-2 rounded-xl hover:bg-green-100 flex items-center gap-2">
               <CheckSquare className="w-4 h-4" /> All Present
            </button>
            <button onClick={() => bulkMark('ABSENT')} className="text-xs font-bold bg-red-50 text-red-700 px-4 py-2 rounded-xl hover:bg-red-100 flex items-center gap-2">
               <X className="w-4 h-4" /> All Absent
            </button>
         </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Student Name</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest italic serif">Class</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest italic serif text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={3} className="px-8 py-12 text-center">Loading students...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={3} className="px-8 py-12 text-center text-slate-500 italic">No students found in your school.</td></tr>
              ) : students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 font-bold text-slate-900">{student.name}</td>
                  <td className="px-8 py-6 text-slate-500">{student.classId}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-4">
                      {[
                        { id: 'PRESENT', icon: Check, color: 'text-green-600', activeBg: 'bg-green-500 text-white border-green-500' },
                        { id: 'ABSENT', icon: X, color: 'text-red-600', activeBg: 'bg-red-500 text-white border-red-500' },
                        { id: 'LEAVE', icon: Minus, color: 'text-orange-600', activeBg: 'bg-orange-500 text-white border-orange-500' }
                      ].map((status) => (
                        <button
                          key={status.id}
                          onClick={() => student.id && handleStatusChange(student.id, status.id as any)}
                          className={cn(
                            "w-12 h-12 rounded-2xl border-2 flex items-center justify-center transition-all",
                            attendanceData[student.id!] === status.id 
                              ? status.activeBg
                              : "border-slate-100 text-slate-300 hover:border-slate-200"
                          )}
                        >
                          <status.icon className="w-6 h-6" />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
