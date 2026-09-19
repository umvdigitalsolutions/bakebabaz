"use client";

import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import styles from "./story-hero.module.css";

const bakes = [
  { src: "/products/chocolate-truffle-cake.jpg", alt: "Chocolate truffle cake", cls: styles.bakeCake },
  { src: "/brand/instagram/chocolate-chip-cookies.jpeg", alt: "Chocolate chip cookies", cls: styles.bakeCookies },
  { src: "/products/chocolate-cupcakes.jpg", alt: "Chocolate cupcakes", cls: styles.bakeCupcakes },
  { src: "/products/brownie.jpg", alt: "Fresh brownie", cls: styles.bakeBrownie },
  { src: "/brand/instagram/kesar-nankhatai.jpeg", alt: "Kesar nankhatai", cls: styles.bakeNankhatai },
];

export function OvenJourney() {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const doorLeft = useTransform(scrollYProgress, [0.12, 0.5], ["0%", "-102%"]);
  const doorRight = useTransform(scrollYProgress, [0.12, 0.5], ["0%", "102%"]);
  const glow = useTransform(scrollYProgress, [0.05, 0.46, 0.82], [0.18, 1, 0.72]);
  const introOpacity = useTransform(scrollYProgress, [0, 0.2, 0.34], [1, 1, 0]);
  const revealOpacity = useTransform(scrollYProgress, [0.42, 0.64], [0, 1]);
  const revealY = useTransform(scrollYProgress, [0.42, 0.66], [22, 0]);
  const bakesY = useTransform(scrollYProgress, [0.34, 0.68], [55, 0]);
  const bakesOpacity = useTransform(scrollYProgress, [0.34, 0.58], [0, 1]);

  return (
    <section ref={ref} className={styles.ovenJourney} aria-label="From our oven to your table">
      <div className={styles.ovenSticky}>
        <motion.div className={styles.ovenGlow} style={reduceMotion ? undefined : { opacity: glow }} />
        <div className={styles.ovenInterior}>
          <motion.div className={styles.ovenCopy} style={reduceMotion ? undefined : { opacity: revealOpacity, y: revealY }}>
            <p>From our oven to your table</p>
            <h2>Every Bake<br />Has a Story</h2>
            <span>Freshly made in Bikaner, for the moments worth celebrating.</span>
          </motion.div>

          <motion.div className={styles.bakeDisplay} style={reduceMotion ? undefined : { opacity: bakesOpacity, y: bakesY }}>
            {bakes.map((bake) => (
              <div key={bake.src} className={`${styles.bakeItem} ${bake.cls}`}>
                <Image src={bake.src} alt={bake.alt} fill sizes="240px" className={styles.bakePhoto} />
              </div>
            ))}
            <div className={styles.displayBoard} aria-hidden="true" />
          </motion.div>

          <motion.div className={styles.ovenSteps} style={reduceMotion ? undefined : { opacity: revealOpacity }}>
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
