import type * as _fetch from 'node-fetch'

// FIXME: No `fetch` API, see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/60924
// Remove `@types/node-fetch` when the issue is fixed
declare global {
  function fetch(url: _fetch.RequestInfo, init?: _fetch.RequestInit): Promise<_fetch.Response>
  type Response = _fetch.Response
}