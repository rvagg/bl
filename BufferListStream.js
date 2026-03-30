import { Duplex } from 'node:stream'
import { BufferList } from './BufferList.js'

const symbol = Symbol.for('BufferList')

/**
 * @typedef {import('./BufferList.js').BufferListAcceptedTypes} BufferListAcceptedTypes
 */

export class BufferListStream extends Duplex {
  /**
   * @param {((err: Error | null, buffer?: Buffer) => void) | BufferListAcceptedTypes} [callback]
   */
  constructor (callback) {
    super()

    if (typeof callback === 'function') {
      this._callback = callback

      /** @param {Error} err */
      const piper = (err) => {
        if (this._callback) {
          this._callback(err)
          this._callback = null
        }
      }

      this.on('pipe', (src) => {
        src.on('error', piper)
      })
      this.on('unpipe', (src) => {
        src.removeListener('error', piper)
      })

      callback = undefined
    }

    Object.defineProperty(this, symbol, { value: true })
    /** @type {Buffer[]} */
    this._bufs = []
    /** @type {number} */
    this.length = 0

    if (callback) {
      /** @type {any} */ (this).append(callback)
    }
  }

  /**
   * @param {any} buf
   * @param {string} encoding
   * @param {Function} callback
   */
  _write (buf, encoding, callback) {
    /** @type {any} */ (this)._appendBuffer(buf)
    if (typeof callback === 'function') {
      callback()
    }
  }

  /** @param {number} size */
  _read (size) {
    if (!this.length) {
      return this.push(null)
    }

    const self = /** @type {any} */ (this)
    size = Math.min(size, this.length)
    this.push(self.slice(0, size))
    self.consume(size)
  }

  /**
   * @param {any} [chunk]
   * @param {any} [encoding]
   * @param {any} [cb]
   * @returns {this}
   */
  end (chunk, encoding, cb) {
    Duplex.prototype.end.call(this, chunk, encoding, cb)

    if (this._callback) {
      this._callback(null, /** @type {any} */ (this).slice())
      this._callback = null
    }

    return this
  }

  /**
   * @param {Error | null} err
   * @param {Function} cb
   */
  _destroy (err, cb) {
    this._bufs.length = 0
    this.length = 0
    cb(err)
  }

  /** @param {any} [callback] */
  _new (callback) {
    return new BufferListStream(callback)
  }

  /**
   * @param {any} b
   * @returns {b is BufferList}
   */
  _isBufferList (b) {
    return b instanceof BufferListStream || b instanceof BufferList || BufferListStream.isBufferList(b)
  }

  /**
   * @param {any} b
   * @returns {boolean}
   */
  static isBufferList (b) {
    return BufferList.isBufferList(b)
  }
}

// Copy BufferList prototype methods to BufferListStream prototype
for (const key of Object.getOwnPropertyNames(BufferList.prototype)) {
  if (key === 'constructor' || key === '_new' || key === '_isBufferList') continue
  const descriptor = Object.getOwnPropertyDescriptor(BufferList.prototype, key)
  if (descriptor) {
    Object.defineProperty(BufferListStream.prototype, key, descriptor)
  }
}

export default BufferListStream
export { BufferList }
export const isBufferList = BufferList.isBufferList
