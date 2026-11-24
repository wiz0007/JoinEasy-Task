import { Request, Response, NextFunction } from 'express';
import { GroupsService } from './groups.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class GroupsController {
  constructor(private readonly groupsService: GroupsService = new GroupsService()) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await this.groupsService.createGroup(req.user!.userId, req.body);
      ApiResponse.created(res, group, 'Group created successfully');
    } catch (error) {
      next(error);
    }
  };

  getMyGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await this.groupsService.getMyGroup(req.user!.userId);
      ApiResponse.success(res, group);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await this.groupsService.getGroupById(
        req.user!.userId,
        req.user!.role,
        req.params.groupId!
      );
      ApiResponse.success(res, group);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await this.groupsService.updateGroup(
        req.user!.userId,
        req.params.groupId!,
        req.body
      );
      ApiResponse.success(res, group, 'Group updated successfully');
    } catch (error) {
      next(error);
    }
  };

  removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.groupsService.removeMember(
        req.user!.userId,
        req.params.groupId!,
        req.params.userId!
      );
      ApiResponse.noContent(res);
    } catch (error) {
      next(error);
    }
  };

  listAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groups = await this.groupsService.listGroupsForAdmin();
      ApiResponse.success(res, groups);
    } catch (error) {
      next(error);
    }
  };
}
