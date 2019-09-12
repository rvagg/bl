'use strict'

const tape = require('tape')
const { BufferList, BufferListStream } = require('../')
const { Buffer } = require('safe-buffer')

tape('isBufferList positives', t => {
  for (const obj of [
    new BufferList(),
    new BufferListStream()
  ]) t.ok(BufferList.isBufferList(obj))
  t.end()
})

tape('isBufferList negatives', t => {
  for (const obj of [
    null,
    undefined,
    NaN,
    true,
    false,
    {},
    [],
    Buffer.alloc(0),
    [Buffer.alloc(0)]
  ]) t.notOk(BufferList.isBufferList(obj))
  t.end()
})
