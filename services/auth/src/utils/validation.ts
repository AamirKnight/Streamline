import Joi from 'joi';
import { ERROR_MESSAGES } from '../constants';

const passwordSchema = Joi.string()
  .min(8)
  .required()
  .messages({
    'string.min': ERROR_MESSAGES.PASSWORD_TOO_SHORT,
    'any.required': 'Password is required',
  });

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': ERROR_MESSAGES.INVALID_EMAIL,
    'any.required': 'Email is required',
  }),
  username: Joi.string().min(3).required(),
  password: passwordSchema,
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const validateRequest = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const messages = error.details.map(d => d.message);
    return { valid: false, errors: messages };
  }
  return { valid: true, value };
};