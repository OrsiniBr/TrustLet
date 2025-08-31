import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Clock, Trophy, AlertTriangle } from "lucide-react";

const ChatTimer = ({ selectedUser }) => {
  const { getRemainingTime, isWinner, getWinner } = useChatStore();
  const { authUser } = useAuthStore();
  const [remainingTime, setRemainingTime] = useState(0);
  const chatId = selectedUser._id;

  useEffect(() => {
    const interval = setInterval(() => {
      const time = getRemainingTime(chatId);
      setRemainingTime(time);
    }, 1000);

    return () => clearInterval(interval);
  }, [chatId, getRemainingTime]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const winner = getWinner(chatId);
  const isUserWinner = isWinner(chatId, authUser._id);

  if (winner) {
    return (
      <div className="bg-base-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="font-semibold">
            {isUserWinner ? 'You won!' : `${selectedUser.fullName} won!`}
          </span>
        </div>
        <p className="text-sm text-base-content/70 text-center mt-1">
          Time ran out and no reply was received
        </p>
      </div>
    );
  }

  if (remainingTime === 0) {
    return null;
  }

  const isLowTime = remainingTime <= 30; // Show warning when 30 seconds or less

  return (
    <div className={`bg-base-200 rounded-lg p-4 mb-4 border-l-4 ${
      isLowTime ? 'border-warning' : 'border-primary'
    }`}>
      <div className="flex items-center justify-center gap-2">
        {isLowTime ? (
          <AlertTriangle className="w-5 h-5 text-warning" />
        ) : (
          <Clock className="w-5 h-5 text-primary" />
        )}
        <span className={`font-semibold ${
          isLowTime ? 'text-warning' : 'text-primary'
        }`}>
          {formatTime(remainingTime)} remaining
        </span>
      </div>
      <p className="text-sm text-base-content/70 text-center mt-1">
        {isLowTime 
          ? 'Reply quickly or lose the challenge!' 
          : 'Waiting for a reply...'
        }
      </p>
    </div>
  );
};

export default ChatTimer;
