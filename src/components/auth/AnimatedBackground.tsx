"use client";
import React from "react";
import styles from "./AnimatedBackground.module.scss";

export default function AnimatedBackground() {
  // Create enough rows to fill the screen vertically
  const rows = Array.from({ length: 6 });

  return (
    <div className={styles.backgroundWrapper}>
      <div className={styles.rotatedContainer}>
        {rows.map((_, i) => (
          <div key={i} className={styles.row}>
            <div className={`${styles.rowInner} ${i % 2 === 0 ? styles.moveRight : styles.moveLeft}`}></div>
          </div>
        ))}
      </div>
    </div>
  );
}
