import { Request, Response, NextFunction } from 'express';
import { SubmissionsService } from './submissions.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService = new SubmissionsService()) {}

  confirm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const confirmation = await this.submissionsService.confirmSubmission(
        req.user!.userId,
        req.params.assignmentId!,
        req.params.groupId!
      );
      ApiResponse.created(res, confirmation, 'Submission confirmed successfully');
    } catch (error) {
      next(error);
    }
  };

  getSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const submission = await this.submissionsService.getSubmission(
        req.user!.userId,
        req.user!.role,
        req.params.assignmentId!,
        req.params.groupId!
      );
      ApiResponse.success(res, submission);
    } catch (error) {
      next(error);
    }
  };

  getGroupProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const progress = await this.submissionsService.getGroupProgress(
        req.user!.userId,
        req.user!.role,
        req.params.groupId!
      );
      ApiResponse.success(res, progress);
    } catch (error) {
      next(error);
    }
  };

  getGroupSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const submissions = await this.submissionsService.getGroupSubmissions(
        req.user!.userId,
        req.user!.role,
        req.params.groupId!
      );
      ApiResponse.success(res, submissions);
    } catch (error) {
      next(error);
    }
  };
}
