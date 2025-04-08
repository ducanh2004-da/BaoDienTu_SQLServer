const Joi = require('joi');

const escapeHTML = (value, helpers) => {
    const sanitized = value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    if (sanitized !== value) {
        return helpers.error('string.escapeHTML', { value });
    }
    return sanitized;
};

const customJoi = Joi.extend((joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} không được chứa ký tự HTML không an toàn!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                return escapeHTML(value, helpers);
            }
        }
    }
}));

module.exports = customJoi;
