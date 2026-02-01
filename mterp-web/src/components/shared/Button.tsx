import { LucideIcon } from "lucide-react";
import "./Button.css";

interface ButtonProps {
  title: string;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "outline";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  fullWidth?: boolean;
  style?: React.CSSProperties;
  className?: string;
  type?: "button" | "submit" | "reset";
}

export default function Button({
  title,
  onClick,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = "left",
  fullWidth = false,
  style,
  className = "",
  type = "button",
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 16;
      case "medium":
        return 20;
      case "large":
        return 24;
      default:
        return 20;
    }
  };

  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? "btn-full" : ""} ${isDisabled ? "btn-disabled" : ""} ${className}`}
      onClick={onClick}
      disabled={isDisabled}
      style={style}
    >
      {loading ? (
        <span className="spinner"></span>
      ) : (
        <span className="btn-content">
          {Icon && iconPosition === "left" && (
            <Icon size={getIconSize()} style={{ marginRight: 8 }} />
          )}
          <span>{title}</span>
          {Icon && iconPosition === "right" && (
            <Icon size={getIconSize()} style={{ marginLeft: 8 }} />
          )}
        </span>
      )}
    </button>
  );
}
