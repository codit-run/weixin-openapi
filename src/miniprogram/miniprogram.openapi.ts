import { WeixinClient } from '../core/client.js'
import type { WeixinError } from '../core/error.js'
import type { WeixinCodeSessionResponse } from '../core/types.js'

export class WeixinMiniProgramOpenAPI {
  #client: WeixinClient

  constructor(client: WeixinClient) {
    this.#client = client
  }

  get client(): WeixinClient {
    return this.#client
  }

  /**
   * Gets unlimited QR code.
   *
   * https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/qrcode-link/qr-code/getUnlimitedQRCode.html
   *
   * @throws {WeixinError}
   */
  async getUnlimitedQRCode(scene: string, options?: Partial<{
    page: string,
    check_path: boolean,
    env_version: 'release' | 'trial' | 'develop',
    width: number,
    auto_color: boolean,
    line_color: object,
    is_hyaline: boolean,
  }>) {
    const res = await this.#client.postRaw('/wxa/getwxacodeunlimit', { scene, ...options })

    return {
      type: res.headers.get('content-type') || 'image/jpeg',
      stream: res.body,
    }
  }

  /**
   * Gets session.
   *
   * @throws {WeixinError}
   */
  async getSession(code: string): Promise<WeixinCodeSessionResponse> {
    return await this.#client.createSessionFromCode(code)
  }

  /**
   * Gets daily summary.
   *
   * @param beginDate The begin date in the form of `yyyymmdd`.
   * @param endDate The begin date in the form of `yyyymmdd`.
   */
  async getDailySummary(beginDate: string, endDate: string): Promise<WeixinCodeSessionResponse> {
    return await this.#client.post('/datacube/getweanalysisappiddailysummarytrend', {
      begin_date: beginDate,
      end_date: endDate,
    })
  }
}
