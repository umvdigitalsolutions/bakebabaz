"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import styles from "./story-hero.module.css";

export function OvenJourney() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Three deliberately separated phases:
  // 0-.24 intro only | .30-.58 doors opening | .66+ final copy only.
  const introOpacity = useTransform(scrollYProgress, [0, 0.16, 0.24], [1, 1, 0]);
  const doorLeft = useTransform(scrollYProgress, [0.30, 0.58], ["0%", "-102%"]);
  const doorRight = useTransform(scrollYProgress, [0.30, 0.58], ["0%", "102%"]);
  const sceneOpacity = useTransform(scrollYProgress, [0.42, 0.62], [0.25, 1]);
  const copyOpacity = useTransform(scrollYProgress, [0.66, 0.76], [0, 1]);
  const copyY = useTransform(scrollYProgress, [0.66, 0.78], [24, 0]);
  const stepsOpacity = useTransform(scrollYProgress, [0.76, 0.86], [0, 1]);

  return (
    <section ref={ref} className={styles.ovenJourney} aria-label="From our oven to your table">
      <div className={styles.ovenSticky}>
        <div className={styles.ovenInterior}>
          <motion.div className={styles.ovenScene} style={reduceMotion ? undefined : { opacity: sceneOpacity }}>
            <Image
              src="/brand/ai-bakery-hero.png"
              alt="Bake Baba'z bakery spread"
              fill
              priority
              sizes="100vw"
              className={styles.ovenSceneImage}
            />
            <div className={styles.ovenSceneShade} />
          </motion.div>

          <motion.div
            className={styles.ovenCopy}
            style={reduceMotion ? undefined : { opacity: copyOpacity, y: copyY }}
          >
            <p>From our oven to your table</p>
            <h2>Every Bake<br />Has a Story</h2>
            <span>Freshly made in Bikaner, for the moments worth celebrating.</span>
          </motion.div>

          <motion.div className={styles.ovenSteps} style={reduceMotion ? undefined : { opacity: stepsOpacity }}>
            <span><b>01</b>Imagine</span><i /><span><b>02</b>Make</span><i />
            <span><b>03</b>Bake</span><i /><span><b>04</b>Celebrate</span>
          </motion.div>
        </div>

        <motion.div className={`${styles.ovenDoor} ${styles.ovenDoorLeft}`} style={reduceMotion ? { x: "-102%" } : { x: doorLeft }} aria-hidden="true"><span /></motion.div>
        <motion.div className={`${styles.ovenDoor} ${styles.ovenDoorRight}`} style={reduceMotion ? { x: "102%" } : { x: doorRight }} aria-hidden="true"><span /></motion.div>

        <motion.div className={styles.ovenIntro} style={reduceMotion ? { opacity: 0 } : { opacity: introOpacity }} aria-hidden="true">
          <span>Every bake has a story</span><i /><small>Keep scrolling</small>
        </motion.div>
      </div>
    </section>
  );
}
