const Joi = require('joi');

const objectId = Joi.string()
    .pattern(/^[a-fA-F0-9]{24}$/)
    .message('Must be a valid ID');

const createAppointmentSchema = Joi.object({
    doctorId: objectId.required(),

    date: Joi.date()
        .greater('now')
        .required()
        .messages({
            'date.greater': 'Appointment date must be in the future',
            'any.required': 'Appointment date is required'
        }),

    type: Joi.string()
        .valid('clinic', 'online')
        .default('clinic'),

    duration: Joi.number()
        .min(15)
        .max(120)
        .default(30),

    notes: Joi.string()
        .trim()
        .max(500)
        .optional()
        .allow('')
});

module.exports = { createAppointmentSchema };