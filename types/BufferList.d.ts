export class BufferList {
    /**
     * @param {any} b
     * @returns {boolean}
     */
    static isBufferList(b: any): boolean;
    /** @param {BufferListAcceptedTypes} [buf] */
    constructor(buf?: BufferListAcceptedTypes);
    /** @type {Buffer[]} */
    _bufs: Buffer[];
    /** @type {number} */
    length: number;
    /** @param {BufferListAcceptedTypes} [buf] */
    _new(buf?: BufferListAcceptedTypes): BufferList;
    /**
     * @param {number} offset
     * @returns {[number, number]}
     */
    _offset(offset: number): [number, number];
    /**
     * @param {[number, number]} blOffset
     * @returns {number}
     */
    _reverseOffset(blOffset: [number, number]): number;
    /** @returns {Buffer[]} */
    getBuffers(): Buffer[];
    /**
     * @param {number} index
     * @returns {number | undefined}
     */
    get(index: number): number | undefined;
    /**
     * @param {number} [start]
     * @param {number} [end]
     * @returns {Buffer}
     */
    slice(start?: number, end?: number): Buffer;
    /**
     * @param {Buffer | null} dst
     * @param {number} [dstStart]
     * @param {number} [srcStart]
     * @param {number} [srcEnd]
     * @returns {Buffer}
     */
    copy(dst: Buffer | null, dstStart?: number, srcStart?: number, srcEnd?: number): Buffer;
    /**
     * @param {number} [start]
     * @param {number} [end]
     * @returns {BufferList}
     */
    shallowSlice(start?: number, end?: number): BufferList;
    /**
     * @param {BufferEncoding} [encoding]
     * @param {number} [start]
     * @param {number} [end]
     * @returns {string}
     */
    toString(encoding?: BufferEncoding, start?: number, end?: number): string;
    /**
     * @param {number} bytes
     * @returns {this}
     */
    consume(bytes: number): this;
    /** @returns {BufferList} */
    duplicate(): BufferList;
    /**
     * @param {BufferListAcceptedTypes} buf
     * @returns {this}
     */
    append(buf: BufferListAcceptedTypes): this;
    /**
     * @param {BufferListAcceptedTypes} buf
     * @returns {this}
     */
    prepend(buf: BufferListAcceptedTypes): this;
    /**
     * @param {BufferListAcceptedTypes} buf
     * @param {(this: BufferList, buf: Buffer) => void} attacher
     * @param {boolean} [prepend]
     * @returns {this}
     */
    _attach(buf: BufferListAcceptedTypes, attacher: (this: BufferList, buf: Buffer) => void, prepend?: boolean): this;
    /** @param {Buffer} buf */
    _appendBuffer(buf: Buffer): void;
    /** @param {Buffer} buf */
    _prependBuffer(buf: Buffer): void;
    /**
     * @param {string | number | Buffer | BufferList | Uint8Array} search
     * @param {number | string} [offset]
     * @param {BufferEncoding} [encoding]
     * @returns {number}
     */
    indexOf(search: string | number | Buffer | BufferList | Uint8Array, offset?: number | string, encoding?: BufferEncoding): number;
    /**
     * @param {number} offset
     * @param {Buffer | Uint8Array} search
     * @returns {boolean}
     */
    _match(offset: number, search: Buffer | Uint8Array): boolean;
    /**
     * @param {any} b
     * @returns {b is BufferList}
     */
    _isBufferList(b: any): b is BufferList;
}
export default BufferList;
export type BufferListAcceptedTypes = Buffer | BufferList | Uint8Array | Array<Buffer | BufferList | Uint8Array | string | number> | string | number;
import { Buffer } from 'node:buffer';
//# sourceMappingURL=BufferList.d.ts.map