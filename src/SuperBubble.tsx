import { useCallback, useEffect, useRef, useState } from "react";
import {
  PanInfo,
  motion,
  useAnimation,
  useMotionTemplate,
} from "framer-motion";
import { Controlled as ControlledZoom } from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import "./styles/superBubble.css";
import { isMobile } from "react-device-detect";

const MAX_WIDTH = isMobile ? 300 : 375;
const VELOCITY_THRESHOLD = 40;
const WIDTH_THRESHOLD = MAX_WIDTH / 2;
const LINK_PREVIEW_HEIGHT = isMobile ? 132 : 148;

enum Swipe {
  toLeft,
  toRight,
}

enum AttachmentType {
  Image,
  Link,
}

interface Attachment {
  type: AttachmentType;
  height: number;
  imgUrl: string; // For image to display in pill, use local SVGs / PNGs for icons or images
  url: string | undefined; // For links, so undefined for other attachmentTypes
  title: string;
  pillText: string;
  description: string;
}

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
    type: AttachmentType.Image,
    height: (MAX_WIDTH / 3583) * 2395,
    imgUrl: "studio.webp",
    title: "studio.webp",
    description: "studio.webp",
    pillText: "studio.webp",
    url: undefined,
  },
  {
    type: AttachmentType.Image,
    height: (MAX_WIDTH / 2300) * 2300,
    imgUrl: "art_in_studio.png",
    title: "art_in_studio.png",
    description: "art_in_studio.png",
    pillText: "art_in_studio.png",
    url: undefined,
  },
  {
    type: AttachmentType.Image,
    height: (MAX_WIDTH / 3583) * 2395,
    imgUrl: "standing.webp",
    title: "standing.webp",
    description: "standing.webp",
    pillText: "standing.webp",
    url: undefined,
  },
  {
    type: AttachmentType.Image,
    height: (MAX_WIDTH / 3583) * 2395,
    imgUrl: "homies.webp",
    title: "homies.webp",
    description: "homies.webp",
    pillText: "homies.webp",
    url: undefined,
  },
  {
    type: AttachmentType.Link,
    height: LINK_PREVIEW_HEIGHT,
    imgUrl: "typo.svg",
    title: "Typo*",
    description:
      "The messenger is the killer mobile app, and we are reimagining it as the ultimate creative app. Typo is communication designed for creation.",
    pillText: "typo.by",
    url: "https://typo.by",
  },
  {
    type: AttachmentType.Link,
    height: LINK_PREVIEW_HEIGHT - (isMobile ? 34 : 44),
    imgUrl: "instagram.png",
    title: "Typo* on Instagram",
    description: "A more ~editorial~ POV",
    pillText: "instagram.com",
    url: "https://instagram.com/tyyyyyyyyyyypo",
  },
  {
    type: AttachmentType.Link,
    height: LINK_PREVIEW_HEIGHT - (isMobile ? 18 : 22),
    imgUrl: "youtube.webp",
    title: "Typo* on YouTube",
    description:
      "Check out our vlogs for a BTS look at how we're building the company",
    pillText: "youtube.com",
    url: "https://www.youtube.com/@tyyyyyyyyyyypo",
  },
].map((item, index) => ({
  ...item,
  x: -(MAX_WIDTH * index), // This map is used to automatically populate the proper x position of the images
}));

const NUM_ITEMS = items.length;
const INITIAL_HEIGHT = items[0].height;
const MAX_HEIGHT = Math.max(...items.map((item) => item.height));

// Only needed to animate the heights for the masking div
const maskControlsItems = items.map((item) => {
  return { imgUrl: item.imgUrl, height: item.height };
});

type BubbleProps = {
  setIndex: (index: number) => void;
  index: number;
  trigger: number;
  setTrigger: (trigger: number) => void;
};

const Bubble = (props: BubbleProps) => {
  const { setIndex, index, trigger, setTrigger } = props;

  const textRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(INITIAL_HEIGHT);
  const [textHeight, setTextHeight] = useState<number>(0);
  const [heightFromTop, setHeightFromTop] = useState<number>(
    (window.innerHeight - MAX_HEIGHT - textHeight) / 2
  );
  const [dragging, setDragging] = useState<boolean>(false); // Resolve conflicting gestures (tap to zoom, drag to swipe)

  const controls = useAnimation();
  const maskControls = useAnimation();
  const divHeight = useMotionTemplate`${height}px`;

  useEffect(() => {
    controls.start(items[index]);
    maskControls.start(maskControlsItems[index]);
    setHeight(items[index].height);
  }, [trigger]); // Triggers whenever user selects on a "pill"

  // Used to automatically calculate the height of text content
  // so that the super bubble can center itself on screen
  useEffect(() => {
    if (textRef.current) {
      setTextHeight(textRef.current.clientHeight);
      setHeightFromTop(
        (window.innerHeight - MAX_HEIGHT - textRef.current.clientHeight) / 2
      );
    }
  }, []);

  const getCurrentHeight = (swipeDirection: Swipe, offsetX: number) => {
    const beginningIndex = index;
    const endingIndex = swipeDirection === Swipe.toLeft ? index + 1 : index - 1;
    const beginningHeight = items[beginningIndex].height;
    const endingHeight = items[endingIndex].height;

    const currentHeight =
      beginningHeight > endingHeight
        ? beginningHeight -
          Math.abs(
            offsetX * (Math.abs(beginningHeight - endingHeight) / MAX_WIDTH)
          )
        : beginningHeight +
          Math.abs(
            offsetX * (Math.abs(beginningHeight - endingHeight) / MAX_WIDTH)
          );

    // Clamping function to constrain heights to proper bounds
    return Math.min(
      Math.max(currentHeight, Math.min(beginningHeight, endingHeight)),
      Math.max(beginningHeight, endingHeight)
    );
  };

  // Dynamically change heights when user is dragging
  const onDrag = (_: any, info: PanInfo) => {
    setDragging(true);
    const offsetX = info.offset.x;

    // Negative offset indicates swipe to right
    if (offsetX < 0) {
      if (index == NUM_ITEMS - 1) {
        return;
      }
      setHeight(getCurrentHeight(Swipe.toLeft, offsetX));
    } else {
      if (index == 0) {
        return;
      }
      setHeight(getCurrentHeight(Swipe.toRight, offsetX));
    }
  };

  // When user drag event is done, gracefully transition to proper height
  const onDragEnd = (_: any, info: PanInfo) => {
    const velocityX = info.velocity.x;
    const offsetX = info.offset.x;

    let newIndex = index;

    if (offsetX < -WIDTH_THRESHOLD || velocityX < -VELOCITY_THRESHOLD) {
      newIndex = Math.min(index + 1, NUM_ITEMS - 1);
    } else if (offsetX > WIDTH_THRESHOLD || velocityX > VELOCITY_THRESHOLD) {
      newIndex = Math.max(index - 1, 0);
    }

    setIndex(newIndex);
    controls.start(items[newIndex]);
    maskControls.start(maskControlsItems[newIndex]);
    setHeight(items[newIndex].height);
    setDragging(false);
  };

  interface PillProps {
    attachment: Attachment;
  }

  // Pill component
  const Pill = (props: PillProps) => {
    const { attachment } = props;
    const currentIndex = items.findIndex(
      (item) => item.imgUrl === attachment.imgUrl
    );

    let thumbnailComponent;

    switch (attachment.type) {
      case AttachmentType.Link:
        thumbnailComponent = (
          <div
            className="pillThumbnailContainer"
            style={{
              height: isMobile ? 12 : 16,
              width: isMobile ? 12 : 16,
            }}
          >
            <img
              style={{ height: isMobile ? 10 : 14 }}
              src={attachment.imgUrl ? attachment.imgUrl : "link.svg"}
              alt="Link Thumbnail"
            />
          </div>
        );
        break;
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
      default:
        thumbnailComponent = null;
        break;
    }

    return (
      <motion.div
        className="pill"
        onClick={() => {
          setIndex(currentIndex);
          setTrigger(trigger + 1);
        }}
        style={{
          backgroundColor:
            index === currentIndex ? "white" : "rgba(255, 255, 255, 0.18)",
          outline: "1px solid rgba(255, 255, 255, 0.1)",
        }}
        whileHover={{
          outline: "1px solid rgba(255, 255, 255, 0.4)",
        }}
      >
        {thumbnailComponent}
        <h4
          style={{
            color: index === currentIndex ? "#3076ff" : "white",
          }}
        >
          {attachment.pillText}
        </h4>
      </motion.div>
    );
  };

  // Text content of super bubble, with pills
  const TextContent = () => {
    return (
      <div
        ref={textRef}
        className="textContainer"
        style={{ width: MAX_WIDTH, fontSize: isMobile ? 12 : 16 }}
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
      </div>
    );
  };

  const [isZoomed, setIsZoomed] = useState(Array(NUM_ITEMS).fill(false));

  const handleZoomChange = useCallback(
    (shouldZoom: boolean, index: number) => {
      if (dragging) {
        setIsZoomed(Array(NUM_ITEMS).fill(false));
      } else {
        setIsZoomed((prevZoomed) => {
          const updatedZoomed = [...prevZoomed];
          updatedZoomed[index] = shouldZoom;
          return updatedZoomed;
        });
      }
    },
    [dragging]
  );

  // Main super bubble component
  return (
    <motion.div
      drag={!isMobile}
      dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
      dragElastic={1}
      dragTransition={{ bounceStiffness: 200, bounceDamping: 20 }}
      whileDrag={{
        scale: 1.05,
        boxShadow: "rgba(0, 0, 0, 0.24) 0px 40px 90px 8px",
      }}
      animate={maskControls}
      className="superBubble"
      style={{
        height: divHeight,
        width: MAX_WIDTH,
        top: heightFromTop,
        left: (window.innerWidth - MAX_WIDTH) / 2,
      }}
    >
      {/* Text content of super bubble */}
      <TextContent />
      {/* Carousel of attachments */}
      <motion.div
        animate={maskControls}
        className="carouselContainer"
        style={{ height: divHeight }}
      >
        <motion.div
          animate={maskControls}
          className="carouselBorder"
          style={{
            height: divHeight,
            width: MAX_WIDTH,
          }}
        />
        <motion.div
          drag="x"
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          dragConstraints={{
            // Update constraints as user swipes. Don't allow long swipes to 'skip' to end of carousel.
            left: -(Math.min(NUM_ITEMS - 1, index + 1) * MAX_WIDTH),
            right: -(Math.max(0, index - 1) * MAX_WIDTH),
          }}
          dragElastic={0.1}
          initial="first"
          animate={controls}
          transition={{ type: "spring", damping: 40, stiffness: 400 }}
          className="carousel"
          style={{ width: MAX_WIDTH * NUM_ITEMS }}
        >
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
                return (
                  <div
                    className="linkPreviewContainer"
                    style={{ width: MAX_WIDTH, height: LINK_PREVIEW_HEIGHT }}
                  >
                    <div
                      className="linkPreviewHeader"
                      style={{ width: MAX_WIDTH - 32 }}
                    >
                      {/* -32 is for padding */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <div className="linkPreviewThumbnailContainer">
                          <img
                            className="linkPreviewThumbnailImg"
                            src={item.imgUrl}
                            draggable={false}
                          />
                        </div>
                        <h2
                          className="linkPreviewTitle"
                          style={{ fontSize: isMobile ? 12 : 16 }}
                        >
                          {item.title}
                        </h2>
                      </div>
                      <a
                        href={item.url}
                        style={{ color: "black", textDecoration: "none" }}
                        target="_blank"
                      >
                        <div className="linkPreviewVisitContainer">
                          <h2
                            className="linkPreviewVisitText"
                            style={{ fontSize: isMobile ? 12 : 16 }}
                          >
                            Visit ↗
                          </h2>
                        </div>
                      </a>
                    </div>
                    <h2
                      className="linkPreviewDescription"
                      style={{ fontSize: isMobile ? 12 : 16 }}
                    >
                      {item.description}
                    </h2>
                  </div>
                );
              default:
                null;
            }
          })}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const SuperBubble = () => {
  const [index, setIndex] = useState<number>(0);
  const [trigger, setTrigger] = useState<number>(0); // TODO: Move to Bubble
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const images = items.map((item) => {
      return item.imgUrl;
    });

    Promise.all(
      images.map((image) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = image;
        });
      })
    )
      .then(() => {
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      })
      .catch((error) => {
        console.error("Error loading images:", error);
        setLoading(false);
      });
  }, []);

  return !loading ? (
    <motion.div
      className="container"
      initial={{
        opacity: 0,
        filter: "blur(4px)",
      }}
      animate={{
        opacity: 1,
        filter: "blur(0px)",
        transition: { type: "spring", duration: 0.7 },
      }}
    >
      <Bubble
        setIndex={setIndex}
        index={index}
        trigger={trigger}
        setTrigger={setTrigger}
      />
    </motion.div>
  ) : (
    <div className="container">
      <h4 className="loadingText">Loading...</h4>
    </div>
  );
};

export default SuperBubble;
