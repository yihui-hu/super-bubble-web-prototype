## [Typo*](https://typo.by) Super Bubble

### Adding attachments to the super bubble:

1. Everything you need can be found in `SuperBubble.tsx`. Navigate to that file, and to add an item/attachment you want that conforms to the type `Attachment`, i.e. it should contain the following fields:

```typescript
  interface Attachment {
    type: AttachmentType;
    height: number;
    imgUrl: string;
    url: string | undefined;
    title: string;
    description: string;
    pillText: string;
  }
```

- `type` determines what kind of attachment preview to show in the carousel. For now, there's only `Link` and `Image` as part of the `AttachmentType` enum, but can and should be expanded in the future.

- `height` needs to be precalculated in advance for the carousel to transition between heights smoothly. For images, use the formula `(MAX_WIDTH / image_width) * image_height` and for links, use `LINK_PREVIEW_HEIGHT`. Depending on the description of link previews, adjust the height to be `LINK_PREVIEW_HEIGHT +- adjustment_value` to fit the content of the link preview perfectly. Just eyeball it for now lol. Or adjust `title` and `description` to fill out the space required for `LINK_PREVIEW_HEIGHT`.

- `imgUrl` is the local URL of images, in this case those found in the `public` folder. For links, this is usually the favicon.

- `url` is undefined for images, but provide one for links.

- `title` is primarily used for link previews, to show the website/article title.

- `description` is also primarily used for link previews, to show the website/article description.

- `pillText` is the string you want to display on the pills. For images, using the filename is usually fine, but for links, if the URL is long, you might want to use a custom `pillText` that is shorter.

Once you've figured out what you want to put in those fields, add it to the `items` array found near the top of the file:

```typescript
// Media items / attachments
const items: [Attachment] = [
  {
    type: AttachmentType.Image,
    height: (MAX_WIDTH / 2300) * 2300,
    imgUrl: "vibes.png",
    title: "vibes.png",
    description: "vibes.png",
    pillText: "vibes.png",
    url: undefined,
  },
  {
    type: AttachmentType.Link,
    height: LINK_PREVIEW_HEIGHT,
    imgUrl: "typo.svg",
    title: "Typo*",
    description: "Typo* is reimagining the messaging app.",
    pillText: "typo.by",
    url: "https://typo.by",
  },
  // ... more items here ...
]
```

***

2. Now that you've added your item, it's time to generate the pill for it. In this block of code, `TextContent`, add the `<Pill>` component at the end, and pass it the correct attachment in the `items` array.

```typescript
// Text content of super bubble, with pills
const TextContent = () => {
  return (
    <div
      ref={textRef}
      className="textContainer"
      style={{ 
        width: MAX_WIDTH, 
        fontSize: isMobile ? 12 : 16 
      }}
    >
      <p>We work together in IRL in Soho, NYC.</p>
      <p>Our office doubles as an art studio, film</p>
      <p>set, and all-around creative space.</p>
      <Pill attachment={items[0]} />
      <Pill attachment={items[1]} />
      <Pill attachment={items[2]} />
      <Pill attachment={items[3]} />
      <Pill attachment={items[4]} />
      <Pill attachment={items[5]} />
      <Pill attachment={items[6]} />
      <Pill attachment={items[7]} />
      // ... add pill here ...
    </div>
  );
};
```

You can also intersperse text between the pills with the `<p>` tag:

```typescript
const TextContent = () => {
  return (
    <div
      ref={textRef}
      className="textContainer"
      style={{ 
        width: MAX_WIDTH, 
        fontSize: isMobile ? 12 : 16 
      }}
    >
      <Pill attachment={items[0]} />
      <p>Text in between pill</p>
      <Pill attachment={items[1]} />
      <Pill attachment={items[2]} />
    </div>
  );
};
```

but make sure it still looks okay on the site. I break the text up into multiple `<p>` above just so I can achieve a more precise layout.

***

3. 