// SCREEN_50 — Secure Chat (Closed-Loop)
import React, { useState, useEffect, useRef } from 'react';

interface Message {
  id: string; content: string; isRedacted: boolean; createdAt: string;
  sender: { id: string; firstName: string; lastName: string; profile?: { avatar?: string } };
}

export default function SecureChat({ roomId, currentUserId }: { roomId: string; currentUserId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages?limit=50`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const data = await res.json();
      if (data.success) setMessages(data.messages);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); const iv = setInterval(fetchMessages, 5000); return () => clearInterval(iv); }, [roomId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (data.success) {
        setText('');
        setMessages(prev => [...prev, data.message]);
        if (data.redactionNotice) alert(data.redactionNotice);
      }
    } catch {}
    setSending(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '80vh', maxWidth: 640, margin: '0 auto', background: '#fff', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1e3a5f', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ background: '#10b981', width: 10, height: 10, borderRadius: '50%' }} />
        <div>
          <div style={{ color: '#fff', fontWeight: 700 }}>🔒 Secure Transaction Chat</div>
          <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>All messages are monitored. Contact info sharing is prohibited.</div>
        </div>
      </div>

      {/* Policy Banner */}
      <div style={{ background: '#fef9c3', padding: '0.5rem 1rem', fontSize: '0.75rem', color: '#92400e', textAlign: 'center', borderBottom: '1px solid #fde68a' }}>
        ⚠️ <strong>Closed-Loop Policy:</strong> Phone numbers, emails, and WhatsApp links are automatically redacted.
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: '#f8fafc' }}>
        {loading && <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Loading messages...</div>}
        {messages.map(msg => {
          const isMe = msg.sender.id === currentUserId;
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '75%' }}>
                {!isMe && (
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.25rem', paddingLeft: '0.5rem' }}>
                    {msg.sender.firstName} {msg.sender.lastName}
                  </div>
                )}
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: isMe ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                  background: msg.isRedacted ? '#fee2e2' : isMe ? '#1d4ed8' : '#fff',
                  color: msg.isRedacted ? '#991b1b' : isMe ? '#fff' : '#1e3a5f',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  fontSize: '0.9rem', lineHeight: 1.5,
                }}>
                  {msg.isRedacted && <div style={{ fontSize: '0.7rem', marginBottom: '0.25rem', opacity: 0.8 }}>⚠️ Message redacted by VeriProp policy</div>}
                  {msg.content}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.25rem', textAlign: isMe ? 'right' : 'left', paddingRight: isMe ? 0 : 0 }}>
                  {new Date(msg.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '1rem', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
        <textarea
          value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Type a message... (Shift+Enter for new line)"
          rows={2}
          style={{
            flex: 1, padding: '0.75rem 1rem', border: '2px solid #e2e8f0', borderRadius: '0.75rem',
            resize: 'none', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
          }}
        />
        <button
          onClick={sendMessage} disabled={!text.trim() || sending}
          style={{
            background: text.trim() ? '#1d4ed8' : '#94a3b8', color: '#fff',
            border: 'none', borderRadius: '0.75rem', padding: '0.75rem 1.25rem',
            fontWeight: 700, cursor: text.trim() ? 'pointer' : 'not-allowed', fontSize: '1rem',
          }}
        >
          {sending ? '...' : '➤'}
        </button>
      </div>
    </div>
  );
}
