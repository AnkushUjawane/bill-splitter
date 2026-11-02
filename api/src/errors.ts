export class HttpError extends Error {
  readonly status: 400 | 404 | 409 | 422

  constructor(status: 400 | 404 | 409 | 422, message: string) {
    super(message)
    this.status = status
  }
}
