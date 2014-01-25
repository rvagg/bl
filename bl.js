var ListStream = require('list-stream')
  , util       = require('util')

function BufferList (_callback) {
  if (!(this instanceof BufferList))
    return new BufferList(_callback)

  var callback
    , self = this

  if (typeof _callback == 'function') {
    callback = function (err) {
      if (err)
        return _callback(err)
      _callback(null, self.slice())
    }
  }

  ListStream.call(this, callback)

  // replace getter from ListStream
  ;delete this.length
  this.length = 0

  if (!callback) { // something else in the arg?
    if (Buffer.isBuffer(_callback)) {
      this.append(_callback)
    } else if (Array.isArray(_callback)) {
      _callback.forEach(function (b) {
        Buffer.isBuffer(b) && self.append(b)
      })
    } // else ignore
  }
}

util.inherits(BufferList, ListStream)

BufferList.prototype._offset = function (offset) {
  var tot = 0, i = 0, _t
  for (; i < this._chunks.length; i++) {
    _t = tot + this._chunks[i].length
    if (offset < _t)
      return [ i, offset - tot ]
    tot = _t
  }
}

BufferList.prototype.append = function (buf) {
  this._chunks.push(Buffer.isBuffer(buf) ? buf : new Buffer(buf))
  this.length += buf.length
  return this
}

BufferList.prototype._write = function (buf, encoding, callback) {
  this.append(buf)
  if (callback)
    callback()
}

BufferList.prototype._read = function (size) {
  if (!this.length)
    return this.push(null)
  size = Math.min(size, this.length)
  this.push(this.slice(0, size))
  this.consume(size)
}

BufferList.prototype.get = function (index) {
  return this.slice(index, index + 1)[0]
}

BufferList.prototype.slice = function (start, end) {
  return this.copy(null, 0, start, end)
}

BufferList.prototype.copy = function (dst, dstStart, srcStart, srcEnd) {
  if (typeof srcStart != 'number' || srcStart < 0)
    srcStart = 0
  if (typeof srcEnd != 'number' || srcEnd > this.length)
    srcEnd = this.length
  if (srcStart >= this.length)
    return dst || new Buffer(0)
  if (srcEnd <= 0)
    return dst || new Buffer(0)

  var copy   = !!dst
    , off    = this._offset(srcStart)
    , len    = srcEnd - srcStart
    , bytes  = len
    , bufoff = (copy && dstStart) || 0
    , start  = off[1]
    , l
    , i

  // copy/slice everything
  if (srcStart === 0 && srcEnd == this.length) {
    if (!copy) // slice, just return a full concat
      return Buffer.concat(this._chunks)

    // copy, need to copy individual buffers
    for (i = 0; i < this._chunks.length; i++) {
      this._chunks[i].copy(dst, bufoff)
      bufoff += this._chunks[i].length
    }

    return dst
  }

  // easy, cheap case where it's a subset of one of the buffers
  if (bytes <= this._chunks[off[0]].length - start) {
    return copy
      ? this._chunks[off[0]].copy(dst, dstStart, start, start + bytes)
      : this._chunks[off[0]].slice(start, start + bytes)
  }

  if (!copy) // a slice, we need something to copy in to
    dst = new Buffer(len)

  for (i = off[0]; i < this._chunks.length; i++) {
    l = this._chunks[i].length - start

    if (bytes > l) {
      this._chunks[i].copy(dst, bufoff, start)
    } else {
      this._chunks[i].copy(dst, bufoff, start, start + bytes)
      break
    }

    bufoff += l
    bytes -= l

    if (start)
      start = 0
  }

  return dst
}

BufferList.prototype.toString = function (encoding, start, end) {
  return this.slice(start, end).toString(encoding)
}

BufferList.prototype.consume = function (bytes) {
  while (this._chunks.length) {
    if (bytes > this._chunks[0].length) {
      bytes -= this._chunks[0].length
      this.length -= this._chunks[0].length
      this._chunks.shift()
    } else {
      this._chunks[0] = this._chunks[0].slice(bytes)
      this.length -= bytes
      break
    }
  }
  return this
}

BufferList.prototype.duplicate = function () {
  var i = 0
    , copy = new BufferList()

  for (; i < this._chunks.length; i++)
    copy.append(this._chunks[i])

  return copy
}

;(function () {
  var methods = {
      'readDoubleBE' : 8
    , 'readDoubleLE' : 8
    , 'readFloatBE'  : 4
    , 'readFloatLE'  : 4
    , 'readInt32BE'  : 4
    , 'readInt32LE'  : 4
    , 'readUInt32BE' : 4
    , 'readUInt32LE' : 4
    , 'readInt16BE'  : 2
    , 'readInt16LE'  : 2
    , 'readUInt16BE' : 2
    , 'readUInt16LE' : 2
    , 'readInt8'     : 1
    , 'readUInt8'    : 1
  }

  for (var m in methods) {
    (function (m) {
      BufferList.prototype[m] = function (offset) {
        return this.slice(offset, offset + methods[m])[m](0)
      }
    }(m))
  }
}())

module.exports = BufferList
