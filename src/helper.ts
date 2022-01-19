import Go from './wasm-exec';

/**
 * load wasm
 *
 * @param {RequestInfo} path wasm file path
 */
export async function loadWasm(path: RequestInfo): Promise<void> {
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
            fetch(path),
            go.importObject
        );

        go.run(result.instance);
    } catch (error) {
        return Promise.reject(error);
    }
}

/**
 * check if the URL scheme is 'ws' or 'wss'
 *
 * @param protocol - URL's scheme
 */
export function isWSProtocol(protocol: string): boolean {
    return protocol === 'ws' || protocol === 'wss';
}

/**
 * get URL's scheme
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
 * update query string parameter
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
