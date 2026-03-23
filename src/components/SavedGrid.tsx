"use client";

import { motion } from "framer-motion";
import NewsCard from "@/components/NewsCard";
import type { Article } from "@/lib/types";

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

interface SavedGridProps {
  articles: Article[];
}

export default function SavedGrid({ articles }: SavedGridProps) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {articles.map((article) => (
        <motion.div key={article.id} variants={staggerItem}>
          <NewsCard article={article} variant="card" />
        </motion.div>
      ))}
    </motion.div>
  );
}
