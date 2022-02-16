import { interval, Observable, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { decoder, encoder, getAuthorizedURL, loadWasm } from './helper';
import { EventMessage, IPresence, IPresenceOption } from './type';

export default class WT extends Subject<EventMessage> {
    // Service url
    public host: string;
    // Wasm file is loaded or not
    private _wasmLoaded: boolean;
    // WebTransport instance
    private _transport: any;
    // WebTransport datagram writer
    private _transportDatagramWriter: any;
    // Subject for connection status stream
    private _connectionStatus$: Subject<boolean>;
    // Subscription
    private _subscription: Subscription | undefined;

    constructor(host: string, option: IPresenceOption) {
        super();
        this.host = host;
        this._wasmLoaded = false;
        this._connectionStatus$ = new Subject<boolean>();

        getAuthorizedURL(host, option).then(url => {
            this.host = url;
            this._connect();
        });
    }

    /**
     * Function to handle response for given event from server
     *
     * @param event name of the event
     * @param cb is the function executed when the events 'connected' and 'closed' occur
     *
     * @private
     */
    on<T>(event: string, cb: (data: T) => void) {
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
                next: (message: EventMessage): void => cb(message.data),
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
        if (this._transportDatagramWriter) {
            this._transportDatagramWriter.write(encoder({ event, data }));
        }
    }

    /**
     * Enter a room
     *
     * @param roomName name of the room
     *
     * @return {IPresence}
     */
    toRoom(roomName: string): IPresence {
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
                await loadWasm();
                this._wasmLoaded = true;
            } catch (error) {
                throw error;
            }
        }

        // @ts-ignore
        this._transport = new WebTransport(this.host);

        try {
            this._transportDatagramWriter = this._transport.datagrams.writable.getWriter();
            await this._transport.ready;
            this._connectionStatus$.next(true);
        } catch (e) {
            throw e;
        }

        this._transport.closed.then(() => {
            this._connectionStatus$.next(false);
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
