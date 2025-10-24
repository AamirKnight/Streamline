import { Request, Response } from 'express';
import Workspace from '../models/Workspace';
import WorkspaceMember, { MemberRole } from '../models/WorkspaceMember';
import WorkspaceInvitation, { generateInvitationToken } from '../models/WorkspaceInvitation';

export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    // Create workspace
    const workspace = await Workspace.create({
      name,
      description,
      ownerId: userId,
    });

    // Add creator as admin member
    await WorkspaceMember.create({
      workspaceId: workspace.id,
      userId,
      role: MemberRole.ADMIN,
    });

    res.status(201).json({
      message: 'Workspace created successfully',
      workspace,
    });
  } catch (error: any) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getWorkspaces = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all workspaces where user is a member
    const memberships = await WorkspaceMember.findAll({
      where: { userId },
      include: [
        {
          model: Workspace,
          as: 'workspace',
        },
      ],
    });

    // Get workspace details
    const workspaceIds = memberships.map(m => m.workspaceId);
    const workspaces = await Workspace.findAll({
      where: { id: workspaceIds },
    });

    // Attach role to each workspace
    const workspacesWithRoles = workspaces.map(workspace => {
      const membership = memberships.find(m => m.workspaceId === workspace.id);
      return {
        ...workspace.toJSON(),
        role: membership?.role,
      };
    });

    res.json({ workspaces: workspacesWithRoles });
  } catch (error: any) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getWorkspaceById = async (req: Request, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    const userId = req.user?.id;

    const workspace = await Workspace.findByPk(workspaceId);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Get user's role in workspace
    const membership = await WorkspaceMember.findOne({
      where: { workspaceId, userId },
    });

    res.json({
      workspace: {
        ...workspace.toJSON(),
        role: membership?.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateWorkspace = async (req: Request, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    const { name, description } = req.body;

    const workspace = await Workspace.findByPk(workspaceId);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;

    await workspace.save();

    res.json({
      message: 'Workspace updated successfully',
      workspace,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteWorkspace = async (req: Request, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);

    const workspace = await Workspace.findByPk(workspaceId);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Delete all members
    await WorkspaceMember.destroy({ where: { workspaceId } });

    // Delete all invitations
    await WorkspaceInvitation.destroy({ where: { workspaceId } });

    // Delete workspace
    await workspace.destroy();

    res.json({ message: 'Workspace deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getWorkspaceMembers = async (req: Request, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);

    const members = await WorkspaceMember.findAll({
      where: { workspaceId },
    });

    res.json({ members });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const inviteMember = async (req: Request, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    const { email, role } = req.body;
    const userId = req.user?.id;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate invitation token
    const token = generateInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await WorkspaceInvitation.create({
      workspaceId,
      invitedBy: userId!,
      invitedEmail: email,
      token,
      role: role || 'viewer',
      expiresAt,
    });

    // TODO: Send email with invitation link
    console.log(`Invitation link: http://localhost:3000/accept-invite?token=${token}`);

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email,
        token,
        expiresAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const workspaceId = parseInt(req.params.workspaceId);
    const memberIdToRemove = parseInt(req.params.memberId);
    const userId = req.user?.id;

    // Can't remove yourself
    if (memberIdToRemove === userId) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    // Find and delete membership
    const membership = await WorkspaceMember.findOne({
      where: { workspaceId, userId: memberIdToRemove },
    });

    if (!membership) {
      return res.status(404).json({ error: 'Member not found' });
    }

    await membership.destroy();

    res.json({ message: 'Member removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};