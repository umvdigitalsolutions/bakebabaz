"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import styles from "./story-hero.module.css";

export function OvenJourney() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const doorLeft = useTransform(scrollYProgress, [0.18, 0.58], ["0%", "-102%"]);
  const doorRight = useTransform(scrollYProgress, [0.18, 0.58], ["0%", "102%"]);
  const glow = useTransform(scrollYProgress, [0.05, 0.48, 0.82], [0.18, 1, 0.72]);
  const scale = useTransform(scrollYProgress, [0, 0.72], [0.94, 1.08]);
  const introOpacity = useTransform(scrollYProgress, [0, 0.24, 0.42], [1, 1, 0]);
  const revealOpacity = useTransform(scrollYProgress, [0.42, 0.7], [0, 1]);
  const revealY = useTransform(scrollYProgress, [0.42, 0.72], [32, 0]);

  return (
    <section ref={ref} className={styles.ovenJourney} aria-label="From our oven to your table">
      <div className={styles.ovenSticky}>
        <motion.div className={styles.ovenGlow} style={reduceMotion ? undefined : { opacity: glow, scale }} />
        <div className={styles.ovenInterior}>
          <div className={styles.ovenRack} aria-hidden="true" />
          <motion.div
            className={styles.ovenReveal}
            style={reduceMotion ? undefined : { opacity: revealOpacity, y: revealY }}
          >
            <p className={styles.ovenEyebrow}>From our oven to your table</p>
            <h2>This is where the magic happens.</h2>
            <p>
              Fresh batches, honest ingredients and a little patience. Every Bake Baba&apos;z order
              is made for its moment — never for a shelf.
            </p>
            <div className={styles.ovenSteps} aria-label="Our baking process">
              <span><b>01</b> Imagine</span>
              <span><b>02</b> Make</span>
              <span><b>03</b> Bake</span>
              <span><b>04</b> Celebrate</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          className={`${styles.ovenDoor} ${styles.ovenDoorLeft}`}
          style={reduceMotion ? { x: "-102%" } : { x: doorLeft }}
          aria-hidden="true"
        >
          <span />
        </motion.div>
        <motion.div
          className={`${styles.ovenDoor} ${styles.ovenDoorRight}`}
          style={reduceMotion ? { x: "102%" } : { x: doorRight }}
          aria-hidden="true"
        >
          <span />
        </motion.div>

        <motion.div
          className={styles.ovenIntro}
          style={reduceMotion ? { opacity: 0 } : { opacity: introOpacity }}
          aria-hidden="true"
        >
          <span>Every bake has a story</span>
          <i />
          <small>Keep scrolling</small>
        </motion.div>
      </div>
    </section>
  );
}
