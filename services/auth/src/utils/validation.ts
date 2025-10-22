import Joi from 'joi';
import { ERROR_MESSAGES } from '../constants';

const passwordSchema = Joi.string()
  .min(8)
  .max(100)
  .required()
  .messages({
    'string.min': ERROR_MESSAGES.PASSWORD_TOO_SHORT,
    'string.max': 'Password must be less than 100 characters',
    'any.required': 'Password is required',
  });

const emailSchema = Joi.string()
  .email()
  .required()
  .messages({
    'string.email': ERROR_MESSAGES.INVALID_EMAIL,
    'any.required': 'Email is required',
  });

export const registerSchema = Joi.object({
  email: emailSchema,
  username: Joi.string().min(3).max(50).required().messages({
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username must be less than 50 characters',
    'any.required': 'Username is required',
  }),
  password: passwordSchema,
  firstName: Joi.string().max(100).optional(),
  lastName: Joi.string().max(100).optional(),
});

export const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().max(100).optional(),
  lastName: Joi.string().max(100).optional(),
  username: Joi.string().min(3).max(50).optional(),
});

export const requestPasswordResetSchema = Joi.object({
  email: emailSchema,
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: passwordSchema,
});

export const validateRequest = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const messages = error.details.map(d => d.message);
    return { valid: false, errors: messages };
  }
  return { valid: true, value };
};