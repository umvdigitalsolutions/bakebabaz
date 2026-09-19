"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import styles from "./story-hero.module.css";

export function OvenJourney() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const doorLeft = useTransform(scrollYProgress, [0.16, 0.50], ["0%", "-104%"]);
  const doorRight = useTransform(scrollYProgress, [0.16, 0.50], ["0%", "104%"]);
  const titleOpacity = useTransform(scrollYProgress, [0.55, 0.67], [0, 1]);
  const titleY = useTransform(scrollYProgress, [0.55, 0.68], [18, 0]);

  return (
    <section ref={ref} className={styles.ovenJourney} aria-label="Bake Baba'z story">
      <div className={styles.ovenSticky}>
        <div className={styles.ovenFrame}>
          <div className={styles.ovenInterior}>
            <Image src="/brand/ai-bakery-hero.png" alt="Bake Baba'z bakery spread" fill priority sizes="100vw" className={styles.ovenSceneImage} />
            <div className={styles.ovenSceneShade} />
            <motion.h2 className={styles.onlyStoryTitle} style={reduceMotion ? undefined : { opacity: titleOpacity, y: titleY }}>
              Every Bake Has a Story
            </motion.h2>
          </div>
          <motion.div className={`${styles.ovenDoor} ${styles.ovenDoorLeft}`} style={reduceMotion ? { x: "-104%" } : { x: doorLeft }} aria-hidden="true"><b className={styles.doorHandle} /></motion.div>
          <motion.div className={`${styles.ovenDoor} ${styles.ovenDoorRight}`} style={reduceMotion ? { x: "104%" } : { x: doorRight }} aria-hidden="true"><b className={styles.doorHandle} /></motion.div>
        </div>
      </div>
    </section>
  );
}
