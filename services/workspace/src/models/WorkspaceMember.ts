import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

export enum MemberRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

interface WorkspaceMemberAttributes {
  id: number;
  workspaceId: number;
  userId: number;
  role: MemberRole;
  joinedAt: Date;
}

interface WorkspaceMemberCreationAttributes 
  extends Optional<WorkspaceMemberAttributes, 'id' | 'joinedAt'> {}

export class WorkspaceMember extends Model<
  WorkspaceMemberAttributes,
  WorkspaceMemberCreationAttributes
> implements WorkspaceMemberAttributes {
  declare id: number;
  declare workspaceId: number;
  declare userId: number;
  declare role: MemberRole;
  declare readonly joinedAt: Date;
}

WorkspaceMember.init(
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'editor', 'viewer'),
      allowNull: false,
      defaultValue: 'viewer',
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'workspace_members',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['workspaceId', 'userId'],
      },
    ],
  }
);

export default WorkspaceMember;