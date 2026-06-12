import TaskModel, { ITask } from '../models/Task';
import { isMockDb } from '../config/db';
import { mockDb, generateId, DbTask } from './mockDb';

export class TaskRepository {
  static async findById(id: string): Promise<DbTask | null> {
    if (isMockDb) {
      const t = mockDb.getTasks().find(task => task._id === id);
      return t ? { ...t } : null;
    }
    const taskDoc = await TaskModel.findById(id);
    return taskDoc ? (taskDoc.toObject() as any as DbTask) : null;
  }

  static async create(taskData: Partial<ITask>): Promise<DbTask> {
    if (isMockDb) {
      const newTask: DbTask = {
        _id: generateId(),
        title: taskData.title || 'Untitled Task',
        description: taskData.description || '',
        status: taskData.status || 'Todo',
        priority: taskData.priority || 'Medium',
        assigneeId: taskData.assigneeId,
        creatorId: taskData.creatorId || '',
        dueDate: taskData.dueDate,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return mockDb.saveTask(newTask);
    }
    const taskDoc = await TaskModel.create(taskData);
    return taskDoc.toObject() as any as DbTask;
  }

  static async update(id: string, updates: Partial<ITask>): Promise<DbTask | null> {
    if (isMockDb) {
      const existing = mockDb.getTasks().find(t => t._id === id);
      if (!existing) return null;
      const updatedTask: DbTask = {
        ...existing,
        ...updates,
        updatedAt: new Date()
      };
      return mockDb.saveTask(updatedTask);
    }
    const taskDoc = await TaskModel.findByIdAndUpdate(id, { $set: updates }, { new: true });
    return taskDoc ? (taskDoc.toObject() as any as DbTask) : null;
  }

  static async delete(id: string): Promise<boolean> {
    if (isMockDb) {
      return mockDb.deleteTask(id);
    }
    const result = await TaskModel.findByIdAndDelete(id);
    return result !== null;
  }

  static async listAll(): Promise<DbTask[]> {
    if (isMockDb) {
      return mockDb.getTasks().map(t => ({ ...t }));
    }
    const tasks = await TaskModel.find({}).sort({ createdAt: -1 });
    return tasks.map(t => t.toObject() as any as DbTask);
  }
}
