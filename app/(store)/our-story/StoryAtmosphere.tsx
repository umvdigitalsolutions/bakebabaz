"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import styles from "./story-hero.module.css";

const flour = [
  { left: "8%", top: "18%", size: 3, delay: 0.2, duration: 7 },
  { left: "16%", top: "72%", size: 5, delay: 1.1, duration: 9 },
  { left: "27%", top: "32%", size: 2, delay: 2.4, duration: 8 },
  { left: "39%", top: "80%", size: 4, delay: 0.8, duration: 10 },
  { left: "51%", top: "20%", size: 3, delay: 3.1, duration: 7.5 },
  { left: "62%", top: "66%", size: 5, delay: 1.7, duration: 9.5 },
  { left: "73%", top: "28%", size: 2, delay: 2.8, duration: 8.5 },
  { left: "84%", top: "74%", size: 4, delay: 0.4, duration: 10.5 },
  { left: "92%", top: "40%", size: 3, delay: 2, duration: 8 },
];

export function StoryAtmosphere() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 24,
    mass: 0.25,
  });

  return (
    <>
      <div className={styles.progressTrack} aria-hidden="true">
        <motion.span
          className={styles.progressFill}
          style={{ scaleX: reduceMotion ? 1 : scaleX }}
        />
      </div>

      <div className={styles.flourField} aria-hidden="true">
        {flour.map((particle, index) => (
          <motion.span
            key={index}
            className={styles.flourParticle}
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
            }}
            animate={
              reduceMotion
                ? undefined
                : {
                    y: [0, -24, 5, 0],
                    x: [0, 8, -5, 0],
                    opacity: [0.08, 0.5, 0.2, 0.08],
                  }
            }
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div
        className={styles.scrollCue}
        aria-hidden="true"
        animate={reduceMotion ? undefined : { y: [0, 7, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <span>Scroll to unfold</span>
        <i />
      </motion.div>
    </>
  );
}
