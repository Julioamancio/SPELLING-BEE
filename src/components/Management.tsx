import React, { useState } from 'react';
import { Plus, Trash2, Users, School as SchoolIcon, ChevronDown, Download, Upload, Check, X, Edit2 } from 'lucide-react';
import { motion } from 'motion/react';
import { School, ClassRoom, Student } from '../types';

interface Props {
  schools: School[];
  setSchools: React.Dispatch<React.SetStateAction<School[]>>;
  classes: ClassRoom[];
  setClasses: React.Dispatch<React.SetStateAction<ClassRoom[]>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

export default function Management({ schools, setSchools, classes, setClasses, students, setStudents }: Props) {
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState(schools[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [bulkStudents, setBulkStudents] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentName, setEditingStudentName] = useState('');

  const startEditingStudent = (student: Student) => {
    setEditingStudentId(student.id);
    setEditingStudentName(student.name);
  };

  const saveEditedStudent = () => {
    if (editingStudentId && editingStudentName.trim()) {
      setStudents(students.map(s => s.id === editingStudentId ? { ...s, name: editingStudentName.trim() } : s));
      setEditingStudentId(null);
      setEditingStudentName('');
    }
  };

  const cancelEditingStudent = () => {
    setEditingStudentId(null);
    setEditingStudentName('');
  };

  const addSchool = () => {
    if (!newSchoolName.trim()) return;
    const newSchool = { id: crypto.randomUUID(), name: newSchoolName.trim() };
    setSchools([...schools, newSchool]);
    setNewSchoolName('');
  };

  const removeSchool = (id: string) => {
    setSchools(schools.filter(s => s.id !== id));
    setClasses(classes.filter(c => c.schoolId !== id));
  };

  const addClass = () => {
    if (!newClassName.trim() || !selectedSchoolId) return;
    const newClass = { id: crypto.randomUUID(), schoolId: selectedSchoolId, name: newClassName.trim() };
    setClasses([...classes, newClass]);
    setNewClassName('');
  };

  const removeClass = (id: string) => {
    setClasses(classes.filter(c => c.id !== id));
    setStudents(students.filter(s => s.classId !== id));
  };

  const addStudent = () => {
    if (!newStudentName.trim()) {
      alert("Student name cannot be empty");
      return;
    }
    const newStudent = {
      id: crypto.randomUUID(),
      classId: selectedClassId,
      name: newStudentName.trim()
    };
    setStudents([...students, newStudent]);
    setNewStudentName('');
  };

  const importStudents = () => {
    if (!selectedClassId || !bulkStudents) return;
    const lines = bulkStudents.split('\n').filter(l => l.trim());
    const newStudents = lines.map(name => ({
      id: crypto.randomUUID(),
      classId: selectedClassId,
      name: name.trim()
    }));
    setStudents([...students, ...newStudents]);
    setBulkStudents('');
    setIsImportModalOpen(false);
  };

  const removeStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const exportToCSV = () => {
    if (!selectedClassId) return;
    const classToExport = classes.find(c => c.id === selectedClassId);
    const studentsToExport = students.filter(s => s.classId === selectedClassId);
    
    const headers = ['Name', 'Class'];
    const csvRows = studentsToExport.map(student => `"${student.name}","${classToExport?.name || ''}"`);
    
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `students_${classToExport?.name || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-12 pb-20 px-2">
      {/* Schools Section */}
      <section className="bento-card p-6 lg:p-10">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
              <SchoolIcon className="w-6 h-6 text-amber-500" />
              Institutions
            </h3>
            <p className="text-sm text-slate-400 font-medium mt-1">Manage schools participating in the competitions.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <input 
              type="text" 
              placeholder="School name (e.g., CSJ)"
              className="px-5 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-sm w-full sm:w-64"
              value={newSchoolName}
              onChange={(e) => setNewSchoolName(e.target.value)}
            />
            <button 
              onClick={addSchool}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add School
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {schools.map(school => (
            <div key={school.id} className="p-6 bg-slate-50 rounded-3xl flex items-center justify-between border border-transparent hover:border-amber-200 hover:bg-white transition-all group">
              <span className="font-black text-slate-900 uppercase tracking-tight">{school.name}</span>
              <button 
                onClick={() => removeSchool(school.id)}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Classes Section */}
      <section className="bento-card p-6 lg:p-10">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
              <Users className="w-6 h-6 text-amber-500" />
              Classrooms
            </h3>
            <p className="text-sm text-slate-400 font-medium mt-1">Organize student groups (e.g., 9° Ano A).</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <select 
              className="px-5 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none font-bold text-sm w-full sm:w-auto"
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
            >
              <option value="">Select School</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input 
              type="text" 
              placeholder="Class name"
              className="px-5 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-sm w-full sm:w-64"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
            />
            <button 
              onClick={addClass}
              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all flex items-center gap-2"
            >
               <Plus className="w-4 h-4" /> Add Class
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {classes.map(cls => (
            <div key={cls.id} className="p-8 border border-slate-100 rounded-[32px] hover:shadow-xl transition-all hover:border-amber-200 bg-white group">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest">{schools.find(s => s.id === cls.schoolId)?.name}</span>
                <button onClick={() => removeClass(cls.id)} className="text-slate-200 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
              </div>
              <h4 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2">{cls.name}</h4>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{students.filter(s => s.classId === cls.id).length} Active Students</p>
              
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => {
                    setSelectedClassId(cls.id);
                    setIsImportModalOpen(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                >
                  <Upload className="w-4 h-4" /> Bulk Import
                </button>
                <button 
                  onClick={() => setSelectedClassId(cls.id)}
                  className={`px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors ${selectedClassId === cls.id ? 'bg-amber-400 text-amber-900 shadow-amber-100 shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Student List View */}
      {selectedClassId && (
        <section className="bento-card p-6 lg:p-10 bg-slate-900 text-white border-none shadow-2xl shadow-slate-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 lg:mb-10 gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tighter">Student List — {classes.find(c => c.id === selectedClassId)?.name}</h3>
              <p className="text-sm text-slate-400 font-medium mt-1">Review and manage individual student entries.</p>
            </div>
            <button 
              onClick={exportToCSV}
              className="w-full sm:w-auto px-6 py-3 bg-amber-500 text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-8 bg-slate-800/50 p-2 rounded-2xl border border-slate-700 w-full sm:w-max">
            <input 
              type="text" 
              placeholder="Student name"
              className="px-5 py-3 bg-slate-800 border border-slate-700 text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-sm w-full sm:w-64"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
            />
            <button 
              onClick={addStudent}
              className="px-6 py-3 bg-amber-500 text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-all flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="overflow-hidden border border-slate-800 rounded-3xl bg-slate-800/50">
            <table className="w-full text-left">
              <thead className="bg-slate-800 transition-all">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Full Name</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {students.filter(s => s.classId === selectedClassId).map(student => (
                  <tr key={student.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-8 py-4 font-bold text-slate-100">
                      {editingStudentId === student.id ? (
                        <input
                          autoFocus
                          type="text"
                          value={editingStudentName}
                          onChange={e => setEditingStudentName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEditedStudent();
                            if (e.key === 'Escape') cancelEditingStudent();
                          }}
                          className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-amber-500"
                        />
                      ) : (
                        student.name
                      )}
                    </td>
                    <td className="px-8 py-4 text-right flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingStudentId === student.id ? (
                        <>
                          <button
                            onClick={saveEditedStudent}
                            className="text-green-500 hover:text-green-400 p-2 hover:bg-slate-700 rounded-lg transition-all"
                            title="Save changes"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditingStudent}
                            className="text-slate-400 hover:text-slate-300 p-2 hover:bg-slate-700 rounded-lg transition-all"
                            title="Cancel editing"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditingStudent(student)}
                            className="text-slate-400 hover:text-amber-400 p-2 hover:bg-slate-700 rounded-lg transition-all"
                            title="Edit student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => removeStudent(student.id)}
                            className="text-slate-400 hover:text-red-400 p-2 hover:bg-slate-700 rounded-lg transition-all"
                            title="Remove student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-xl mx-4 rounded-[40px] shadow-2xl overflow-hidden border border-slate-200"
          >
            <div className="p-6 sm:p-10 border-b border-slate-100">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter">Bulk Student Import</h3>
              <p className="text-slate-400 mt-2 font-medium tracking-tight">Importing to class: <span className="text-amber-500 font-bold">{classes.find(c => c.id === selectedClassId)?.name}</span>.</p>
            </div>
            <div className="p-6 sm:p-10">
              <textarea 
                className="w-full h-64 sm:h-80 p-6 bg-slate-50 border border-slate-200 rounded-[32px] focus:ring-4 focus:ring-amber-100 focus:outline-none font-mono text-sm leading-relaxed"
                placeholder="Ex:&#10;Alice Johnson&#10;Bob Smith&#10;Charlie Brown..."
                value={bulkStudents}
                onChange={(e) => setBulkStudents(e.target.value)}
              />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-4 text-center">Tip: Paste one name per line from Excel or a text file.</p>
            </div>
            <div className="p-6 sm:p-10 bg-slate-50 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="flex-1 py-4 sm:py-5 font-black text-slate-400 uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={importStudents}
                className="flex-2 py-4 sm:py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 shadow-xl shadow-slate-200"
              >
                Start Import Process
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
