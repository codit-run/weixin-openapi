
import { describe, expect, it } from 'vitest'
import { createError } from './error.js'

describe('createError', () => {
  it('creates an "WeixinAuthCodeError"', () => {
    const authCodeError = createError('Unable to create a session.', {
      errcode: 40029,
      errmsg: 'invalid code',
    })
    const authcodeErrorJson = {
      name: 'WeixinAuthCodeError',
      message: 'Unable to create a session: invalid code.',
      response: {
        errcode: 40029,
        errmsg: 'invalid code',
      },
    }

    expect(authCodeError.toJSON()).toStrictEqual(authcodeErrorJson)
    expect(JSON.stringify(authCodeError)).toBe(JSON.stringify(authcodeErrorJson))
    expect(authCodeError.toString()).toBe('WeixinAuthCodeError: Unable to create a session: invalid code.') // default is `${name}: ${message}`
  })

  it('creates a general "WeixinError"', () => {
    const generalError = createError('Unable to create a session.', {
      errcode: 40013,
      errmsg: 'invalid appid',
    })
    const generalErrorJson = {
      name: 'WeixinError',
      message: 'Unable to create a session.',
      response: {
        errcode: 40013,
        errmsg: 'invalid appid',
      },
    }

    expect(generalError.toJSON()).toStrictEqual(generalErrorJson)
  })
})
