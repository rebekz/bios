import React, { useState, useEffect, useRef } from 'react';
import { useMatrix } from '../App';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ChatPage = () => {
  const { client, user, logout } = useMatrix();
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize rooms and event listeners
  useEffect(() => {
    if (!client) return;

    const initializeRooms = async () => {
      try {
        await client.once('sync', (state) => {
          if (state === 'PREPARED') {
            const joinedRooms = client.getRooms();
            setRooms(joinedRooms);
            
            // Auto-select first room if available
            if (joinedRooms.length > 0 && !currentRoom) {
              setCurrentRoom(joinedRooms[0]);
            }
          }
        });

        // Set up event listeners
        client.on('Room.timeline', (event, room, toStartOfTimeline) => {
          if (toStartOfTimeline) return;
          
          // Update messages if it's the current room
          if (currentRoom && room.roomId === currentRoom.roomId) {
            loadMessages(room);
          }
          
          // Update rooms list
          setRooms([...client.getRooms()]);
        });

        client.on('Room', (room) => {
          setRooms([...client.getRooms()]);
        });

      } catch (error) {
        console.error('Failed to initialize rooms:', error);
        toast.error('Failed to load rooms');
      }
    };

    initializeRooms();

    return () => {
      // Cleanup event listeners
      client.removeAllListeners('Room.timeline');
      client.removeAllListeners('Room');
    };
  }, [client, currentRoom]);

  // Load messages for a room
  const loadMessages = (room) => {
    const timeline = room.getLiveTimeline().getEvents();
    const roomMessages = timeline
      .filter(event => event.getType() === 'm.room.message')
      .map(event => ({
        id: event.getId(),
        sender: event.getSender(),
        content: event.getContent().body,
        timestamp: event.getTs(),
        isOwn: event.getSender() === user.user_id
      }));
    
    setMessages(roomMessages);
  };

  // Handle room selection
  const selectRoom = (room) => {
    setCurrentRoom(room);
    loadMessages(room);
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentRoom || isLoading) return;

    try {
      setIsLoading(true);
      
      await client.sendTextMessage(currentRoom.roomId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new room
  const createRoom = async () => {
    const roomName = prompt('Enter room name:');
    if (!roomName) return;

    try {
      setIsLoading(true);
      
      const room = await client.createRoom({
        name: roomName,
        visibility: 'private',
        invite: ['@aibot:localhost'] // Invite AI bot to new rooms
      });
      
      toast.success(`Room "${roomName}" created successfully!`);
    } catch (error) {
      console.error('Failed to create room:', error);
      toast.error('Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  // Get user avatar initials
  const getAvatarInitials = (userId) => {
    const username = userId.split(':')[0].substring(1);
    return username.substring(0, 2).toUpperCase();
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
        {/* User Header */}
        <div className="chat-header">
          <div className="chat-user-info">
            <div className="chat-avatar">
              {getAvatarInitials(user.user_id)}
            </div>
            <div className="chat-username">
              {user.user_id.split(':')[0].substring(1)}
            </div>
            <button className="chat-logout" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {/* Rooms Section */}
        <div className="rooms-section">
          <div className="rooms-header">
            Rooms ({rooms.length})
          </div>
          
          <div className="room-list">
            {rooms.map((room) => {
              const lastEvent = room.getLastLiveEvent();
              const lastMessage = lastEvent?.getType() === 'm.room.message' 
                ? lastEvent.getContent().body 
                : 'No messages yet';

              return (
                <div
                  key={room.roomId}
                  className={`room-item ${currentRoom?.roomId === room.roomId ? 'active' : ''}`}
                  onClick={() => selectRoom(room)}
                >
                  <div className="room-name">
                    {room.name || 'Unnamed Room'}
                  </div>
                  <div className="room-last-message">
                    {lastMessage}
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            className="create-room-button" 
            onClick={createRoom}
            disabled={isLoading}
          >
            {isLoading ? 'Creating...' : '+ Create Room'}
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {currentRoom ? (
          <>
            {/* Room Header */}
            <div className="chat-room-header">
              <h2 className="chat-room-title">
                {currentRoom.name || 'Unnamed Room'}
              </h2>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">💬</div>
                  <div className="empty-state-title">No messages yet</div>
                  <div className="empty-state-description">
                    Start the conversation by sending a message!
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.isOwn ? 'own' : ''}`}
                  >
                    <div className="message-avatar">
                      {getAvatarInitials(message.sender)}
                    </div>
                    <div className="message-content">
                      <div className="message-bubble">
                        <div className="message-sender">
                          {message.sender.split(':')[0].substring(1)}
                        </div>
                        <div className="message-text">
                          {message.content}
                        </div>
                        <div className="message-time">
                          {formatMessageTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="message-input-container">
              <form className="message-input-form" onSubmit={sendMessage}>
                <textarea
                  className="message-input"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="send-button"
                  disabled={isLoading || !newMessage.trim()}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          // No room selected state
          <div className="empty-state">
            <div className="empty-state-icon">🏠</div>
            <div className="empty-state-title">No room selected</div>
            <div className="empty-state-description">
              Select a room from the sidebar to start chatting
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;