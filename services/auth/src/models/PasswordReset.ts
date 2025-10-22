import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';
import crypto from 'crypto';

interface PasswordResetAttributes {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

interface PasswordResetCreationAttributes 
  extends Optional<PasswordResetAttributes, 'id' | 'createdAt' | 'isUsed'> {}

export class PasswordReset extends Model<
  PasswordResetAttributes,
  PasswordResetCreationAttributes
> implements PasswordResetAttributes {
  declare id: number;
  declare userId: number;
  declare token: string;
  declare expiresAt: Date;
  declare isUsed: boolean;
  declare readonly createdAt: Date;
}

PasswordReset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    token: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
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
    tableName: 'password_resets',
    timestamps: false,
  }
);

export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export default PasswordReset;