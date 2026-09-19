"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import styles from "./InspirationGallery.module.css";

const DIRECTIONS = [
  {
    id: "entrance",
    number: "01",
    choice: "Make an entrance",
    title: "A little theatre at the table.",
    body: "Sculptural petals, layered florals and a silhouette that rewards a second look.",
    image: "/brand/founder/mishika-dawra-floral-cake.jpeg",
    alt: "Mishika Daawra with an ornate floral celebration cake",
    focus: "50% 48%",
    words: ["Sculptural", "Floral", "Statement"],
    colours: ["#f0ddd8", "#c58aa0", "#8b254d", "#d8b978"],
  },
  {
    id: "personal",
    number: "02",
    choice: "Feel deeply personal",
    title: "Two stories, one celebration.",
    body: "Names, favourite colours and playful details turn a cake into part of the memory.",
    image: "/brand/founder/mishika-dawra-custom-cakes.jpeg",
    alt: "Mishika Daawra with two personalised celebration cakes",
    focus: "50% 55%",
    words: ["Playful", "Pastel", "Personal"],
    colours: ["#cfe3ed", "#efb8c2", "#e7d37c", "#8ab7a2"],
  },
  {
    id: "chocolate",
    number: "03",
    choice: "Lead with chocolate",
    title: "Deep, polished, unapologetic.",
    body: "A cocoa-first direction where texture, shine and flavour do the talking.",
    image: "/products/chocolate-truffle-cake.jpg",
    alt: "Chocolate truffle cake by Bake Baba'z",
    focus: "50% 58%",
    words: ["Cocoa", "Polished", "Generous"],
    colours: ["#ead4bf", "#ad7150", "#63352b", "#2c1715"],
  },
  {
    id: "quiet",
    number: "04",
    choice: "Stay quietly elegant",
    title: "Soft detail. Plenty of presence.",
    body: "A restrained palette and precise finish for a cake that never needs to shout.",
    image: "/products/vanilla-cake.jpg",
    alt: "Minimal vanilla cake by Bake Baba'z",
    focus: "50% 54%",
    words: ["Minimal", "Light", "Precise"],
    colours: ["#fffaf0", "#e9e1be", "#b7c69b", "#d9b2a7"],
  },
  {
    id: "maker",
    number: "05",
    choice: "Carry the maker's touch",
    title: "Made by hand, unmistakably yours.",
    body: "Start with a feeling and let Mishika shape the finish, balance and final detail.",
    image: "/brand/founder/mishika-dawra-founder-cake.jpeg",
    alt: "Mishika Daawra holding a cake in the Bake Baba'z bakery",
    focus: "50% 38%",
    words: ["Crafted", "Warm", "One of one"],
    colours: ["#f8eee4", "#ef665f", "#a9ad78", "#3d2521"],
  },
] as const;

export function InspirationGallery() {
  const [selectedId, setSelectedId] =
    useState<(typeof DIRECTIONS)[number]["id"]>(DIRECTIONS[0].id);
  const reduceMotion = useReducedMotion();
  const selected =
    DIRECTIONS.find((direction) => direction.id === selectedId) ?? DIRECTIONS[0];

  return (
    <div className={styles.compass}>
      <div
        id="cake-compass-panel"
        className={styles.stage}
        role="tabpanel"
        aria-labelledby={`cake-direction-${selected.id}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selected.id}
            className={styles.imageLayer}
            initial={
              reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 1.015 }
            }
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.45 }}
          >
            <Image
              src={selected.image}
              alt={selected.alt}
              fill
              sizes="(max-width: 900px) 100vw, 68vw"
              className={styles.image}
              style={{ objectPosition: selected.focus }}
            />
          </motion.div>
        </AnimatePresence>

        <div className={styles.scrim} aria-hidden />
        <span className={styles.railLabel} aria-hidden>
          Bake Baba&rsquo;z / visual direction
        </span>
        <div className={styles.stageIndex} aria-hidden>
          <span>{selected.number}</span>
          <span className={styles.indexRule} />
          <span>05</span>
        </div>
        <div className={styles.caption}>
          <p className={styles.captionLabel}>Your chosen feeling</p>
          <h3>{selected.title}</h3>
          <p>{selected.body}</p>
        </div>
      </div>

      <div className={styles.controls}>
        <div>
          <p className={styles.controlsEyebrow}>
            <Sparkles aria-hidden />
            The celebration dial
          </p>
          <h3 className={styles.question}>I want my cake to...</h3>
        </div>

        <div
          className={styles.choiceList}
          role="tablist"
          aria-label="Cake feeling"
        >
          {DIRECTIONS.map((direction) => {
            const active = selected.id === direction.id;
            return (
              <button
                key={direction.id}
                id={`cake-direction-${direction.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="cake-compass-panel"
                onClick={() => setSelectedId(direction.id)}
                className={styles.choice}
                data-active={active || undefined}
              >
                <span className={styles.choiceNumber}>{direction.number}</span>
                <span>{direction.choice}</span>
                <ArrowUpRight aria-hidden />
              </button>
            );
          })}
        </div>

        <div className={styles.directionDetails} aria-live="polite">
          <div
            className={styles.swatches}
            aria-label="Suggested colour direction"
          >
            {selected.colours.map((colour) => (
              <span key={colour} style={{ backgroundColor: colour }} />
            ))}
          </div>
          <p>{selected.words.join(" · ")}</p>
        </div>

        <ButtonLink
          href="#studio"
          variant="light"
          className={styles.studioLink}
        >
          Take this feeling to the studio
          <ArrowUpRight className="size-4" />
        </ButtonLink>
      </div>
    </div>
  );
}
