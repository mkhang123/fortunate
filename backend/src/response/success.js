class OKResponse {
    constructor({ message = "Success", metadata = {} }) {
        this.message = message;
        this.status = 200;
        this.metadata = metadata;
    }

    send(res) {
        return res.status(this.status).json(this);
    }
}

class CreatedResponse {
    constructor({ message = "Created", metadata = {} }) {
        this.message = message;
        this.status = 201;
        this.metadata = metadata;
    }

    send(res) {
        return res.status(this.status).json(this);
    }
}

export { OKResponse, CreatedResponse };
