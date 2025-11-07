import React from "react";
import { useNavigate } from "react-router-dom";
import SparkleEffect from "../effects/SparkleEffect";
import Button from "../shared/Button";

interface DashboardCardProps {
  title: string;
  description: string;
  gradient: string;
  route?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  description,
  gradient,
  route,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (route) {
      void navigate(route);
    }
  };

  return (
    <SparkleEffect intensity="medium">
      <Button
        onClick={handleClick}
        variant="subtle"
        fullWidth
        className={`text-left bg-white dark:bg-gray-800 bg-gradient-to-br ${gradient} border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg group`}
        aria-label={`Navigate to ${title}`}
      >
        <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm">
          {description}
        </p>
      </Button>
    </SparkleEffect>
  );
};

export default React.memo(DashboardCard);
