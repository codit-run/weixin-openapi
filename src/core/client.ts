
import { createError, type WeixinError } from './error.js'
import * as fetcher from './fetcher.js'
import type {
  WeixinAPIQuota,
  WeixinErrorResponse,
  WeixinCodeSessionResponse,
  WeixinCodeTokenResponse,
  WeixinOptions,
} from './types.js'

/**
 * Weixin Client with access token auto-retry.
 */
export class WeixinClient {
  #options: WeixinOptions

  constructor(options: WeixinOptions) {
    this.#options = options
  }

  /**
   * HTTP GET
   *
   * @throws {WeixinError}
   */
  async get<T extends object>(path: string, query: Record<string, string>): Promise<T> {
    return await this.#request('GET', path, query)
  }

  /**
   * HTTP POST
   *
   * @throws {WeixinError}
   */
  async post<T extends object>(path: string, body: Record<string, unknown>): Promise<T> {
    return await this.#request('POST', path, body)
  }

  /**
   * HTTP GET. The raw `Response` object is returned.
   *
   * @throws {WeixinError}
   */
  async getRaw(path: string, query: Record<string, string>): Promise<Response> {
    return this.#raw('GET', path, query)
  }

  /**
   * HTTP POST. The raw `Response` object is returned.
   *
   * @throws {WeixinError}
   */
  async postRaw(path: string, body: Record<string, unknown>): Promise<Response> {
    return await this.#raw('POST', path, body)
  }

  /**
   * HTTP request.
   *
   * Invalid access token error:
   * ```js
   * {
   *   errcode: 40001,
   *   errmsg: 'invalid credential, access_token is invalid or not latest, could get access_token by getStableAccessToken, more details at https://mmbizurl.cn/s/JtxxFh33r rid: 64b37c9e-5128bd63-39bd9581',
   * }
   * ```
   *
   * @throws {WeixinError}
   */
  async #request<M extends 'GET' | 'POST', T extends object>(
    method: M,
    path: string,
    params: Record<string, M extends 'GET' ? string : unknown>,
    isRetry = false,
  ): Promise<T> {
    const accessToken = await this.getAccessToken()
    const res = await fetcher.request(method, path, accessToken, params)
    const data = await res.json() as T | WeixinErrorResponse

    if (('errcode' in data && data.errcode !== 0)) {
      if (!isRetry && data.errcode === 40001) { // access token is invalid, will retry once
        await this.getAccessToken(true)
        return this.#request(method, path, params, true)
      }

      throw createError(`Request to '${path}' is failed.`, data)
    }

    return data as T
  }

  /**
   * HTTP raw request.
   *
   * @throws {WeixinError}
   */
  async #raw<M extends 'GET' | 'POST'>(
    method: M,
    path: string,
    params: Record<string, M extends 'GET' ? string : unknown>,
    isRetry = false,
  ): Promise<Response> {
    const accessToken = await this.getAccessToken()
    const res = await fetcher.request(method, path, accessToken, params)

    if (res.headers.get('content-type')?.startsWith('application/json')) { // an error arises
      const data = await res.json() as WeixinErrorResponse
      if (!isRetry && data.errcode === 40001) { // access token is invalid, will retry once
        await this.getAccessToken(true)
        return this.#raw(method, path, params, true)
      }

      throw createError(`Request to '${path}' is failed.`, data)
    }

    return res
  }

  /**
   * Gets an access token.
   *
   * @throws {WeixinError}
   */
  async getAccessToken(forceRefresh = false): Promise<string> {
    const { appid, secret, store } = this.#options
    const key = compositeKey(appid, secret.slice(0, 6), false)

    if (forceRefresh) {
      await store.delete(key)
    } else {
      const cachedToken = await store.get(key)
      if (cachedToken) return cachedToken.access_token
    }

    const data = await fetcher.createAccessToken(appid, secret)
    if ('access_token' in data) {
      const access_token = data.access_token
      const ttl = data.expires_in - 10
      await store.set(key, { access_token }, ttl)
      return access_token
    }

    throw createError('Unable to get an access token.', data)
  }

  /**
   * Gets a stable access token.
   *
   * @throws {WeixinError}
   */
  async getStableAccessToken(forceRefresh = false): Promise<string> {
    const { appid, secret, store } = this.#options
    const key = compositeKey(appid, secret.slice(0, 6), true)

    if (forceRefresh) {
      await store.delete(key)
    } else {
      const cachedToken = await store.get(key)
      if (cachedToken) return cachedToken.access_token
    }

    const data = await fetcher.createStableAccessToken(appid, secret, forceRefresh)
    if ('access_token' in data) {
      const access_token = data.access_token
      const ttl = data.expires_in - 10
      await store.set(key, { access_token }, ttl)
      return access_token
    }

    throw createError('Unable to get a stable access token.', data)
  }

  /**
   * Creates a session from an authorization code.
   *
   * @throws {WeixinError}
   */
  async createSessionFromCode(code: string): Promise<WeixinCodeSessionResponse> {
    const { appid, secret } = this.#options
    const data = await fetcher.exchangeCodeForSession(appid, secret, code)
    // What to do with `session_key`?
    if ('openid' in data)
      return data

    throw createError('Unable to create a session from an authorization code.', data)
  }

  /**
   * Creates a token from an authorization code.
   *
   * [Refresh Tokens with OAuth 2.0](https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens)
   *
   * @throws {WeixinError}
   */
  async createTokenFromCode(code: string): Promise<WeixinCodeTokenResponse> {
    const { appid, secret } = this.#options
    const data = await fetcher.exchangeCodeForToken(appid, secret, code)
    // What to do with `access_token`, 'refresh_token'?
    if ('openid' in data)
      return data

    throw createError('Unable to create a token from an authorization code.', data)
  }

  /****** Common APIs ******/

  /**
   * Gets API quota.
   *
   * https://developers.weixin.qq.com/doc/offiaccount/openApi/get_api_quota.html
   *
   * @param path API path starting with '/'.
   *
   * @throws {WeixinError}
   */
  async getAPIQuota(path: string): Promise<WeixinAPIQuota> {
    const data = await this.post<{ quota: WeixinAPIQuota }>('/cgi-bin/openapi/quota/get', {
      cgi_path: path,
    })

    return data.quota
  }
}

/**
 * Gets a composite key from the given appid and secret.
 *
 * Tokens will be invalidated when `secret` is chanaged, then the `secret` is
 * involved to compute the composite key.
 */
function compositeKey(appid: string, secret: string, stable: boolean) {
  // Truncate the secret to hide details and shorten the composite key.
  return appid + ':' + secret.slice(0, 6) + (stable ? ':stable' : '')
}
