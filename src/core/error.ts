/**
 * Common error codes:
 * https://developers.weixin.qq.com/doc/oplatform/Return_codes/Return_code_descriptions_new.html
 */

import { WeixinErrorResponse } from './types.js'

export function createError(message: string, response: WeixinErrorResponse) {
  const authCodeMessage = authcodeErrorMap(response.errcode)
  if (authCodeMessage)
    return new WeixinAuthCodeError(formatMessage(message, authCodeMessage), response)

  return new WeixinError(message, response)
}

function authcodeErrorMap(errcode: number) {
  switch (errcode) {
    case 40029: return 'invalid code'
    case 40163: return 'code has been used'
    case 42003: return 'code has expired'
  }
}

function formatMessage(title: string, detail: string): string {
  if (title.at(-1) === '.')
    return title.slice(0, -1) + ': ' + detail + '.'
  return title + ': ' + detail
}

export class WeixinError extends Error {
  readonly response: WeixinErrorResponse

  constructor(message: string, response: WeixinErrorResponse) {
    super(message, { cause: response })
    Error.captureStackTrace(this, this.constructor)
    this.name = this.constructor.name
    this.response = response
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      response: this.response,
    }
  }
}

// Some concret errors caused by client input.

export class WeixinAuthCodeError extends WeixinError { }
