import { buffer } from 'node:stream/consumers'
import type { ReadableStream } from 'node:stream/web'

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
   * - [OpenAPI](https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/qrcode-link/qr-code/getUnlimitedQRCode.html)
   *
   * @throws {WeixinError}
   */
  async getUnlimitedQRCode(scene: string, options?: Partial<{
    page: string
    check_path: boolean
    env_version: 'release' | 'trial' | 'develop'
    width: number
    auto_color: boolean
    line_color: object
    is_hyaline: boolean
  }>): Promise<{ type: string; stream: ReadableStream<Uint8Array> }> {
    const res = await this.#client.postRaw('/wxa/getwxacodeunlimit', { scene, ...options })
    return {
      type: res.headers.get('content-type') || 'image/jpeg',
      stream: res.body!,
    }
  }

  /**
   * Gets unlimited QR code in the form of [data URI](https://en.wikipedia.org/wiki/Data_URI_scheme#Syntax).
   *
   * - [OpenAPI](https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/qrcode-link/qr-code/getUnlimitedQRCode.html)
   * - [Data URI](https://en.wikipedia.org/wiki/Data_URI_scheme#Syntax).
   *
   * @throws {WeixinError}
   */
  async getUnlimitedQRCodeDataURI(scene: string, options?: Partial<{
    page: string
    check_path: boolean
    env_version: 'release' | 'trial' | 'develop'
    width: number
    auto_color: boolean
    line_color: object
    is_hyaline: boolean
  }>): Promise<string> {
    const { type, stream } = await this.getUnlimitedQRCode(scene, options)
    return await toDataURI(type, stream)
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
   * - [OpenAPI](https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/data-analysis/others/getDailySummary.html)
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

/**
 * Converts a readable stream to the Data URI `data:content/type;base64,`.
 *
 * - [Data URI Scheme](https://en.wikipedia.org/wiki/Data_URI_scheme#Syntax)
 * - [buffer consumer](https://nodejs.org/api/webstreams.html#streamconsumersbufferstream)
 */
async function toDataURI(type: string, stream: ReadableStream) {
  // @ts-ignore: `buffer` can accept global `ReadableStream` from `node:stream/web`
  const buf = await buffer(stream)
  return `data:${type};base64,${buf.toString('base64')}`
}
