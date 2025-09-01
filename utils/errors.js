class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.status = 400;
    }
}

class ProcessingError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ProcessingError';
        this.status = 500;
    }
}

module.exports = {
    ValidationError,
    ProcessingError
};
