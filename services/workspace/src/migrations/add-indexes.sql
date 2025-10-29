-- Workspace indexes
CREATE INDEX idx_workspace_owner ON workspaces(ownerId);
CREATE INDEX idx_workspace_created ON workspaces(createdAt DESC);

-- Workspace members indexes
CREATE INDEX idx_member_workspace ON workspace_members(workspaceId);
CREATE INDEX idx_member_user ON workspace_members(userId);
CREATE INDEX idx_member_role ON workspace_members(role);
CREATE INDEX idx_member_workspace_user ON workspace_members(workspaceId, userId);

-- Workspace invitations indexes
CREATE INDEX idx_invitation_workspace ON workspace_invitations(workspaceId);
CREATE INDEX idx_invitation_email ON workspace_invitations(invitedEmail);
CREATE INDEX idx_invitation_token ON workspace_invitations(token);
CREATE INDEX idx_invitation_expires ON workspace_invitations(expiresAt);

-- Auth service indexes (in services/auth)
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_created ON users(createdAt DESC);
