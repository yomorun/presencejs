## GroupHug

![](https://badgen.net/npm/v/@yomo/group-hug-react)

Live collaborator avatars for multiplayer web apps

[Online Demo](https://allegrocloud.io/preview/clewfjysp0008osvwuina6qnf)

## 🥷🏼 Usage

Install with npm:

```
$ npm i --save @yomo/group-hug-react
```

Create a [Presence](https://github.com/yomorun/presencejs) instance

```js
import Presence from "@yomo/presence";

// create an instance.
const presence = new Presence("https://lo.yomo.dev:8443/v1", {
  publicKey: "DEV_TOKEN",
  id,
  debug: true,
});
```

Add `<GroupHug />` to pages:

```js
const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  return (
    <div>
      <GroupHug
        presence={presence}
        id={peerId}
        name={peerDisplayName}
        darkMode={darkMode}
      />
    </div>
  );
};
```

## 🧪 Props

According to the demo code above, we can see an avatar with the default style.

Furthermore, we offer the option to utilize custom styles should you desire

If the `avatar` image is not specified, [avvvatars](https://avvvatars.com/) will
be utilized as the placeholder.

Similarly, if you do not specify the color of `avatarBorderColor`, a random
color will be assigned automatically.

Grouphug provides many style-related properties, you can customize the avatar
with your own style by setting these properties.

Grouphug offers a plethora of style-related properties, enabling you to
personalize the avatar according to your own preferences by configuring these
properties.

Below are the comprehensive customization options:

```jsx
<GroupHug
  presence={presence}
  channel={channel}
  id={id}
  name={"Noah"}
  placeholder={shape}
  size={24}
  darkMode={true}
  avatar={"https://avatars.githubusercontent.com/u/33050549?v=4"}
  avatarTextColor={"white"}
  avatarBorderWidth={3}
  avatarBorderColor={"blue"}
  avatarBackgroundColor={"red"}
  overlapping={true}
  transparency={0.5}
  maximum={6}
  MPOP={true}
  onMouseEnter={() => console.log(`mouse enter`)}
  onMouseLeave={() => console.log(`mouse leave`)}
/>;
```

Here are the full props:

| name                  | type                 | description                                                                                               |
| --------------------- | -------------------- | --------------------------------------------------------------------------------------------------------- |
| presence              | Promise<IPresence>   | The Presence instance                                                                                     |
| channel               | string               | The channel name of the Presence instance                                                                 |
| id                    | string               | The unique identifier of the user                                                                         |
| name                  | string               | The name or display name of the user                                                                      |
| avatar                | string               | The avatar image url of the user                                                                          |
| placeholder           | 'shape', 'character' | The placeholder image when `avatar` absence                                                               |
| MPOP                  | boolean              | A boolean value indicating whether the MPOP (Multiple Points of Presence) feature is enabled for the user |
| darkMode              | boolean              | A boolean value indicating whether the dark mode is enabled for the user                                  |
| avatarTextColor       | string               | The color of the text displayed on the user's avatar                                                      |
| avatarBackgroundColor | string               | The background color of the user's avatar                                                                 |
| avatarBorderColor     | string               | The border color of the user's avatar                                                                     |
| avatarBorderWidth     | number               | The width of the border around the user's avatar                                                          |
| size                  | number               | The size of the avatar in pixels                                                                          |
| overlapping           | boolean              | A boolean value indicating whether the avatars should overlap when multiple users are present             |
| transparency          | number               | The transparency level of the avatars, ranging from 0 (fully transparent) to 1 (fully opaque)             |
| maximum               | number               | The maximum number of avatars stacking                                                                    |
| onMouseEnter          | (user: User) => void | A callback function triggered when the mouse pointer enters the user's avatar                             |
| onMouseLeave          | (user: User) => void | A callback function triggered when the mouse pointer leaves the user's avatar                             |

## 👩‍🔬 Local Development

1. Start local `prscd` dev server: `bun run prscd:dev`
2. Start Grouphug code generator tool: `bun run dev`

<img width="1024" alt="image" src="https://github.com/yomorun/presencejs/assets/65603/b7f5f8a1-e0db-4aac-8b01-861d8aa535a2">

## 🌎 Self-hosting

see [Self-Hosting Doc](https://presence.js.org/docs/hosting)

## 🧘🏻 License

The [MIT License](./LICENSE).
