import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = "p-6",
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 shadow rounded-lg ${padding} ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
