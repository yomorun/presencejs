import { faker } from '@faker-js/faker';
import {
  AppShell,
  Box,
  Burger,
  Card,
  Center,
  ColorInput,
  ColorScheme,
  ColorSchemeProvider,
  Flex,
  Header,
  MantineProvider,
  MediaQuery,
  NavLink,
  Navbar,
  NumberInput,
  ScrollArea,
  SegmentedControl,
  Stack,
  Switch,
  Table,
  Tabs,
  Text,
  TextInput,
  ThemeIcon,
  useMantineTheme
} from '@mantine/core';
import { Prism } from '@mantine/prism';
import { RichTextEditor } from '@mantine/tiptap';
import {
  IconAlertCircle,
  IconArticle,
  IconCalendar,
  IconCamera,
  IconComponents,
  IconMail,
  IconMessage,
  IconMoon,
  IconSun,
  IconUserPlus,
  IconUsers
} from '@tabler/icons-react';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { createPresence } from '@yomo/presence';
import jsLanguageSyntax from 'highlight.js/lib/languages/javascript';
import { lowlight } from 'lowlight';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LiveEditor, LiveError } from 'react-live';
import './dist/style.css';
import GroupHug from './index';
import metadata from './metadata.json';
// @ts-ignore
import { themes } from 'prism-react-renderer';

lowlight.registerLanguage('js', jsLanguageSyntax);

const domContainer = document.querySelector('#app');
const root = createRoot(domContainer);

const id = Math.random().toString();

const presence = createPresence(import.meta.env.VITE_PUBLIC_URL as string, {
  publicKey: import.meta.env.VITE_PUBLIC_KEY as string,
  id,
  debug: true,
  autoDowngrade: true,
});

const rows = metadata.props.map(element => (
  <tr key={element.name}>
    <td>{element.name}</td>
    <td>{element.type}</td>
  </tr>
));

const App = () => {
  const theme = useMantineTheme();

  const [colorScheme, setColorScheme] = useState<ColorScheme>('dark');
  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  const [opened, setOpened] = useState(false);

  const [active, setActive] = useState(0);

  const navLinks = [
    {
      icon: IconUsers,
      label: 'GroupHug',
      description: 'Add real-time live avatar to your own product',
    },
  ];

  const navLinkItems = navLinks.map((item, index) => (
    <NavLink
      key={item.label}
      active={index === active}
      label={item.label}
      description={item.description}
      icon={
        <ThemeIcon variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
          <item.icon size="1rem" stroke={1.5} />
        </ThemeIcon>
      }
      onClick={() => {
        setActive(index);
        setOpened(false);
      }}
    />
  ));

  return (
    <ColorSchemeProvider
      colorScheme={theme.colorScheme}
      toggleColorScheme={toggleColorScheme}
    >
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme,
          primaryColor: 'violet',
        }}
      >
        <AppShell
          padding="md"
          navbarOffsetBreakpoint="md"
          navbar={
            <Navbar
              p="xs"
              hiddenBreakpoint="md"
              hidden={!opened}
              width={{
                md: 260,
                lg: 300,
              }}
            >
              {navLinkItems}
            </Navbar>
          }
          header={
            <Header height={60} p="xs">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  height: '100%',
                }}
              >
                {/* <GroupHug
                  presence={presence}
                  id={'Noah'}
                  darkMode={dark}
                  avatar={
                    'https://avatars.githubusercontent.com/u/33050549?v=4'
                  }
                  name={'Noah'}
                  avatarBorderColor={'#5F3DC4'}
                /> */}
                <MediaQuery largerThan="md" styles={{ display: 'none' }}>
                  <Burger
                    opened={opened}
                    onClick={() => setOpened(o => !o)}
                    size="sm"
                    color={theme.colors.gray[6]}
                    mr="xl"
                  />
                </MediaQuery>

                <div></div>
              </div>
            </Header>
          }
          styles={theme => ({
            main: {
              backgroundColor:
                theme.colorScheme === 'dark'
                  ? theme.colors.dark[8]
                  : theme.colors.gray[0],
              maxHeight: '100vh',
            },
          })}
        >
          <Content
            colorScheme={colorScheme}
            toggleColorScheme={toggleColorScheme}
          />
        </AppShell>
      </MantineProvider>
    </ColorSchemeProvider>
  );
};

const examples = {
  Default: {
    theme: 'dark',
    size: 24,
    avatar: Math.random() > 0.5 ? `https://robohash.org/${id}` : '',
    name: faker.name.fullName(),
    avatarBorderWidth: 2,
    overlapping: true,
    transparent: 0.5,
    maximum: 5,
    MPOP: true,
    popover: void 0,
  },
  GitHub: {
    theme: 'light',
    size: 24,
    avatar: 'https://avatars.githubusercontent.com/u/33050549?v=4',
    avatarBorderWidth: 1,
    avatarBorderColor: '#e1e4e8',
    avatarBackgroundColor: '#ffffff',
    overlapping: true,
    popover: (id, name) => (
      <>
        <div
          className="group-hug-w-[10px] group-hug-h-[10px]
  group-hug-bg-[white] dark:group-hug-bg-[#34323E]
  group-hug-shadow-[0px_0px_2px_0px_rgb(0_0_0_/_0.1)]
  group-hug-rotate-[135deg] group-hug-z-10"
        ></div>
        <div
          className="group-hug-absolute group-hug-w-[12px] group-hug-h-[12px]
  group-hug-bg-[white] dark:group-hug-bg-[#34323E]
  group-hug-top-[0.5px]
  group-hug-rotate-[135deg] group-hug-z-10"
          style={{
            marginTop: `${8 + 5}px`,
          }}
        ></div>

        <div
          className="group-hug-bg-white dark:group-hug-bg-[#34323E] group-hug-rounded-[6px] group-hug-whitespace-nowrap 
    group-hug-shadow-[0px_1px_4px_0px_rgb(0_0_0_/_0.1)] group-hug--translate-y-[5px]"
          style={{
            gap: '0.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
            }}
          >
            <span>☁️</span>
            <span>working</span>
          </div>

          <div
            style={{
              height: '1px',
              // margin: '0.5rem 0',
              backgroundColor: 'rgba(0,0,0,0.1)',
            }}
          ></div>

          <div
            style={{
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                justifyContent: 'space-between',
              }}
            >
              <img
                src="https://avatars.githubusercontent.com/u/33050549?v=4"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
              <button
                style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.25rem',
                  backgroundColor: '#f7f8fa',
                  color: 'black',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  lineHeight: '1.25rem',
                  letterSpacing: '0.02em',
                  border: '1px solid #e1e4e8',
                }}
              >
                follow
              </button>
            </div>

            <a
              style={{
                color: 'black',
                fontSize: '0.875rem',
                fontWeight: 500,
                lineHeight: '1.25rem',
                letterSpacing: '0.02em',
                textDecoration: 'none',
              }}
              href={'https://github.com/yomorun'}
            >
              {name}
            </a>

            <div
              style={{
                color: '#586069',
                fontSize: '0.75rem',
              }}
            >
              Member of Allegro Networks
            </div>
          </div>
        </div>
      </>
    ),
  },
  Figma: {
    theme: 'light',
    size: 24,
    avatarBorderWidth: 0,
    avatarBorderColor: 'transparent',
    overlapping: false,
    MPOP: false,
    popover: (id, name) => (
      <>
        <div
          className="group-hug-w-[10px] group-hug-h-[10px]
  group-hug-shadow-[0px_0px_2px_0px_rgb(0_0_0_/_0.1)]
  group-hug-rotate-[135deg] group-hug-z-10"
          style={{
            background: 'black',
          }}
        ></div>
        <div
          className="group-hug-absolute group-hug-w-[12px] group-hug-h-[12px]
  group-hug-top-[0.5px]
  group-hug-rotate-[135deg] group-hug-z-10"
          style={{
            marginTop: `${8 + 5}px`,
            backgroundColor: 'black',
          }}
        ></div>

        <div
          className="group-hug-whitespace-nowrap 
    group-hug-shadow-[0px_1px_4px_0px_rgb(0_0_0_/_0.1)] group-hug--translate-y-[5px]"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            backgroundColor: 'black',
            borderRadius: '0.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              padding: '0.5rem',
              paddingBottom: '0',
              color: 'white',
            }}
          >
            {name}
          </div>

          <a
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              padding: '0.5rem',
              paddingTop: '0',
              color: '#A6A7AB',
            }}
          >
            View profile
          </a>
        </div>
      </>
    ),
  },
  'Google Docs': {
    theme: 'light',
    size: 32,
    avatarBorderWidth: 3,
    avatarBorderColor: '#e1e4e8',
    avatarBackgroundColor: '#ffffff',
    overlapping: false,
    popover: (id, name) => (
      <>
        <div
          className="group-hug-whitespace-nowrap group-hug--translate-y-[5px]"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            backgroundColor: 'white',
            borderRadius: '0.3rem',
            boxShadow: '0px 4px 8px 0px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem',
              paddingBottom: '0',
              gap: '1rem',
            }}
          >
            <img
              src={'https://avatars.githubusercontent.com/u/33050549?v=4'}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            ></img>
            <div
              style={{
                flex: 1,
                padding: '0.5rem',
              }}
            >
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  lineHeight: '1.25rem',
                  letterSpacing: '0.02em',
                }}
              >
                {name}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#586069',
                }}
              >
                {name}@yomo.run
              </div>
            </div>
            <div>
              <IconUserPlus size="2rem" stroke={1.5} />
            </div>
          </div>

          <div
            style={{
              height: '1px',
              backgroundColor: 'rgba(0,0,0,0.1)',
            }}
          ></div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.5rem',
              paddingTop: '0',
              gap: '1rem',
            }}
          >
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '2rem',
                padding: '0rem 0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                lineHeight: '1.25rem',
                letterSpacing: '0.02em',
                border: 'none',
                backgroundColor: '#eaf0fd',
                color: '#4170e2',
              }}
            >
              Open detailed view
            </button>
            <IconMail size="2rem" stroke={1.5} color="#4170e2" />
            <IconMessage size="2rem" stroke={1.5} color="#4170e2" />
            <IconCamera size="2rem" stroke={1.5} color="#4170e2" />
            <IconCalendar size="2rem" stroke={1.5} color="#4170e2" />
          </div>
        </div>
      </>
    ),
  },
};

function Content({ colorScheme, toggleColorScheme }) {
  const theme = useMantineTheme();
  const [controlType, setControlType] = useState('control');
  const [exampleTheme, setExampleTheme] = useState<
    '' | 'GitHub' | 'Figma' | 'Google Docs'
  >('');

  useEffect(() => {
    const _exampleTheme = examples[exampleTheme];
    if (_exampleTheme) {
      if (_exampleTheme.theme) {
        toggleColorScheme(_exampleTheme.theme);
      }
      if (_exampleTheme.size) setSize(_exampleTheme.size);
      if (_exampleTheme.avatarBorderWidth !== void 0)
        setAvatarBorderWidth(_exampleTheme.avatarBorderWidth);
      if (_exampleTheme.avatarBorderColor)
        setAvatarBorderColor(_exampleTheme.avatarBorderColor);
      if (_exampleTheme.avatarBackgroundColor)
        setAvatarBackgroundColor(_exampleTheme.avatarBackgroundColor);
      if (_exampleTheme.overlapping !== undefined)
        setOverlapping(_exampleTheme.overlapping);

      popoverRef.current = _exampleTheme.popover;
    }
  }, [exampleTheme]);

  const [size, setSize] = useState<number>(examples.Default.size);
  const [avatar, setAvatar] = useState<string>(examples.Default.avatar);
  const [name, setName] = useState<string>(examples.Default.name);
  const [avatarTextColor, setAvatarTextColor] = useState<string>(
    theme.colors.dark[9]
  );
  const [avatarBorderColor, setAvatarBorderColor] = useState<string>(
    theme.colors.violet[5]
  );
  const [avatarBackgroundColor, setAvatarBackgroundColor] = useState<string>(
    theme.colors.violet[5]
  );
  const [avatarBorderWidth, setAvatarBorderWidth] = useState<number>(
    examples.Default.avatarBorderWidth
  );
  const [overlapping, setOverlapping] = useState<boolean>(
    examples.Default.overlapping
  );
  const [transparency, setTransparency] = useState<number>(
    examples.Default.transparent
  );
  const [maximum, setMaximum] = useState<number>(examples.Default.maximum);
  const [MPOP, setMPOP] = useState<boolean>(examples.Default.MPOP);
  const onMouseEnterEditor = useEditor({
    extensions: [
      StarterKit,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: `<pre><code lang="js">(user) => console.log('onMouseEnter', user)</code></pre>`,
  });
  const [placeholder, setPlaceHolder] = useState<'shape' | 'character'>(
    'shape'
  );

  const onMouseLeaveEditor = useEditor({
    extensions: [
      StarterKit,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: `<pre><code lang="js">(user) => console.log('onMouseLeave', user)</code></pre>`,
  });
  const popoverRef = useRef(null);
  const dark = colorScheme === 'dark';

  return (
    // <LiveProvider
    //   code={`<GroupHug
    // presence={presence}
    // id={${id}}
    // darkMode={${dark}}
    // size={${size}}
    // avatar='${avatar}'
    // avatarTextColor='${avatarTextColor}'
    // avatarBorderWidth={${avatarBorderWidth}}
    // avatarBorderColor='${avatarBorderColor}'
    // avatarBackgroundColor='${avatarBackgroundColor}'
    // name='${name}'
    // overlapping={${overlapping}}
    // transparency={${transparency}}
    // maximum={${maximum}}
    // onMouseEnter={${
    //   onMouseEnterEditor ? `${onMouseEnterEditor.getText()}` : '() => {}'
    // }}
    // onMouseLeave={${
    //   onMouseLeaveEditor ? `${onMouseLeaveEditor.getText()}` : '() => {}'
    // }}
    // />`}
    //   scope={{
    //     Card,
    //     GroupHug,
    //     presence,
    //     id,
    //     dark,
    //     size,
    //     avatar,
    //     avatarTextColor,
    //     avatarBorderWidth,
    //     avatarBorderColor,
    //     avatarBackgroundColor,
    //     name,
    //     overlapping,
    //     transparency,
    //     maximum,
    //   }}
    //   theme={dark ? themes.vsDark : themes.vsLight}
    // >
    <Flex
      gap="md"
      h="100%"
      w="100%"
      direction={{ base: 'column-reverse', md: 'row' }}
    >
      <Card
        w={{
          base: '100%',
          md: 400,
          lg: 600,
        }}
        miw={{
          base: '100%',
          md: 400,
          lg: 600,
        }}
      >
        <ScrollArea h={'100%'}>
          <Tabs defaultValue="Documentation">
            <Tabs.List>
              <Tabs.Tab
                value="Documentation"
                icon={<IconArticle size="0.8rem" />}
              >
                Documentation
              </Tabs.Tab>
              <Tabs.Tab value="Props" icon={<IconAlertCircle size="0.8rem" />}>
                Props
              </Tabs.Tab>
              <Tabs.Tab
                value="Examples"
                icon={<IconComponents size="0.8rem" />}
              >
                Examples
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="Documentation" pt="xs">
              <Stack>
                {/* <SegmentedControl
                  value={controlType}
                  onChange={setControlType}
                  data={[
                    {
                      label: (
                        <Group
                          style={{
                            justifyContent: 'center',
                          }}
                        >
                          <IconArticle size="1rem" />
                          &nbsp;Control
                        </Group>
                      ),
                      value: 'control',
                    },
                    {
                      label: (
                        <Group
                          style={{
                            justifyContent: 'center',
                          }}
                        >
                          <IconCode size="1rem" />
                          &nbsp;Code
                        </Group>
                      ),
                      value: 'code',
                    },
                  ]}
                /> */}

                {controlType === 'control' ? (
                  <Stack>
                    <Stack spacing={0}>
                      <Text fz="sm" fw={500}>
                        DarkMode
                      </Text>
                      <SegmentedControl
                        value={colorScheme}
                        onChange={(value: 'light' | 'dark') =>
                          toggleColorScheme(value)
                        }
                        data={[
                          {
                            value: 'light',
                            label: (
                              <Center>
                                <IconSun size="1rem" stroke={1.5} />
                                <Box ml={10}>Light</Box>
                              </Center>
                            ),
                          },
                          {
                            value: 'dark',
                            label: (
                              <Center>
                                <IconMoon size="1rem" stroke={1.5} />
                                <Box ml={10}>Dark</Box>
                              </Center>
                            ),
                          },
                        ]}
                      />
                    </Stack>
                    <NumberInput
                      placeholder="Size"
                      label="Size"
                      labelProps={{ required: false }}
                      withAsterisk
                      min={8}
                      max={100}
                      value={size}
                      onChange={number => {
                        setSize(Number(number));
                      }}
                    />
                    <TextInput
                      placeholder="Your Avatar Url"
                      label="Avatar"
                      labelProps={{ required: false }}
                      withAsterisk
                      value={avatar}
                      onChange={event => setAvatar(event.currentTarget.value)}
                    />
                    <TextInput
                      placeholder="Your Name"
                      label="Name"
                      labelProps={{ required: false }}
                      withAsterisk
                      value={name}
                      onChange={event => setName(event.currentTarget.value)}
                    />
                    <NumberInput
                      placeholder="Avatar Border Width"
                      label="AvatarBorderWidth"
                      labelProps={{ required: false }}
                      withAsterisk
                      min={0}
                      max={100}
                      value={avatarBorderWidth}
                      onChange={number => {
                        setAvatarBorderWidth(Number(number));
                      }}
                    />
                    <ColorInput
                      label="AvatarTextColor"
                      labelProps={{ required: false }}
                      placeholder="Avatar Text Color"
                      withAsterisk
                      value={avatarTextColor}
                      onChange={setAvatarTextColor}
                    />
                    <ColorInput
                      label="AvatarBorderColor"
                      labelProps={{ required: false }}
                      placeholder="Avatar Border Color"
                      withAsterisk
                      value={avatarBorderColor}
                      onChange={setAvatarBorderColor}
                    />
                    <ColorInput
                      label="AvatarBackgroundColor"
                      labelProps={{ required: false }}
                      placeholder="Avatar Background Color"
                      withAsterisk
                      value={avatarBackgroundColor}
                      onChange={setAvatarBackgroundColor}
                    />
                    <Switch
                      label="Overlapping"
                      checked={overlapping}
                      onChange={event =>
                        setOverlapping(event.currentTarget.checked)
                      }
                    />
                    <NumberInput
                      defaultValue={5}
                      placeholder="Transparency"
                      label="Transparency"
                      labelProps={{ required: false }}
                      withAsterisk
                      min={0}
                      max={1}
                      step={0.1}
                      precision={1}
                      value={transparency}
                      onChange={number => {
                        setTransparency(Number(number));
                      }}
                    />
                    <Switch
                      label="MPOP"
                      checked={MPOP}
                      onChange={event => setMPOP(event.currentTarget.checked)}
                    />
                    <NumberInput
                      defaultValue={5}
                      placeholder="Maximum"
                      label="Maximum"
                      labelProps={{ required: false }}
                      withAsterisk
                      min={1}
                      max={100}
                      value={maximum}
                      onChange={number => {
                        setMaximum(Number(number));
                      }}
                    />
                    <Stack spacing={0}>
                      <Text fz="sm" fw={500}>
                        Placeholder
                      </Text>
                      <SegmentedControl
                        value={placeholder}
                        onChange={(value: 'shape' | 'character') =>
                          setPlaceHolder(value)
                        }
                        data={[
                          {
                            value: 'shape',
                            label: (
                              <Center>
                                <Box ml={10}>shape</Box>
                              </Center>
                            ),
                          },
                          {
                            value: 'character',
                            label: (
                              <Center>
                                <Box ml={10}>character</Box>
                              </Center>
                            ),
                          },
                        ]}
                      />
                    </Stack>
                    <RichTextEditor editor={onMouseEnterEditor}>
                      <RichTextEditor.Toolbar>
                        <Text fz="sm" fw={500}>
                          onMouseEnter
                        </Text>
                      </RichTextEditor.Toolbar>
                      <RichTextEditor.Content />
                    </RichTextEditor>
                    <RichTextEditor editor={onMouseLeaveEditor}>
                      <RichTextEditor.Toolbar>
                        <Text fz="sm" fw={500}>
                          onMouseLeave
                        </Text>
                      </RichTextEditor.Toolbar>
                      <RichTextEditor.Content />
                    </RichTextEditor>
                  </Stack>
                ) : (
                  <>
                    <LiveEditor
                      style={{
                        wordSpacing: '4px',
                      }}
                    />
                    <LiveError />
                  </>
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="Props" pt="xs">
              <Table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>{rows}</tbody>
              </Table>
            </Tabs.Panel>

            <Tabs.Panel value="Examples" pt="xs">
              <SegmentedControl
                value={exampleTheme}
                onChange={theme => setExampleTheme(theme as any)}
                data={(Object.keys(examples) as Array<string>).map(key => ({
                  value: key,
                  label: key,
                }))}
              />
            </Tabs.Panel>
          </Tabs>
        </ScrollArea>
      </Card>

      <Flex
        justify={'center'}
        align={'center'}
        direction={'column'}
        gap={16}
        style={{
          flex: 1,
          minHeight: 400,
          width: 'auto',
        }}
      >
        <Flex
          justify={'center'}
          align={'center'}
          style={{
            width: '100%',
            flex: 1,
            minHeight: 400,
            background: `
          linear-gradient(90deg,${dark ? 'black' : 'white'
              } 10px, transparent 1%) 50% center / 12px 12px,
          linear-gradient(
            ${dark ? 'black' : 'white'
              } 10px, transparent 1%) 50% center /12px 12px,
            ${dark ? '#313649' : '#dfe2ea'}`,
          }}
        >
          {/* <LivePreview /> */}
          <GroupHug
            presence={presence}
            id={id}
            darkMode={dark}
            size={size}
            avatar={avatar}
            avatarTextColor={avatarTextColor}
            avatarBorderWidth={avatarBorderWidth}
            avatarBorderColor={avatarBorderColor}
            avatarBackgroundColor={avatarBackgroundColor}
            name={name}
            overlapping={overlapping}
            transparency={transparency}
            maximum={maximum}
            MPOP={MPOP}
            placeholder={placeholder}
            // @ts-ignore
            onMouseEnter={(user) => eval(`(${onMouseEnterEditor?.getText()})(user)`)}
            // @ts-ignore
            onMouseLeave={(user) => eval(`(${onMouseLeaveEditor?.getText()})(user)`)}
            popover={popoverRef.current}
          />
        </Flex>

        <MediaQuery
          smallerThan="md"
          styles={{
            display: 'none',
          }}
        >
          <ScrollArea
            h={'100%'}
            style={{
              height: '40%',
              width: '100%',
              maxWidth: 'calc(100%-300px)',
            }}
          >
            <Prism
              language="tsx"
              colorScheme={dark ? 'dark' : 'light'}
              getPrismTheme={(_theme, colorScheme) =>
                colorScheme === 'light'
                  ? themes.duotoneLight
                  : themes.duotoneDark
              }
            >{`<GroupHug
  presence={presence}
  id={${id}}
  darkMode={${dark}}
  size={${size}}
  avatar='${avatar}'
  avatarTextColor='${avatarTextColor}'
  avatarBorderWidth={${avatarBorderWidth}}
  avatarBorderColor='${avatarBorderColor}'
  avatarBackgroundColor='${avatarBackgroundColor}'
  name="${name}"
  overlapping={${overlapping}}
  transparency={${transparency}}
  maximum={${maximum}}
  placeholder={${placeholder}}
  onMouseEnter={${onMouseEnterEditor ? `${onMouseEnterEditor.getText()}` : '() => {}'
              }}
  onMouseLeave={${onMouseLeaveEditor ? `${onMouseLeaveEditor.getText()}` : '() => {}'
              }}
/>`}</Prism>
          </ScrollArea>
        </MediaQuery>
      </Flex>
    </Flex>
    // </LiveProvider>
  );
}

root.render(<App />);
