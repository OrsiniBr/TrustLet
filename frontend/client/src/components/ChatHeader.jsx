import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { DollarSign, Clock, Trophy, X } from "lucide-react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, hasDeposited, getRemainingTime, isWinner, getWinner } = useChatStore();
  const { authUser, onlineUsers } = useAuthStore();
  
  if (!selectedUser) return null;

  const chatId = selectedUser._id;
  const userHasDeposited = hasDeposited(chatId);
  const remainingTime = getRemainingTime(chatId);
  const winner = getWinner(chatId);
  const isUserWinner = isWinner(chatId, authUser._id);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {userHasDeposited ? "Chat active" : "Deposit required"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Show deposit status */}
          {!userHasDeposited && (
            <div className="badge badge-warning gap-1">
              <DollarSign className="w-3 h-3" />
              $5 Required
            </div>
          )}

          {/* Show timer if active */}
          {userHasDeposited && remainingTime > 0 && (
            <div className="badge badge-primary gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(remainingTime)}
            </div>
          )}

          {/* Show winner if time ran out */}
          {winner && (
            <div className={`badge gap-1 ${
              isUserWinner ? 'badge-success' : 'badge-error'
            }`}>
              <Trophy className="w-3 h-3" />
              {isUserWinner ? 'You Won!' : 'Opponent Won'}
            </div>
          )}

          {/* Close button */}
          <button onClick={() => setSelectedUser(null)}>
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
