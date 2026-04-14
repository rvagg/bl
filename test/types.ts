// Type-level test: verifies augmented types are correct.
// Run with: tsc --noEmit test/types.ts
// If this file fails to compile, the type augmentations are out of sync.

import { BufferListStream, BufferList } from '../types/index.js'

// -- Conformance with Buffer read methods --
// Assert that BufferList's read methods are callable with the same
// signatures as Buffer's. If @types/node changes a signature, this
// section will fail to compile.
type AssertConforms<_Bl extends _Buf, _Buf> = true

type _FixedRead = AssertConforms<
  { [K in
    | 'readDoubleBE' | 'readDoubleLE'
    | 'readFloatBE' | 'readFloatLE'
    | 'readBigInt64BE' | 'readBigInt64LE'
    | 'readBigUInt64BE' | 'readBigUInt64LE'
    | 'readInt32BE' | 'readInt32LE'
    | 'readUInt32BE' | 'readUInt32LE'
    | 'readInt16BE' | 'readInt16LE'
    | 'readUInt16BE' | 'readUInt16LE'
    | 'readInt8' | 'readUInt8'
  ]: BufferList[K] },
  { [K in
    | 'readDoubleBE' | 'readDoubleLE'
    | 'readFloatBE' | 'readFloatLE'
    | 'readBigInt64BE' | 'readBigInt64LE'
    | 'readBigUInt64BE' | 'readBigUInt64LE'
    | 'readInt32BE' | 'readInt32LE'
    | 'readUInt32BE' | 'readUInt32LE'
    | 'readInt16BE' | 'readInt16LE'
    | 'readUInt16BE' | 'readUInt16LE'
    | 'readInt8' | 'readUInt8'
  ]: Buffer[K] }
>

type _VariableRead = AssertConforms<
  { [K in 'readIntBE' | 'readIntLE' | 'readUIntBE' | 'readUIntLE']: BufferList[K] },
  { [K in 'readIntBE' | 'readIntLE' | 'readUIntBE' | 'readUIntLE']: Buffer[K] }
>

// Verify return types match Buffer
declare const buf: Buffer
declare const bl: BufferList
const _br: ReturnType<typeof buf.readUInt16BE> = bl.readUInt16BE(0)
const _bbr: ReturnType<typeof buf.readBigInt64BE> = bl.readBigInt64BE(0)
const _bfr: ReturnType<typeof buf.readDoubleBE> = bl.readDoubleBE(0)

// -- BufferList basic API --
const bl2 = new BufferList()
const _a1: BufferList = bl2.append(Buffer.from('test'))
const _a2: BufferList = bl2.prepend(Buffer.from('test'))
const _g: number | undefined = bl2.get(0)
const _s: Buffer = bl2.slice(0, 2)
const _ss: BufferList = bl2.shallowSlice(0, 2)
const _c: Buffer = bl2.copy(Buffer.alloc(4), 0, 0, 4)
const _d: BufferList = bl2.duplicate()
const _co: BufferList = bl2.consume(2)
const _ts: string = bl2.toString('utf8', 0, 2)
const _io: number = bl2.indexOf('test')
const _io2: number = bl2.indexOf(Buffer.from('x'), 0, 'utf8')
const _gb: Buffer[] = bl2.getBuffers()
const _l: number = bl2.length
const _ib: boolean = BufferList.isBufferList(bl2)

// -- BufferListStream has both Duplex and BufferList APIs --
const bls = new BufferListStream()
const _sa: BufferListStream = bls.append(Buffer.from('test'))
const _sp: BufferListStream = bls.prepend(Buffer.from('test'))
const _sg: number | undefined = bls.get(0)
const _sslice: Buffer = bls.slice(0, 2)
const _sss: BufferListStream = bls.shallowSlice(0, 2)
const _sco: BufferListStream = bls.consume(2)
const _sd: BufferListStream = bls.duplicate()
const _sts: string = bls.toString('utf8', 0, 2)
const _sio: number = bls.indexOf('test')
const _sgb: Buffer[] = bls.getBuffers()
const _sru: number = bls.readUInt16BE(0)
const _srb: bigint = bls.readBigInt64BE(0)
const _srib: number = bls.readIntBE(0, 4)

// Duplex stream methods
bls.pipe(process.stdout)
bls.write(Buffer.from('hello'))
bls.end()

// isBufferList
const _sib: boolean = BufferListStream.isBufferList(bls)
