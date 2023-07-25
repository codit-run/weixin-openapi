export interface WeixinOptions {
  appid: string
  secret: string
  store: WeixinTokenStore
}

export interface WeixinErrorResponse {
  errcode: number
  errmsg: string
}

export interface WeixinAccessTokenResponse {
  access_token: string
  expires_in: number // 2 hours in seconds
}

export interface WeixinCodeSessionResponse {
  session_key: string
  unionid?: string
  openid: string
}

// TODO: To refresh access token by using `refresh_token` or fallback to the standard OAuth flow.
// https://developers.weixin.qq.com/doc/oplatform/Website_App/WeChat_Login/Wechat_Login.html
// https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens
export interface WeixinCodeTokenResponse {
  access_token: string  // 2 hours in seconds
  refresh_token: string // 30 days
  expires_in: number
  openid: string
  unionid?: string
  scope: string
}

export interface WeixinToken {
  access_token: string
  refresh_token?: string
}

export interface WeixinTokenStore<T extends WeixinToken = WeixinToken> {
  /**
   * Gets token.
   */
  get(key: string): Promise<T | null>

  /**
   * Sets token.
   */
  set(key: string, token: T, ttl: number): Promise<void>

  /**
   * Delete token.
   */
  delete(key: string): Promise<void>
}

export interface WeixinAPIQuota {
  daily_limit: number
  used: number
  remain: number
}
