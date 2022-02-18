import Go from './wasm-exec';
import { PresenceOption } from './type';

const y3WasmPath = 'https://d1lxb757x1h2rw.cloudfront.net/y3.wasm';

/**
 * Load wasm
 */
export async function loadWasm(): Promise<void> {
    // This is a polyfill for FireFox and Safari
    if (!WebAssembly.instantiateStreaming) {
        WebAssembly.instantiateStreaming = async (resp, importObject) => {
            const source = await (await resp).arrayBuffer();
            return await WebAssembly.instantiate(source, importObject);
        };
    }

    const go = new Go();

    go.importObject.env['syscall/js.finalizeRef'] = () => {};

    try {
        const result = await WebAssembly.instantiateStreaming(
            fetch(y3WasmPath),
            go.importObject
        );

        go.run(result.instance);
    } catch (error) {
        return Promise.reject(error);
    }
}

/**
 * Encoder
 *
 * @param data
 */
export function encoder(data: any) {
    return (window as any).encode(0x11, data).buffer;
}

/**
 * Decoder
 *
 * @param data
 */
export function decoder(data: any) {
    const uint8buf = new Uint8Array(data);
    return (window as any).decode(0x11, uint8buf);
}

/**
 * Get URL's scheme
 *
 * @param url - the url of the socket server to connect to
 */
export function getProtocol(url: string) {
    if (!url) {
        return '';
    }

    return url.split(':')[0];
}

/**
 * Update query string parameter
 *
 * @param uri Uniform Resource Identifier
 * @param key parameter key
 * @param value value of the parameter key
 *
 * @returns Uniform Resource Identifier
 */
export function updateQueryStringParameter(
    uri: string,
    key: string,
    value: string | number | undefined
) {
    const re = new RegExp(`([?&])${key}=.*?(&|$)`, 'i');
    const separator = uri.indexOf('?') !== -1 ? '&' : '?';
    if (uri.match(re)) {
        return uri.replace(re, `$1${key}=${value}$2`);
    } else {
        return `${uri}${separator}${key}=${value}`;
    }
}

/**
 * Function for obtaining authorised URL
 *
 * @param host Service url
 * @param {PresenceOption} option
 *
 * @returns Promise containing AuthorizedURL
 */
export async function getAuthorizedURL(host: string, option: PresenceOption) {
    // `publickey` is the way to test
    // if (option?.auth?.type === 'publickey' && option.auth.publicKey) {
    //     return updateQueryStringParameter(
    //         host,
    //         'public_key',
    //         option.auth.publicKey
    //     );
    // }

    // `token` is the way to go for production environments
    if (option?.auth?.type === 'token' && option.auth.endpoint) {
        try {
            const response = await fetch(option.auth.endpoint);
            const data = await response.json();
            return updateQueryStringParameter(host, 'token', data.token);
        } catch (error) {
            throw error;
        }
    } else {
        throw new Error('You are not authorized, please configure `endpoint`');
    }
}
