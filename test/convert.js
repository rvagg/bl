'use strict'

const tape = require('tape')
const { BufferList, BufferListStream } = require('../')
const { Buffer } = require('safe-buffer')

tape('convert from BufferList to BufferListStream', t => {
  const data = Buffer.from(`TEST-${Date.now()}`)
  const bl = new BufferList(data)
  const bls = new BufferListStream(bl)
  t.equal(bl.slice(), bls.slice())
  t.end()
})

tape('convert from BufferListStream to BufferList', t => {
  const data = Buffer.from(`TEST-${Date.now()}`)
  const bls = new BufferListStream(data)
  const bl = new BufferList(bls)
  t.equal(bl.slice(), bls.slice())
  t.end()
})
