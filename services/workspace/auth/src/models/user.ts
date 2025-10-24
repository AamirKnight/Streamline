import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../database';
import bcrypt from 'bcrypt';
import { config } from '../config';

interface UserAttributes {
  id: number;
  email: string;
  username: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Add all optional fields here
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'avatarUrl' | 'isVerified'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare email: string;
  declare username: string;
  declare passwordHash: string;
  declare firstName: string;
  declare lastName: string;
  declare avatarUrl: string;
  declare isVerified: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Instance methods
  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  toJSON() {
    const { passwordHash, ...rest } = this.get();
    return rest;
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
    },
    lastName: {
      type: DataTypes.STRING(100),
    },
    avatarUrl: {
      type: DataTypes.STRING(255),
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.passwordHash) {
          user.passwordHash = await bcrypt.hash(user.passwordHash, config.bcrypt.rounds);
        }
      },
    },
  }
);

export default User;