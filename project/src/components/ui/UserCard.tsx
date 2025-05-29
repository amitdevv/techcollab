import React from "react";
import { MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Avatar from "./Avatar";
import Button from "./Button";
import { cn } from "../../lib/utils";

interface UserCardProps {
  user: {
    _id: string;
    username: string;
    name: string;
    picture?: string;
    status?: "online" | "offline" | "away" | "busy";
  };
  showMessageButton?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  showMessageButton = true,
  className,
  size = "md",
  onClick,
}) => {
  const navigate = useNavigate();

  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/inbox/${user._id}`);
  };

  const sizes = {
    sm: {
      card: "p-2",
      avatar: "sm",
      name: "text-sm",
      username: "text-xs",
    },
    md: {
      card: "p-3",
      avatar: "md",
      name: "text-base",
      username: "text-sm",
    },
    lg: {
      card: "p-4",
      avatar: "lg",
      name: "text-lg",
      username: "text-base",
    },
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg hover:bg-gray-50 transition-colors",
        sizes[size].card,
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <Avatar
          src={user.picture}
          username={user.name}
          size={sizes[size].avatar as any}
          status={user.status}
        />
        <div>
          <h3 className={cn("font-medium text-gray-900", sizes[size].name)}>
            {user.name}
          </h3>
          <p className={cn("text-gray-500", sizes[size].username)}>
            @{user.username}
          </p>
        </div>
      </div>
      {showMessageButton && (
        <Button
          variant="outline"
          size="sm"
          className="text-violet-600 border-violet-200 hover:bg-violet-50"
          onClick={handleMessageClick}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default UserCard;
