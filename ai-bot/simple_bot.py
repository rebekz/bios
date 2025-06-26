#!/usr/bin/env python3
"""
Simple Matrix AI Bot - Uses regular user authentication
"""

import asyncio
import logging
import re
from datetime import datetime

from nio import AsyncClient, MatrixRoom, RoomMessageText, LoginResponse, InviteMemberEvent

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Changed to DEBUG for more verbose logging
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SimpleMatrixBot:
    def __init__(self):
        self.homeserver = "http://synapse:8008"
        self.username = "aibot"
        self.password = "aibot_password"
        self.access_token = "syt_YWlib3Q_RsYZdjZoVkCZFOthiVnh_42Ca5J"  # Use the generated access token
        self.client = None
        
    async def setup_client(self):
        """Setup and login Matrix client"""
        self.client = AsyncClient(self.homeserver, f"@{self.username}:localhost")
        
        # Try using access token first, fallback to password
        try:
            # Set the access token directly
            self.client.access_token = self.access_token
            self.client.user_id = f"@{self.username}:localhost"
            
            # Test the token by making a whoami request
            response = await self.client.whoami()
            if hasattr(response, 'user_id'):
                logger.info(f"Using access token authentication as {response.user_id}")
            else:
                raise Exception("Access token invalid, falling back to password")
                
        except Exception as e:
            logger.warning(f"Access token failed ({e}), trying password authentication")
            # Fallback to password login
            response = await self.client.login(self.password)
            
            if not isinstance(response, LoginResponse):
                logger.error(f"Failed to login: {response}")
                return False
            
            logger.info(f"Logged in with password as {self.client.user_id}")
        
        # Add event callbacks
        self.client.add_event_callback(self.message_callback, RoomMessageText)
        self.client.add_event_callback(self.invitation_callback, InviteMemberEvent)
        
        # Add a generic event callback to see all events
        self.client.add_event_callback(self.debug_event_callback, (RoomMessageText, InviteMemberEvent))
        
        logger.info(f"Bot setup complete as {self.client.user_id}")
        return True
    
    async def debug_event_callback(self, room, event):
        """Debug callback to log all events"""
        logger.debug(f"Received event: {type(event).__name__} in room {room.room_id if room else 'unknown'}")
        logger.debug(f"Event details: {event}")
    
    async def invitation_callback(self, room: MatrixRoom, event: InviteMemberEvent):
        """Handle room invitations"""
        try:
            logger.info(f"Invitation callback triggered for event: {event}")
            # Check if the bot is being invited
            if event.state_key == self.client.user_id:
                logger.info(f"Received invitation to room {room.room_id} from {event.sender}")
                
                # Auto-accept the invitation
                response = await self.client.join(room.room_id)
                if hasattr(response, 'room_id'):
                    logger.info(f"Successfully joined room {room.room_id}")
                    
                    # Send a greeting message
                    await asyncio.sleep(2)  # Wait a bit before sending message
                    await self.client.room_send(
                        room_id=room.room_id,
                        message_type="m.room.message",
                        content={
                            "msgtype": "m.text",
                            "body": "🤖 Hello! I'm your AI Agent. I've joined this room and I'm ready to help! Mention @aibot in your messages to interact with me."
                        }
                    )
                else:
                    logger.error(f"Failed to join room {room.room_id}: {response}")
            else:
                logger.debug(f"Invitation not for bot (state_key: {event.state_key}, bot: {self.client.user_id})")
                    
        except Exception as e:
            logger.error(f"Error handling invitation: {e}")
    
    async def message_callback(self, room: MatrixRoom, event: RoomMessageText):
        """Handle incoming messages"""
        logger.debug(f"Message callback triggered: {event.body} from {event.sender}")
        
        # Don't respond to own messages
        if event.sender == self.client.user_id:
            logger.debug("Ignoring own message")
            return
            
        # Check if bot is mentioned
        if "@aibot" in event.body.lower() or "aibot" in event.body.lower():
            logger.info(f"Bot mentioned in message: {event.body}")
            await self.respond_to_message(room, event)
        else:
            logger.debug("Bot not mentioned in message")
    
    async def respond_to_message(self, room: MatrixRoom, event: RoomMessageText):
        """Generate and send response"""
        try:
            user_message = event.body
            sender_name = event.sender.split(':')[0][1:]  # Remove @ and domain
            
            logger.info(f"Generating response for: {user_message}")
            
            # Simple responses (replace with LLM later)
            responses = {
                "icd-generator": f"Hello {sender_name}! 👋 Here's your ICD generator link: http://localhost:8089/icd-generator/{room.room_id}",
                #"help": "I'm an AI bot that can help answer questions and have conversations. Just mention @aibot in your message!",
                #"time": f"The current time is {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ⏰",
                #"joke": "Why don't scientists trust atoms? Because they make up everything! 😄",
                #"weather": "I don't have access to weather data yet, but I hope it's nice where you are! ☀️",
                #"default": f"Thanks for your message, {sender_name}! I'm a simple AI bot. I can respond to: hello, help, time, joke, weather. More features coming soon! 🤖"
            }
            
            # Simple keyword matching
            message_lower = user_message.lower()
            response = f"Hi {sender_name}! Here are available AI agents: 'icd-generator' 🤖"
            
            for keyword, reply in responses.items():
                if keyword in message_lower:
                    response = reply
                    break
            
            logger.info(f"Sending response: {response}")
            
            # Send response
            await self.client.room_send(
                room_id=room.room_id,
                message_type="m.room.message",
                content={
                    "msgtype": "m.text",
                    "body": response
                }
            )
            
            logger.info(f"Responded to {sender_name} in {room.display_name}")
            
        except Exception as e:
            logger.error(f"Error responding to message: {e}")
            # Send error message
            await self.client.room_send(
                room_id=room.room_id,
                message_type="m.room.message",
                content={
                    "msgtype": "m.text",
                    "body": "Sorry, I encountered an error processing your message. 🤖"
                }
            )
    
    async def auto_join_public_rooms(self):
        """Automatically join all public rooms on the server"""
        try:
            logger.info("Discovering and joining public rooms...")
            
            # Get list of public rooms
            response = await self.client.room_list(limit=100)
            
            if hasattr(response, 'rooms'):
                public_room_count = 0
                joined_room_count = 0
                
                for room in response.rooms:
                    room_id = room.room_id
                    
                    # Check if room is public (not invite-only)
                    if room.join_rule == "public":
                        public_room_count += 1
                        
                        # Check if we're already in the room
                        if room_id not in self.client.rooms:
                            try:
                                join_response = await self.client.join(room_id)
                                if hasattr(join_response, 'room_id'):
                                    joined_room_count += 1
                                    logger.info(f"Successfully joined public room: {room.name or room_id}")
                                    
                                    # Send a greeting message after joining
                                    await asyncio.sleep(1)  # Small delay to ensure join is processed
                                    await self.client.room_send(
                                        room_id=room_id,
                                        message_type="m.room.message",
                                        content={
                                            "msgtype": "m.text",
                                            "body": "🤖 Hello! I'm the AI Bot. I've automatically joined this public room. Mention @aibot to interact with me!"
                                        }
                                    )
                                else:
                                    logger.warning(f"Failed to join room {room.name or room_id}: {join_response}")
                            except Exception as e:
                                logger.error(f"Error joining room {room.name or room_id}: {e}")
                        else:
                            logger.debug(f"Already in room: {room.name or room_id}")
                
                logger.info(f"Found {public_room_count} public rooms, joined {joined_room_count} new rooms")
                    
            else:
                logger.error(f"Failed to get room list: {response}")
                
        except Exception as e:
            logger.error(f"Error in auto-join public rooms: {e}")
    
    async def run(self):
        """Run the bot"""
        logger.info("Starting Simple Matrix Bot...")
        
        if await self.setup_client():
            logger.info("Bot is ready! Mention @aibot in any room to interact.")
            try:
                # Do an initial sync to get current state
                logger.info("Performing initial sync...")
                sync_response = await self.client.sync(timeout=30000)
                logger.info(f"Initial sync complete. Next batch: {sync_response.next_batch}")
                
                # Check what rooms we're in after initial sync
                rooms = self.client.rooms
                logger.info(f"Bot is currently in {len(rooms)} rooms: {list(rooms.keys())}")
                
                # Auto-join public rooms
                await self.auto_join_public_rooms()
                
                # Start the sync loop
                logger.info("Starting sync loop...")
                await self.client.sync_forever(timeout=30000)
            except Exception as e:
                logger.error(f"Error in sync_forever: {e}")
        else:
            logger.error("Failed to start bot")

async def main():
    bot = SimpleMatrixBot()
    await bot.run()

if __name__ == "__main__":
    asyncio.run(main()) 