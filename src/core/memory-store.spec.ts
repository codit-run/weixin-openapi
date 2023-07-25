import { test, expect } from 'vitest'
import { randomBytes } from 'node:crypto'
import { setTimeout as sleep } from 'node:timers/promises'
import { WeixinMemoryStore } from './memory-store.js'

const store = new WeixinMemoryStore()

async function createEntry(ttl = 1) {
  const { key, token } = randomKeyAndToken()
  await store.set(key, token, ttl)
  return { key, token }
}

function randomKeyAndToken() {
  const key = randomBytes(16).toString('base64url')
  const access_token = randomBytes(16).toString('base64url')
  return {
    key,
    token: { access_token },
  }
}

test('sets token', async () => {
  const { key, token } = randomKeyAndToken()
  expect(await store.set(key, token, 10)).toBeUndefined()
  expect(await store.get(key)).toStrictEqual(token)
})

test('gets nonexistent', async () => {
  expect(await store.get('nonexistent')).toBeNull()
})

test('gets existing', async () => {
  const { key, token } = await createEntry()
  expect(await store.get(key)).toStrictEqual(token)
})

test('gets expired', async () => {
  const { key, token } = await createEntry(1)

  expect(await store.get(key)).toStrictEqual(token)
  await sleep(1000)
  expect(await store.get(key)).toBeNull()
})

test('deletes nonexistent', async () => {
  expect(await store.delete('nonexistent')).toBeUndefined()
  expect(await store.get('nonexistent')).toBeNull()
})

test('deletes existing', async () => {
  const { key } = await createEntry()

  expect(await store.delete(key)).toBeUndefined()
  expect(await store.get(key)).toBeNull()
})
