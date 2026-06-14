const Joi = require('joi');

const createSymptomSchema = Joi.object({
    symptomsText: Joi.string()
        .trim()
        .min(10)
        .max(2000)
        .required()
        .messages({
            'string.min': 'Please describe your symptoms in at least 10 characters',
            'string.max': 'Symptom description cannot exceed 2000 characters',
            'any.required': 'Symptom description is required',
            'string.empty': 'Symptom description cannot be empty'
        })
});

module.exports = { createSymptomSchema };