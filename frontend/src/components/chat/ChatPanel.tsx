'use client';
// src/components/chat/ChatPanel.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { getSocket } from '@/lib/socket';
import { useTripStore } from '@/lib/stores/tripStore';
import { Message } from '@/types';
import Avatar from '@/components/ui/Avatar';

interface Props {
  tripId: string;
  userId: string;
  userName: string;
}

export default function ChatPanel({ tripId, userId, userName }: Props) {
  const { messages, typingUsers } = useTripStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const socket = getSocket();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    const content = input.trim();
    if (!content) return;
    socket.emit('chat:send', { tripId, content });
    setInput('');
    // Stop typing indicator
    if (isTyping) {
      socket.emit('chat:typing', { tripId, isTyping: false });
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    if (!isTyping) {
      socket.emit('chat:typing', { tripId, isTyping: true });
      setIsTyping(true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:typing', { tripId, isTyping: false });
      setIsTyping(false);
    }, 2000);
  };

  const otherTyping = typingUsers.filter(t => t.userId !== userId);

  // Group messages by date and consecutive sender
  const grouped = groupMessages(messages);

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-220px)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">Chat</h2>
        <span className="text-xs text-[var(--text-muted)]">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sand-500">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
              </div>
              <p className="text-sm text-[var(--text-muted)]">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {grouped.map((group, gi) => (
              <MessageGroup key={gi} group={group} currentUserId={userId} />
            ))}
          </>
        )}

        {/* Typing indicator */}
        {otherTyping.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 animate-fade-in">
            <div className="flex -space-x-1">
              {otherTyping.slice(0, 2).map(t => (
                <Avatar key={t.userId} name={t.name} size="xs" />
              ))}
            </div>
            <div className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 bg-sand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-sand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-sand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              {otherTyping[0].name}{otherTyping.length > 1 ? ` +${otherTyping.length - 1}` : ''} typing...
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 card p-3 flex items-end gap-3">
        <textarea
          className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none max-h-32"
          placeholder="Type a message..."
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          style={{ lineHeight: '1.5' }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="w-8 h-8 rounded-lg bg-sand-400 text-ink-950 flex items-center justify-center hover:bg-sand-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

interface MessageGroupType {
  userId: string;
  userName: string;
  userAvatar?: string | null;
  messages: Message[];
  date: Date;
}

function groupMessages(messages: Message[]): MessageGroupType[] {
  const groups: MessageGroupType[] = [];
  let currentGroup: MessageGroupType | null = null;

  messages.forEach(msg => {
    const msgDate = new Date(msg.createdAt);
    const sameGroup = currentGroup &&
      currentGroup.userId === msg.userId &&
      msgDate.getTime() - new Date(currentGroup.messages[currentGroup.messages.length - 1].createdAt).getTime() < 5 * 60 * 1000;

    if (sameGroup && currentGroup) {
      currentGroup.messages.push(msg);
    } else {
      currentGroup = {
        userId: msg.userId,
        userName: msg.user.name,
        userAvatar: msg.user.avatar,
        messages: [msg],
        date: msgDate,
      };
      groups.push(currentGroup);
    }
  });

  return groups;
}

function MessageGroup({ group, currentUserId }: { group: MessageGroupType; currentUserId: string }) {
  const isOwn = group.userId === currentUserId;
  const time = new Date(group.messages[0].createdAt);

  return (
    <div className={`flex items-end gap-2 py-1 animate-fade-in ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && <Avatar name={group.userName} size="sm" className="flex-shrink-0 mb-1" />}

      <div className={`flex flex-col gap-0.5 max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <span className="text-xs text-[var(--text-muted)] px-1">{group.userName}</span>
        )}
        {group.messages.map((msg, i) => (
          <div
            key={msg.id}
            className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
              isOwn
                ? 'bg-sand-500 text-ink-950 rounded-br-sm'
                : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border)] rounded-bl-sm'
            } ${i === 0 ? '' : isOwn ? 'rounded-tr-2xl' : 'rounded-tl-2xl'}`}
          >
            {msg.content}
          </div>
        ))}
        <span className="text-[10px] text-[var(--text-muted)] px-1">
          {formatMessageTime(time)}
        </span>
      </div>
    </div>
  );
}

function formatMessageTime(date: Date) {
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
  return format(date, 'MMM d, HH:mm');
}
