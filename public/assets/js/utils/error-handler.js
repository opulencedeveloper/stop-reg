const ErrorTypes = {
    NETWORK: 'network',
    TIMEOUT: 'timeout',
    SERVER: 'server',
    UNAUTHORIZED: 'unauthorized',
    UNKNOWN: 'unknown'
};

const ErrorMessages = {
    network: {
        title: 'No Internet Connection',
        desc: 'Please check your internet connection and try again.'
    },
    timeout: {
        title: 'Request Timeout',
        desc: 'The request took too long. Please try again.'
    },
    server: {
        title: 'Server Error',
        desc: 'Something went wrong on our end. Please try again.'
    },
    unauthorized: {
        title: 'Session Expired',
        desc: 'Your session has expired. Please log in again.'
    },
    unknown: {
        title: 'Failed to load data',
        desc: 'Something went wrong. Please try again.'
    }
};

function classifyError(error, response) {
    if (!error && !response) {
        return ErrorTypes.UNKNOWN;
    }

    if (error instanceof TypeError) {
        if (error.message === 'Failed to fetch') {
            return ErrorTypes.NETWORK;
        }
        if (error.name === 'AbortError') {
            return ErrorTypes.TIMEOUT;
        }
    }

    if (response) {
        if (response.status === 401 || response.status === 403) {
            return ErrorTypes.UNAUTHORIZED;
        }
        if (response.status >= 500) {
            return ErrorTypes.SERVER;
        }
    }

    return ErrorTypes.UNKNOWN;
}

function getErrorMessage(errorType) {
    return ErrorMessages[errorType] || ErrorMessages[ErrorTypes.UNKNOWN];
}
