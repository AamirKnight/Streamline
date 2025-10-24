import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';
import crypto from 'crypto';

interface WorkspaceInvitationAttributes {
  id: number;
  workspaceId: number;
  invitedBy: number;
  invitedEmail: string;
  token: string;
  role: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

interface WorkspaceInvitationCreationAttributes 
  extends Optional<WorkspaceInvitationAttributes, 'id' | 'createdAt' | 'isUsed'> {}

export class WorkspaceInvitation extends Model<
  WorkspaceInvitationAttributes,
  WorkspaceInvitationCreationAttributes
> implements WorkspaceInvitationAttributes {
  declare id: number;
  declare workspaceId: number;
  declare invitedBy: number;
  declare invitedEmail: string;
  declare token: string;
  declare role: string;
  declare expiresAt: Date;
  declare isUsed: boolean;
  declare readonly createdAt: Date;
}

WorkspaceInvitation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    workspaceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'workspaces',
        key: 'id',
      },
    },
    invitedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    invitedEmail: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'viewer',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isUsed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'workspace_invitations',
    timestamps: false,
  }
);

export const generateInvitationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export default WorkspaceInvitation;