import React from 'react';

const DEFAULT_SENDER = 'Parent/Guardian';
const TYPING_EXPIRY_MS = 3500;
const TYPING_THROTTLE_MS = 1500;

const createLocalId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const useChildMessages = ({ childId, isSupabaseEnabled, supabase, storageKey, defaultSender }) => {
  const [messages, setMessages] = React.useState([]);
  const [status, setStatus] = React.useState('');
  const [draft, setDraft] = React.useState({ sender: '', message: '' });
  const [isSending, setIsSending] = React.useState(false);
  const [typingUsers, setTypingUsers] = React.useState([]);
  const typingChannelRef = React.useRef(null);
  const lastTypingSentRef = React.useRef(0);

  React.useEffect(() => {
    setDraft({ sender: '', message: '' });
    setTypingUsers([]);
  }, [childId]);

  React.useEffect(() => {
    if (!childId) {
      setMessages([]);
      setTypingUsers([]);
      return undefined;
    }

    if (!isSupabaseEnabled) {
      try {
        const stored = localStorage.getItem(storageKey);
        const parsed = stored ? JSON.parse(stored) : [];
        const filtered = Array.isArray(parsed)
          ? parsed.filter((item) => item.childId === childId)
          : [];
        setMessages(
          filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        );
      } catch (error) {
        setMessages([]);
      }
      return undefined;
    }

  let isActive = true;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('child_messages')
        .select('id, child_id, sender_name, message, created_at')
        .eq('child_id', childId)
        .order('created_at', { ascending: false });

      if (!isActive) {
        return;
      }

      if (error) {
        setStatus('Unable to load messages right now.');
        return;
      }

      const mapped = (data || []).map((message) => ({
        id: message.id,
        childId: message.child_id,
        sender: message.sender_name || DEFAULT_SENDER,
        message: message.message || '',
        createdAt: message.created_at || '',
      }));

      setMessages(mapped);
      setStatus('');
    };

    fetchMessages();

    const channel = supabase
      .channel(`child-messages-${childId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'child_messages', filter: `child_id=eq.${childId}` },
        (payload) => {
          const incoming = payload.new;
          setMessages((prev) => {
            if (prev.some((item) => item.id === incoming.id)) {
              return prev;
            }
            return [
              {
                id: incoming.id,
                childId: incoming.child_id,
                sender: incoming.sender_name || DEFAULT_SENDER,
                message: incoming.message || '',
                createdAt: incoming.created_at || '',
              },
              ...prev,
            ];
          });
        }
      )
      .subscribe();

    const typingChannel = supabase
      .channel(`child-messages-typing-${childId}`, {
        config: {
          broadcast: { self: false },
        },
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        const sender = payload?.payload?.sender;
        if (!sender) {
          return;
        }
        setTypingUsers((prev) => {
          const filtered = prev.filter((user) => user.sender !== sender);
          return [...filtered, { sender, timestamp: Date.now() }];
        });
      })
      .subscribe();

    typingChannelRef.current = typingChannel;

    const interval = setInterval(() => {
      setTypingUsers((prev) =>
        prev.filter((user) => Date.now() - user.timestamp < TYPING_EXPIRY_MS)
      );
    }, 1000);

    return () => {
      isActive = false;
      supabase.removeChannel(channel);
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
      }
      typingChannelRef.current = null;
      clearInterval(interval);
    };
  }, [childId, isSupabaseEnabled, supabase, storageKey]);

  const broadcastTyping = () => {
    if (!isSupabaseEnabled || !typingChannelRef.current) {
      return;
    }
    const now = Date.now();
    if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) {
      return;
    }
    lastTypingSentRef.current = now;
    const senderName = draft.sender.trim() || defaultSender || DEFAULT_SENDER;
    typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { sender: senderName },
    });
  };

  const sendMessage = async () => {
    if (!childId) {
      return { success: false };
    }
    const trimmedMessage = draft.message.trim();
    if (!trimmedMessage) {
      setStatus('Please enter a message before sending.');
      return { success: false };
    }

  const senderName = draft.sender.trim() || defaultSender || DEFAULT_SENDER;
    setIsSending(true);
    setStatus('');

    if (isSupabaseEnabled) {
      const { error } = await supabase
        .from('child_messages')
        .insert({
          child_id: childId,
          sender_name: senderName,
          message: trimmedMessage,
        });

      if (error) {
        setIsSending(false);
        setStatus('Unable to send message right now.');
        return { success: false };
      }

      setIsSending(false);
      setDraft({ sender: '', message: '' });
      setTypingUsers([]);
      return { success: true };
    }

    try {
      const stored = localStorage.getItem(storageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      const baseMessages = Array.isArray(parsed) ? parsed : [];
      const newMessage = {
        id: createLocalId(),
        childId,
        sender: senderName,
        message: trimmedMessage,
        createdAt: new Date().toISOString(),
      };
      const updated = [newMessage, ...baseMessages];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setMessages((prev) => [newMessage, ...prev]);
  setDraft({ sender: '', message: '' });
  setTypingUsers([]);
      setIsSending(false);
      return { success: true };
    } catch (error) {
      setIsSending(false);
      setStatus('Unable to save message locally.');
      return { success: false };
    }
  };

  return {
    messages,
    status,
    draft,
    setDraft,
    sendMessage,
    isSending,
    typingUsers,
    broadcastTyping,
  };
};

export default useChildMessages;
