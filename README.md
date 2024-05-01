## [Typo*](https://typo.by) Super Bubble

### Adding attachments to the super bubble:

1. Everything you need is in `SuperBubble.tsx`. Navigate to that file, and to add an item/attachment, it should conform to the type `Attachment`, i.e. it should contain the following fields:

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

- `url` should be undefined for images, but provide one for links.

- `title` is primarily used for link previews, to show the website/article title.

- `description` is also primarily used for link previews, to show the website/article description.

- `pillText` is the string you want to display on the pills. For images, using the filename is usually fine, but for links, if the URL is long, you might want to use a custom `pillText` that is shorter.

Once you know what to put in those fields, add it to the `items` array found near the top of the file like so:

```diff
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
+ {
+   type: AttachmentType.Link,
+   height: LINK_PREVIEW_HEIGHT,
+   imgUrl: "typo.svg",
+   title: "Typo*",
+   description: "Typo* is reimagining the messaging app.",
+   pillText: "typo.by",
+   url: "https://typo.by",
+ },
]
```

And of course make sure that `imgUrl`s point to files in the public folder or assets hosted on the web, like in AWS.

***

2. Now that you've added your attachment to the `items` array, it's time to generate the pill for it. In this block of code, `TextContent`, add the `<Pill>` component at the end, and pass it the correct attachment in the `items` array.

```diff
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
+     <Pill attachment={items[7]} />
    </div>
  );
};
```

Side note: you can also intersperse text between the pills with the `<p>` tag:

```diff
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
+     <p>Text in between pill</p>
      <Pill attachment={items[1]} />
      <Pill attachment={items[2]} />
    </div>
  );
};
```

but make sure it still looks okay on the site, on both desktop and mobile. Also, I break the text up into multiple `<p>` as shown above, to achieve a more precise layout of text and pills.


## Making changes

For now we support links and images, but if we want to support other types of attachments, like documents, we can add a new type to the enum `AttachmentType`:

```diff
enum AttachmentType {
  Image,
  Link,
+ Document,
}
```

To support these new `AttachmentType`s, we'll need to modify other components so their pills / carousel previews are rendered as expected.

### Pills:

In the `<Pill>` component, it's made up of primarily two parts: the `thumbnailComponent` and `attachment.pillText`. We'll want to create a new case for the `thumbnailComponent` to handle our new `AttachmentType` as follows:

```diff
switch (attachment.type) {
  case AttachmentType.Image:
    thumbnailComponent = (
      <img
        className="pillThumbnail"
        style={{ height: isMobile ? 14 : 18 }}
        src={attachment.imgUrl}
        alt="Image Thumbnail"
      />
    );
    break;
  case AttachmentType.Link:
    thumbnailComponent = // component for links;
    break;
+ case AttachmentType.Document:
+   thumbnailComponent = // create a new tsx component for documents;
+   break;
  default:
    thumbnailComponent = null;
    break;
}
```

### Carousel preview:

And for the carousel preview, look for the section `// Main super bubble component`, and find the block of code where we're mapping over our array of `items`:

```diff
{items.map((item, i) => {
  switch (item.type) {
    /// Preview component for images
    case AttachmentType.Image:
      return (
        <ControlledZoom
          isZoomed={isZoomed[i]}
          onZoomChange={(shouldZoom) =>
            handleZoomChange(shouldZoom, i)
          }
          classDialog="custom-zoom"
        >
          <img
            src={item.imgUrl}
            style={{
              width: MAX_WIDTH,
              height: item.height,
              cursor: "none",
            }}
            draggable={false}
          />
        </ControlledZoom>
      );
    /// Preview component for links
    case AttachmentType.Link:
      return <div>This is my link preview</div>
+   case AttachmentType.Document:
+     // return preview component for documents
    default:
      null;
  }
})}
```
Like pills, we'll want to return a new `tsx` component that renders our new attachment type correctly.