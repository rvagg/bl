'use strict'

var tape       = require('tape')
  , crypto     = require('crypto')
  , fs         = require('fs')
  , hash       = require('hash_file')
  , BufferList = require('../')
  , Buffer     = require('safe-buffer').Buffer

  , encodings  =
      ('hex utf8 utf-8 ascii binary base64'
          + (process.browser ? '' : ' ucs2 ucs-2 utf16le utf-16le')).split(' ')

tape('single bytes from single buffer', function (t) {
  var bl = new BufferList()
  bl.append(Buffer.from('abcd'))

  t.equal(bl.length, 4)

  t.equal(bl.get(0), 97)
  t.equal(bl.get(1), 98)
  t.equal(bl.get(2), 99)
  t.equal(bl.get(3), 100)

  t.end()
})

tape('single bytes from multiple buffers', function (t) {
  var bl = new BufferList()
  bl.append(Buffer.from('abcd'))
  bl.append(Buffer.from('efg'))
  bl.append(Buffer.from('hi'))
  bl.append(Buffer.from('j'))

  t.equal(bl.length, 10)

  t.equal(bl.get(0), 97)
  t.equal(bl.get(1), 98)
  t.equal(bl.get(2), 99)
  t.equal(bl.get(3), 100)
  t.equal(bl.get(4), 101)
  t.equal(bl.get(5), 102)
  t.equal(bl.get(6), 103)
  t.equal(bl.get(7), 104)
  t.equal(bl.get(8), 105)
  t.equal(bl.get(9), 106)
  t.end()
})

tape('multi bytes from single buffer', function (t) {
  var bl = new BufferList()
  bl.append(Buffer.from('abcd'))

  t.equal(bl.length, 4)

  t.equal(bl.slice(0, 4).toString('ascii'), 'abcd')
  t.equal(bl.slice(0, 3).toString('ascii'), 'abc')
  t.equal(bl.slice(1, 4).toString('ascii'), 'bcd')
  t.equal(bl.slice(-4, -1).toString('ascii'), 'abc')

  t.end()
})

tape('multi bytes from single buffer (negative indexes)', function (t) {
  var bl = new BufferList()
  bl.append(Buffer.from('buffer'))

  t.equal(bl.length, 6)

  t.equal(bl.slice(-6, -1).toString('ascii'), 'buffe')
  t.equal(bl.slice(-6, -2).toString('ascii'), 'buff')
  t.equal(bl.slice(-5, -2).toString('ascii'), 'uff')

  t.end()
})

tape('multiple bytes from multiple buffers', function (t) {
  var bl = new BufferList()

  bl.append(Buffer.from('abcd'))
  bl.append(Buffer.from('efg'))
  bl.append(Buffer.from('hi'))
  bl.append(Buffer.from('j'))

  t.equal(bl.length, 10)

  t.equal(bl.slice(0, 10).toString('ascii'), 'abcdefghij')
  t.equal(bl.slice(3, 10).toString('ascii'), 'defghij')
  t.equal(bl.slice(3, 6).toString('ascii'), 'def')
  t.equal(bl.slice(3, 8).toString('ascii'), 'defgh')
  t.equal(bl.slice(5, 10).toString('ascii'), 'fghij')
  t.equal(bl.slice(-7, -4).toString('ascii'), 'def')

  t.end()
})

tape('multiple bytes from multiple buffer lists', function (t) {
  var bl = new BufferList()

  bl.append(new BufferList([ Buffer.from('abcd'), Buffer.from('efg') ]))
  bl.append(new BufferList([ Buffer.from('hi'), Buffer.from('j') ]))

  t.equal(bl.length, 10)

  t.equal(bl.slice(0, 10).toString('ascii'), 'abcdefghij')

  t.equal(bl.slice(3, 10).toString('ascii'), 'defghij')
  t.equal(bl.slice(3, 6).toString('ascii'), 'def')
  t.equal(bl.slice(3, 8).toString('ascii'), 'defgh')
  t.equal(bl.slice(5, 10).toString('ascii'), 'fghij')

  t.end()
})

// same data as previous test, just using nested constructors
tape('multiple bytes from crazy nested buffer lists', function (t) {
  var bl = new BufferList()

  bl.append(new BufferList([
      new BufferList([
          new BufferList(Buffer.from('abc'))
        , Buffer.from('d')
        , new BufferList(Buffer.from('efg'))
      ])
    , new BufferList([ Buffer.from('hi') ])
    , new BufferList(Buffer.from('j'))
  ]))

  t.equal(bl.length, 10)

  t.equal(bl.slice(0, 10).toString('ascii'), 'abcdefghij')

  t.equal(bl.slice(3, 10).toString('ascii'), 'defghij')
  t.equal(bl.slice(3, 6).toString('ascii'), 'def')
  t.equal(bl.slice(3, 8).toString('ascii'), 'defgh')
  t.equal(bl.slice(5, 10).toString('ascii'), 'fghij')

  t.end()
})

tape('append accepts arrays of Buffers', function (t) {
  var bl = new BufferList()
  bl.append(Buffer.from('abc'))
  bl.append([ Buffer.from('def') ])
  bl.append([ Buffer.from('ghi'), Buffer.from('jkl') ])
  bl.append([ Buffer.from('mnop'), Buffer.from('qrstu'), Buffer.from('vwxyz') ])
  t.equal(bl.length, 26)
  t.equal(bl.slice().toString('ascii'), 'abcdefghijklmnopqrstuvwxyz')
  t.end()
})

tape('append accepts arrays of BufferLists', function (t) {
  var bl = new BufferList()
  bl.append(Buffer.from('abc'))
  bl.append([ new BufferList('def') ])
  bl.append(new BufferList([ Buffer.from('ghi'), new BufferList('jkl') ]))
  bl.append([ Buffer.from('mnop'), new BufferList([ Buffer.from('qrstu'), Buffer.from('vwxyz') ]) ])
  t.equal(bl.length, 26)
  t.equal(bl.slice().toString('ascii'), 'abcdefghijklmnopqrstuvwxyz')
  t.end()
})

tape('append chainable', function (t) {
  var bl = new BufferList()
  t.ok(bl.append(Buffer.from('abcd')) === bl)
  t.ok(bl.append([ Buffer.from('abcd') ]) === bl)
  t.ok(bl.append(new BufferList(Buffer.from('abcd'))) === bl)
  t.ok(bl.append([ new BufferList(Buffer.from('abcd')) ]) === bl)
  t.end()
})

tape('append chainable (test results)', function (t) {
  var bl = new BufferList('abc')
    .append([ new BufferList('def') ])
    .append(new BufferList([ Buffer.from('ghi'), new BufferList('jkl') ]))
    .append([ Buffer.from('mnop'), new BufferList([ Buffer.from('qrstu'), Buffer.from('vwxyz') ]) ])

  t.equal(bl.length, 26)
  t.equal(bl.slice().toString('ascii'), 'abcdefghijklmnopqrstuvwxyz')
  t.end()
})

tape('consuming from multiple buffers', function (t) {
  var bl = new BufferList()

  bl.append(Buffer.from('abcd'))
  bl.append(Buffer.from('efg'))
  bl.append(Buffer.from('hi'))
  bl.append(Buffer.from('j'))

  t.equal(bl.length, 10)

  t.equal(bl.slice(0, 10).toString('ascii'), 'abcdefghij')

  bl.consume(3)
  t.equal(bl.length, 7)
  t.equal(bl.slice(0, 7).toString('ascii'), 'defghij')

  bl.consume(2)
  t.equal(bl.length, 5)
  t.equal(bl.slice(0, 5).toString('ascii'), 'fghij')

  bl.consume(1)
  t.equal(bl.length, 4)
  t.equal(bl.slice(0, 4).toString('ascii'), 'ghij')

  bl.consume(1)
  t.equal(bl.length, 3)
  t.equal(bl.slice(0, 3).toString('ascii'), 'hij')

  bl.consume(2)
  t.equal(bl.length, 1)
  t.equal(bl.slice(0, 1).toString('ascii'), 'j')

  t.end()
})

tape('complete consumption', function (t) {
  var bl = new BufferList()

  bl.append(Buffer.from('a'))
  bl.append(Buffer.from('b'))

  bl.consume(2)

  t.equal(bl.length, 0)
  t.equal(bl._bufs.length, 0)

  t.end()
})

tape('test readUInt8 / readInt8', function (t) {
  var buf1 = Buffer.alloc(1)
    , buf2 = Buffer.alloc(3)
    , buf3 = Buffer.alloc(3)
    , bl  = new BufferList()

  buf2[1] = 0x3
  buf2[2] = 0x4
  buf3[0] = 0x23
  buf3[1] = 0x42

  bl.append(buf1)
  bl.append(buf2)
  bl.append(buf3)

  t.equal(bl.readUInt8(2), 0x3)
  t.equal(bl.readInt8(2), 0x3)
  t.equal(bl.readUInt8(3), 0x4)
  t.equal(bl.readInt8(3), 0x4)
  t.equal(bl.readUInt8(4), 0x23)
  t.equal(bl.readInt8(4), 0x23)
  t.equal(bl.readUInt8(5), 0x42)
  t.equal(bl.readInt8(5), 0x42)
  t.end()
})

tape('test readUInt16LE / readUInt16BE / readInt16LE / readInt16BE', function (t) {
  var buf1 = Buffer.alloc(1)
    , buf2 = Buffer.alloc(3)
    , buf3 = Buffer.alloc(3)
    , bl   = new BufferList()

  buf2[1] = 0x3
  buf2[2] = 0x4
  buf3[0] = 0x23
  buf3[1] = 0x42

  bl.append(buf1)
  bl.append(buf2)
  bl.append(buf3)

  t.equal(bl.readUInt16BE(2), 0x0304)
  t.equal(bl.readUInt16LE(2), 0x0403)
  t.equal(bl.readInt16BE(2), 0x0304)
  t.equal(bl.readInt16LE(2), 0x0403)
  t.equal(bl.readUInt16BE(3), 0x0423)
  t.equal(bl.readUInt16LE(3), 0x2304)
  t.equal(bl.readInt16BE(3), 0x0423)
  t.equal(bl.readInt16LE(3), 0x2304)
  t.equal(bl.readUInt16BE(4), 0x2342)
  t.equal(bl.readUInt16LE(4), 0x4223)
  t.equal(bl.readInt16BE(4), 0x2342)
  t.equal(bl.readInt16LE(4), 0x4223)
  t.end()
})

tape('test readUInt32LE / readUInt32BE / readInt32LE / readInt32BE', function (t) {
  var buf1 = Buffer.alloc(1)
    , buf2 = Buffer.alloc(3)
    , buf3 = Buffer.alloc(3)
    , bl   = new BufferList()

  buf2[1] = 0x3
  buf2[2] = 0x4
  buf3[0] = 0x23
  buf3[1] = 0x42

  bl.append(buf1)
  bl.append(buf2)
  bl.append(buf3)

  t.equal(bl.readUInt32BE(2), 0x03042342)
  t.equal(bl.readUInt32LE(2), 0x42230403)
  t.equal(bl.readInt32BE(2), 0x03042342)
  t.equal(bl.readInt32LE(2), 0x42230403)
  t.end()
})

tape('test readUIntLE / readUIntBE / readIntLE / readIntBE', function (t) {
  var buf1 = Buffer.alloc(1)
    , buf2 = Buffer.alloc(3)
    , buf3 = Buffer.alloc(3)
    , bl   = new BufferList()

  buf2[0] = 0x2
  buf2[1] = 0x3
  buf2[2] = 0x4
  buf3[0] = 0x23
  buf3[1] = 0x42
  buf3[2] = 0x61

  bl.append(buf1)
  bl.append(buf2)
  bl.append(buf3)

  t.equal(bl.readUIntBE(1, 1), 0x02)
  t.equal(bl.readUIntBE(1, 2), 0x0203)
  t.equal(bl.readUIntBE(1, 3), 0x020304)
  t.equal(bl.readUIntBE(1, 4), 0x02030423)
  t.equal(bl.readUIntBE(1, 5), 0x0203042342)
  t.equal(bl.readUIntBE(1, 6), 0x020304234261)
  t.equal(bl.readUIntLE(1, 1), 0x02)
  t.equal(bl.readUIntLE(1, 2), 0x0302)
  t.equal(bl.readUIntLE(1, 3), 0x040302)
  t.equal(bl.readUIntLE(1, 4), 0x23040302)
  t.equal(bl.readUIntLE(1, 5), 0x4223040302)
  t.equal(bl.readUIntLE(1, 6), 0x614223040302)
  t.equal(bl.readIntBE(1, 1), 0x02)
  t.equal(bl.readIntBE(1, 2), 0x0203)
  t.equal(bl.readIntBE(1, 3), 0x020304)
  t.equal(bl.readIntBE(1, 4), 0x02030423)
  t.equal(bl.readIntBE(1, 5), 0x0203042342)
  t.equal(bl.readIntBE(1, 6), 0x020304234261)
  t.equal(bl.readIntLE(1, 1), 0x02)
  t.equal(bl.readIntLE(1, 2), 0x0302)
  t.equal(bl.readIntLE(1, 3), 0x040302)
  t.equal(bl.readIntLE(1, 4), 0x23040302)
  t.equal(bl.readIntLE(1, 5), 0x4223040302)
  t.equal(bl.readIntLE(1, 6), 0x614223040302)
  t.end()
})

tape('test readFloatLE / readFloatBE', function (t) {
  var buf1 = Buffer.alloc(1)
    , buf2 = Buffer.alloc(3)
    , buf3 = Buffer.alloc(3)
    , bl   = new BufferList()

  buf2[1] = 0x00
  buf2[2] = 0x00
  buf3[0] = 0x80
  buf3[1] = 0x3f

  bl.append(buf1)
  bl.append(buf2)
  bl.append(buf3)

  t.equal(bl.readFloatLE(2), 0x01)
  t.end()
})

tape('test readDoubleLE / readDoubleBE', function (t) {
  var buf1 = Buffer.alloc(1)
    , buf2 = Buffer.alloc(3)
    , buf3 = Buffer.alloc(10)
    , bl   = new BufferList()

  buf2[1] = 0x55
  buf2[2] = 0x55
  buf3[0] = 0x55
  buf3[1] = 0x55
  buf3[2] = 0x55
  buf3[3] = 0x55
  buf3[4] = 0xd5
  buf3[5] = 0x3f

  bl.append(buf1)
  bl.append(buf2)
  bl.append(buf3)

  t.equal(bl.readDoubleLE(2), 0.3333333333333333)
  t.end()
})

tape('test toString', function (t) {
  var bl = new BufferList()

  bl.append(Buffer.from('abcd'))
  bl.append(Buffer.from('efg'))
  bl.append(Buffer.from('hi'))
  bl.append(Buffer.from('j'))

  t.equal(bl.toString('ascii', 0, 10), 'abcdefghij')
  t.equal(bl.toString('ascii', 3, 10), 'defghij')
  t.equal(bl.toString('ascii', 3, 6), 'def')
  t.equal(bl.toString('ascii', 3, 8), 'defgh')
  t.equal(bl.toString('ascii', 5, 10), 'fghij')

  t.end()
})

tape('test toString encoding', function (t) {
  var bl = new BufferList()
    , b  = Buffer.from('abcdefghij\xff\x00')

  bl.append(Buffer.from('abcd'))
  bl.append(Buffer.from('efg'))
  bl.append(Buffer.from('hi'))
  bl.append(Buffer.from('j'))
  bl.append(Buffer.from('\xff\x00'))

  encodings.forEach(function (enc) {
      t.equal(bl.toString(enc), b.toString(enc), enc)
    })

  t.end()
})

tape('indexOf single byte needle', t => {
  const bl = new BufferList(['abcdefg', 'abcdefg', '12345'])
  t.equal(bl.indexOf('e'), 4)
  t.equal(bl.indexOf('e', 5), 11)
  t.equal(bl.indexOf('e', 12), -1)
  t.equal(bl.indexOf('5'), 18)
  t.end()
})

tape('indexOf multiple byte needle', t => {
  const bl = new BufferList(['abcdefg', 'abcdefg'])
  t.equal(bl.indexOf('ef'), 4)
  t.equal(bl.indexOf('ef', 5), 11)
  t.end()
})

tape('indexOf multiple byte needles across buffer boundaries', t => {
  const bl = new BufferList(['abcdefg', 'abcdefg'])
  t.equal(bl.indexOf('fgabc'), 5)
  t.end()
})

tape('indexOf takes a buffer list search', t => {
  const bl = new BufferList(['abcdefg', 'abcdefg'])
  const search = new BufferList('fgabc')
  t.equal(bl.indexOf(search), 5)
  t.end()
})

tape('indexOf a zero byte needle', t => {
  const b = new BufferList('abcdef')
  const buf_empty = Buffer.from('')
  t.equal(b.indexOf(''), 0)
  t.equal(b.indexOf('', 1), 1)
  t.equal(b.indexOf('', b.length + 1), b.length)
  t.equal(b.indexOf('', Infinity), b.length)
  t.equal(b.indexOf(buf_empty), 0)
  t.equal(b.indexOf(buf_empty, 1), 1)
  t.equal(b.indexOf(buf_empty, b.length + 1), b.length)
  t.equal(b.indexOf(buf_empty, Infinity), b.length)
  t.end()
})

// only present in node 6+
;(process.version.substr(1).split('.')[0] >= 6) && tape('indexOf latin1 and binary encoding', t => {
  const b = new BufferList('abcdef')

  // test latin1 encoding
  t.equal(
    new BufferList(Buffer.from(b.toString('latin1'), 'latin1'))
      .indexOf('d', 0, 'latin1'),
    3
  )
  t.equal(
    new BufferList(Buffer.from(b.toString('latin1'), 'latin1'))
      .indexOf(Buffer.from('d', 'latin1'), 0, 'latin1'),
    3
  )
  t.equal(
    new BufferList(Buffer.from('aa\u00e8aa', 'latin1'))
      .indexOf('\u00e8', 'latin1'),
    2
  )
  t.equal(
    new BufferList(Buffer.from('\u00e8', 'latin1'))
      .indexOf('\u00e8', 'latin1'),
    0
  )
  t.equal(
    new BufferList(Buffer.from('\u00e8', 'latin1'))
      .indexOf(Buffer.from('\u00e8', 'latin1'), 'latin1'),
    0
  )

  // test binary encoding
  t.equal(
    new BufferList(Buffer.from(b.toString('binary'), 'binary'))
      .indexOf('d', 0, 'binary'),
    3
  )
  t.equal(
    new BufferList(Buffer.from(b.toString('binary'), 'binary'))
      .indexOf(Buffer.from('d', 'binary'), 0, 'binary'),
    3
  )
  t.equal(
    new BufferList(Buffer.from('aa\u00e8aa', 'binary'))
      .indexOf('\u00e8', 'binary'),
    2
  )
  t.equal(
    new BufferList(Buffer.from('\u00e8', 'binary'))
      .indexOf('\u00e8', 'binary'),
    0
  )
  t.equal(
    new BufferList(Buffer.from('\u00e8', 'binary'))
      .indexOf(Buffer.from('\u00e8', 'binary'), 'binary'),
    0
  )
  t.end()
})

tape('indexOf the entire nodejs10 buffer test suite', t => {
  const b = new BufferList('abcdef')
  const buf_a = Buffer.from('a')
  const buf_bc = Buffer.from('bc')
  const buf_f = Buffer.from('f')
  const buf_z = Buffer.from('z')

  const stringComparison = 'abcdef'

  t.equal(b.indexOf('a'), 0)
  t.equal(b.indexOf('a', 1), -1)
  t.equal(b.indexOf('a', -1), -1)
  t.equal(b.indexOf('a', -4), -1)
  t.equal(b.indexOf('a', -b.length), 0)
  t.equal(b.indexOf('a', NaN), 0)
  t.equal(b.indexOf('a', -Infinity), 0)
  t.equal(b.indexOf('a', Infinity), -1)
  t.equal(b.indexOf('bc'), 1)
  t.equal(b.indexOf('bc', 2), -1)
  t.equal(b.indexOf('bc', -1), -1)
  t.equal(b.indexOf('bc', -3), -1)
  t.equal(b.indexOf('bc', -5), 1)
  t.equal(b.indexOf('bc', NaN), 1)
  t.equal(b.indexOf('bc', -Infinity), 1)
  t.equal(b.indexOf('bc', Infinity), -1)
  t.equal(b.indexOf('f'), b.length - 1)
  t.equal(b.indexOf('z'), -1)
  // empty search tests
  t.equal(b.indexOf(buf_a), 0)
  t.equal(b.indexOf(buf_a, 1), -1)
  t.equal(b.indexOf(buf_a, -1), -1)
  t.equal(b.indexOf(buf_a, -4), -1)
  t.equal(b.indexOf(buf_a, -b.length), 0)
  t.equal(b.indexOf(buf_a, NaN), 0)
  t.equal(b.indexOf(buf_a, -Infinity), 0)
  t.equal(b.indexOf(buf_a, Infinity), -1)
  t.equal(b.indexOf(buf_bc), 1)
  t.equal(b.indexOf(buf_bc, 2), -1)
  t.equal(b.indexOf(buf_bc, -1), -1)
  t.equal(b.indexOf(buf_bc, -3), -1)
  t.equal(b.indexOf(buf_bc, -5), 1)
  t.equal(b.indexOf(buf_bc, NaN), 1)
  t.equal(b.indexOf(buf_bc, -Infinity), 1)
  t.equal(b.indexOf(buf_bc, Infinity), -1)
  t.equal(b.indexOf(buf_f), b.length - 1)
  t.equal(b.indexOf(buf_z), -1)
  t.equal(b.indexOf(0x61), 0)
  t.equal(b.indexOf(0x61, 1), -1)
  t.equal(b.indexOf(0x61, -1), -1)
  t.equal(b.indexOf(0x61, -4), -1)
  t.equal(b.indexOf(0x61, -b.length), 0)
  t.equal(b.indexOf(0x61, NaN), 0)
  t.equal(b.indexOf(0x61, -Infinity), 0)
  t.equal(b.indexOf(0x61, Infinity), -1)
  t.equal(b.indexOf(0x0), -1)

  // test offsets
  t.equal(b.indexOf('d', 2), 3)
  t.equal(b.indexOf('f', 5), 5)
  t.equal(b.indexOf('f', -1), 5)
  t.equal(b.indexOf('f', 6), -1)

  t.equal(b.indexOf(Buffer.from('d'), 2), 3)
  t.equal(b.indexOf(Buffer.from('f'), 5), 5)
  t.equal(b.indexOf(Buffer.from('f'), -1), 5)
  t.equal(b.indexOf(Buffer.from('f'), 6), -1)

  t.equal(Buffer.from('ff').indexOf(Buffer.from('f'), 1, 'ucs2'), -1)

  // test invalid and uppercase encoding
  t.equal(b.indexOf('b', 'utf8'), 1)
  t.equal(b.indexOf('b', 'UTF8'), 1)
  t.equal(b.indexOf('62', 'HEX'), 1)
  t.throws(() => b.indexOf('bad', 'enc'), TypeError)

  // test hex encoding
  t.equal(
    Buffer.from(b.toString('hex'), 'hex')
      .indexOf('64', 0, 'hex'),
    3
  )
  t.equal(
    Buffer.from(b.toString('hex'), 'hex')
      .indexOf(Buffer.from('64', 'hex'), 0, 'hex'),
    3
  )

  // test base64 encoding
  t.equal(
    Buffer.from(b.toString('base64'), 'base64')
      .indexOf('ZA==', 0, 'base64'),
    3
  )
  t.equal(
    Buffer.from(b.toString('base64'), 'base64')
      .indexOf(Buffer.from('ZA==', 'base64'), 0, 'base64'),
    3
  )

  // test ascii encoding
  t.equal(
    Buffer.from(b.toString('ascii'), 'ascii')
      .indexOf('d', 0, 'ascii'),
    3
  )
  t.equal(
    Buffer.from(b.toString('ascii'), 'ascii')
      .indexOf(Buffer.from('d', 'ascii'), 0, 'ascii'),
    3
  )

  // test optional offset with passed encoding
  t.equal(Buffer.from('aaaa0').indexOf('30', 'hex'), 4)
  t.equal(Buffer.from('aaaa00a').indexOf('3030', 'hex'), 4)

  {
    // test usc2 encoding
    const twoByteString = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'ucs2')

    t.equal(8, twoByteString.indexOf('\u0395', 4, 'ucs2'))
    t.equal(6, twoByteString.indexOf('\u03a3', -4, 'ucs2'))
    t.equal(4, twoByteString.indexOf('\u03a3', -6, 'ucs2'))
    t.equal(4, twoByteString.indexOf(
      Buffer.from('\u03a3', 'ucs2'), -6, 'ucs2'))
    t.equal(-1, twoByteString.indexOf('\u03a3', -2, 'ucs2'))
  }

  const mixedByteStringUcs2 =
      Buffer.from('\u039a\u0391abc\u03a3\u03a3\u0395', 'ucs2')
  t.equal(6, mixedByteStringUcs2.indexOf('bc', 0, 'ucs2'))
  t.equal(10, mixedByteStringUcs2.indexOf('\u03a3', 0, 'ucs2'))
  t.equal(-1, mixedByteStringUcs2.indexOf('\u0396', 0, 'ucs2'))

  t.equal(
    6, mixedByteStringUcs2.indexOf(Buffer.from('bc', 'ucs2'), 0, 'ucs2'))
  t.equal(
    10, mixedByteStringUcs2.indexOf(Buffer.from('\u03a3', 'ucs2'), 0, 'ucs2'))
  t.equal(
    -1, mixedByteStringUcs2.indexOf(Buffer.from('\u0396', 'ucs2'), 0, 'ucs2'))

  {
    const twoByteString = Buffer.from('\u039a\u0391\u03a3\u03a3\u0395', 'ucs2')

    // Test single char pattern
    t.equal(0, twoByteString.indexOf('\u039a', 0, 'ucs2'))
    let index = twoByteString.indexOf('\u0391', 0, 'ucs2')
    t.equal(2, index, `Alpha - at index ${index}`)
    index = twoByteString.indexOf('\u03a3', 0, 'ucs2')
    t.equal(4, index, `First Sigma - at index ${index}`)
    index = twoByteString.indexOf('\u03a3', 6, 'ucs2')
    t.equal(6, index, `Second Sigma - at index ${index}`)
    index = twoByteString.indexOf('\u0395', 0, 'ucs2')
    t.equal(8, index, `Epsilon - at index ${index}`)
    index = twoByteString.indexOf('\u0392', 0, 'ucs2')
    t.equal(-1, index, `Not beta - at index ${index}`)

    // Test multi-char pattern
    index = twoByteString.indexOf('\u039a\u0391', 0, 'ucs2')
    t.equal(0, index, `Lambda Alpha - at index ${index}`)
    index = twoByteString.indexOf('\u0391\u03a3', 0, 'ucs2')
    t.equal(2, index, `Alpha Sigma - at index ${index}`)
    index = twoByteString.indexOf('\u03a3\u03a3', 0, 'ucs2')
    t.equal(4, index, `Sigma Sigma - at index ${index}`)
    index = twoByteString.indexOf('\u03a3\u0395', 0, 'ucs2')
    t.equal(6, index, `Sigma Epsilon - at index ${index}`)
  }

  const mixedByteStringUtf8 = Buffer.from('\u039a\u0391abc\u03a3\u03a3\u0395')
  t.equal(5, mixedByteStringUtf8.indexOf('bc'))
  t.equal(5, mixedByteStringUtf8.indexOf('bc', 5))
  t.equal(5, mixedByteStringUtf8.indexOf('bc', -8))
  t.equal(7, mixedByteStringUtf8.indexOf('\u03a3'))
  t.equal(-1, mixedByteStringUtf8.indexOf('\u0396'))


  // Test complex string indexOf algorithms. Only trigger for long strings.
  // Long string that isn't a simple repeat of a shorter string.
  let longString = 'A'
  for (let i = 66; i < 76; i++) {  // from 'B' to 'K'
    longString = longString + String.fromCharCode(i) + longString
  }

  const longBufferString = Buffer.from(longString)

  // pattern of 15 chars, repeated every 16 chars in long
  let pattern = 'ABACABADABACABA'
  for (let i = 0; i < longBufferString.length - pattern.length; i += 7) {
    const index = longBufferString.indexOf(pattern, i)
    t.equal((i + 15) & ~0xf, index,
                      `Long ABACABA...-string at index ${i}`)
  }

  let index = longBufferString.indexOf('AJABACA')
  t.equal(510, index, `Long AJABACA, First J - at index ${index}`)
  index = longBufferString.indexOf('AJABACA', 511)
  t.equal(1534, index, `Long AJABACA, Second J - at index ${index}`)

  pattern = 'JABACABADABACABA'
  index = longBufferString.indexOf(pattern)
  t.equal(511, index, `Long JABACABA..., First J - at index ${index}`)
  index = longBufferString.indexOf(pattern, 512)
  t.equal(
    1535, index, `Long JABACABA..., Second J - at index ${index}`)

  // Search for a non-ASCII string in a pure ASCII string.
  const asciiString = Buffer.from(
    'arglebargleglopglyfarglebargleglopglyfarglebargleglopglyf')
  t.equal(-1, asciiString.indexOf('\x2061'))
  t.equal(3, asciiString.indexOf('leb', 0))

  // Search in string containing many non-ASCII chars.
  const allCodePoints = []
  for (let i = 0; i < 65536; i++) allCodePoints[i] = i
  const allCharsString = String.fromCharCode.apply(String, allCodePoints)
  const allCharsBufferUtf8 = Buffer.from(allCharsString)
  const allCharsBufferUcs2 = Buffer.from(allCharsString, 'ucs2')

  // Search for string long enough to trigger complex search with ASCII pattern
  // and UC16 subject.
  t.equal(-1, allCharsBufferUtf8.indexOf('notfound'))
  t.equal(-1, allCharsBufferUcs2.indexOf('notfound'))

  // Needle is longer than haystack, but only because it's encoded as UTF-16
  t.equal(Buffer.from('aaaa').indexOf('a'.repeat(4), 'ucs2'), -1)

  t.equal(Buffer.from('aaaa').indexOf('a'.repeat(4), 'utf8'), 0)
  t.equal(Buffer.from('aaaa').indexOf('你好', 'ucs2'), -1)

  // Haystack has odd length, but the needle is UCS2.
  t.equal(Buffer.from('aaaaa').indexOf('b', 'ucs2'), -1)

  {
    // Find substrings in Utf8.
    const lengths = [1, 3, 15];  // Single char, simple and complex.
    const indices = [0x5, 0x60, 0x400, 0x680, 0x7ee, 0xFF02, 0x16610, 0x2f77b]
    for (let lengthIndex = 0; lengthIndex < lengths.length; lengthIndex++) {
      for (let i = 0; i < indices.length; i++) {
        const index = indices[i]
        let length = lengths[lengthIndex]

        if (index + length > 0x7F) {
          length = 2 * length
        }

        if (index + length > 0x7FF) {
          length = 3 * length
        }

        if (index + length > 0xFFFF) {
          length = 4 * length
        }

        const patternBufferUtf8 = allCharsBufferUtf8.slice(index, index + length)
        t.equal(index, allCharsBufferUtf8.indexOf(patternBufferUtf8))

        const patternStringUtf8 = patternBufferUtf8.toString()
        t.equal(index, allCharsBufferUtf8.indexOf(patternStringUtf8))
      }
    }
  }

  {
    // Find substrings in Usc2.
    const lengths = [2, 4, 16];  // Single char, simple and complex.
    const indices = [0x5, 0x65, 0x105, 0x205, 0x285, 0x2005, 0x2085, 0xfff0]
    for (let lengthIndex = 0; lengthIndex < lengths.length; lengthIndex++) {
      for (let i = 0; i < indices.length; i++) {
        const index = indices[i] * 2
        const length = lengths[lengthIndex]

        const patternBufferUcs2 =
            allCharsBufferUcs2.slice(index, index + length)
        t.equal(
          index, allCharsBufferUcs2.indexOf(patternBufferUcs2, 0, 'ucs2'))

        const patternStringUcs2 = patternBufferUcs2.toString('ucs2')
        t.equal(
          index, allCharsBufferUcs2.indexOf(patternStringUcs2, 0, 'ucs2'))
      }
    }
  }

  [
    () => {},
    {},
    []
  ].forEach(val => {
    debugger
    t.throws(() => b.indexOf(val), TypeError, `"${JSON.stringify(val)}" should throw`)
  })

  // Test weird offset arguments.
  // The following offsets coerce to NaN or 0, searching the whole Buffer
  t.equal(b.indexOf('b', undefined), 1)
  t.equal(b.indexOf('b', {}), 1)
  t.equal(b.indexOf('b', 0), 1)
  t.equal(b.indexOf('b', null), 1)
  t.equal(b.indexOf('b', []), 1)

  // The following offset coerces to 2, in other words +[2] === 2
  t.equal(b.indexOf('b', [2]), -1)

  // Behavior should match String.indexOf()
  t.equal(
    b.indexOf('b', undefined),
    stringComparison.indexOf('b', undefined))
  t.equal(
    b.indexOf('b', {}),
    stringComparison.indexOf('b', {}))
  t.equal(
    b.indexOf('b', 0),
    stringComparison.indexOf('b', 0))
  t.equal(
    b.indexOf('b', null),
    stringComparison.indexOf('b', null))
  t.equal(
    b.indexOf('b', []),
    stringComparison.indexOf('b', []))
  t.equal(
    b.indexOf('b', [2]),
    stringComparison.indexOf('b', [2]))

  // test truncation of Number arguments to uint8
  {
    const buf = Buffer.from('this is a test')
    t.equal(buf.indexOf(0x6973), 3)
    t.equal(buf.indexOf(0x697320), 4)
    t.equal(buf.indexOf(0x69732069), 2)
    t.equal(buf.indexOf(0x697374657374), 0)
    t.equal(buf.indexOf(0x69737374), 0)
    t.equal(buf.indexOf(0x69737465), 11)
    t.equal(buf.indexOf(0x69737465), 11)
    t.equal(buf.indexOf(-140), 0)
    t.equal(buf.indexOf(-152), 1)
    t.equal(buf.indexOf(0xff), -1)
    t.equal(buf.indexOf(0xffff), -1)
  }

  // Test that Uint8Array arguments are okay.
  {
    const needle = new Uint8Array([ 0x66, 0x6f, 0x6f ])
    const haystack = new BufferList(Buffer.from('a foo b foo'))
    t.equal(haystack.indexOf(needle), 2)
  }
  t.end()
})

!process.browser && tape('test stream', function (t) {
  var random = crypto.randomBytes(65534)
    , rndhash = hash(random, 'md5')
    , md5sum = crypto.createHash('md5')
    , bl     = new BufferList(function (err, buf) {
        t.ok(Buffer.isBuffer(buf))
        t.ok(err === null)
        t.equal(rndhash, hash(bl.slice(), 'md5'))
        t.equal(rndhash, hash(buf, 'md5'))

        bl.pipe(fs.createWriteStream('/tmp/bl_test_rnd_out.dat'))
          .on('close', function () {
            var s = fs.createReadStream('/tmp/bl_test_rnd_out.dat')
            s.on('data', md5sum.update.bind(md5sum))
            s.on('end', function() {
              t.equal(rndhash, md5sum.digest('hex'), 'woohoo! correct hash!')
              t.end()
            })
          })

      })

  fs.writeFileSync('/tmp/bl_test_rnd.dat', random)
  fs.createReadStream('/tmp/bl_test_rnd.dat').pipe(bl)
})

tape('instantiation with Buffer', function (t) {
  var buf  = crypto.randomBytes(1024)
    , buf2 = crypto.randomBytes(1024)
    , b    = BufferList(buf)

  t.equal(buf.toString('hex'), b.slice().toString('hex'), 'same buffer')
  b = BufferList([ buf, buf2 ])
  t.equal(b.slice().toString('hex'), Buffer.concat([ buf, buf2 ]).toString('hex'), 'same buffer')
  t.end()
})

tape('test String appendage', function (t) {
  var bl = new BufferList()
    , b  = Buffer.from('abcdefghij\xff\x00')

  bl.append('abcd')
  bl.append('efg')
  bl.append('hi')
  bl.append('j')
  bl.append('\xff\x00')

  encodings.forEach(function (enc) {
      t.equal(bl.toString(enc), b.toString(enc))
    })

  t.end()
})

tape('test Number appendage', function (t) {
  var bl = new BufferList()
    , b  = Buffer.from('1234567890')

  bl.append(1234)
  bl.append(567)
  bl.append(89)
  bl.append(0)

  encodings.forEach(function (enc) {
      t.equal(bl.toString(enc), b.toString(enc))
    })

  t.end()
})

tape('write nothing, should get empty buffer', function (t) {
  t.plan(3)
  BufferList(function (err, data) {
    t.notOk(err, 'no error')
    t.ok(Buffer.isBuffer(data), 'got a buffer')
    t.equal(0, data.length, 'got a zero-length buffer')
    t.end()
  }).end()
})

tape('unicode string', function (t) {
  t.plan(2)
  var inp1 = '\u2600'
    , inp2 = '\u2603'
    , exp = inp1 + ' and ' + inp2
    , bl = BufferList()
  bl.write(inp1)
  bl.write(' and ')
  bl.write(inp2)
  t.equal(exp, bl.toString())
  t.equal(Buffer.from(exp).toString('hex'), bl.toString('hex'))
})

tape('should emit finish', function (t) {
  var source = BufferList()
    , dest = BufferList()

  source.write('hello')
  source.pipe(dest)

  dest.on('finish', function () {
    t.equal(dest.toString('utf8'), 'hello')
    t.end()
  })
})

tape('basic copy', function (t) {
  var buf  = crypto.randomBytes(1024)
    , buf2 = Buffer.alloc(1024)
    , b    = BufferList(buf)

  b.copy(buf2)
  t.equal(b.slice().toString('hex'), buf2.toString('hex'), 'same buffer')
  t.end()
})

tape('copy after many appends', function (t) {
  var buf  = crypto.randomBytes(512)
    , buf2 = Buffer.alloc(1024)
    , b    = BufferList(buf)

  b.append(buf)
  b.copy(buf2)
  t.equal(b.slice().toString('hex'), buf2.toString('hex'), 'same buffer')
  t.end()
})

tape('copy at a precise position', function (t) {
  var buf  = crypto.randomBytes(1004)
    , buf2 = Buffer.alloc(1024)
    , b    = BufferList(buf)

  b.copy(buf2, 20)
  t.equal(b.slice().toString('hex'), buf2.slice(20).toString('hex'), 'same buffer')
  t.end()
})

tape('copy starting from a precise location', function (t) {
  var buf  = crypto.randomBytes(10)
    , buf2 = Buffer.alloc(5)
    , b    = BufferList(buf)

  b.copy(buf2, 0, 5)
  t.equal(b.slice(5).toString('hex'), buf2.toString('hex'), 'same buffer')
  t.end()
})

tape('copy in an interval', function (t) {
  var rnd      = crypto.randomBytes(10)
    , b        = BufferList(rnd) // put the random bytes there
    , actual   = Buffer.alloc(3)
    , expected = Buffer.alloc(3)

  rnd.copy(expected, 0, 5, 8)
  b.copy(actual, 0, 5, 8)

  t.equal(actual.toString('hex'), expected.toString('hex'), 'same buffer')
  t.end()
})

tape('copy an interval between two buffers', function (t) {
  var buf      = crypto.randomBytes(10)
    , buf2     = Buffer.alloc(10)
    , b        = BufferList(buf)

  b.append(buf)
  b.copy(buf2, 0, 5, 15)

  t.equal(b.slice(5, 15).toString('hex'), buf2.toString('hex'), 'same buffer')
  t.end()
})

tape('shallow slice across buffer boundaries', function (t) {
  var bl = new BufferList(['First', 'Second', 'Third'])

  t.equal(bl.shallowSlice(3, 13).toString(), 'stSecondTh')
  t.end()
})

tape('shallow slice within single buffer', function (t) {
  t.plan(2)
  var bl = new BufferList(['First', 'Second', 'Third'])

  t.equal(bl.shallowSlice(5, 10).toString(), 'Secon')
  t.equal(bl.shallowSlice(7, 10).toString(), 'con')
  t.end()
})

tape('shallow slice single buffer', function (t) {
  t.plan(3)
  var bl = new BufferList(['First', 'Second', 'Third'])

  t.equal(bl.shallowSlice(0, 5).toString(), 'First')
  t.equal(bl.shallowSlice(5, 11).toString(), 'Second')
  t.equal(bl.shallowSlice(11, 16).toString(), 'Third')
})

tape('shallow slice with negative or omitted indices', function (t) {
  t.plan(4)
  var bl = new BufferList(['First', 'Second', 'Third'])

  t.equal(bl.shallowSlice().toString(), 'FirstSecondThird')
  t.equal(bl.shallowSlice(5).toString(), 'SecondThird')
  t.equal(bl.shallowSlice(5, -3).toString(), 'SecondTh')
  t.equal(bl.shallowSlice(-8).toString(), 'ondThird')
})

tape('shallow slice does not make a copy', function (t) {
  t.plan(1)
  var buffers = [Buffer.from('First'), Buffer.from('Second'), Buffer.from('Third')]
  var bl = (new BufferList(buffers)).shallowSlice(5, -3)

  buffers[1].fill('h')
  buffers[2].fill('h')

  t.equal(bl.toString(), 'hhhhhhhh')
})

tape('duplicate', function (t) {
  t.plan(2)

  var bl = new BufferList('abcdefghij\xff\x00')
    , dup = bl.duplicate()

  t.equal(bl.prototype, dup.prototype)
  t.equal(bl.toString('hex'), dup.toString('hex'))
})

tape('destroy no pipe', function (t) {
  t.plan(2)

  var bl = new BufferList('alsdkfja;lsdkfja;lsdk')
  bl.destroy()

  t.equal(bl._bufs.length, 0)
  t.equal(bl.length, 0)
})

!process.browser && tape('destroy with pipe before read end', function (t) {
  t.plan(2)

  var bl = new BufferList()
  fs.createReadStream(__dirname + '/test.js')
    .pipe(bl)

  bl.destroy()

  t.equal(bl._bufs.length, 0)
  t.equal(bl.length, 0)

})

!process.browser && tape('destroy with pipe before read end with race', function (t) {
  t.plan(2)

  var bl = new BufferList()
  fs.createReadStream(__dirname + '/test.js')
    .pipe(bl)

  setTimeout(function () {
    bl.destroy()
    setTimeout(function () {
      t.equal(bl._bufs.length, 0)
      t.equal(bl.length, 0)
    }, 500)
  }, 500)
})

!process.browser && tape('destroy with pipe after read end', function (t) {
  t.plan(2)

  var bl = new BufferList()
  fs.createReadStream(__dirname + '/test.js')
    .on('end', onEnd)
    .pipe(bl)

  function onEnd () {
    bl.destroy()

    t.equal(bl._bufs.length, 0)
    t.equal(bl.length, 0)
  }
})

!process.browser && tape('destroy with pipe while writing to a destination', function (t) {
  t.plan(4)

  var bl = new BufferList()
    , ds = new BufferList()

  fs.createReadStream(__dirname + '/test.js')
    .on('end', onEnd)
    .pipe(bl)

  function onEnd () {
    bl.pipe(ds)

    setTimeout(function () {
      bl.destroy()

      t.equals(bl._bufs.length, 0)
      t.equals(bl.length, 0)

      ds.destroy()

      t.equals(bl._bufs.length, 0)
      t.equals(bl.length, 0)

    }, 100)
  }
})

!process.browser && tape('handle error', function (t) {
  t.plan(2)
  fs.createReadStream('/does/not/exist').pipe(BufferList(function (err, data) {
    t.ok(err instanceof Error, 'has error')
    t.notOk(data, 'no data')
  }))
})
