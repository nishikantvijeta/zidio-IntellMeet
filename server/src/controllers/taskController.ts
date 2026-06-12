import { Request, Response, NextFunction } from 'express';
import { TaskRepository } from '../repositories/taskRepository';
import { UserRepository } from '../repositories/userRepository';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { logger } from '../utils/logger';

export class TaskController {
  static async list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tasks = await TaskRepository.listAll();
      res.status(200).json({
        success: true,
        tasks
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, status, priority, assigneeId, dueDate } = req.body;
      const creatorId = req.user?.userId;

      if (!creatorId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!title) {
        res.status(400).json({ success: false, message: 'Task title is required.' });
        return;
      }

      // Check if assignee exists
      if (assigneeId) {
        const assignee = await UserRepository.findById(assigneeId);
        if (!assignee) {
          res.status(400).json({ success: false, message: 'Assigned user not found.' });
          return;
        }
      }

      const task = await TaskRepository.create({
        title,
        description: description || '',
        status: status || 'Todo',
        priority: priority || 'Medium',
        assigneeId,
        creatorId,
        dueDate: dueDate ? new Date(dueDate) : undefined
      });

      res.status(201).json({
        success: true,
        task
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const existingTask = await TaskRepository.findById(id);
      if (!existingTask) {
        res.status(404).json({ success: false, message: 'Task not found.' });
        return;
      }

      // Validate assignee if being updated
      if (updates.assigneeId) {
        const assignee = await UserRepository.findById(updates.assigneeId);
        if (!assignee) {
          res.status(400).json({ success: false, message: 'Assigned user not found.' });
          return;
        }
      }

      // If dueDate is passed as empty or invalid, clear it
      if (updates.dueDate === null) {
        updates.dueDate = undefined;
      } else if (updates.dueDate) {
        updates.dueDate = new Date(updates.dueDate);
      }

      const updatedTask = await TaskRepository.update(id, updates);
      res.status(200).json({
        success: true,
        task: updatedTask
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const success = await TaskRepository.delete(id);

      if (!success) {
        res.status(404).json({ success: false, message: 'Task not found.' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
}
