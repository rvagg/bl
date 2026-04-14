import tape from 'tape'
import { BufferList, BufferListStream } from '../BufferListStream.js'

// Methods declared in types/augment.d.ts for BufferList (read methods)
const readMethods = [
  'readDoubleBE', 'readDoubleLE',
  'readFloatBE', 'readFloatLE',
  'readBigInt64BE', 'readBigInt64LE',
  'readBigUInt64BE', 'readBigUInt64LE',
  'readInt32BE', 'readInt32LE',
  'readUInt32BE', 'readUInt32LE',
  'readInt16BE', 'readInt16LE',
  'readUInt16BE', 'readUInt16LE',
  'readInt8', 'readUInt8',
  'readIntBE', 'readIntLE',
  'readUIntBE', 'readUIntLE'
]

// Methods declared in types/augment.d.ts for BufferListStream (BufferList methods)
const bufferListMethods = [
  'append', 'prepend',
  'get', 'indexOf',
  'slice', 'shallowSlice',
  'copy', 'duplicate',
  'consume', 'toString',
  'getBuffers'
]

tape('BufferList has all augmented read methods', (t) => {
  const bl = new BufferList()
  for (const method of readMethods) {
    t.equal(typeof bl[method], 'function', `BufferList.prototype.${method} exists`)
  }
  t.end()
})

tape('BufferListStream has all augmented read methods', (t) => {
  const bls = new BufferListStream()
  for (const method of readMethods) {
    t.equal(typeof bls[method], 'function', `BufferListStream.prototype.${method} exists`)
  }
  t.end()
})

tape('BufferListStream has all augmented BufferList methods', (t) => {
  const bls = new BufferListStream()
  for (const method of bufferListMethods) {
    t.equal(typeof bls[method], 'function', `BufferListStream.prototype.${method} exists`)
  }
  t.end()
})
