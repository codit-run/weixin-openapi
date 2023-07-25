import type { WeixinToken, WeixinTokenStore } from './types.js'

interface Token<T extends WeixinToken> {
  data: T
  expiresAt: number
}

/**
 * A token store in memory.
 */
export class WeixinMemoryStore<T extends WeixinToken> implements WeixinTokenStore<T> {
  tokens: Record<string, Token<T>> = Object.create(null)

  async get(key: string): Promise<T | null> {
    return new Promise<T | null>((resolve, _) => {
      setImmediate(() => {
        const data = this.#getTokenData(key)
        resolve(data)
      })
    })
  }

  async set(key: string, token: T, ttl: number): Promise<void> {
    return new Promise((resolve, _) => {
      setImmediate(() => {
        this.tokens[key] = {
          data: token,
          expiresAt: Date.now() + ttl * 1000
        }
        resolve()
      })
    })
  }

  async delete(key: string): Promise<void> {
    return new Promise((resolve, _) => {
      setImmediate(() => {
        delete this.tokens[key]
        resolve()
      })
    })
  }

  #getTokenData(key: string): T | null {
    const token = this.tokens[key]
    if (!token) return null

    if (token.expiresAt <= Date.now()) {
      // Destroy expired token.
      delete this.tokens[key]
      return null
    }

    return token.data
  }

  /**
   * Clears all the tokens. Internal use.
   * @private
   */
  _clear() {
    this.tokens = Object.create(null)
  }
}
