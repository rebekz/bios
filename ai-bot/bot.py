#!/usr/bin/env python3
"""
Matrix AI Bot - Intelligent bot powered by LLM
"""

import os
import asyncio
import logging
import json
import re
from typing import Optional, Dict, Any
from datetime import datetime

import aiohttp
from nio import AsyncClient, MatrixRoom, RoomMessageText, LoginResponse, Event
from flask import Flask, request, jsonify
import threading

from llm_providers import LLMProvider
from config import BotConfig

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class MatrixAIBot:
    def __init__(self, config: BotConfig):
        self.config = config
        self.client = None
        self.llm_provider = LLMProvider(config)
        self.conversation_history = {}
        
        # Flask app for application service
        self.app = Flask(__name__)
        self.setup_routes()
        
    def setup_routes(self):
        """Setup Flask routes for application service"""
        
        @self.app.route('/health', methods=['GET'])
        def health_check():
            return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})
        
        @self.app.route('/_matrix/app/v1/transactions/<transaction_id>', methods=['PUT'])
        def handle_transaction(transaction_id):
            """Handle Matrix application service transactions"""
            try:
                data = request.get_json()
                events = data.get('events', [])
                
                # Process events asynchronously
                asyncio.create_task(self.process_events(events))
                
                return jsonify({})
            except Exception as e:
                logger.error(f"Error handling transaction: {e}")
                return jsonify({"error": str(e)}), 500
    
    async def process_events(self, events):
        """Process Matrix events from application service"""
        for event in events:
            if event.get('type') == 'm.room.message':
                await self.handle_message_event(event)
    
    async def handle_message_event(self, event):
        """Handle incoming message events"""
        try:
            room_id = event.get('room_id')
            sender = event.get('sender')
            content = event.get('content', {})
            message_body = content.get('body', '')
            
            # Don't respond to own messages
            if sender == self.config.matrix_username:
                return
            
            # Check if bot is mentioned or if it's a direct message
            bot_username = self.config.matrix_username.split(':')[0]
            is_mentioned = bot_username in message_body
            
            if is_mentioned or await self.is_direct_message(room_id):
                await self.respond_to_message(room_id, sender, message_body)
                
        except Exception as e:
            logger.error(f"Error handling message event: {e}")
    
    async def is_direct_message(self, room_id: str) -> bool:
        """Check if the room is a direct message"""
        try:
            if not self.client:
                return False
            
            room = self.client.rooms.get(room_id)
            if room:
                # Consider it a DM if there are only 2 members
                return len(room.users) <= 2
            return False
        except Exception as e:
            logger.error(f"Error checking if room is DM: {e}")
            return False
    
    async def respond_to_message(self, room_id: str, sender: str, message: str):
        """Generate and send AI response to a message"""
        try:
            # Get conversation history
            history = self.get_conversation_history(room_id)
            
            # Add user message to history
            history.append({
                "role": "user",
                "content": message,
                "sender": sender,
                "timestamp": datetime.now().isoformat()
            })
            
            # Generate AI response
            response = await self.llm_provider.generate_response(message, history)
            
            if response:
                # Send response to Matrix room
                await self.send_message(room_id, response)
                
                # Add bot response to history
                history.append({
                    "role": "assistant",
                    "content": response,
                    "sender": self.config.matrix_username,
                    "timestamp": datetime.now().isoformat()
                })
                
                # Update conversation history
                self.update_conversation_history(room_id, history)
            
        except Exception as e:
            logger.error(f"Error responding to message: {e}")
            await self.send_message(room_id, "I'm sorry, I encountered an error processing your message. 🤖")
    
    def get_conversation_history(self, room_id: str) -> list:
        """Get conversation history for a room"""
        if room_id not in self.conversation_history:
            self.conversation_history[room_id] = []
        
        # Keep only last 20 messages to avoid token limits
        return self.conversation_history[room_id][-20:]
    
    def update_conversation_history(self, room_id: str, history: list):
        """Update conversation history for a room"""
        self.conversation_history[room_id] = history[-20:]  # Keep last 20 messages
    
    async def send_message(self, room_id: str, message: str):
        """Send a message to a Matrix room"""
        try:
            if self.client:
                await self.client.room_send(
                    room_id=room_id,
                    message_type="m.room.message",
                    content={
                        "msgtype": "m.text",
                        "body": message
                    }
                )
                logger.info(f"Sent message to room {room_id}: {message[:50]}...")
        except Exception as e:
            logger.error(f"Error sending message: {e}")
    
    async def setup_matrix_client(self):
        """Setup and login Matrix client"""
        try:
            self.client = AsyncClient(
                homeserver=self.config.matrix_server_url,
                user=self.config.matrix_username
            )
            
            # Login
            login_response = await self.client.login(
                password=self.config.matrix_password
            )
            
            if isinstance(login_response, LoginResponse):
                logger.info(f"Successfully logged in as {self.config.matrix_username}")
                
                # Set up event callbacks
                self.client.add_event_callback(self.message_callback, RoomMessageText)
                
                # Start syncing
                await self.client.sync_forever(timeout=30000)
            else:
                logger.error(f"Failed to login: {login_response}")
                
        except Exception as e:
            logger.error(f"Error setting up Matrix client: {e}")
    
    async def message_callback(self, room: MatrixRoom, event: RoomMessageText):
        """Callback for Matrix room messages"""
        try:
            # Don't respond to own messages
            if event.sender == self.client.user_id:
                return
            
            # Check if bot should respond
            bot_username = self.config.matrix_username.split(':')[0]
            is_mentioned = bot_username in event.body
            is_dm = len(room.users) <= 2
            
            if is_mentioned or is_dm:
                await self.respond_to_message(room.room_id, event.sender, event.body)
                
        except Exception as e:
            logger.error(f"Error in message callback: {e}")
    
    def run_flask_app(self):
        """Run Flask application service"""
        self.app.run(host='0.0.0.0', port=8080, debug=False)
    
    async def run_matrix_client(self):
        """Run Matrix client"""
        await self.setup_matrix_client()
    
    def run(self):
        """Run the bot"""
        logger.info("Starting Matrix AI Bot...")
        
        # Start Flask app in a separate thread
        flask_thread = threading.Thread(target=self.run_flask_app)
        flask_thread.daemon = True
        flask_thread.start()
        
        # Run Matrix client in main thread
        try:
            asyncio.run(self.run_matrix_client())
        except KeyboardInterrupt:
            logger.info("Bot stopped by user")
        except Exception as e:
            logger.error(f"Error running bot: {e}")

def main():
    """Main function"""
    config = BotConfig()
    bot = MatrixAIBot(config)
    bot.run()

if __name__ == "__main__":
    main()