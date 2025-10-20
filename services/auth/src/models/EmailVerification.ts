import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';
import crypto from 'crypto';

interface EmailVerificationAttributes {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

interface EmailVerificationCreationAttributes 
  extends Optional<EmailVerificationAttributes, 'id' | 'createdAt' | 'isUsed'> {}

export class EmailVerification extends Model<EmailVerificationAttributes, EmailVerificationCreationAttributes> implements EmailVerificationAttributes {
  declare id: number;
  declare userId: number;
  declare token: string;
  declare expiresAt: Date;
  declare isUsed: boolean;
  declare readonly createdAt: Date;
}

EmailVerification.init(
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
    tableName: 'email_verifications',
    timestamps: false,
  }
);

export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const generateVerificationUrl = (token: string): string => {
  return `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
};

export default EmailVerification;