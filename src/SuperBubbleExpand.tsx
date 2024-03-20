import { motion } from "framer-motion";
import { useState } from "react";
import "./styles/superBubbleExpand.css";

const SuperBubbleExpand = () => {
  const [bubbleHeight, setBubbleHeight] = useState<number>(137);
  const [duration, setDuration] = useState<number>(1.0);

  return (
    <div className="container">
      <motion.div
        className="superBubble"
        initial={{
          opacity: 0.2,
          filter: "blur(4px)",
          height: bubbleHeight,
        }}
        animate={{
          opacity: 1,
          filter: "blur(0px)",
          height: bubbleHeight,
          transition: { type: "spring", duration: duration },
        }}
      >
        <p>These are just some images I like.</p>
        <p>Say hello to Kirby.</p>
        <div
          className="pill"
          onClick={() => {
            setDuration(0.5);
            
            if (bubbleHeight == 137) {
              setBubbleHeight(137 + 312);
              document.getElementById("kirby")!.style.opacity = "1"
            } else {
              setBubbleHeight(137);
              
              setTimeout(() => {
                document.getElementById("kirby")!.style.opacity = "0.01"
              }, 450);
            }
          }}
        >
          <img className="pillThumbnail" src="kirby.jpeg"/>
          <h4>kirby.jpeg</h4>
        </div>
        <div className="pill">
          <img className="pillThumbnail" src="too_close_jacques_greene.jpeg" />
          <h4>too_close_jacques_greene.jpeg</h4>
        </div>
        <p>This is by Eric Hu.</p>
        <div className="pill">
          <img className="pillThumbnail" src="gerard_richter.jpeg" />
          <h4>richter.jpeg</h4>
        </div>
        <p>A painting by Gerard Richter.</p>
        <img src="kirby.jpeg" className="kirbyImg" draggable="false" id="kirby" />
        <img src="too_close_jacques_greene.jpeg.jpeg" className="jacquesImg" draggable="false" id="kirby" />
      </motion.div>
    </div>
  );
};

export default SuperBubbleExpand;
