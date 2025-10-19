import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';

interface WorkspaceAttributes {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkspaceCreationAttributes extends Optional<WorkspaceAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Workspace extends Model<WorkspaceAttributes, WorkspaceCreationAttributes> {
  declare id: number;
  declare name: string;
  declare description: string;
  declare ownerId: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Workspace.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'workspaces',
    timestamps: true,
  }
);

export default Workspace;