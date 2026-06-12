import { Schema, model } from 'mongoose';

export type TaskStatus = 'Todo' | 'InProgress' | 'Done';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface ITask {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  creatorId: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Todo', 'InProgress', 'Done'],
      default: 'Todo'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
    },
    assigneeId: { type: String },
    creatorId: { type: String, required: true },
    dueDate: { type: Date }
  },
  { timestamps: true }
);

export const TaskModel = model<ITask>('Task', taskSchema);
export default TaskModel;
