/**
 * HTTP GET/POST, etc.
 *
 * Put fetching in a module to allow for spying & mocking.
 *
 * Exported functions that are called by others in the same module cannot be
 * mocked. See the reason: https://stackoverflow.com/a/55193363/3414249.
 */

import type {
  WeixinAccessTokenResponse,
  WeixinErrorResponse,
  WeixinCodeSessionResponse,
  WeixinCodeTokenResponse,
} from './types.js'

const API_URL = 'https://api.weixin.qq.com'

export async function request<M extends 'GET' | 'POST'>(
  method: M,
  path: string,
  accessToken: string | null,
  params: Record<string, M extends 'GET' ? string : unknown>,
): Promise<Response> {
  if (path[0] !== '/') throw new Error("Path must start with '/'")

  if (method === 'GET') {
    const queryParams = new URLSearchParams(params as Record<string, string>)
    if (accessToken)
      queryParams.set('access_token', accessToken)

    return await fetch(API_URL + path + '?' + queryParams)
  }

  if (accessToken)
    path += `?access_token=${accessToken}`

  return await fetch(API_URL + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
}

/**
 * Creates an access token using OAuth2 client credentials.
 *
 * Success response:
 * ```js
 * {
 *   access_token: '70_JW9uqqofPLfob-vhwYtdxtynLfPSjKORbM0BPToN9isXQyUbsUhF4V9TPVO2QbKBbUGFO-rPEn0f_-IuD35JgEpq2VuKsem-N_w2M8vn6FQj4X4mHDLZEOKwvAQADZeAEAEHD',
 *   expires_in: 7200,
 * }
 *
 * Error response:
 * ```js
 * {
 *   errcode: 40125,
 *   errmsg: 'invalid appsecret rid: 64b79aff-477f027c-06415867',
 * }
 * ```
 *
 * - [OpenAPI](https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/mp-access-token/getAccessToken.html)
 */
export async function createAccessToken(appid: string, secret: string): Promise<WeixinAccessTokenResponse | WeixinErrorResponse> {
  const res = await request('GET', '/cgi-bin/token', null, {
    appid,
    secret,
    grant_type: 'client_credential',
  })
  return await res.json()
}

/**
 * Creates a stable access token using OAuth2 client credentials.
 *
 * Limit:
 * - A new access token will be only generated in more than 30 seconds since
 *   the last generation.
 * - The quota is 20 times per day, if exceeded call `clear_quota` API to reset it.
 *
 * Success response:
 * ```js
 * {
 *   access_token: '70_GTSJeKUgm5yqgDjroYtToZpyOlMueufA6OU-ldrt81B--gkWgF1pgjOzCkJGqUG71DLUixGF96idq9ubfTfXGHrVO5PUrhejD0RBQHF4_acpv_iUrIWmEqc4rD4AKLaABAMWX',
 *   expires_in: 7200,
 * }
 * ```
 *
 * Quota excceded error response:
 * ```js
 * {
 *   errcode: 45009,
 *   errmsg: 'reach max api daily quota limit rid: 64b279b3-2eddb111-78605a3e'
 * }
 * ```
 *
 * - [OpenAPI](https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/mp-access-token/getStableAccessToken.html)
 */
export async function createStableAccessToken(
  appid: string,
  secret: string,
  forceRefresh = false,
): Promise<WeixinAccessTokenResponse | WeixinErrorResponse> {
  const res = await request('POST', '/cgi-bin/stable_token', null, {
    appid,
    secret,
    grant_type: 'client_credential',
    force_refresh: forceRefresh,
  })
  return await res.json() as WeixinAccessTokenResponse | WeixinErrorResponse
}

/**
 * Exchanges an authorization code for a session.
 *
 * Used for Mini Program, Mini Game, Offical Account.
 *
 * Code must be obtained from corresponding app with the given appid.
 *
 * Success response:
 * ```js
 * {
 *   session_key: 'gPXJstHE7Gviep8pOAfvZQ==',
 *   openid: 'olQ7rLmm83trKrCNaof6Gf0IkDwU',
 * }
 *
 * Error response:
 * ```js
 * {
 *   errcode: 40029,
 *   errmsg: 'invalid code, rid: 64b79592-1db719b6-187cfe77',
 * }
 *
 * {
 *   errcode: 40163,
 *   errmsg: ‘code been used, rid: 64bb7f31-356dfe4d-6348ca3b‘,
 * },
 * ```
 *
 * - [OpenAPI](https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/code2Session.html)
 */
export async function exchangeCodeForSession(appid: string, secret: string, code: string): Promise<WeixinCodeSessionResponse | WeixinErrorResponse> {
  const res = await request('GET', '/sns/jscode2session', null, {
    appid,
    secret,
    js_code: code,
    grant_type: 'authorization_code',
  })

  return await res.json() as WeixinCodeSessionResponse | WeixinErrorResponse
}

/**
 * Exchanges an authorization code for a token.
 *
 * Used for Weixin Open Platform, includes websites and native apps.
 *
 * Code must be obtained from corresponding app with the given appid.
 *
 * Success response:
 * ```js
 * {
 *   access_token: '70_Un4WQS_rXSSMlB5V_2av-30ELsG893aLocRvcCW21aAK9ol4T4Fjm7f3Qgcxlci2cHaSh5nOb6eMIPUd-F4EKXTfRseEUhkTQ9jHcWpkeTc',
 *   expires_in: 7200,
 *   refresh_token: '70_o_tiVeITRmgQjAiRmW0xGwkJy_0S8_0wx9LYYU4AsmGqXJFL2qA_1-QT2JvJO0RxLIEKAeE5Zq08s6boOdOflK-zVDs7cGn1W8DgyLX_GzM',
 *   openid: 'olQ7rLmm83trKrCNaof6Gf0IkDwU',
 *   scope: 'snsapi_login',
 *   unionid: 'oAg5pv3QsjETBuOSK1sUmqiYzpDc',
 * }
 *
 * Error response:
 * ```js
 * {
     errcode: 40163,
     errmsg: 'code been used, rid: 64ba6749-265e5bf9-42ca80e9',
 * }
 * ```
 *
 * - [OpenAPI](https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html)
 */
export async function exchangeCodeForToken(appid: string, secret: string, code: string) {
  const res = await request('GET', '/sns/oauth2/access_token', null, {
    appid,
    secret,
    code,
    grant_type: 'authorization_code',
  })

  return await res.json() as WeixinCodeTokenResponse | WeixinErrorResponse
}
