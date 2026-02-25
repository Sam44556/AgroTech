'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search,
  Send,
  Phone,
  MoreVertical,
  Paperclip,
  ShoppingCart,
  Bell,
  MessageSquare,
  Circle,
  ImageIcon
} from 'lucide-react'
import Link from 'next/link'
import { apiGet } from '@/lib/api'
import { useSocket } from '@/lib/socket-context'

/**
 * EXPLANATION: Interface for Messages from Socket.IO
 */
interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    name: string
    image: string | null
    role: string
  }
}

/**
 * EXPLANATION: Interface for Conversations
 */
interface Conversation {
  id: string
  participants: Array<{
    user: {
      id: string
      name: string
      image: string | null
      role: string
    }
  }>
  messages: Message[]
  updatedAt: string
}

export default function BuyerChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Get Socket.IO connection
  const { socket, isConnected, onlineUsers } = useSocket()

  // Load user session
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await apiGet<{ user: { id: string } }>('/api/me')
        setUserId(response.user?.id || null)
      } catch {
        setUserId(null)
      }
    }
    loadUser()
  }, [])

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true)
      setError('')
      try {
        const response = await apiGet<{ success: boolean; data: Conversation[] }>(
          '/api/buyer/chat/conversations'
        )
        setConversations(response.data || [])
        
        if (response.data && response.data.length > 0) {
          setSelectedConversation(response.data[0].id)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load conversations')
      } finally {
        setIsLoading(false)
      }
    }
    loadConversations()
  }, [])

  // Load messages when conversation selected
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([])
      return
    }

    const selectedConv = conversations.find(c => c.id === selectedConversation)
    if (selectedConv) {
      setMessages(selectedConv.messages || [])
      socket?.emit('join_conversation', selectedConversation)
      socket?.emit('mark_as_read', { conversationId: selectedConversation })
    }

    return () => {
      if (selectedConversation) {
        socket?.emit('leave_conversation', selectedConversation)
      }
    }
  }, [selectedConversation, conversations, socket])

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket) return

    socket.on('new_message', (message: Message) => {
      if (message.conversationId === selectedConversation) {
        setMessages(prev => [...prev, message])
        if (message.senderId !== userId) {
          socket.emit('mark_as_read', { conversationId: selectedConversation })
        }
      }
      
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id === message.conversationId) {
            return {
              ...conv,
              messages: [...conv.messages, message],
              updatedAt: message.createdAt
            }
          }
          return conv
        })
        return updated.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      })
    })

    socket.on('user_typing', (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === selectedConversation) {
        setTypingUsers(prev => new Set(prev).add(data.userId))
      }
    })

    socket.on('user_stopped_typing', (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === selectedConversation) {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
      }
    })

    socket.on('messages_read', (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === selectedConversation) {
        setMessages(prev => prev.map(msg => 
          msg.senderId === userId ? { ...msg, isRead: true } : msg
        ))
      }
    })

    return () => {
      socket.off('new_message')
      socket.off('user_typing')
      socket.off('user_stopped_typing')
      socket.off('messages_read')
    }
  }, [socket, selectedConversation, userId])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const currentConversation = conversations.find(c => c.id === selectedConversation)
  const otherParticipant = currentConversation?.participants.find(p => p.user.id !== userId)?.user

  const filteredConversations = conversations.filter(conv => {
    const other = conv.participants.find(p => p.user.id !== userId)?.user
    return other?.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation || !socket) return

    socket.emit('send_message', {
      conversationId: selectedConversation,
      content: messageInput.trim()
    })

    setMessageInput('')
    socket.emit('stop_typing', { conversationId: selectedConversation })
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value)
    
    if (!socket || !selectedConversation) return

    socket.emit('typing', { conversationId: selectedConversation })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { conversationId: selectedConversation })
    }, 2000)
  }

  const isUserOnline = (userId: string) => onlineUsers.includes(userId)

  const getLastMessage = (conv: Conversation) => {
    const lastMsg = conv.messages[conv.messages.length - 1]
    return lastMsg?.content || 'No messages yet'
  }

  const getUnreadCount = (conv: Conversation) => {
    return conv.messages.filter(msg => 
      msg.senderId !== userId && !msg.isRead
    ).length
  }

  return (
    <div className="min-h-screen bg-gray-50">
    


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
          <p className="text-gray-600">Chat with farmers about their produce</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search conversations..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full">
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading conversations...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No conversations yet</div>
                ) : (
                  filteredConversations.map((conv) => {
                    const other = conv.participants.find(p => p.user.id !== userId)?.user
                    if (!other) return null

                    return (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedConversation === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={other.image || ''} />
                              <AvatarFallback className="bg-green-100 text-green-700">
                                {other.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {isUserOnline(other.id) && (
                              <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900 truncate">{other.name}</p>
                              <span className="text-xs text-gray-500">
                                {new Date(conv.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm text-green-600 truncate capitalize">{other.role.toLowerCase()}</p>
                            <p className="text-sm text-gray-500 truncate">{getLastMessage(conv)}</p>
                          </div>
                          {getUnreadCount(conv) > 0 && (
                            <Badge className="bg-blue-600">{getUnreadCount(conv)}</Badge>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {currentConversation && otherParticipant ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={otherParticipant.image || ''} />
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {otherParticipant.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {isUserOnline(otherParticipant.id) && (
                          <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-green-500 text-green-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{otherParticipant.name}</p>
                        <p className="text-sm text-gray-500">
                          {isUserOnline(otherParticipant.id) ? (
                            <span className="text-green-600">Online</span>
                          ) : (
                            'Offline'
                          )}
                          {' • '}<span className="capitalize">{otherParticipant.role.toLowerCase()}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon">
                        <Phone className="h-5 w-5 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5 text-gray-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwn = message.senderId === userId
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                              <div
                                className={`px-4 py-2 rounded-2xl ${
                                  isOwn
                                    ? 'bg-blue-600 text-white rounded-br-md'
                                    : 'bg-gray-100 text-gray-900 rounded-bl-md'
                                }`}
                              >
                                <p>{message.content}</p>
                              </div>
                              <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : ''}`}>
                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {isOwn && message.isRead && ' • Read'}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                      
                      {/* Typing Indicator */}
                      {typingUsers.size > 0 && (
                        <div className="flex justify-start">
                          <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-md">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon">
                      <Paperclip className="h-5 w-5 text-gray-600" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <ImageIcon className="h-5 w-5 text-gray-600" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={messageInput}
                      onChange={handleTyping}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                      disabled={!isConnected}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      className="bg-blue-600 hover:bg-blue-700"
                      size="icon"
                      disabled={!messageInput.trim() || !isConnected}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-500">Choose a conversation from the list to start chatting</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}