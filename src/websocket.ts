import { interval, Observable, Subject, Subscription } from 'rxjs';
import { WebSocketSubject } from 'rxjs/webSocket';
import { takeWhile } from 'rxjs/operators';
import Transport from './transport';
import { decoder, encoder, getAuthorizedURL, loadWasm } from './helper';
import { EventMessage, IPresenceOption } from './type';

export default class WS extends Transport {
    // WebSocketSubject instance
    private _socket$: WebSocketSubject<EventMessage> | undefined;
    // Socket Subscription
    private _socketSubscription: Subscription | undefined;
    // Reconnection stream
    private _reconnectionObservable: Observable<number> | undefined;
    // Reconnection Subscription
    private _reconnectionSubscription: Subscription | undefined;
    // Reconnect interval
    private _reconnectInterval: number;
    // Reconnect attempts
    private _reconnectAttempts: number;

    constructor(host: string, option: IPresenceOption) {
        super(host);
        this._reconnectInterval = option?.reconnectInterval || 5000;
        this._reconnectAttempts = option?.reconnectAttempts || 3;
        this.connectionStatus$ = new Subject<boolean>();
        this.connectionStatus$.subscribe({
            next: isConnected => {
                if (
                    !this._reconnectionObservable &&
                    typeof isConnected === 'boolean' &&
                    !isConnected
                ) {
                    this._reconnect();
                }
            },
        });

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
        if (this._socket$) {
            this._socket$.next({ event, data });
        }
    }

    /**
     * Close subscriptions, clean up
     */
    close(): void {
        this._reconnectAttempts = 0;
        this._clearReconnection();
        this._clearSocket();
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

        this._socket$ = new WebSocketSubject({
            url: this.host,
            serializer: encoder,
            deserializer: (event: MessageEvent) => decoder(event.data),
            binaryType: 'arraybuffer',
            openObserver: {
                next: () => {
                    this.connectionStatus$.next(true);
                },
            },
            closeObserver: {
                next: () => {
                    this._clearSocket();
                    this.connectionStatus$.next(false);
                },
            },
        });

        this._socketSubscription = this._socket$.subscribe({
            next: msg => {
                this.next(msg);
            },
            error: () => {
                if (!this._socket$) {
                    this._clearReconnection();
                    this._reconnect();
                }
            },
        });

        this._socketSubscription.add(
            interval(5000).subscribe(_ => {
                this.send('ping', { timestamp: Date.now() });
            })
        );

        this._socketSubscription.add(
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
    }

    /**
     * Reconnect
     *
     * @private
     */
    private _reconnect(): void {
        this._reconnectionObservable = interval(this._reconnectInterval).pipe(
            takeWhile(
                (_, index) => index < this._reconnectAttempts && !this._socket$
            )
        );

        this._reconnectionSubscription = this._reconnectionObservable.subscribe(
            {
                next: () => this._connect(),
                error: () => undefined,
                complete: () => {
                    this._clearReconnection();
                    if (!this._socket$) {
                        this.complete();
                        this.connectionStatus$.complete();
                    }
                },
            }
        );
    }

    /**
     * Clear socket
     *
     * @private
     */
    private _clearSocket(): void {
        this._socket$?.complete();
        this._socketSubscription && this._socketSubscription.unsubscribe();
        this._socket$ = undefined;
    }

    /**
     * Clear reconnect
     *
     * @private
     */
    private _clearReconnection(): void {
        this._reconnectionSubscription &&
            this._reconnectionSubscription.unsubscribe();
        this._reconnectionObservable = undefined;
    }
}
