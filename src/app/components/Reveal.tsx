import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { cn } from "./ui/utils";

type RevealProps = HTMLMotionProps<"div"> & {
  /** Retraso en segundos al aparecer en viewport */
  delay?: number;
  /** Desplazamiento vertical inicial (px) */
  y?: number;
};

/**
 * Bloque que aparece al hacer scroll (una vez). Útil fuera de &lt;section&gt; o para tarjetas sueltas.
 */
export function Reveal({ children, className, delay = 0, y = 20, ...rest }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14, margin: "0px 0px -48px 0px" }}
      transition={{
        duration: 0.52,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
