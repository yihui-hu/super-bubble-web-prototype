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

enum Swipe {
  toLeft,
  toRight,
}

// Media items / attachments
const items = [
  {
    height: (MAX_WIDTH / 679) * 720,
    imgUrl: "magic_library.png",
  },
  {
    height: (MAX_WIDTH / 838) * 517,
    imgUrl: "showa_town_sauna.png",
  },
  {
    height: (MAX_WIDTH / 217) * 219,
    imgUrl: "magic_booster.gif",
  },
  {
    height: (MAX_WIDTH / 960) * 856,
    imgUrl: "free_market.jpeg",
  },
  {
    height: (MAX_WIDTH / 800) * 600,
    imgUrl: "remnant_of_the_goddess.png",
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
    let beginningIndex = index;
    let endingIndex = swipeDirection === Swipe.toLeft ? index + 1 : index - 1;
    let beginningHeight = items[beginningIndex].height;
    let endingHeight = items[endingIndex].height;

    let currentHeight =
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

  // Pill content
  interface PillProps {
    imgUrl: string;
  }

  const Pill = (props: PillProps) => {
    const { imgUrl } = props;
    const currentIndex = items.findIndex((item) => item.imgUrl === imgUrl);

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
        <img
          className="pillThumbnail"
          style={{ height: isMobile ? 14 : 18 }}
          src={imgUrl}
        />
        <h4
          style={{
            color: index === currentIndex ? "#3076ff" : "white",
          }}
        >
          {imgUrl}
        </h4>
      </motion.div>
    );
  };

  const TextContent = () => {
    return (
      <div
        ref={textRef}
        className="textContainer"
        style={{ width: MAX_WIDTH, fontSize: isMobile ? 12 : 16 }}
      >
        <p>I spent my childhood on Maplestory.</p>
        <p>Here are some images that remind me</p>
        <p>of those times.</p>
        <Pill imgUrl={items[0].imgUrl} />
        <Pill imgUrl={items[1].imgUrl} />
        <Pill imgUrl={items[2].imgUrl} />
        <p>Also this meme is </p>
        <p>pretty funny lol</p>
        <Pill imgUrl={items[3].imgUrl} />
        <Pill imgUrl={items[4].imgUrl} />
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
      <TextContent />
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
            return (
              <ControlledZoom
                isZoomed={isZoomed[i]}
                onZoomChange={(shouldZoom) => handleZoomChange(shouldZoom, i)}
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
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading images:", error);
        setLoading(false);
      });
  }, []);

  // TODO: Display loading...
  // TODO: Animate in bubble
  return !loading ? (
    <div className="container">
      <Bubble
        setIndex={setIndex}
        index={index}
        trigger={trigger}
        setTrigger={setTrigger}
      />
    </div>
  ) : null;
};

export default SuperBubble;
