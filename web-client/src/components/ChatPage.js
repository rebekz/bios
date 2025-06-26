import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMatrix } from '../App';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import Markdown from 'markdown-to-jsx';

const ChatPage = () => {
  const { client, user, logout } = useMatrix();
  
  // Add immediate debugging
  console.warn('🔥 ChatPage rendered, client:', client ? 'Available' : 'Null', 'user:', user?.user_id);
  
  const [rooms, setRooms] = useState([]);
  const [joinedPublicRooms, setJoinedPublicRooms] = useState([]);
  const [joinedPrivateRooms, setJoinedPrivateRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewRoomModal, setShowNewRoomModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPublicRoomsModal, setShowPublicRoomsModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomTopic, setNewRoomTopic] = useState('');
  const [newRoomType, setNewRoomType] = useState('private');
  const [includeAIBot, setIncludeAIBot] = useState(true);
  const [inviteUsername, setInviteUsername] = useState('');
  const [publicRooms, setPublicRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const messagesEndRef = useRef(null);
  const workingClientRef = useRef(null);

  // AI Bot configuration
  const AI_BOT_USERNAME = '@aibot:localhost';

  // Helper function to get the working Matrix client
  const getWorkingClient = () => {
    return workingClientRef.current || client;
  };

  // Helper function to determine if a room is public
  const isPublicRoom = useCallback((room) => {
    const joinRule = room.getJoinRule();
    return joinRule === 'public';
  }, []);

  // Helper function to get room type for display
  const getRoomType = useCallback((room) => {
    if (isPublicRoom(room)) return 'public';
    return 'private';
  }, [isPublicRoom]);

  // Helper function to check if AI bot is in a room
  const hasAIBot = (room) => {
    if (!room) return false;
    const members = room.getJoinedMembers();
    return members.some(member => member.userId === AI_BOT_USERNAME);
  };

  // Helper function to invite AI bot to a room
  const inviteAIBot = async (roomId) => {
    try {
      const workingClient = getWorkingClient();
      if (!workingClient) {
        throw new Error('No Matrix client available');
      }
      
      await workingClient.invite(roomId, AI_BOT_USERNAME);
      toast.success('AI Bot invited to the session!');
      
      // Update room list to reflect changes
      setTimeout(() => {
        const allRooms = workingClient.getRooms();
        const { roomsList, publicRoomsList, privateRoomsList } = categorizeRooms(allRooms);
        setRooms(roomsList);
        setJoinedPublicRooms(publicRoomsList);
        setJoinedPrivateRooms(privateRoomsList);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to invite AI bot:', error);
      if (error.message.includes('already in the room')) {
        toast.info('AI Bot is already in this session');
      } else {
        toast.error('Failed to invite AI Bot: ' + (error.message || 'Unknown error'));
      }
    }
  };

  // Enhanced room categorization
  const categorizeRooms = useCallback((allRooms) => {
    const roomsList = [];
    const publicRoomsList = [];
    const privateRoomsList = [];
    
    allRooms.forEach(room => {
      const roomType = getRoomType(room);
      
      switch (roomType) {
        case 'public':
          publicRoomsList.push(room);
          roomsList.push(room); // Also add to general rooms list
          break;
        case 'private':
          privateRoomsList.push(room);
          roomsList.push(room); // Also add to general rooms list
          break;
        default:
          // Unknown room type, add to general rooms list
          roomsList.push(room);
          break;
      }
    });
    
    // Sort rooms by activity (most recent first)
    const sortByActivity = (a, b) => {
      const aLastEvent = a.getLastLiveEvent();
      const bLastEvent = b.getLastLiveEvent();
      const aTime = aLastEvent ? aLastEvent.getTs() : 0;
      const bTime = bLastEvent ? bLastEvent.getTs() : 0;
      return bTime - aTime;
    };
    
    roomsList.sort(sortByActivity);
    publicRoomsList.sort(sortByActivity);
    privateRoomsList.sort(sortByActivity);
    
    return { roomsList, publicRoomsList, privateRoomsList };
  }, [getRoomType]); // Include getRoomType dependency

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize rooms and event listeners
  useEffect(() => {
    console.warn('🔥 ChatPage useEffect called, client:', client ? 'Available' : 'Null');
    
    // If no client from context, try to create one manually
    let workingClient = client;
    
    if (!client) {
      console.warn('🔥 No client from context, creating manual client...');
      
      const accessToken = localStorage.getItem('matrix_access_token');
      const userId = localStorage.getItem('matrix_user_id');
      const deviceId = localStorage.getItem('matrix_device_id');
      
      if (accessToken && userId && deviceId && window.matrixcs) {
        try {
          workingClient = window.matrixcs.createClient({
            baseUrl: 'http://localhost:8008',
            accessToken: accessToken,
            userId: userId,
            deviceId: deviceId,
            store: new window.matrixcs.MemoryStore(),
            scheduler: new window.matrixcs.MatrixScheduler(),
          });
          
          console.warn('🔥 Manual client created successfully');
          workingClient.startClient();
          
          // Expose globally for debugging
          window.matrixClient = workingClient;
        } catch (error) {
          console.warn('❌ Failed to create manual client:', error);
          return;
        }
      } else {
        console.warn('🔥 No credentials or Matrix SDK available, returning early');
        return;
      }
    }
    
    if (!workingClient) {
      console.warn('🔥 No working client available, returning early');
      return;
    }
    
    // Store working client in ref for access by other functions
    workingClientRef.current = workingClient;

    const initializeRooms = async () => {
      try {
        console.log('Starting initializeRooms...');
        setIsLoading(true);
        
        // Expose client globally for debugging
        window.matrixClient = workingClient;
        console.warn('🔥 Matrix client exposed to window, total rooms:', workingClient.getRooms().length);
        
        // Check if client is already synced
        if (workingClient.getSyncState() === 'SYNCING' || workingClient.getSyncState() === 'PREPARED') {
          // Client is already synced, get rooms immediately
          const joinedRooms = workingClient.getRooms();
          console.log('Client already synced. Total rooms:', joinedRooms.length);
          
          const { roomsList, publicRoomsList, privateRoomsList } = categorizeRooms(joinedRooms);
          setRooms(roomsList);
          setJoinedPublicRooms(publicRoomsList);
          setJoinedPrivateRooms(privateRoomsList);
          
          console.log('Initial categorization - Total Rooms:', roomsList.length, 'Public:', publicRoomsList.length, 'Private:', privateRoomsList.length);
          
          // Auto-select first room if available (prefer public rooms)
          if (publicRoomsList.length > 0 && !currentRoom) {
            setCurrentRoom(publicRoomsList[0]);
          } else if (privateRoomsList.length > 0 && !currentRoom) {
            setCurrentRoom(privateRoomsList[0]);
          }
        } else {
          console.log('Client not synced yet, waiting for sync...');
          // Wait for sync to complete
          const onSync = (state) => {
            console.log('Sync state changed to:', state);
            if (state === 'PREPARED') {
              workingClient.removeListener('sync', onSync);
              
              const joinedRooms = workingClient.getRooms();
              console.log('Sync completed. Total rooms:', joinedRooms.length);
              
              const { roomsList, publicRoomsList, privateRoomsList } = categorizeRooms(joinedRooms);
              setRooms(roomsList);
              setJoinedPublicRooms(publicRoomsList);
              setJoinedPrivateRooms(privateRoomsList);
              
              console.log('After sync categorization - Total Rooms:', roomsList.length, 'Public:', publicRoomsList.length, 'Private:', privateRoomsList.length);
              
              // Auto-select first room if available (prefer public rooms)
              if (publicRoomsList.length > 0 && !currentRoom) {
                setCurrentRoom(publicRoomsList[0]);
              } else if (privateRoomsList.length > 0 && !currentRoom) {
                setCurrentRoom(privateRoomsList[0]);
              } else if (roomsList.length > 0 && !currentRoom) {
                setCurrentRoom(roomsList[0]);
              }
            }
          };
          
          workingClient.on('sync', onSync);
          
          // Timeout fallback
          setTimeout(() => {
            workingClient.removeListener('sync', onSync);
            const roomsNow = workingClient.getRooms();
            if (roomsNow.length > 0) {
              const { roomsList, publicRoomsList, privateRoomsList } = categorizeRooms(roomsNow);
              setRooms(roomsList);
              setJoinedPublicRooms(publicRoomsList);
              setJoinedPrivateRooms(privateRoomsList);
              console.log('Timeout fallback - setting rooms:', roomsList.length);
            }
          }, 10000);
        }
      } catch (error) {
        console.error('Failed to initialize rooms:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRooms();

    // Set up real-time message event listener
    const onRoomTimeline = (event, room, toStartOfTimeline, removed, data) => {
      // Only handle new messages (not historical), and only message events
      if (toStartOfTimeline || removed || event.getType() !== 'm.room.message') {
        return;
      }

      // If we're currently viewing this room, update messages
      if (currentRoom && room.roomId === currentRoom.roomId) {
        const newMessage = {
          id: event.getId(),
          sender: event.getSender(),
          content: event.getContent().body,
          timestamp: event.getTs(),
          isOwn: event.getSender() === user?.user_id
        };

        // Add the new message to the messages list
        setMessages(prevMessages => [...prevMessages, newMessage]);
      }

      // Update the room list to reflect the new last message
      const allRooms = workingClient.getRooms();
      const { roomsList, publicRoomsList, privateRoomsList } = categorizeRooms(allRooms);
      setRooms(roomsList);
      setJoinedPublicRooms(publicRoomsList);
      setJoinedPrivateRooms(privateRoomsList);
    };

    // Add the event listener
    workingClient.on('Room.timeline', onRoomTimeline);

    // Set up room membership event listener for when rooms are joined/left
    const onRoomMembershipUpdate = () => {
      const allRooms = workingClient.getRooms();
      const { roomsList, publicRoomsList, privateRoomsList } = categorizeRooms(allRooms);
      setRooms(roomsList);
      setJoinedPublicRooms(publicRoomsList);
      setJoinedPrivateRooms(privateRoomsList);
      console.log('Session membership updated - Total Sessions:', roomsList.length);
    };

    // Listen for room membership changes
    workingClient.on('Room', onRoomMembershipUpdate);

    // Cleanup: remove event listeners on unmount or when client changes
    return () => {
      if (workingClient) {
        workingClient.removeListener('Room.timeline', onRoomTimeline);
        workingClient.removeListener('Room', onRoomMembershipUpdate);
      }
    };
  }, [client, currentRoom, user, categorizeRooms]);

  // Load messages for a room
  const loadMessages = (room) => {
    try {
      const roomMessages = room.getLiveTimeline().getEvents();
      const parsedMessages = roomMessages
        .filter(event => event.getType() === 'm.room.message')
        .map(event => ({
          id: event.getId(),
          sender: event.getSender(),
          content: event.getContent().body,
          timestamp: event.getTs(),
          isOwn: event.getSender() === user.user_id
        }))
        .slice(-50); // Show last 50 messages

      setMessages(parsedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    }
  };

  // Handle room selection
  const selectRoom = (room) => {
    setCurrentRoom(room);
    loadMessages(room);
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentRoom) return;

    try {
      setIsLoading(true);
      
      const workingClient = getWorkingClient();
      if (!workingClient) {
        throw new Error('No Matrix client available');
      }
      
      await workingClient.sendTextMessage(currentRoom.roomId, newMessage.trim());
      setNewMessage('');
      
      // Messages will be updated automatically via the Room.timeline event listener
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Create session
  // Open create session modal
  const openCreateRoomModal = () => {
    setShowNewRoomModal(true);
    setNewRoomName('');
    setNewRoomTopic('');
    setNewRoomType('private');
    setIncludeAIBot(true); // Default to including AI bot for public sessions
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) {
      toast.error('Please enter a session name');
      return;
    }

    try {
      setIsLoading(true);
      
      const workingClient = getWorkingClient();
      if (!workingClient) {
        throw new Error('No Matrix client available');
      }
      
      const roomConfig = {
        name: newRoomName.trim(),
        topic: newRoomTopic.trim() || undefined,
        visibility: newRoomType,
        preset: newRoomType === 'public' ? 'public_chat' : 'private_chat',
        room_alias_name: newRoomType === 'public' && newRoomName.trim() 
          ? newRoomName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') 
          : undefined,
      };
      
      const createResponse = await workingClient.createRoom(roomConfig);
      
      // Invite AI bot if requested and it's a public room
      if (newRoomType === 'public' && includeAIBot) {
        try {
          await inviteAIBot(createResponse.room_id);
        } catch (error) {
          console.warn('Failed to invite AI bot to new room:', error);
          // Don't fail the room creation if AI bot invitation fails
        }
      }
      
      setShowNewRoomModal(false);
      setNewRoomName('');
      setNewRoomTopic('');
      setNewRoomType('private');
      setIncludeAIBot(true);
      toast.success('Session created successfully!');
      
      // The session list will be updated automatically via the Room event listener
      // Auto-select the newly created session after a brief delay
      setTimeout(() => {
        const newRoom = workingClient.getRoom(createResponse.room_id);
        if (newRoom) {
          setCurrentRoom(newRoom);
        }
      }, 500);
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create session: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Get user avatar initials
  const getAvatarInitials = (userId) => {
    const username = userId.split(':')[0].substring(1);
    return username.substring(0, 2).toUpperCase();
  };

  // Browse public sessions with search
  const browsePublicRooms = async () => {
    try {
      setIsLoading(true);
      setShowPublicRoomsModal(true);
      
      const workingClient = getWorkingClient();
      if (!workingClient) {
        throw new Error('No Matrix client available');
      }
      
      const response = await workingClient.publicRooms();
      setPublicRooms(response.chunk || []);
    } catch (error) {
      console.error('Failed to browse public sessions:', error);
      toast.error('Failed to load public sessions');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter public sessions based on search query
  const filteredPublicRooms = publicRooms.filter(room => {
    const roomName = room.name || room.canonical_alias || 'Unnamed Room';
    const roomTopic = room.topic || '';
    const query = searchQuery.toLowerCase();
    return roomName.toLowerCase().includes(query) || roomTopic.toLowerCase().includes(query);
  });

  // Join a public session
  const joinRoom = async (roomId, roomAlias) => {
    try {
      setIsLoading(true);
      
      const workingClient = getWorkingClient();
      if (!workingClient) {
        throw new Error('No Matrix client available');
      }
      
      const joinedRoom = await workingClient.joinRoom(roomAlias || roomId);
      
      toast.success('Successfully joined session!');
      setShowPublicRoomsModal(false);
      setSearchQuery('');
      
      // The session list will be updated automatically via the Room event listener
      // Auto-select the newly joined session after a brief delay
      setTimeout(() => {
        const newRoom = workingClient.getRoom(joinedRoom.room_id || roomId);
        if (newRoom) {
          setCurrentRoom(newRoom);
          console.log('Auto-selected newly joined session:', newRoom.name || newRoom.roomId);
        }
      }, 500);
    } catch (error) {
      console.error('Failed to join session:', error);
      toast.error('Failed to join session: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Invite user to current session with modal
  const openInviteModal = () => {
    if (!currentRoom) {
      toast.error('Please select a session first');
      return;
    }
    setShowInviteModal(true);
    setInviteUsername('');
  };

  const inviteUser = async () => {
    if (!currentRoom) {
      toast.error('Please select a session first');
      return;
    }

    if (!inviteUsername.trim()) {
      toast.error('Please enter a username');
      return;
    }

    const fullUserId = inviteUsername.startsWith('@') ? inviteUsername : `@${inviteUsername}:localhost`;

    try {
      setIsLoading(true);
      
      const workingClient = getWorkingClient();
      if (!workingClient) {
        throw new Error('No Matrix client available');
      }
      
      await workingClient.invite(currentRoom.roomId, fullUserId);
      
      toast.success(`Successfully invited ${inviteUsername} to the session!`);
      setShowInviteModal(false);
      setInviteUsername('');
    } catch (error) {
      console.error('Failed to invite user:', error);
      toast.error('Failed to invite user: ' + (error.message || 'User not found'));
    } finally {
      setIsLoading(false);
    }
  };

  // Delete/Leave session functions
  const openDeleteModal = (room) => {
    setSessionToDelete(room);
    setShowDeleteModal(true);
  };

  const deleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      setIsLoading(true);
      
      const workingClient = getWorkingClient();
      if (!workingClient) {
        throw new Error('No Matrix client available');
      }

      // Leave the room (this effectively deletes it for the user)
      await workingClient.leave(sessionToDelete.roomId);

      // If this was the current session, clear it
      if (currentRoom && currentRoom.roomId === sessionToDelete.roomId) {
        setCurrentRoom(null);
        setMessages([]);
      }

      toast.success('Successfully left session!');
      setShowDeleteModal(false);
      setSessionToDelete(null);

      // The session list will be updated automatically via the Room event listener
    } catch (error) {
      console.error('Failed to leave session:', error);
      toast.error('Failed to leave session: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  // Parse message content with markdown support and make links clickable
  const parseMessageContent = (content) => {
    if (!content) return content;
    
    // Custom markdown options with link security
    const markdownOptions = {
      overrides: {
        a: {
          props: {
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'message-link',
            onClick: (e) => e.stopPropagation()
          }
        },
        code: {
          props: {
            className: 'message-code'
          }
        },
        pre: {
          props: {
            className: 'message-code-block'
          }
        },
        blockquote: {
          props: {
            className: 'message-blockquote'
          }
        }
      }
    };
    
    try {
      return (
        <Markdown options={markdownOptions}>
          {content}
        </Markdown>
      );
    } catch (error) {
      // Fallback to plain text with links if markdown parsing fails
      console.warn('Markdown parsing failed, falling back to link parsing:', error);
      return parseMessageWithLinks(content);
    }
  };

  // Fallback function for link parsing only (kept for error cases)
  const parseMessageWithLinks = (content) => {
    if (!content) return content;
    
    // URL regex pattern to detect http/https links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Split the content by URLs and create clickable links
    const parts = content.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="message-link"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
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

        {/* Header */}
        <div className="rooms-header">
          <span className="tab-icon">🏠</span>
          <span className="tab-label">Sessions</span>
          <span className="tab-count">
            ({rooms.length}
            {joinedPublicRooms.length > 0 && joinedPrivateRooms.length > 0 && 
              `: ${joinedPublicRooms.length} public, ${joinedPrivateRooms.length} private`
            })
          </span>
        </div>

        {/* Sessions Section */}
        <div className="content-section">
          <div className="section-header">
            <h3 className="section-title">Sessions</h3>
          </div>
          
          <div className="item-list">
            {rooms.length === 0 ? (
              <div className="empty-section">
                <div className="empty-icon">🏠</div>
                <p>No sessions yet</p>
                <small>Create or join a session to get started</small>
              </div>
            ) : (
              <>
                {/* Public Sessions Section */}
                {joinedPublicRooms.length > 0 && (
                  <div className="room-category">
                    <div className="category-header">
                      <span className="category-icon">🌍</span>
                      <span className="category-title">Public Sessions</span>
                      <span className="category-count">({joinedPublicRooms.length})</span>
                    </div>
                    {joinedPublicRooms.map((room) => {
                      const lastEvent = room.getLastLiveEvent();
                      const lastMessage = lastEvent?.getType() === 'm.room.message' 
                        ? lastEvent.getContent().body 
                        : 'No messages yet';

                      return (
                        <div
                          key={room.roomId}
                          className={`item public-room ${currentRoom?.roomId === room.roomId ? 'active' : ''}`}
                          onClick={() => selectRoom(room)}
                        >
                          <div className="item-avatar room-avatar public">
                            <span className="avatar-icon">🌍</span>
                          </div>
                          <div className="item-content">
                            <div className="item-name">
                              {room.name || 'Unnamed Public Session'}
                              <span className="room-type-badge public">Public</span>
                              {hasAIBot(room) && (
                                <span className="ai-bot-badge" title="AI Bot is present">🤖</span>
                              )}
                            </div>
                            <div className="item-last-message">
                              {lastMessage}
                            </div>
                          </div>
                          <div className="item-status">
                            <div className="member-count">
                              👥 {room.getJoinedMembers().length}
                            </div>
                            {!hasAIBot(room) && isPublicRoom(room) && (
                              <button
                                className="invite-ai-bot-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  inviteAIBot(room.roomId);
                                }}
                                title="Invite AI Bot to this session"
                                disabled={isLoading}
                              >
                                🤖+
                              </button>
                            )}
                            <button
                              className="delete-session-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(room);
                              }}
                              title="Leave session"
                              disabled={isLoading}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Private Sessions Section */}
                {joinedPrivateRooms.length > 0 && (
                  <div className="room-category">
                    <div className="category-header">
                      <span className="category-icon">🔒</span>
                      <span className="category-title">Private Sessions</span>
                      <span className="category-count">({joinedPrivateRooms.length})</span>
                    </div>
                    {joinedPrivateRooms.map((room) => {
                      const lastEvent = room.getLastLiveEvent();
                      const lastMessage = lastEvent?.getType() === 'm.room.message' 
                        ? lastEvent.getContent().body 
                        : 'No messages yet';

                      return (
                        <div
                          key={room.roomId}
                          className={`item private-room ${currentRoom?.roomId === room.roomId ? 'active' : ''}`}
                          onClick={() => selectRoom(room)}
                        >
                          <div className="item-avatar room-avatar private">
                            <span className="avatar-icon">🔒</span>
                          </div>
                          <div className="item-content">
                            <div className="item-name">
                              {room.name || 'Unnamed Private Session'}
                              <span className="room-type-badge private">Private</span>
                              {hasAIBot(room) && (
                                <span className="ai-bot-badge" title="AI Bot is present">🤖</span>
                              )}
                            </div>
                            <div className="item-last-message">
                              {lastMessage}
                            </div>
                          </div>
                          <div className="item-status">
                            <div className="member-count">
                              👥 {room.getJoinedMembers().length}
                            </div>
                            <button
                              className="delete-session-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(room);
                              }}
                              title="Leave session"
                              disabled={isLoading}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Session Actions */}
          <div className="section-actions">
            <button 
              className="action-button primary" 
              onClick={openCreateRoomModal}
              disabled={isLoading}
              title="Create a new session"
            >
              <span className="button-icon">➕</span>
              <span className="button-text">Create Session</span>
            </button>
            
            <button 
              className="action-button secondary" 
              onClick={browsePublicRooms}
              disabled={isLoading}
            >
              🔍 Browse Public Sessions
            </button>

            <button 
              className="action-button tertiary" 
              onClick={openInviteModal}
              disabled={isLoading || !currentRoom}
              title={currentRoom ? "Invite user to current session" : "Select a session first"}
            >
              <span className="button-icon">👥</span>
              <span className="button-text">{isLoading ? 'Inviting...' : 'Invite User'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main">
        {currentRoom ? (
          <>
            {/* Chat Header */}
            <div className="chat-room-header">
              <div className="chat-header-content">
                <div className="chat-header-avatar">
                  <span className="header-avatar room-avatar">
                    🏠
                  </span>
                </div>
                <div className="chat-header-info">
                  <h2 className="chat-room-title">
                    {currentRoom.name || 'Unnamed Session'}
                  </h2>
                  <div className="chat-header-subtitle">
                    <span className="room-status">
                      Session • {currentRoom.getJoinedMembers().length} members
                    </span>
                  </div>
                </div>
              </div>
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
                          {parseMessageContent(message.content)}
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
                  placeholder="Type your message... (Supports **bold**, *italic*, `code`, > quotes, and more markdown)"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
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
            <div className="empty-state-title">No session selected</div>
            <div className="empty-state-description">
              Select a session from the sidebar to start chatting
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Session Browser Modal */}
      {showPublicRoomsModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">
                <span className="modal-icon">🏠</span>
                Browse Public Sessions
              </h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowPublicRoomsModal(false);
                  setSearchQuery('');
                }}
                title="Close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              {/* Search Bar */}
              <div className="search-container">
                <div className="search-input-wrapper">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search sessions by name or topic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button 
                      className="search-clear"
                      onClick={() => setSearchQuery('')}
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Session List */}
              <div className="room-browser-content">
                {isLoading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading public sessions...</p>
                  </div>
                ) : filteredPublicRooms.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      {searchQuery ? '🔍' : '🏠'}
                    </div>
                    <h3>
                      {searchQuery ? 'No sessions found' : 'No public sessions available'}
                    </h3>
                    <p>
                      {searchQuery 
                        ? `No sessions match "${searchQuery}". Try a different search term.`
                        : 'Create the first public session to get started!'
                      }
                    </p>
                    {searchQuery && (
                      <button 
                        className="clear-search-btn"
                        onClick={() => setSearchQuery('')}
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="rooms-grid">
                    {filteredPublicRooms.map((room) => (
                      <div key={room.room_id} className="room-card">
                        <div className="room-card-header">
                          <h4 className="room-card-title">
                            {room.name || room.canonical_alias || 'Unnamed Session'}
                          </h4>
                          <span className="room-member-count">
                            👥 {room.num_joined_members}
                          </span>
                        </div>
                        
                        {room.topic && (
                          <p className="room-card-topic">
                            {room.topic}
                          </p>
                        )}
                        
                        <div className="room-card-footer">
                          <div className="room-card-info">
                            <span className="room-alias">
                              {room.canonical_alias || room.room_id}
                            </span>
                          </div>
                          <button
                            className="join-room-btn"
                            onClick={() => joinRoom(room.room_id, room.canonical_alias)}
                            disabled={isLoading}
                          >
                            {isLoading ? '⏳' : '➡️'} Join
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <div className="modal-stats">
                {!isLoading && publicRooms.length > 0 && (
                  <span>
                    Showing {filteredPublicRooms.length} of {publicRooms.length} sessions
                    {searchQuery && ` for "${searchQuery}"`}
                  </span>
                )}
              </div>
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowPublicRoomsModal(false);
                  setSearchQuery('');
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Session Modal */}
      {showNewRoomModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">
                <span className="modal-icon">➕</span>
                Create New Session
              </h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowNewRoomModal(false);
                  setNewRoomName('');
                  setNewRoomTopic('');
                  setNewRoomType('private');
                  setIncludeAIBot(true);
                }}
                title="Close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="room-name" className="form-label">
                  Session Name *
                </label>
                <input
                  id="room-name"
                  type="text"
                  className="form-input"
                  placeholder="Enter session name..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && newRoomName.trim()) {
                      e.preventDefault();
                      createRoom();
                    }
                  }}
                  autoFocus
                  maxLength={50}
                />
                <small className="form-help">
                  Choose a descriptive name for your session
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="room-topic" className="form-label">
                  Session Topic <span style={{ color: '#666', fontWeight: 'normal' }}>(optional)</span>
                </label>
                <textarea
                  id="room-topic"
                  className="form-input"
                  placeholder="Describe what this session is about..."
                  value={newRoomTopic}
                  onChange={(e) => setNewRoomTopic(e.target.value)}
                  rows={3}
                  maxLength={200}
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
                <small className="form-help">
                  Optional description to help others understand the session's purpose
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Session Type</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="roomType"
                      value="private"
                      checked={newRoomType === 'private'}
                      onChange={(e) => setNewRoomType(e.target.value)}
                      style={{ margin: 0 }}
                    />
                    <span>🔒 Private</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="roomType"
                      value="public"
                      checked={newRoomType === 'public'}
                      onChange={(e) => setNewRoomType(e.target.value)}
                      style={{ margin: 0 }}
                    />
                    <span>🌍 Public</span>
                  </label>
                </div>
                <small className="form-help">
                  {newRoomType === 'private' 
                    ? 'Only invited users can join this session'
                    : 'Anyone can discover and join this session'
                  }
                </small>
              </div>

              {/* AI Bot inclusion option for public rooms */}
              {newRoomType === 'public' && (
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includeAIBot}
                      onChange={(e) => setIncludeAIBot(e.target.checked)}
                      style={{ margin: 0 }}
                    />
                    <span>🤖 Include AI Bot</span>
                  </label>
                  <small className="form-help">
                    The AI Bot will be automatically invited to join this public session and can assist with conversations
                  </small>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowNewRoomModal(false);
                  setNewRoomName('');
                  setNewRoomTopic('');
                  setNewRoomType('private');
                  setIncludeAIBot(true);
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={createRoom}
                disabled={isLoading || !newRoomName.trim()}
              >
                {isLoading ? '⏳ Creating...' : '➕ Create Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Invite User Modal */}
      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal-container invite-modal">
            <div className="modal-header">
              <h2 className="modal-title">
                <span className="modal-icon">👥</span>
                Invite User to Session
              </h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteUsername('');
                }}
                title="Close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="invite-room-info">
                <h4>Inviting to: <span className="room-name">{currentRoom?.name || 'Unnamed Session'}</span></h4>
                <p className="invite-description">
                  Enter the username of the person you want to invite to this session.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="invite-username" className="form-label">
                  Username
                </label>
                <div className="input-wrapper">
                  <span className="input-prefix">@</span>
                  <input
                    id="invite-username"
                    type="text"
                    className="form-input"
                    placeholder="username"
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        inviteUser();
                      }
                    }}
                    autoFocus
                  />
                  <span className="input-suffix">:localhost</span>
                </div>
                <small className="form-help">
                  Examples: rebekz, test123, alice
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteUsername('');
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={inviteUser}
                disabled={isLoading || !inviteUsername.trim()}
              >
                {isLoading ? '⏳ Inviting...' : '📨 Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Session Confirmation Modal */}
      {showDeleteModal && sessionToDelete && (
        <div className="modal-overlay">
          <div className="modal-container delete-modal">
            <div className="modal-header">
              <h2 className="modal-title">
                <span className="modal-icon">⚠️</span>
                Leave Session
              </h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSessionToDelete(null);
                }}
                title="Close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-confirmation">
                <p className="delete-message">
                  Are you sure you want to leave this session?
                </p>
                <div className="session-info">
                  <h4 className="session-name">
                    {sessionToDelete.name || 'Unnamed Session'}
                  </h4>
                  <p className="session-details">
                    {isPublicRoom(sessionToDelete) ? '🌍 Public Session' : '🔒 Private Session'} • 
                    {sessionToDelete.getJoinedMembers().length} members
                  </p>
                </div>
                <div className="warning-text">
                  <p>
                    <strong>Note:</strong> You will no longer receive messages from this session. 
                    {isPublicRoom(sessionToDelete) 
                      ? ' You can rejoin later from the public sessions list.'
                      : ' You will need to be invited again to rejoin this private session.'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSessionToDelete(null);
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                className="btn-danger"
                onClick={deleteSession}
                disabled={isLoading}
              >
                {isLoading ? '⏳ Leaving...' : '🚪 Leave Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;