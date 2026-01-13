import React from "react";
import PoojaListClient from "./PoojaListClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Poojas & Sevas | DevBhakti - Sacred Rituals at Holy Temples",
    description: "Explore and book authentic Vedic poojas, aartis and sevas at India's most sacred temples through DevBhakti.",
};

const PoojasPage = () => {
    return <PoojaListClient />;
};

export default PoojasPage;
