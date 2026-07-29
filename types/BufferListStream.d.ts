import { Duplex } from 'node:stream';
import { BufferList } from './BufferList.js';
export type BufferListAcceptedTypes = import('./BufferList.js').BufferListAcceptedTypes;
/**
 * @typedef {import('./BufferList.js').BufferListAcceptedTypes} BufferListAcceptedTypes
 */
export declare class BufferListStream extends Duplex {
    _callback: ((err: Error | null, buffer?: Buffer) => void) | undefined;
    /** @type {Buffer[]} */
    _bufs: Buffer[];
    /** @type {number} */
    length: number;
    /**
     * @param {((err: Error | null, buffer?: Buffer) => void) | BufferListAcceptedTypes} [callback]
     */
    constructor(callback?: ((err: Error | null, buffer?: Buffer) => void) | BufferListAcceptedTypes);
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
    /**
     * @param {any} b
     * @returns {boolean}
     */
    static isBufferList(b: any): boolean;
}
export default BufferListStream;
export { BufferList };
/** @type {(b: any) => boolean} */
export declare const isBufferList: (b: any) => boolean;
//# sourceMappingURL=BufferListStream.d.ts.map