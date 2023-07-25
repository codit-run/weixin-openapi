import { beforeEach, describe, expect, it, test, vi } from 'vitest'

import { WeixinClient } from './client.js'
import * as fetcher from './fetcher.js'
import { WeixinMemoryStore } from './memory-store.js'

vi.mock('./fetcher.js', async (): Promise<typeof fetcher> => {
  return {
    request: vi.fn(),
    createAccessToken: vi.fn(async () => ({
      access_token: 'test_access_token',
      expires_in: 7200,
    })),
    createStableAccessToken: vi.fn(async () => ({
      access_token: 'test_access_token',
      expires_in: 7200,
    })),
    exchangeCodeForSession: vi.fn(async () => ({
      session_key: 'test_session_key',
      openid: 'test_openid',
    })),
    exchangeCodeForToken: vi.fn(async () => ({
      access_token: 'test_access_token',
      expires_in: 7200,
      refresh_token: 'test_refresh_token',
      openid: 'test_openid',
      scope: 'snsapi_login',
      unionid: 'test_unionid',
    })),
  }
})

const store = new WeixinMemoryStore()

const client = new WeixinClient({
  appid: 'appid',
  secret: 'secret',
  store,
})

const successData = {
  quota: {
    daily_limit: 100000000,
    used: 7,
    remain: 99999993,
  },
}

const invalidAccessTokenData = {
  errcode: 40001,
  errmsg: 'invalid credential',
}

const quotaExeededData = {
  errcode: 45009,
  errmsg: 'daily quota limit',
}

function createResponse(data: object, raw: boolean): Response {
  return {
    headers: {
      get(name) {
        if (raw && !('errcode' in data && data.errcode !== 0))
          return 'image/jpeg'
        return 'application/json'
      },
    },
    async json() { return data },
  } as Response
}

beforeEach(async () => {
  await store._clear()
  vi.restoreAllMocks()
})

describe('#get', () => {
  it('returns success response', async () => {
    vi.mocked(fetcher.request).mockResolvedValue(createResponse(successData, false))

    const res = await client.get('/some/path', {})
    expect(res).toStrictEqual(successData)
    expect(fetcher.createAccessToken).toBeCalledTimes(1)
  })

  it('returns success response after one access token auto-retry', async () => {
    vi.mocked(fetcher.request)
      .mockResolvedValueOnce(createResponse(invalidAccessTokenData, false))
      .mockResolvedValueOnce(createResponse(successData, false))

    const res = await client.get('/some/path', {})
    expect(res).toStrictEqual(successData)
    expect(fetcher.createAccessToken).toBeCalledTimes(2)
  })

  it('throws an error after one access token auto-retry', async () => {
    vi.mocked(fetcher.request).mockResolvedValue(createResponse(invalidAccessTokenData, false))

    await expect(client.get('/some/path', {})).rejects.toThrow(/^Request to '.+' is failed.$/)
    expect(fetcher.createAccessToken).toBeCalledTimes(2)
  })

  it('throws an error without access token auto-retry', async () => {
    vi.mocked(fetcher.request).mockResolvedValue(createResponse(quotaExeededData, false))

    await expect(client.get('/some/path', {})).rejects.toThrow(/^Request to '.+' is failed.$/)
    expect(fetcher.createAccessToken).toBeCalledTimes(1)
  })
})

describe('#post', () => {
  it('returns success response', async () => {
    vi.mocked(fetcher.request).mockResolvedValue(createResponse(successData, false))

    const res = await client.post('/some/path', {})
    expect(res).toStrictEqual(successData)
    expect(fetcher.createAccessToken).toBeCalledTimes(1)
  })

  it('returns success response after one access token auto-retry', async () => {
    vi.mocked(fetcher.request)
      .mockResolvedValueOnce(createResponse(invalidAccessTokenData, false))
      .mockResolvedValueOnce(createResponse(successData, false))

    const res = await client.post('/some/path', {})
    expect(res).toStrictEqual(successData)
    expect(fetcher.createAccessToken).toBeCalledTimes(2)
  })

  it('throws an error after one access token auto-retry', async () => {
    vi.mocked(fetcher.request).mockResolvedValue(createResponse(invalidAccessTokenData, false))

    await expect(client.post('/some/path', {})).rejects.toThrow(/^Request to '.+' is failed.$/)
    expect(fetcher.createAccessToken).toBeCalledTimes(2)
  })

  it('throws an error without access token auto-retry', async () => {
    vi.mocked(fetcher.request).mockResolvedValue(createResponse(quotaExeededData, false))

    await expect(client.post('/some/path', {})).rejects.toThrow(/^Request to '.+' is failed.$/)
    expect(fetcher.createAccessToken).toBeCalledTimes(1)
  })
})

describe('#getRaw', () => {
  it('returns success response', async () => {
    vi.mocked(fetcher.request).mockResolvedValue(createResponse(successData, true))

    const res = await client.getRaw('/some/path', {})
    expect(await res.json()).toStrictEqual(successData)
    expect(fetcher.createAccessToken).toBeCalledTimes(1)
  })

  it('returns success response after one access token auto-retry', async () => {
    vi.mocked(fetcher.request)
      .mockResolvedValueOnce(createResponse(invalidAccessTokenData, true))
      .mockResolvedValueOnce(createResponse(successData, true))

    const res = await client.getRaw('/some/path', {})
    expect(await res.json()).toStrictEqual(successData)
    expect(fetcher.createAccessToken).toBeCalledTimes(2)
  })

  it('throws an error after one access token auto-retry', async () => {
    vi.mocked(fetcher.request).mockResolvedValue(createResponse(invalidAccessTokenData, true))

    await expect(client.getRaw('/some/path', {})).rejects.toThrow(/^Request to '.+' is failed.$/)
    expect(fetcher.createAccessToken).toBeCalledTimes(2)
  })

  it('throws an error without access token auto-retry', async () => {
    vi.mocked(fetcher.request).mockResolvedValue(createResponse(quotaExeededData, true))

    await expect(client.getRaw('/some/path', {})).rejects.toThrow(/^Request to '.+' is failed.$/)
    expect(fetcher.createAccessToken).toBeCalledTimes(1)
  })
})

describe('#postRaw', () => {
  it('returns success response', async () => {
    vi.mocked(fetcher.request).mockResolvedValue(createResponse(successData, true))

    const res = await client.postRaw('/some/path', {})
    expect(await res.json()).toStrictEqual(successData)
    expect(fetcher.createAccessToken).toBeCalledTimes(1)
  })

  it('returns success response after one access token auto-retry', async () => {
    vi.mocked(fetcher.request)
      .mockResolvedValueOnce(createResponse(invalidAccessTokenData, true))
      .mockResolvedValueOnce(createResponse(successData, true))

    const res = await client.postRaw('/some/path', {})
    expect(await res.json()).toStrictEqual(successData)
    expect(fetcher.createAccessToken).toBeCalledTimes(2)
  })

  it('throws an error after one access token auto-retry', async () => {
    vi.mocked(fetcher.request).mockResolvedValue(createResponse(invalidAccessTokenData, true))

    await expect(client.postRaw('/some/path', {})).rejects.toThrow(/^Request to '.+' is failed.$/)
    expect(fetcher.createAccessToken).toBeCalledTimes(2)
  })

  it('throws an error without access token auto-retry', async () => {
    vi.mocked(fetcher.request).mockResolvedValue(createResponse(quotaExeededData, true))

    await expect(client.postRaw('/some/path', {})).rejects.toThrow(/^Request to '.+' is failed.$/)
    expect(fetcher.createAccessToken).toBeCalledTimes(1)
  })
})

describe('#getAccessToken', () => {
  it('returns a token', async () => {
    vi.mocked(fetcher.createAccessToken)
      .mockResolvedValueOnce({ access_token: 'test_access_token1', expires_in: 7200 })
      .mockResolvedValueOnce({ access_token: 'test_access_token2', expires_in: 7200 })
      .mockResolvedValueOnce({ access_token: 'test_access_token3', expires_in: 7200 })

    const accessToken = await client.getAccessToken()

    expect(accessToken).toBe('test_access_token1')
    expect(fetcher.createAccessToken).toBeCalledTimes(1)

    const accessToken2 = await client.getAccessToken() // get again
    expect(accessToken2).toBe(accessToken) // not changed, cache hits
    expect(fetcher.createAccessToken).toBeCalledTimes(1)

    const accessToken3 = await client.getAccessToken(true) // force refresh
    expect(accessToken3).toBe('test_access_token2')
    expect(fetcher.createAccessToken).toBeCalledTimes(2)
  })

  it('throws an error', async () => {
    vi.mocked(fetcher.createAccessToken).mockResolvedValueOnce({
      errcode: 40125,
      errmsg: 'invalid appsecret rid: 64b79aff-477f027c-06415867',
    })
    await expect(client.getAccessToken()).rejects.toThrow('Unable to get an access token.')
    expect(fetcher.createAccessToken).toBeCalledTimes(1)
  })
})

describe('#getStableAccessToken', () => {
  it('returns a token', async () => {
    vi.mocked(fetcher.createStableAccessToken)
      .mockResolvedValueOnce({ access_token: 'test_access_token1', expires_in: 7200 })
      .mockResolvedValueOnce({ access_token: 'test_access_token2', expires_in: 7200 })
      .mockResolvedValueOnce({ access_token: 'test_access_token3', expires_in: 7200 })

    const accessToken = await client.getStableAccessToken()

    expect(accessToken).toBe('test_access_token1')
    expect(fetcher.createStableAccessToken).toBeCalledTimes(1)

    const accessToken2 = await client.getStableAccessToken() // get again
    expect(accessToken2).toBe(accessToken) // not changed, cache hits
    expect(fetcher.createStableAccessToken).toBeCalledTimes(1)

    // Limit: 20/day quota and 1/30s rate limit
    const accessToken3 = await client.getStableAccessToken(true)
    expect(accessToken3).toBe('test_access_token2')
    expect(fetcher.createStableAccessToken).toBeCalledTimes(2)
  })

  it('throws an error', async () => {
    vi.mocked(fetcher.createStableAccessToken).mockResolvedValueOnce({
      errcode: 45009,
      errmsg: 'reach max api daily quota limit rid: 64b279b3-2eddb111-78605a3e',
    })
    await expect(client.getStableAccessToken()).rejects.toThrow('Unable to get a stable access token.')
    expect(fetcher.createStableAccessToken).toBeCalledTimes(1)
  })
})

describe('#createSessionFromCode', () => {
  it('returns session', async () => {
    const session = await client.createSessionFromCode('authcode')

    expect(session).toStrictEqual({
      session_key: 'test_session_key',
      openid: 'test_openid',
    })
    expect(fetcher.exchangeCodeForSession).toBeCalledTimes(1)
  })

  it('throws an error', async () => {
    vi.mocked(fetcher.exchangeCodeForSession).mockResolvedValueOnce({
      errcode: 40029,
      errmsg: 'invalid code, rid: 64b797fc-1d6a3114-6740d76e',
    })
    await expect(client.createSessionFromCode('authcode')).rejects.toThrow('Unable to create a session from an authorization code: invalid code.')
    expect(fetcher.exchangeCodeForSession).toBeCalledTimes(1)
  })
})

describe('#createTokenFromCode', () => {
  it('returns an access token', async () => {
    const token = await client.createTokenFromCode('authcode')

    expect(token).toStrictEqual({
      access_token: 'test_access_token',
      expires_in: 7200,
      refresh_token: 'test_refresh_token',
      openid: 'test_openid',
      scope: 'snsapi_login',
      unionid: 'test_unionid',
    })
    expect(fetcher.exchangeCodeForToken).toBeCalledTimes(1)
  })

  it('throws an error', async () => {
    vi.mocked(fetcher.exchangeCodeForToken).mockResolvedValueOnce({
      errcode: 40163,
      errmsg: 'code been used, rid: 64ba6749-265e5bf9-42ca80e9',
    })
    await expect(client.createTokenFromCode('authcode')).rejects.toThrow('Unable to create a token from an authorization code: code has been used.')
    expect(fetcher.exchangeCodeForToken).toBeCalledTimes(1)
  })
})

test('#getAPIQuota', async () => {
  const spy = vi.spyOn(client, 'post').mockResolvedValueOnce({
    quota: {
      daily_limit: 100000000,
      used: 7,
      remain: 99999993,
    },
  })
  const quota = await client.getAPIQuota('authcode')

  expect(quota).toStrictEqual({
    daily_limit: 100000000,
    used: 7,
    remain: 99999993,
  })
  expect(spy).toHaveBeenCalledTimes(1)
})
