import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = "p-6",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 shadow rounded-lg ${padding} ${className} ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {children}
    </div>
  );
};

export default Card;
