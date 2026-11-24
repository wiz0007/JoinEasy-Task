import { Request, Response, NextFunction } from 'express';
import { AssignmentsService } from './assignments.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService = new AssignmentsService()) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignment = await this.assignmentsService.createAssignment(
        req.user!.userId,
        req.body
      );
      ApiResponse.created(res, assignment, 'Assignment created successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignment = await this.assignmentsService.updateAssignment(
        req.params.assignmentId!,
        req.body
      );
      ApiResponse.success(res, assignment, 'Assignment updated successfully');
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignments = await this.assignmentsService.listAssignments(
        req.user!.userId,
        req.user!.role
      );
      ApiResponse.success(res, assignments);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const assignment = await this.assignmentsService.getAssignmentById(
        req.user!.userId,
        req.user!.role,
        req.params.assignmentId!
      );
      ApiResponse.success(res, assignment);
    } catch (error) {
      next(error);
    }
  };
}
