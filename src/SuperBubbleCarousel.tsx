import { useEffect, useState } from "react";
import {
  PanInfo,
  motion,
  useAnimation,
  useMotionTemplate,
} from "framer-motion";
import "./styles/superBubbleCarousel.css";

const DEBUG = false;

const MAX_WIDTH = 400;
const VELOCITY_THRESHOLD = 40;
const WIDTH_THRESHOLD = MAX_WIDTH / 2;

enum Swipe {
  toLeft,
  toRight,
}

// Media items / attachments
const items = [
  {
    height: (MAX_WIDTH / 3276) * 4096,
    imgUrl: "kitasavi.jpeg",
  },
  {
    height: (MAX_WIDTH / 790) * 474,
    imgUrl: "nizo_yamamoto.png",
  },
  {
    height: (MAX_WIDTH / 673) * 469,
    imgUrl: "gerard_richter.jpeg",
  },
  {
    height: (MAX_WIDTH / 1200) * 1200,
    imgUrl: "too_close_jacques_greene.jpeg",
  },
].map((item, index) => ({
  ...item,
  x: -(MAX_WIDTH * index), // This map is used to automatically populate the proper x position of the images.
}));

const NUM_ITEMS = items.length;
const INITIAL_HEIGHT = items[0].height;
const TEXT_PADDING = 38;

// Only needed to animate the heights for the masking div
const maskControlsItems = items.map((item) => {
  return { imgUrl: item.imgUrl, height: item.height + TEXT_PADDING };
});

const divControlsItems = items.map((item) => {
  return { imgUrl: item.imgUrl, height: item.height };
});

type CarouselDivProps = {
  setVelocityX: (velocityX: number) => void;
  setOffsetX: (velocityX: number) => void;
  setIndex: (index: number) => void;
  index: number;
  trigger: number;
};

const CarouselDiv = (props: CarouselDivProps) => {
  const { setVelocityX, setOffsetX, setIndex, index, trigger } = props;
  const [height, setHeight] = useState<number>(INITIAL_HEIGHT);
  const controls = useAnimation();
  const maskControls = useAnimation();
  const divControls = useAnimation();
  const divHeight = useMotionTemplate`${height + TEXT_PADDING}px`;

  useEffect(() => {
    controls.start(items[index]);
    divControls.start(divControlsItems[index]);
    maskControls.start(maskControlsItems[index]);
    setHeight(items[index].height);
  }, [trigger]); // Triggers whenever user selects on a "pill"

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
    const velocityX = info.velocity.x;
    const offsetX = info.offset.x;

    setVelocityX(velocityX);
    setOffsetX(offsetX);

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
    divControls.start(divControlsItems[newIndex]);
    maskControls.start(maskControlsItems[newIndex]);
    setHeight(items[newIndex].height);
  };

  return (
    <>
      <motion.div
        drag
        dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
        animate={maskControls}
        style={{
          height: divHeight,
          width: MAX_WIDTH,
          border: "2px solid blue",
          position: "fixed",
          top: 200,
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        <h4 style={{ backgroundColor: "blue", padding: 12, paddingBottom: 32 }}>
          This is some text
        </h4>
        <motion.div
          animate={divControls}
          style={{
            height: divHeight,
            position: "relative",
            top: -20,
            backgroundColor: "black",
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          <motion.div
            drag="x"
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            initial="first"
            animate={controls}
            transition={{ type: "spring", damping: 40, stiffness: 400 }}
            dragConstraints={{
              left: -(Math.min(NUM_ITEMS - 1, index + 1) * MAX_WIDTH),
              right: -(Math.max(0, index - 1) * MAX_WIDTH),
            }}
            dragElastic={0.1}
            className="card"
            style={{
              position: "relative",
              top: 0,
              left: 0,
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              width: MAX_WIDTH * NUM_ITEMS,
            }}
          >
            {items.map((item) => {
              return (
                <img
                  src={item.imgUrl}
                  style={{
                    width: MAX_WIDTH,
                    height: item.height,
                  }}
                  draggable={false}
                />
              );
            })}
          </motion.div>
        </motion.div>
      </motion.div>
    </>
  );
};

const SuperBubbleCarousel = () => {
  const [velocityX, setVelocityX] = useState<number>(0);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [index, setIndex] = useState<number>(0);
  const [trigger, setTrigger] = useState<number>(0);
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

  return !loading ? (
    <div className="carouselContainer">
      <div style={{ position: "fixed", top: 100, margin: "auto" }}>
        <div style={{ display: "flex", flexDirection: "row", gap: 12 }}>
          {items.map((item, i) => (
            <h4
              key={item.imgUrl}
              onClick={() => {
                setIndex(i);
                setTrigger((prev) => prev + 1);
              }}
              style={{
                color: "white",
                backgroundColor: `rgba(255, 255, 255, ${
                  index === i ? 0.2 : 0.1
                })`,
                border: `1px solid rgba(255, 255, 255, ${
                  index === i ? 0.2 : 0.1
                })`,
                paddingInline: 12,
                paddingBlock: 4,
                borderRadius: 100,
              }}
            >
              {item.imgUrl}
            </h4>
          ))}
        </div>
        {DEBUG ? (
          <h4 style={{ color: "white", marginTop: 12 }}>
            velocityX: {velocityX.toFixed(0)}, offsetX: {offsetX.toFixed(0)},
            image: {index + 1}
          </h4>
        ) : null}
      </div>
      <CarouselDiv
        setVelocityX={setVelocityX}
        setOffsetX={setOffsetX}
        setIndex={setIndex}
        index={index}
        trigger={trigger}
      />
    </div>
  ) : null;
};

export default SuperBubbleCarousel;
