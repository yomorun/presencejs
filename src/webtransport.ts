import { interval, Subscription } from 'rxjs';
import Transport from './transport';
import { decoder, encoder, getAuthorizedURL, loadWasm } from './helper';
import { IPresenceOption } from './type';

export default class WT extends Transport {
    // WebTransport instance
    private _transport: any;
    // WebTransport datagram writer
    private _transportDatagramWriter: any;
    // Subscription
    private _subscription: Subscription | undefined;

    constructor(host: string, option: IPresenceOption) {
        super(host);
        getAuthorizedURL(host, option).then(url => {
            this.host = url;
            this._connect();
        });
    }

    /**
     * Function for sending data to the server
     *
     * @param event name of the event
     * @param data
     */
    send<T>(event: string, data: T) {
        if (this._transportDatagramWriter) {
            this._transportDatagramWriter.write(encoder({ event, data }));
        }
    }

    /**
     * Clean up
     */
    close() {
        if (this._transport) {
            this._transport = undefined;
        }

        if (this._transportDatagramWriter) {
            this._transportDatagramWriter = undefined;
        }

        if (this._subscription) {
            this._subscription.unsubscribe();
            this._subscription = undefined;
        }

        this.connectionStatus$.next(false);
    }

    /**
     * Connect to YoMo
     *
     * @private
     */
    private async _connect() {
        if (!this.wasmLoaded) {
            try {
                await loadWasm();
                this.wasmLoaded = true;
            } catch (error) {
                throw error;
            }
        }

        // @ts-ignore
        this._transport = new WebTransport(this.host);

        try {
            this._transportDatagramWriter = this._transport.datagrams.writable.getWriter();
            await this._transport.ready;
            this.connectionStatus$.next(true);
        } catch (e) {
            throw e;
        }

        this._transport.closed.then(() => {
            this.connectionStatus$.next(false);
        });

        this._subscription = interval(5000).subscribe(_ => {
            this.send('ping', { timestamp: Date.now() });
        });

        this._subscription.add(
            this.on$<{ timestamp: number; meshId: string }>('pong').subscribe(
                data => {
                    const { timestamp, meshId } = data;
                    if (timestamp) {
                        // Calculate the latency and broadcast the results
                        const rtt = Date.now() - timestamp;
                        const latency = rtt / 2;
                        this.send('latency', {
                            latency,
                            meshId,
                        });
                    }
                }
            )
        );

        this._readDatagrams();
    }

    /**
     * Read datagrams
     *
     * @private
     */
    private async _readDatagrams() {
        try {
            const reader = this._transport.datagrams.readable.getReader();
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    return;
                }
                this.next(decoder(value));
            }
        } catch (e) {
            throw e;
        }
    }
}
