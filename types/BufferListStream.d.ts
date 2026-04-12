/**
 * @typedef {import('./BufferList.js').BufferListAcceptedTypes} BufferListAcceptedTypes
 */
export class BufferListStream extends Duplex {
    /**
     * @param {any} b
     * @returns {boolean}
     */
    static isBufferList(b: any): boolean;
    /**
     * @param {((err: Error | null, buffer?: Buffer) => void) | BufferListAcceptedTypes} [callback]
     */
    constructor(callback?: ((err: Error | null, buffer?: Buffer) => void) | BufferListAcceptedTypes);
    _callback: ((err: Error | null, buffer?: Buffer) => void) | undefined;
    /** @type {Buffer[]} */
    _bufs: Buffer[];
    /** @type {number} */
    length: number;
    /**
     * @param {any} buf
     * @param {string} encoding
     * @param {Function} callback
     */
    _write(buf: any, encoding: string, callback: Function): void;
    /** @param {number} size */
    _read(size: number): boolean | undefined;
    /**
     * @param {any} [chunk]
     * @param {any} [encoding]
     * @param {any} [cb]
     * @returns {this}
     */
    end(chunk?: any, encoding?: any, cb?: any): this;
    /**
     * @param {Error | null} err
     * @param {Function} cb
     */
    _destroy(err: Error | null, cb: Function): void;
    /** @param {any} [callback] */
    _new(callback?: any): BufferListStream;
    /**
     * @param {any} b
     * @returns {b is BufferList}
     */
    _isBufferList(b: any): b is BufferList;
}
export default BufferListStream;
export { BufferList };
/** @type {(b: any) => boolean} */
export const isBufferList: (b: any) => boolean;
export type BufferListAcceptedTypes = import("./BufferList.js").BufferListAcceptedTypes;
import { Duplex } from 'node:stream';
import { BufferList } from './BufferList.js';
//# sourceMappingURL=BufferListStream.d.ts.map