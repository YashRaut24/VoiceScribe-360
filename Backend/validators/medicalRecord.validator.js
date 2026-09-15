const Joi = require('joi');

const objectId = Joi.string().pattern(/^[a-fA-F0-9]{24}$/).message('Must be a valid ID');

const createMedicalRecordSchema = Joi.object({
    patientId: objectId.required(),
    appointmentId: objectId.optional(),
    voiceTranscription: Joi.string().trim().max(5000).optional().allow(''),
    soapNotes: Joi.object({
        subjective: Joi.string().trim().max(2000).optional().allow(''),
        objective: Joi.string().trim().max(2000).optional().allow(''),
        assessment: Joi.string().trim().max(2000).optional().allow(''),
        plan: Joi.string().trim().max(2000).optional().allow('')
    }).optional(),
    diagnosis: Joi.string().trim().max(1000).optional().allow(''),
    prescription: Joi.string().trim().max(1000).optional().allow(''),
    audioFileUrl: Joi.string().optional().allow(null, '')
});

const patchMedicalRecordSchema = Joi.object({
    voiceTranscription: Joi.string().trim().max(5000).allow(''),
    soapNotes: Joi.object({
        subjective: Joi.string().trim().max(2000).allow(''),
        objective: Joi.string().trim().max(2000).allow(''),
        assessment: Joi.string().trim().max(2000).allow(''),
        plan: Joi.string().trim().max(2000).allow('')
    }),
    diagnosis: Joi.string().trim().max(1000).allow(''),
    prescription: Joi.string().trim().max(1000).allow('')
}).min(1).unknown(false);

const consultationContentSchema = Joi.object({
    transcript: Joi.string().trim().max(50000),
    soapNotes: Joi.object({
        subjective: Joi.string().trim().max(10000).allow(''),
        objective: Joi.string().trim().max(10000).allow(''),
        assessment: Joi.string().trim().max(10000).allow(''),
        plan: Joi.string().trim().max(10000).allow('')
    }).unknown(false)
}).min(1).unknown(false);

module.exports = { createMedicalRecordSchema, patchMedicalRecordSchema, consultationContentSchema };