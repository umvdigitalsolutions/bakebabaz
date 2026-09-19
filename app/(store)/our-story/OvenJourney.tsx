"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import styles from "./story-hero.module.css";

export function OvenJourney() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  // Intentionally non-overlapping timeline:
  // 0-.18 closed oven / cue
  // .18-.52 doors open
  // .52-.64 visual breathing room
  // .64-.76 headline
  // .80+ process strip
  const cueOpacity = useTransform(scrollYProgress, [0, 0.12, 0.18], [1, 1, 0]);
  const doorLeft = useTransform(scrollYProgress, [0.18, 0.52], ["0%", "-104%"]);
  const doorRight = useTransform(scrollYProgress, [0.18, 0.52], ["0%", "104%"]);
  const sceneScale = useTransform(scrollYProgress, [0.18, 0.58], [1.08, 1]);
  const copyOpacity = useTransform(scrollYProgress, [0.64, 0.73], [0, 1]);
  const copyY = useTransform(scrollYProgress, [0.64, 0.74], [18, 0]);
  const stepsOpacity = useTransform(scrollYProgress, [0.80, 0.88], [0, 1]);
  const stepsY = useTransform(scrollYProgress, [0.80, 0.90], [14, 0]);

  return (
    <section ref={ref} className={styles.ovenJourney} aria-label="Bake Baba'z oven story">
      <div className={styles.ovenSticky}>
        <div className={styles.ovenFrame}>
          <div className={styles.ovenInterior}>
            <motion.div className={styles.ovenScene} style={reduceMotion ? undefined : { scale: sceneScale }}>
              <Image
                src="/brand/ai-bakery-hero.png"
                alt="A spread of Bake Baba'z cakes and bakes"
                fill
                priority
                sizes="100vw"
                className={styles.ovenSceneImage}
              />
              <div className={styles.ovenSceneShade} />
            </motion.div>

            <motion.div className={styles.ovenCopy} style={reduceMotion ? undefined : { opacity: copyOpacity, y: copyY }}>
              <p>From our oven to your table</p>
              <h2>Every Bake<br />Has a Story</h2>
              <span>Freshly made in Bikaner, for the moments worth celebrating.</span>
            </motion.div>

            <motion.div className={styles.ovenSteps} style={reduceMotion ? undefined : { opacity: stepsOpacity, y: stepsY }}>
              <span><b>01</b>Imagine</span><i /><span><b>02</b>Make</span><i />
              <span><b>03</b>Bake</span><i /><span><b>04</b>Celebrate</span>
            </motion.div>
          </div>

          <motion.div className={`${styles.ovenDoor} ${styles.ovenDoorLeft}`} style={reduceMotion ? { x: "-104%" } : { x: doorLeft }} aria-hidden="true">
            <div className={styles.doorInset}><span>GOOD THINGS<br/>TAKE TIME</span></div>
            <b className={styles.doorHandle} />
          </motion.div>
          <motion.div className={`${styles.ovenDoor} ${styles.ovenDoorRight}`} style={reduceMotion ? { x: "104%" } : { x: doorRight }} aria-hidden="true">
            <div className={styles.doorInset}><span>BAKED WITH<br/>LOVE</span></div>
            <b className={styles.doorHandle} />
          </motion.div>

          <motion.div className={styles.closedCue} style={reduceMotion ? { opacity: 0 } : { opacity: cueOpacity }} aria-hidden="true">
            <small>BAKE BABA&apos;Z</small>
            <span>Open the oven</span>
            <i />
            <em>Scroll to discover</em>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
