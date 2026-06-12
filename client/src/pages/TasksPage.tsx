import React, { useEffect, useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { useSocket } from '../app/SocketContext';
import { DashboardLayout } from '../components/layouts/DashboardLayout';
import { SEOHead } from '../components/common/SEOHead';
import { api } from '../services/api';
import { Task, TaskStatus, TaskPriority } from '../types';
import {
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  User as UserIcon,
  X,
  Loader2
} from 'lucide-react';

interface BoardUser {
  id: string;
  username: string;
  avatarUrl: string;
  email: string;
}

export const TasksPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<BoardUser[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Todo');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, usersRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/auth/users')
      ]);
      setTasks(tasksRes.data.tasks || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      console.error('Failed to load Kanban tasks workspace', err);
      setError('Could not load board tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setError('');
      setSubmitting(true);
      
      const payload = {
        title,
        description,
        status,
        priority,
        assigneeId: assigneeId || undefined,
        dueDate: dueDate || undefined
      };

      const res = await api.post('/tasks', payload);
      const newTask = res.data.task;

      // Update state
      setTasks(prev => [newTask, ...prev]);

      // Emit socket notification if assignee is different from creator
      if (assigneeId && assigneeId !== user?.id && socket) {
        socket.emit('task-assigned', {
          taskTitle: title,
          assigneeId,
          assignerName: user?.username || 'A team member'
        });
      }

      // Reset Form & Close
      setTitle('');
      setDescription('');
      setStatus('Todo');
      setPriority('Medium');
      setAssigneeId('');
      setDueDate('');
      setModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) {
      console.error('Failed to delete task', err);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const draggedTask = tasks.find(t => t._id === taskId);
    if (!draggedTask || draggedTask.status === targetStatus) return;

    // Optimistic UI state update
    const previousTasks = [...tasks];
    setTasks(prev =>
      prev.map(t => (t._id === taskId ? { ...t, status: targetStatus, updatedAt: new Date().toISOString() } : t))
    );

    try {
      await api.put(`/tasks/${taskId}`, { status: targetStatus });
    } catch (err) {
      console.error('Failed to update task state on drop', err);
      // Rollback
      setTasks(previousTasks);
    }
  };

  const columns: { title: string; status: TaskStatus; bg: string; border: string; text: string }[] = [
    { title: 'To Do', status: 'Todo', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-blue-600' },
    { title: 'In Progress', status: 'InProgress', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-purple-600' },
    { title: 'Done', status: 'Done', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-emerald-600' }
  ];

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'High': return 'bg-red-50 text-red-600 border-red-100';
      case 'Medium': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Low': return 'bg-green-50 text-green-600 border-green-100';
    }
  };

  const getAssigneeDetails = (assigneeId?: string) => {
    if (!assigneeId) return null;
    return users.find(u => u.id === assigneeId) || null;
  };

  return (
    <DashboardLayout>
      <SEOHead title="Kanban Board Workspace" />
      
      <div className="space-y-6 text-left">
        {/* Workspace Title & Create Task */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Sprint Workspace</span>
            <h3 className="text-xl font-bold text-slate-900">Project Workflows</h3>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>

        {/* Columns Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-slate-400 mt-4">Hydrating workspaces tasks...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {columns.map(col => {
              const colTasks = tasks.filter(t => t.status === col.status);
              return (
                <div
                  key={col.status}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.status)}
                  className={`rounded-2xl border ${col.border} p-5 ${col.bg} min-h-[70vh] flex flex-col`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 shrink-0">
                    <div className="flex items-center space-x-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${col.status === 'Todo' ? 'bg-blue-600' : col.status === 'InProgress' ? 'bg-purple-600' : 'bg-emerald-600'}`} />
                      <h4 className="font-bold text-xs text-slate-900">{col.title}</h4>
                    </div>
                    <span className="text-[9px] bg-slate-200/50 px-2 py-0.5 rounded-md font-bold text-slate-500">{colTasks.length}</span>
                  </div>

                  {/* Tasks Container */}
                  <div className="flex-1 space-y-3 overflow-y-auto">
                    {colTasks.length === 0 ? (
                      <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs py-10">
                        Drag tasks here
                      </div>
                    ) : (
                      colTasks.map(task => {
                        const assignee = getAssigneeDetails(task.assigneeId);
                        return (
                          <div
                            key={task._id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task._id)}
                            className="bg-white border border-slate-250 p-4 rounded-xl text-left cursor-grab active:cursor-grabbing relative group shadow-2xs hover:border-slate-350 hover:shadow-xs transition-all duration-150"
                          >
                            {/* Priority & Delete */}
                            <div className="flex items-center justify-between mb-3">
                              <span className={`text-[8px] px-2 py-0.5 rounded-md font-bold border ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              <button
                                onClick={() => handleDeleteTask(task._id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 transition-all cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Title */}
                            <h4 className="text-xs font-semibold text-slate-900 leading-snug mb-1">{task.title}</h4>
                            {task.description && (
                              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed mb-3">{task.description}</p>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[9px] text-slate-400">
                              {/* Due date */}
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>
                                  {task.dueDate
                                    ? new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                    : 'No due date'}
                                </span>
                              </div>

                              {/* Assignee */}
                              {assignee ? (
                                <div className="flex items-center space-x-1" title={assignee.username}>
                                  <img
                                    src={assignee.avatarUrl}
                                    alt={assignee.username}
                                    className="w-4.5 h-4.5 rounded-full border border-slate-200 bg-white"
                                  />
                                </div>
                              ) : (
                                <div className="p-1 rounded-full bg-slate-100 text-slate-400" title="Unassigned">
                                  <UserIcon className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white border border-[#e2e8f0] rounded-3xl p-6 shadow-2xl z-10 animate-scale-in text-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900">Create Kanban Task</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl mb-4 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="flex-1">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateTask} className="space-y-4 text-xs text-left">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Task title (e.g. Verify WebRTC codecs)"
                  className="w-full px-3 py-2 rounded-xl glass-input border"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Add detailed task notes..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl glass-input border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Priority</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl glass-input border bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 rounded-xl glass-input border bg-white"
                  >
                    <option value="Todo">Todo</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Assignee</label>
                  <select
                    value={assigneeId}
                    onChange={e => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input border bg-white"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl glass-input border"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Create Task</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default TasksPage;
