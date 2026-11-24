import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService = new AnalyticsService()) {}

  getDashboardSummary = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getAdminDashboardSummary();
      ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  };

  getAssignmentAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getAssignmentWiseAnalytics();
      ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  };

  getGroupAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getGroupWiseAnalytics();
      ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  };

  getStudentAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await this.analyticsService.getStudentWiseAnalytics();
      ApiResponse.success(res, data);
    } catch (error) {
      next(error);
    }
  };
}
