import { Buffer } from 'node:buffer'

/**
 * @typedef {Buffer | BufferList | Uint8Array | Array<Buffer | BufferList | Uint8Array | string | number> | string | number} BufferListAcceptedTypes
 */

const symbol = Symbol.for('BufferList')

export class BufferList {
  /** @param {BufferListAcceptedTypes} [buf] */
  constructor (buf) {
    /** @type {Buffer[]} */
    this._bufs = []
    /** @type {number} */
    this.length = 0
    Object.defineProperty(this, symbol, { value: true })
    if (buf) {
      this.append(buf)
    }
  }

  /** @param {BufferListAcceptedTypes} [buf] */
  _new (buf) {
    return new BufferList(buf)
  }

  /**
   * @param {number} offset
   * @returns {[number, number]}
   */
  _offset (offset) {
    if (offset === 0 || this._bufs.length === 0) {
      return [0, 0]
    }

    let tot = 0

    for (let i = 0; i < this._bufs.length; i++) {
      const _t = tot + this._bufs[i].length
      if (offset < _t || i === this._bufs.length - 1) {
        return [i, offset - tot]
      }
      tot = _t
    }

    return [0, 0]
  }

  /**
   * @param {[number, number]} blOffset
   * @returns {number}
   */
  _reverseOffset (blOffset) {
    const bufferId = blOffset[0]
    let offset = blOffset[1]

    for (let i = 0; i < bufferId; i++) {
      offset += this._bufs[i].length
    }

    return offset
  }

  /** @returns {Buffer[]} */
  getBuffers () {
    return this._bufs
  }

  /**
   * @param {number} index
   * @returns {number | undefined}
   */
  get (index) {
    if (index > this.length || index < 0) {
      return undefined
    }

    const offset = this._offset(index)

    return this._bufs[offset[0]][offset[1]]
  }

  /**
   * @param {number} [start]
   * @param {number} [end]
   * @returns {Buffer}
   */
  slice (start, end) {
    if (typeof start === 'number' && start < 0) {
      start += this.length
    }

    if (typeof end === 'number' && end < 0) {
      end += this.length
    }

    return this.copy(null, 0, start, end)
  }

  /**
   * @param {Buffer | null} dst
   * @param {number} [dstStart]
   * @param {number} [srcStart]
   * @param {number} [srcEnd]
   * @returns {Buffer}
   */
  copy (dst, dstStart, srcStart, srcEnd) {
    if (typeof srcStart !== 'number' || srcStart < 0) {
      srcStart = 0
    }

    if (typeof srcEnd !== 'number' || srcEnd > this.length) {
      srcEnd = this.length
    }

    if (srcStart >= this.length) {
      return dst || Buffer.alloc(0)
    }

    if (srcEnd <= 0) {
      return dst || Buffer.alloc(0)
    }

    const copy = !!dst
    const off = this._offset(srcStart)
    const len = srcEnd - srcStart
    let bytes = len
    let bufoff = (copy && dstStart) || 0
    let start = off[1]

    // copy/slice everything
    if (srcStart === 0 && srcEnd === this.length) {
      if (!copy) {
        // slice, but full concat if multiple buffers
        return this._bufs.length === 1
          ? this._bufs[0]
          : Buffer.concat(/** @type {any} */ (this._bufs), this.length)
      }

      // copy, need to copy individual buffers
      const d = /** @type {any} */ (dst)
      for (let i = 0; i < this._bufs.length; i++) {
        this._bufs[i].copy(d, bufoff)
        bufoff += this._bufs[i].length
      }

      return d
    }

    // easy, cheap case where it's a subset of one of the buffers
    if (bytes <= this._bufs[off[0]].length - start) {
      if (!copy) {
        return this._bufs[off[0]].slice(start, start + bytes)
      }
      this._bufs[off[0]].copy(/** @type {any} */ (dst), dstStart, start, start + bytes)
      return /** @type {Buffer} */ (dst)
    }

    if (!copy) {
      // a slice, we need something to copy in to
      dst = Buffer.allocUnsafe(len)
    }

    const target = /** @type {any} */ (dst)

    for (let i = off[0]; i < this._bufs.length; i++) {
      const l = this._bufs[i].length - start

      if (bytes > l) {
        this._bufs[i].copy(target, bufoff, start)
        bufoff += l
      } else {
        this._bufs[i].copy(target, bufoff, start, start + bytes)
        bufoff += l
        break
      }

      bytes -= l

      if (start) {
        start = 0
      }
    }

    // safeguard so that we don't return uninitialized memory
    if (target.length > bufoff) return target.slice(0, bufoff)

    return target
  }

  /**
   * @param {number} [start]
   * @param {number} [end]
   * @returns {BufferList}
   */
  shallowSlice (start, end) {
    start = start || 0
    end = typeof end !== 'number' ? this.length : end

    if (start < 0) {
      start += this.length
    }

    if (end < 0) {
      end += this.length
    }

    if (start === end) {
      return this._new()
    }

    const startOffset = this._offset(start)
    const endOffset = this._offset(end)
    const buffers = this._bufs.slice(startOffset[0], endOffset[0] + 1)

    if (endOffset[1] === 0) {
      buffers.pop()
    } else {
      buffers[buffers.length - 1] = buffers[buffers.length - 1].slice(0, endOffset[1])
    }

    if (startOffset[1] !== 0) {
      buffers[0] = buffers[0].slice(startOffset[1])
    }

    return this._new(buffers)
  }

  /**
   * @param {BufferEncoding} [encoding]
   * @param {number} [start]
   * @param {number} [end]
   * @returns {string}
   */
  toString (encoding, start, end) {
    return this.slice(start, end).toString(encoding)
  }

  /**
   * @param {number} bytes
   * @returns {this}
   */
  consume (bytes) {
    // first, normalize the argument, in accordance with how Buffer does it
    bytes = Math.trunc(bytes)
    // do nothing if not a positive number
    if (Number.isNaN(bytes) || bytes <= 0) return this

    while (this._bufs.length) {
      if (bytes >= this._bufs[0].length) {
        bytes -= this._bufs[0].length
        this.length -= this._bufs[0].length
        this._bufs.shift()
      } else {
        this._bufs[0] = this._bufs[0].slice(bytes)
        this.length -= bytes
        break
      }
    }

    return this
  }

  /** @returns {BufferList} */
  duplicate () {
    const copy = this._new()

    for (let i = 0; i < this._bufs.length; i++) {
      copy.append(this._bufs[i])
    }

    return copy
  }

  /**
   * @param {BufferListAcceptedTypes} buf
   * @returns {this}
   */
  append (buf) {
    return this._attach(buf, BufferList.prototype._appendBuffer)
  }

  /**
   * @param {BufferListAcceptedTypes} buf
   * @returns {this}
   */
  prepend (buf) {
    return this._attach(buf, BufferList.prototype._prependBuffer, true)
  }

  /**
   * @param {BufferListAcceptedTypes} buf
   * @param {(this: BufferList, buf: Buffer) => void} attacher
   * @param {boolean} [prepend]
   * @returns {this}
   */
  _attach (buf, attacher, prepend) {
    if (buf == null) {
      return this
    }

    if (typeof buf === 'object' && 'buffer' in buf) {
      // append/prepend a view of the underlying ArrayBuffer
      const view = /** @type {Uint8Array} */ (buf)
      attacher.call(this, Buffer.from(view.buffer, view.byteOffset, view.byteLength))
    } else if (Array.isArray(buf)) {
      const [starting, modifier] = prepend ? [buf.length - 1, -1] : [0, 1]

      for (let i = starting; i >= 0 && i < buf.length; i += modifier) {
        this._attach(buf[i], attacher, prepend)
      }
    } else if (this._isBufferList(buf)) {
      // unwrap argument into individual BufferLists
      const [starting, modifier] = prepend ? [buf._bufs.length - 1, -1] : [0, 1]

      for (let i = starting; i >= 0 && i < buf._bufs.length; i += modifier) {
        this._attach(buf._bufs[i], attacher, prepend)
      }
    } else {
      // coerce number arguments to strings, since Buffer(number) does
      // uninitialized memory allocation
      if (typeof buf === 'number') {
        buf = buf.toString()
      }

      attacher.call(this, Buffer.from(/** @type {string} */ (buf)))
    }

    return this
  }

  /** @param {Buffer} buf */
  _appendBuffer (buf) {
    this._bufs.push(buf)
    this.length += buf.length
  }

  /** @param {Buffer} buf */
  _prependBuffer (buf) {
    this._bufs.unshift(buf)
    this.length += buf.length
  }

  /**
   * @param {string | number | Buffer | BufferList | Uint8Array} search
   * @param {number | string} [offset]
   * @param {BufferEncoding} [encoding]
   * @returns {number}
   */
  indexOf (search, offset, encoding) {
    if (encoding === undefined && typeof offset === 'string') {
      encoding = /** @type {BufferEncoding} */ (offset)
      offset = undefined
    }

    if (typeof search === 'function' || Array.isArray(search)) {
      throw new TypeError('The "value" argument must be one of type string, Buffer, BufferList, or Uint8Array.')
    } else if (typeof search === 'number') {
      search = Buffer.from([search])
    } else if (typeof search === 'string') {
      search = Buffer.from(search, encoding)
    } else if (this._isBufferList(search)) {
      search = search.slice()
    } else if (Array.isArray(/** @type {any} */ (search).buffer)) {
      search = Buffer.from(/** @type {any} */ (search).buffer, /** @type {any} */ (search).byteOffset, /** @type {any} */ (search).byteLength)
    } else if (!Buffer.isBuffer(search)) {
      search = Buffer.from(/** @type {any} */ (search))
    }

    offset = Number(offset || 0)

    if (isNaN(offset)) {
      offset = 0
    }

    if (offset < 0) {
      offset = this.length + offset
    }

    if (offset < 0) {
      offset = 0
    }

    if (search.length === 0) {
      return offset > this.length ? this.length : offset
    }

    const blOffset = this._offset(offset)
    let blIndex = blOffset[0] // index of which internal buffer we're working on
    let buffOffset = blOffset[1] // offset of the internal buffer we're working on

    // scan over each buffer
    for (; blIndex < this._bufs.length; blIndex++) {
      const buff = this._bufs[blIndex]

      while (buffOffset < buff.length) {
        const availableWindow = buff.length - buffOffset

        if (availableWindow >= search.length) {
          const nativeSearchResult = buff.indexOf(/** @type {any} */ (search), buffOffset)

          if (nativeSearchResult !== -1) {
            return this._reverseOffset([blIndex, nativeSearchResult])
          }

          buffOffset = buff.length - search.length + 1 // end of native search window
        } else {
          const revOffset = this._reverseOffset([blIndex, buffOffset])

          if (this._match(revOffset, search)) {
            return revOffset
          }

          buffOffset++
        }
      }

      buffOffset = 0
    }

    return -1
  }

  /**
   * @param {number} offset
   * @param {Buffer} search
   * @returns {boolean}
   */
  _match (offset, search) {
    if (this.length - offset < search.length) {
      return false
    }

    for (let searchOffset = 0; searchOffset < search.length; searchOffset++) {
      if (this.get(offset + searchOffset) !== search[searchOffset]) {
        return false
      }
    }
    return true
  }

  // Used internally by the class and also as an indicator of this object being
  // a `BufferList`. It's not possible to use `instanceof BufferList` in a browser
  // environment because there could be multiple different copies of the
  // BufferList class and some `BufferList`s might be `BufferList`s.
  /**
   * @param {any} b
   * @returns {b is BufferList}
   */
  _isBufferList (b) {
    return b instanceof BufferList || BufferList.isBufferList(b)
  }

  /**
   * @param {any} b
   * @returns {boolean}
   */
  static isBufferList (b) {
    return b != null && b[symbol]
  }
}

// Add all the Buffer read methods
/** @type {Record<string, number | null>} */
const methods = {
  readDoubleBE: 8,
  readDoubleLE: 8,
  readFloatBE: 4,
  readFloatLE: 4,
  readBigInt64BE: 8,
  readBigInt64LE: 8,
  readBigUInt64BE: 8,
  readBigUInt64LE: 8,
  readInt32BE: 4,
  readInt32LE: 4,
  readUInt32BE: 4,
  readUInt32LE: 4,
  readInt16BE: 2,
  readInt16LE: 2,
  readUInt16BE: 2,
  readUInt16LE: 2,
  readInt8: 1,
  readUInt8: 1,
  readIntBE: null,
  readIntLE: null,
  readUIntBE: null,
  readUIntLE: null
}

for (const m in methods) {
  const size = methods[m]
  if (size === null) {
    /** @type {any} */ (BufferList.prototype)[m] = function (/** @type {number} */ offset, /** @type {number} */ byteLength) {
      return /** @type {any} */ (this.slice(offset, offset + byteLength))[m](0, byteLength)
    }
  } else {
    /** @type {any} */ (BufferList.prototype)[m] = function (/** @type {number} */ offset = 0) {
      return /** @type {any} */ (this.slice(offset, offset + size))[m](0)
    }
  }
}

export default BufferList
