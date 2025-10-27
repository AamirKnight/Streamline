'use client';

interface User {
  socketId: string;
  userId: number;
  username: string;
}

interface PresenceAvatarsProps {
  users: User[];
}

export function PresenceAvatars({ users }: PresenceAvatarsProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
  ];

  return (
    <div className="flex -space-x-2">
      {users.slice(0, 5).map((user, index) => (
        <div
          key={user.socketId}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center
            text-white text-xs font-medium border-2 border-white
            ${colors[index % colors.length]}
          `}
          title={user.username}
        >
          {getInitials(user.username)}
        </div>
      ))}
      {users.length > 5 && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-500 text-white text-xs font-medium border-2 border-white">
          +{users.length - 5}
        </div>
      )}
    </div>
  );
}