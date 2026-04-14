import { BufferList, BufferListAcceptedTypes } from './BufferList.js'

// Buffer read methods dynamically assigned to BufferList.prototype
interface BufferListReadMethods {
  readDoubleBE(offset?: number): number
  readDoubleLE(offset?: number): number
  readFloatBE(offset?: number): number
  readFloatLE(offset?: number): number
  readBigInt64BE(offset?: number): bigint
  readBigInt64LE(offset?: number): bigint
  readBigUInt64BE(offset?: number): bigint
  readBigUInt64LE(offset?: number): bigint
  readInt32BE(offset?: number): number
  readInt32LE(offset?: number): number
  readUInt32BE(offset?: number): number
  readUInt32LE(offset?: number): number
  readInt16BE(offset?: number): number
  readInt16LE(offset?: number): number
  readUInt16BE(offset?: number): number
  readUInt16LE(offset?: number): number
  readInt8(offset?: number): number
  readUInt8(offset?: number): number
  readIntBE(offset: number, byteLength: number): number
  readIntLE(offset: number, byteLength: number): number
  readUIntBE(offset: number, byteLength: number): number
  readUIntLE(offset: number, byteLength: number): number
}

// BufferList methods copied to BufferListStream.prototype at runtime
interface BufferListMethods {
  append(buf: BufferListAcceptedTypes): this
  prepend(buf: BufferListAcceptedTypes): this
  get(index: number): number | undefined
  indexOf(search: string | number | Buffer | BufferList | Uint8Array, offset?: number | string, encoding?: BufferEncoding): number
  slice(start?: number, end?: number): Buffer
  shallowSlice(start?: number, end?: number): this
  copy(dst: Buffer | null, dstStart?: number, srcStart?: number, srcEnd?: number): Buffer
  duplicate(): this
  consume(bytes: number): this
  toString(encoding?: BufferEncoding, start?: number, end?: number): string
  getBuffers(): Buffer[]
}

declare module './BufferList.js' {
  interface BufferList extends BufferListReadMethods {}
}

declare module './BufferListStream.js' {
  interface BufferListStream extends BufferListMethods, BufferListReadMethods {}
}
