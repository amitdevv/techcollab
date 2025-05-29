import React from "react";
import { cn } from "../../lib/utils";
import { UserCircle } from "lucide-react";

interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away" | "busy";
  className?: string;
  onClick?: () => void;
  showInitials?: boolean;
  username?: string;
  isLoading?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "Avatar",
  fallback,
  size = "md",
  status,
  className,
  onClick,
  showInitials = true,
  username,
  isLoading = false,
}) => {
  const [imageError, setImageError] = React.useState(false);

  const sizeStyles = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
    xl: "h-16 w-16 text-xl",
  };

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    away: "bg-yellow-500",
    busy: "bg-red-500",
  };

  const statusSizes = {
    xs: "h-1.5 w-1.5",
    sm: "h-2 w-2",
    md: "h-2.5 w-2.5",
    lg: "h-3 w-3",
    xl: "h-3.5 w-3.5",
  };

  const getInitials = (name?: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const containerClasses = cn(
    "relative inline-block rounded-full overflow-hidden",
    onClick && "cursor-pointer hover:opacity-90 transition-opacity",
    className
  );

  return (
    <div className={containerClasses} onClick={onClick}>
      {isLoading ? (
        <div
          className={cn(
            sizeStyles[size],
            "flex items-center justify-center bg-violet-100"
          )}
        >
          <div
            className="animate-spin rounded-full border-2 border-violet-300 border-t-violet-600"
            style={{ width: "50%", height: "50%" }}
          />
        </div>
      ) : src && !imageError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className={cn("rounded-full object-cover", sizeStyles[size])}
        />
      ) : (
        <div
          className={cn(
            sizeStyles[size],
            "rounded-full flex items-center justify-center bg-violet-100 text-violet-600",
            "font-medium"
          )}
        >
          {showInitials && username ? (
            getInitials(username)
          ) : (
            <UserCircle className="w-2/3 h-2/3" />
          )}
        </div>
      )}
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-white",
            statusColors[status],
            statusSizes[size]
          )}
        />
      )}
    </div>
  );
};

export default Avatar;
