import { beforeEach, describe, expect, it, test, vi } from 'vitest'
import { Readable } from 'node:stream'

import { WeixinClient } from '../core/client.js'
import { WeixinError } from '../core/error.js'
import { WeixinMemoryStore } from '../core/memory-store.js'
import { WeixinErrorResponse } from '../core/types.js'
import { WeixinMiniProgramOpenAPI } from './miniprogram.openapi.js'

const client = new WeixinClient({
  appid: 'appid',
  secret: 'secret',
  store: new WeixinMemoryStore()
})

const openapi = new WeixinMiniProgramOpenAPI(client)

function createResponse(data: ReadableStream | WeixinErrorResponse): Response {
  const isStream = data instanceof ReadableStream
  const body: any = isStream ? data : Readable.from([JSON.stringify(data)])
  return {
    headers: {
      get(name) {
        return isStream ? 'image/jpeg' : 'application/json'
      },
    },
    body,
    async json() { return data },
  } as Response
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.spyOn(client, 'getAccessToken').mockResolvedValue('test_access_token')
})

describe('#getUnlimitedQRCode', () => {
  it('returns a success response', async () => {
    const spy = vi.spyOn(client, 'postRaw').mockResolvedValueOnce(
      createResponse(new ReadableStream({
        start(controller) {
          controller.enqueue('abc')
          controller.close()
        },
      }))
    )
    const image = await openapi.getUnlimitedQRCode('a=hello')

    expect(image).toStrictEqual({
      type: 'image/jpeg',
      stream: expect.any(ReadableStream),
    })
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('throws an error', async () => {
    const error = new WeixinError('Creation failed.', {
      errcode: 40013,
      errmsg: 'invalid appid',
    })
    const spy = vi.spyOn(client, 'postRaw').mockRejectedValueOnce(error)

    await expect(openapi.getUnlimitedQRCode('a=hello')).rejects.toThrow('Creation failed.')
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

test('#getSession', async () => {
  const spy = vi.spyOn(client, 'createSessionFromCode').mockResolvedValueOnce({
    session_key: 'test_session_key',
    openid: 'test_openid',
  })
  const session = await openapi.getSession('authcode')

  expect(session).toStrictEqual({
    session_key: 'test_session_key',
    openid: 'test_openid',
  })
  expect(spy).toHaveBeenCalledTimes(1)
})

test('#getDailySummary', async () => {
  const spy = vi.spyOn(client, 'post').mockResolvedValueOnce({
    list: [
      {
        ref_date: '20230724',
        visit_total: 391,
        share_pv: 572,
        share_uv: 383
      },
    ],
  })
  const summary = await openapi.getDailySummary('20230724', '20230724')

  expect(summary).toStrictEqual({
    list: [
      {
        ref_date: '20230724',
        visit_total: 391,
        share_pv: 572,
        share_uv: 383
      },
    ],
  })
  expect(spy).toHaveBeenCalledTimes(1)
})
