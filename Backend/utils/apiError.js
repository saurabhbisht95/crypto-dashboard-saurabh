class ApiError extends Error {
    constructor(
        statusCode,
        message = 'Something Went Wrong',
        erros = [],
        stack = ''
    )
    //override the constructor
    {
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false
        this.erros = erros

    }
}

export {ApiError}