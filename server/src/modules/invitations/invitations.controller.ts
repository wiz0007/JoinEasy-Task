import { Request, Response, NextFunction } from 'express';
import { InvitationsService } from './invitations.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService = new InvitationsService()) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invitation = await this.invitationsService.createInvitation(
        req.user!.userId,
        req.params.groupId!,
        req.body
      );
      ApiResponse.created(res, invitation, 'Invitation sent successfully');
    } catch (error) {
      next(error);
    }
  };

  getMyInvitations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const invitations = await this.invitationsService.getMyInvitations(req.user!.userId);
      ApiResponse.success(res, invitations);
    } catch (error) {
      next(error);
    }
  };

  accept = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.invitationsService.acceptInvitation(
        req.user!.userId,
        req.params.invitationId!
      );
      ApiResponse.success(res, result, 'Invitation accepted successfully');
    } catch (error) {
      next(error);
    }
  };

  reject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.invitationsService.rejectInvitation(
        req.user!.userId,
        req.params.invitationId!
      );
      ApiResponse.success(res, result, 'Invitation rejected');
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.invitationsService.cancelInvitation(
        req.user!.userId,
        req.params.groupId!,
        req.params.invitationId!
      );
      ApiResponse.noContent(res);
    } catch (error) {
      next(error);
    }
  };
}
