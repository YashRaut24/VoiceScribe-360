const Joi = require('joi');

const registerSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
    firstName: Joi.string().trim().min(2).max(50).required(),
    lastName:Joi.string().trim().min(2).max(50).required(),
    phone:Joi.string().pattern(/^(\+\d{1,3})?[0-9]{10}$/).required(),
    userType: Joi.string().trim().lowercase().required().valid('doctor','patient','admin'),
    specialization: Joi.string().when('userType', {
    is: 'doctor',
    then: Joi.string().trim().min(2).max(100).required(),
    otherwise: Joi.forbidden()
    }),
    licenseNumber: Joi.string().when('userType', {
    is: 'doctor',
    then: Joi.string().trim().min(3).max(50).required(),
    otherwise: Joi.forbidden()
    }),
    dateOfBirth: Joi.date().when('userType', {
    is: 'patient',
    then: Joi.date().required(),
    otherwise: Joi.forbidden()
    })

});

const loginSchema = Joi.object({
    email: Joi.string().trim().lowercase().email().required(),

    password: Joi.string().required(),

    userType: Joi.string().trim().lowercase().valid('doctor', 'patient', 'admin').required()
});

module.exports = {
    registerSchema,loginSchema
};