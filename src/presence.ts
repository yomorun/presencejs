import { interval, Observable, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, takeWhile } from 'rxjs/operators';
import { WebSocketSubject } from 'rxjs/webSocket';
import {
    getProtocol,
    isWSProtocol,
    updateQueryStringParameter,
    loadWasm,
} from './helper';
import { WebSocketMessage, PresenceOption } from './type';

export default class Presence extends Subject<WebSocketMessage> {
    public host: string;

    private _wasmLoaded: boolean;

    private _socket$: WebSocketSubject<WebSocketMessage> | undefined;
    private _socketSubscription: Subscription | undefined;

    private _connectionStatus$: Subject<boolean>;

    // Reconnection stream
    private _reconnectionObservable: Observable<number> | undefined;
    private _reconnectionSubscription: Subscription | undefined;
    private _reconnectInterval: number;
    private _reconnectAttempts: number;

    private _pingSubscription: Subscription | undefined;
    private _sendLatencySubscription: Subscription | undefined;

    constructor(host: string, option?: PresenceOption) {
        if (!isWSProtocol(getProtocol(host))) {
            throw new Error(
                `${host} -> The URL's scheme must be either 'ws' or 'wss'`
            );
        }

        super();

        this.host = host;

        this._wasmLoaded = false;

        this._reconnectInterval = option?.reconnectInterval
            ? option.reconnectInterval
            : 5000;

        this._reconnectAttempts = option?.reconnectAttempts
            ? option.reconnectAttempts
            : 3;

        this._connectionStatus$ = new Subject<boolean>();
        this._connectionStatus$.subscribe({
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

        this._pingSubscription = interval(5000).subscribe(_ => {
            this.send('ping', { timestamp: Date.now() });
        });

        this._sendLatencySubscription = this._sendLatency();

        if (option?.auth?.type === 'publickey' && option.auth.publicKey) {
            this.host = updateQueryStringParameter(
                host,
                'public_key',
                option.auth.publicKey
            );
            this._connect();
        } else if (option?.auth?.type === 'token' && option.auth.endpoint) {
            fetch(option.auth.endpoint)
                .then(response => response.json())
                .then((data: { token: string }) => {
                    this.host = updateQueryStringParameter(
                        host,
                        'token',
                        data.token
                    );
                    this._connect();
                })
                .catch(error => {
                    console.error('Error:', error);
                });
        } else {
            throw new Error(
                'You are not authorized, please configure `publicKey` or `endpoint`'
            );
        }
    }

    /**
     * Function to handle response for given event from server
     *
     * @param event name of the event
     * @param cb is the function executed when the events 'connected' and 'closed' occur
     *
     * @private
     */
    on<T>(event: string, cb: (data: T) => void): void {
        if (event === 'connected' || event === 'closed') {
            this._connectionStatus$
                .pipe(
                    distinctUntilChanged(),
                    filter(isConnected => {
                        return (
                            (isConnected && event === 'connected') ||
                            (!isConnected && event === 'closed')
                        );
                    })
                )
                .subscribe((isConnected: any) => {
                    cb(isConnected);
                });
        } else {
            this.pipe(
                filter((message: any): boolean => {
                    return (
                        message.event && message.event === event && message.data
                    );
                })
            ).subscribe({
                next: (message: WebSocketMessage): void => cb(message.data),
                error: () => undefined,
                complete: (): void => {},
            });
        }
    }

    /**
     * Same as the `on` method, returns an observable response
     *
     * @param event name of the event
     *
     * @return {Observable<T>}
     */
    on$<T>(event: string): Observable<T> {
        return this.pipe(
            filter((message: any): boolean => {
                return message.event && message.event === event && message.data;
            }),
            map(_ => _.data)
        );
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
     * Enter a room
     *
     * @param roomName name of the room
     *
     * @return {Presence}
     */
    toRoom(roomName: string): Presence {
        this.send('TOROOM', roomName);
        return this;
    }

    /**
     * Function for sending data streams to the server
     *
     * @param roomName name of the room
     * @param event name of the event
     *
     * @return (data: any) => void
     */
    ofRoom(roomName: string, event: string) {
        this.toRoom(roomName);
        return (data: any) => {
            this.send(event, data);
        };
    }

    /**
     * Close subscriptions, clean up
     */
    close(): void {
        if (this._pingSubscription) {
            this._pingSubscription.unsubscribe();
            this._pingSubscription = undefined;
        }
        if (this._sendLatencySubscription) {
            this._sendLatencySubscription.unsubscribe();
            this._sendLatencySubscription = undefined;
        }
        this._reconnectAttempts = 0;
        this._clearReconnection();
        this._clearSocket();
        this._connectionStatus$.next(false);
    }

    /**
     * Connect to YoMo
     *
     * @private
     */
    private async _connect() {
        if (!this._wasmLoaded) {
            try {
                await loadWasm('https://d1lxb757x1h2rw.cloudfront.net/y3.wasm');
                this._wasmLoaded = true;
            } catch (error) {
                throw error;
            }
        }

        const tag = 0x11;

        const serializer = (data: any) => {
            return (window as any).encode(tag, data).buffer;
        };

        const deserializer = (event: MessageEvent) => {
            const uint8buf = new Uint8Array(event.data);
            return (window as any).decode(tag, uint8buf);
        };

        this._socket$ = new WebSocketSubject({
            url: this.host,
            serializer,
            deserializer,
            binaryType: 'arraybuffer',
            openObserver: {
                next: () => {
                    this._connectionStatus$.next(true);
                },
            },
            closeObserver: {
                next: () => {
                    this._clearSocket();
                    this._connectionStatus$.next(false);
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
                        this._connectionStatus$.complete();
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

    /**
     * Calculate the latency and broadcast the results
     *
     * @private
     */
    private _sendLatency() {
        return this.on$<{ timestamp: number; meshId: string }>(
            'pong'
        ).subscribe(data => {
            const { timestamp, meshId } = data;
            if (timestamp) {
                const rtt = Date.now() - timestamp;
                const latency = rtt / 2;
                this.send('latency', {
                    latency,
                    meshId,
                });
            }
        });
    }
}
