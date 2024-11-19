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
const aspectRatio = 612 / 612;

// Calculate height based on the MAX_WIDTH and aspect ratio
const calculatedHeight = MAX_WIDTH / aspectRatio;


enum Swipe {
  toLeft,
  toRight,
}

enum AttachmentType {
  Image,
  Link,
  Video,
}

interface Attachment {
  type: AttachmentType;
  height: number;
  imgUrl?: string; // For image to display in pill, use local SVGs / PNGs for icons or images
  url: string | undefined; // For links, so undefined for other attachmentTypes
  title: string;
  pillText: string;
  description: string;
  videoUrl?: string;
  x: number;
}

// Media items / attachments
const items: Attachment[] = [
  {
    type: AttachmentType.Video,
    height: calculatedHeight,
    imgUrl: "https://typowebsitevideo.s3.amazonaws.com/video.gif",
    title: "video.mov",
    description: "video.mov",
    pillText: "video.mov",
    url: undefined,
    videoUrl: "https://typowebsitevideo.s3.amazonaws.com/video.mov",
    x: -(MAX_WIDTH * 0),
  },
  {
    type: AttachmentType.Video,
    height: calculatedHeight,
    imgUrl: "https://typowebsitevideo.s3.amazonaws.com/timestamp.gif",
    title: "timestamp.mov",
    description: "timestamp.mov",
    pillText: "timestamp.mov",
    url: undefined,
    videoUrl: "https://typowebsitevideo.s3.amazonaws.com/timestamp.MOV",
    x: -(MAX_WIDTH * 1),
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
    x: -(MAX_WIDTH * 2),
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

/// Bubble is the main component that draws the super bubble
/// and basically contains all the logic required for it
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
    controls.start({ x: items[index].x });
    maskControls.start({ height: maskControlsItems[index].height });
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
    controls.start({ x: items[newIndex].x });
    maskControls.start({ height: maskControlsItems[newIndex].height });
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
        case AttachmentType.Video:
          thumbnailComponent = (
            <div
              className="pillThumbnailContainer"
              style={{
                height: isMobile ? 12 : 16,
                width: isMobile ? 12 : 16,
                backgroundImage: `url('${attachment.imgUrl}')`,
                backgroundSize: 'contain', 
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
              
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
        <p>At Typo* we’re building the best</p>
        <p>messenger for creative work.</p>
        <p>Imagine if you could annotate any file</p>
        <p>you send from your group chat?</p> 
        <Pill attachment={items[0]} />
        <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>   <p> </p>   <p> </p>   <p> </p>   <p> </p>   <p> </p>
        <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>   <p> </p>   <p> </p>   <p> </p>   <p> </p>   <p> </p>
        <p>Now imagine you could do this for a</p>
        <p>specific timestamp in a song, or for a  </p>
        <p>set of frames in a video.</p>
        <Pill attachment={items[1]} />
        <p>And imagine you could do all of this </p>
        <p>without ever duplicating a file.</p>
        <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>   <p> </p>   <p> </p>   <p> </p>   <p> </p>   <p> </p>
        <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>   <p> </p>   <p> </p>   <p> </p>   <p> </p>   <p> </p>
        <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>  <p> </p>   <p> </p>   <p> </p>   <p> </p>   <p> </p>   <p> </p>
        <p>We envision a world in which makers </p>
        <p>only focus on making. No uploading,</p>
        <p> downloading, sharing, collating, </p>
        <p>exporting, importing, and wrangling.</p>
        <p>Oh, and no more scrolling around your</p>
        <p>messenger searching for the thing.</p>
        
        <p> <br></br> If you wanna get more of a vibecheck </p>
        <p> for us, you can check out: </p>
        <Pill attachment={items[2]} />

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

                //Preview for Video
                case AttachmentType.Video:
                  return (
                    <div className="video-container" style={{backgroundColor: '#ffffff'}}>
                      <video
                        controls
                        autoPlay  // starts playing automatically
      loop      // loops the video
      muted     // necessary for autoplay to work in most browsers
      playsInline  // prevents fullscreen playback on mobile
                        style={{
                          width: MAX_WIDTH,
                          height: calculatedHeight,
                          backgroundColor: '#ffffff'  // Ensures video element itself has a white background
                        }}
                        src={item.videoUrl}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
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

/// Wrapper for the Bubble component that handles
/// image preloading and appear in view transitions
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
          img.src = image|| "";
        });
      })
    )
      .then(() => {
        setTimeout(() => {
          setLoading(false);
        }, 1);
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
        transition: { type: "spring", duration: 0.1 },
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
