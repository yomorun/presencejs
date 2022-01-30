<p align="center">
    <img alt="presencejs logo " src="/logo.png"><br/>
    <a aria-label="NPM version" href="https://www.npmjs.com/package/@yomo/presencejs">
        <img alt="NPM version" src="https://badgen.net/npm/v/@yomo/presencejs">
    </a>
    <a aria-label="License" href="https://github.com/yomorun/presencejs/blob/main/LICENSE">
        <img alt="License" src="https://badgen.net/npm/license/@yomo/presencejs">
    </a>
</p>

## Introduction

`Presencejs` is a JavaScript library that allows you to build real-time web applications quickly, the server is built atop of [YoMo](https://github.com/yomorun/yomo), which provide secure, low-latency, and high-performance geo-distributed services.

-   **Secure**, **low-latency** and **high-performance**
-   **Real-time** experience
-   Revalidation on network recovery
-   Keep Connected
-   Built-in error retry
-   TypeScript

...and a lot more.

With `presencejs`, components will get data flow in real time. Thus, the UI will be always **fast** and **reactive**.

## Quick Start

### 1. Add `presencejs` to your web app

Using npm

```
$ npm i --save @yomo/presencejs
```

Using yarn

```
$ yarn add @yomo/presencejs
```

Using pnpm

```
$ pmpm i @yomo/presencejs
```

For CDN, you can use [skypack](https://www.skypack.dev): [https://cdn.skypack.dev/@yomo/presencejs](https://cdn.skypack.dev/@yomo/presencejs)

```html
<script type="module">
    import { Presence } from 'https://cdn.skypack.dev/@yomo/presencejs';
</script>
```

### 2. Connect to presence server

The client need to authenticate with YoMo to establish a realtime connection. The following code sample uses a demo YoMo's server(`wss://presence.yomo.dev`) and public Key to authenticate and print the message `Connected to YoMo!` when you’ve successfully connected.

#### How do I get a token?

If you build your application using next.js, then you can use [API Routes](https://nextjs.org/docs/api-routes/introduction) to get the access token.
For example, the following API route `pages/api/auth.js` returns a json response with a status code of 200:

```js
export default async function handler(req, res) {
    if (req.method === 'GET') {
        const response = await fetch('https://presence.yomo.dev/api/v1/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                app_id: process.env.PRESENCE_APP_ID,
                app_secret: process.env.PRESENCE_APP_SECRET,
            }),
        });
        const data = await response.json();
        res.status(200).json(data.data);
    } else {
        // Handle any other HTTP method
    }
}
```

Response data:

```json
{
    "token": "eyJhbGciOiJIUzI1..."
}
```

#### Create a `Presence` instance.

```js
import { Presence } from '@yomo/presencejs';

// new Presence(host: string, option?: {
//     // Authentication
//     auth?: {
//         // Certification Type
//         type: 'publickey' | 'token',
//         // The public key in your Allegro Mesh project.
//         publicKey?: string,
//         // api for getting access token
//         endpoint?: string,
//     };
//     // The reconnection interval value.
//     reconnectInterval?: number;
//     // The reconnection attempts value.
//     reconnectAttempts?: number;
// }): Presence

// create an instance.
const yomo = new Presence('wss://presence.yomo.dev', {
    auth: {
        // Certification Type
        type: 'token',
        // api for getting access token
        endpoint: '/api/auth',
    },
});

yomo.on('connected', () => {
    console.log('Connected to server: ', yomo.host);
});
```

### 3. Subscribe to messages from the server

Call the `toRoom('001')` function to enter room `001`, without it, you are in the default room.The client receives a message with the name `online` through the `on` callback function, and can also subscribe to a message with the name `mousemove` by returning an observable object through `on$`.

```js
yomo.on('connected', () => {
    // Enter a room
    yomo.toRoom('001');

    // Function to handle response for given event from server
    yomo.on('online', data => {
        console.log('online:', data);
    });

    // Same as the `on` method, returns an observable response
    yomo.on$('mousemove').subscribe(data => {
        console.log('mousemove:', data);
    });

    // If you want to display the latency, you can get the value of the latency like this
    yomo.on('latency', data => {
        const { id, latency, meshId } = data;
        console.log('latency:', latency);
    });
});
```

### 4. Send messages to the server

The following example code send a message to the quickstart room with the name `online` and the contents pixel position.
You can use rxjs to get an observable sequence of browser event transitions，then send the data to the signal channel with the name `mousemove` in room `001` via `ofRoom('001', 'mousemove')`.

```js
import { fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';

const ID = '34a1dbb5-c031-4680-926c-84a789d251e0';

yomo.on('connected', () => {
    // Function for sending data to the server
    yomo.send('online', {
        id: ID,
        x: 10,
        y: 10,
    });

    // Converting browser events into observable sequences.
    const mousemove$ = fromEvent(document, 'mousemove').pipe(
        map(event => {
            return {
                id: ID,
                x: event.clientX,
                y: event.clientY,
            };
        })
    );

    // Sending data streams to the server
    mousemove$.subscribe(yomo.ofRoom('001', 'mousemove'));
});
```

### 5. Close a connection

A connection to YoMo can be closed once it is no longer needed.

```js
yomo.close();
yomo.on('closed', () => {
    console.log('Closed the connection');
});
```

## API

| Methods of instance | Description                                                     | Type                                                |
| ------------------- | --------------------------------------------------------------- | --------------------------------------------------- |
| `on`                | Function to handle response for given event from server         | `on<T>(event: string, cb: (data: T) => void): void` |
| `on$`               | Same as the `on` method, returns an observable response         | `on$<T>(event: string): Observable<T>`              |
| `send`              | Function for sending data to the server                         | `send<T>(event: string, data: T)`                   |
| `toRoom`            | Enter a room                                                    | `toRoom(roomName: string): Presence`                |
| `ofRoom`            | Function for sending data streams to the server                 | `ofRoom(roomName: string, event: string)`           |
| `close`             | A connection to YoMo can be closed once it is no longer needed. | `close(): void`                                     |

## Examples

- React Cursor Chat Component: [Online Preview](https://cursor-chat-example.vercel.app)
  - https://github.com/yomorun/react-cursor-chat
- Next.js Commerce with realtime collaboration: [Online Preview](https://commerce-ochre-sigma-86.vercel.app/)
  - https://github.com/osdodo/commerce

## Contributors

[//]: contributor-faces

<a href="https://github.com/osdodo"><img src="https://avatars.githubusercontent.com/u/24246314?v=4" title="Osdodo" width="60" height="60"></a>
<a href="https://github.com/yoname"><img src="https://avatars.githubusercontent.com/u/25947177?v=4" title="Yona" width="60" height="60"></a>
<a href="https://github.com/vishvadlamani"><img src="https://avatars.githubusercontent.com/u/16164144?v=4" title="Vish Vadlamani" width="60" height="60"></a>
<a href="https://github.com/xiaojian-hong"><img src="https://avatars.githubusercontent.com/u/48110142?v=4" title="XJ Hong" width="60" height="60"></a>
<a href="https://github.com/venjiang"><img src="https://avatars.githubusercontent.com/u/1587671?v=4" title="Venjiang" width="60" height="60"></a>
<a href="https://github.com/fanweixiao"><img src="https://avatars.githubusercontent.com/u/65603?v=4" title="C.C." width="60" height="60"></a>

[//]: contributor-faces

## License

The MIT License.
