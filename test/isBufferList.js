import tape from 'tape'
import { BufferList, BufferListStream } from '../BufferListStream.js'
import { Buffer } from 'node:buffer'

tape('isBufferList positives', (t) => {
  t.ok(BufferList.isBufferList(new BufferList()))
  t.ok(BufferList.isBufferList(new BufferListStream()))

  t.end()
})

tape('isBufferList negatives', (t) => {
  const types = [
    null,
    undefined,
    NaN,
    true,
    false,
    {},
    [],
    Buffer.alloc(0),
    [Buffer.alloc(0)]
  ]

  for (const obj of types) {
    t.notOk(BufferList.isBufferList(obj))
  }

  t.end()
})
