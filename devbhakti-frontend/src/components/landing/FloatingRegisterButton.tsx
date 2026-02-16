"use client";

import React from "react";
import { motion } from "framer-motion";

interface FloatingRegisterButtonProps {
    onClick: () => void;
}

const FloatingRegisterButton: React.FC<FloatingRegisterButtonProps> = ({ onClick }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-50"
        >
            <button
                onClick={onClick}
                className="bg-[#88542B] hover:bg-[#704221] text-white py-8 px-3 rounded-l-md shadow-lg transition-all duration-300 group cursor-pointer border-l border-y border-white/20 flex flex-col items-center justify-center outline-none"
            >
                <div className="writing-mode-vertical rotate-180 text-sm font-medium tracking-wide whitespace-nowrap px-1">
                    Register Your Temple
                </div>
            </button>
        </motion.div>
    );
};

export default FloatingRegisterButton;


