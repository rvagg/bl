var DuplexStream = require('readable-stream/duplex')
  , util         = require('util')


function BufferList (callback) {
  if (!(this instanceof BufferList))
    return new BufferList(callback)

  this._bufs  = []
  this.length = 0

  if (typeof callback == 'function') {
    this._callback = callback

    var piper = function piper (err) {
      if (this._callback) {
        this._callback(err)
        this._callback = null
      }
    }.bind(this)

    this.on('pipe', function onPipe (src) {
      src.on('error', piper)
    })
    this.on('unpipe', function onUnpipe (src) {
      src.removeListener('error', piper)
    })
  } else {
    this.append(callback)
  }

  DuplexStream.call(this)
}


util.inherits(BufferList, DuplexStream)


BufferList.prototype._offset = function _offset (offset) {
  var tot = 0, i = 0, _t
  for (; i < this._bufs.length; i++) {
    _t = tot + this._bufs[i].length
    if (offset < _t)
      return [ i, offset - tot ]
    tot = _t
  }
}


BufferList.prototype._index = function _index (indexOffsetPair) {
  var bufferIndex = indexOffsetPair[0]
  var offset = indexOffsetPair[1]
  var sum = 0

  for (var i = 0; i < bufferIndex; i++) {
    sum += this._bufs[i].length
  }

  return sum + offset
}


BufferList.prototype.append = function append (buf) {
  var i = 0
    , newBuf

  if (Array.isArray(buf)) {
    for (; i < buf.length; i++)
      this.append(buf[i])
  } else if (buf instanceof BufferList) {
    // unwrap argument into individual BufferLists
    for (; i < buf._bufs.length; i++)
      this.append(buf._bufs[i])
  } else if (buf != null) {
    // coerce number arguments to strings, since Buffer(number) does
    // uninitialized memory allocation
    if (typeof buf == 'number')
      buf = buf.toString()

    newBuf = Buffer.isBuffer(buf) ? buf : new Buffer(buf)
    this._bufs.push(newBuf)
    this.length += newBuf.length
  }

  return this
}


BufferList.prototype._write = function _write (buf, encoding, callback) {
  this.append(buf)

  if (typeof callback == 'function')
    callback()
}


BufferList.prototype._read = function _read (size) {
  if (!this.length)
    return this.push(null)

  size = Math.min(size, this.length)
  this.push(this.slice(0, size))
  this.consume(size)
}


BufferList.prototype.end = function end (chunk) {
  DuplexStream.prototype.end.call(this, chunk)

  if (this._callback) {
    this._callback(null, this.slice())
    this._callback = null
  }
}


BufferList.prototype.get = function get (index) {
  return this.slice(index, index + 1)[0]
}


BufferList.prototype.slice = function slice (start, end) {
  return this.copy(null, 0, start, end)
}


BufferList.prototype.copy = function copy (dst, dstStart, srcStart, srcEnd) {
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
      return Buffer.concat(this._bufs)

    // copy, need to copy individual buffers
    for (i = 0; i < this._bufs.length; i++) {
      this._bufs[i].copy(dst, bufoff)
      bufoff += this._bufs[i].length
    }

    return dst
  }

  // easy, cheap case where it's a subset of one of the buffers
  if (bytes <= this._bufs[off[0]].length - start) {
    return copy
      ? this._bufs[off[0]].copy(dst, dstStart, start, start + bytes)
      : this._bufs[off[0]].slice(start, start + bytes)
  }

  if (!copy) // a slice, we need something to copy in to
    dst = new Buffer(len)

  for (i = off[0]; i < this._bufs.length; i++) {
    l = this._bufs[i].length - start

    if (bytes > l) {
      this._bufs[i].copy(dst, bufoff, start)
    } else {
      this._bufs[i].copy(dst, bufoff, start, start + bytes)
      break
    }

    bufoff += l
    bytes -= l

    if (start)
      start = 0
  }

  return dst
}

BufferList.prototype.toString = function toString (encoding, start, end) {
  return this.slice(start, end).toString(encoding)
}

BufferList.prototype.consume = function consume (bytes) {
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


BufferList.prototype.duplicate = function duplicate () {
  var i = 0
    , copy = new BufferList()

  for (; i < this._bufs.length; i++)
    copy.append(this._bufs[i])

  return copy
}

BufferList.prototype.indexOf = function indexOf (value, byteOffset, encoding) {
  byteOffset = byteOffset || 0

  var beginOffset = this._offset(byteOffset)

  var bufferIndex = beginOffset[0]
  var searchOffset = beginOffset[1]

  // search each buffer in turn as long as nothing has been found yet
  for (var result = -1;
       result == -1 && bufferIndex < this._bufs.length;
       bufferIndex++) {
    result = this._bufs[bufferIndex].indexOf(value, searchOffset, encoding)
    searchOffset = 0
  }

  // if this is a multi-byte search and nothing has been found in individual buffers, maybe we need to search across buffer boundaries
  if(value.length > 1 && result == -1) {
    return this._indexOfMultiByte(value, byteOffset, encoding)
  }

  // return early if nothing has been found at all
  if(result == -1) {
    return -1
  }

  // fix buffer index because the last iteration increases it even if the first condition failed
  bufferIndex--
  return this._index([bufferIndex, result])
}


BufferList.prototype._indexOfMultiByte = function _indexOfMultiByte (value, byteOffset, encoding) {
  // this is much more inefficient than the single byte indexOf, as it has to do backtracking in JS
  if (!(value instanceof Buffer)) {
    value = new Buffer(value, encoding)
  }

  var firstByte = value[0];

  // search for first byte only to get a starting point for comparison
  var index = this.indexOf(firstByte, byteOffset, encoding)
  while (index != -1) {
    // compare split buffers until mismatch or complete match is found
    var offset = this._offset(index)
    var bufferIndex = offset[0]
    var bufferOffset = offset[1]
    var valueOffset = 0
    var comparisonResult = true

    while (comparisonResult && valueOffset < value.length) {
      var remainingBufferLength = this._bufs[bufferIndex].length - bufferOffset
      var remainingValueLength = value.length - valueOffset

      var bufferSlice = this._bufs[bufferIndex].slice(bufferOffset, bufferOffset + remainingValueLength)
      var valueSlice = value.slice(valueOffset, valueOffset + remainingBufferLength)
      comparisonResult = (bufferSlice.compare(valueSlice) == 0)

      valueOffset += remainingBufferLength
      bufferIndex++;
      bufferOffset = 0;
    }

    if (comparisonResult)
      return index;

    // next round, increase offset and search for first byte
    byteOffset = index + 1
    var index = this.indexOf(firstByte, byteOffset, encoding)
  }

  return -1
}


BufferList.prototype.destroy = function destroy () {
  this._bufs.length = 0
  this.length = 0
  this.push(null)
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
