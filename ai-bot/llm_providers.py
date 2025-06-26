"""
LLM Providers module for Matrix AI Bot
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

import openai
from anthropic import Anthropic

logger = logging.getLogger(__name__)

class LLMProvider:
    """LLM provider class that handles multiple AI providers"""
    
    def __init__(self, config):
        self.config = config
        self.openai_client = None
        self.anthropic_client = None
        
        # Initialize available providers
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize available LLM providers"""
        if self.config.has_openai_key():
            try:
                openai.api_key = self.config.openai_api_key
                self.openai_client = openai
                logger.info("OpenAI client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
        
        if self.config.has_anthropic_key():
            try:
                self.anthropic_client = Anthropic(api_key=self.config.anthropic_api_key)
                logger.info("Anthropic client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Anthropic client: {e}")
    
    async def generate_response(self, message: str, conversation_history: List[Dict[str, Any]]) -> Optional[str]:
        """Generate AI response using the preferred provider"""
        try:
            # Determine which provider to use
            if self.config.preferred_llm == 'openai' and self.openai_client:
                return await self._generate_openai_response(message, conversation_history)
            elif self.config.preferred_llm == 'anthropic' and self.anthropic_client:
                return await self._generate_anthropic_response(message, conversation_history)
            
            # Fallback to any available provider
            if self.openai_client:
                return await self._generate_openai_response(message, conversation_history)
            elif self.anthropic_client:
                return await self._generate_anthropic_response(message, conversation_history)
            
            logger.error("No LLM providers available")
            return "I'm sorry, I'm currently unable to process your request. Please try again later. 🤖"
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return "I encountered an error while processing your message. Please try again. 🤖"
    
    async def _generate_openai_response(self, message: str, conversation_history: List[Dict[str, Any]]) -> str:
        """Generate response using OpenAI API"""
        try:
            # Prepare messages for OpenAI format
            messages = [
                {"role": "system", "content": self.config.get_system_prompt()}
            ]
            
            # Add conversation history
            for msg in conversation_history[-10:]:  # Last 10 messages
                role = "assistant" if msg.get("role") == "assistant" else "user"
                messages.append({
                    "role": role,
                    "content": msg.get("content", "")
                })
            
            # Make API call
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: openai.ChatCompletion.create(
                    model="gpt-3.5-turbo",
                    messages=messages,
                    max_tokens=500,
                    temperature=0.7,
                    timeout=self.config.response_timeout
                )
            )
            
            if response.choices:
                generated_text = response.choices[0].message.content.strip()
                return self._truncate_response(generated_text)
            else:
                return "I'm sorry, I couldn't generate a response. Please try again. 🤖"
                
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return "I'm having trouble connecting to my AI service. Please try again later. 🤖"
    
    async def _generate_anthropic_response(self, message: str, conversation_history: List[Dict[str, Any]]) -> str:
        """Generate response using Anthropic Claude API"""
        try:
            # Prepare conversation for Anthropic format
            conversation_text = self.config.get_system_prompt() + "\n\n"
            
            # Add conversation history
            for msg in conversation_history[-10:]:  # Last 10 messages
                sender = msg.get("sender", "Unknown")
                content = msg.get("content", "")
                role = "Assistant" if msg.get("role") == "assistant" else "Human"
                conversation_text += f"{role}: {content}\n\n"
            
            # Make API call
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.anthropic_client.messages.create(
                    model="claude-3-haiku-20240307",
                    max_tokens=500,
                    temperature=0.7,
                    messages=[
                        {"role": "user", "content": conversation_text}
                    ]
                )
            )
            
            if response.content:
                generated_text = response.content[0].text.strip()
                return self._truncate_response(generated_text)
            else:
                return "I'm sorry, I couldn't generate a response. Please try again. 🤖"
                
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            return "I'm having trouble connecting to my AI service. Please try again later. 🤖"
    
    def _truncate_response(self, response: str) -> str:
        """Truncate response to maximum length"""
        if len(response) > self.config.max_response_length:
            return response[:self.config.max_response_length - 3] + "..."
        return response
    
    def _clean_message(self, message: str) -> str:
        """Clean and sanitize message content"""
        # Remove mentions and clean up the message
        cleaned = message.strip()
        
        # Remove bot mentions
        bot_username = self.config.matrix_username.split(':')[0]
        cleaned = cleaned.replace(bot_username, "").strip()
        
        # Remove extra whitespace
        cleaned = ' '.join(cleaned.split())
        
        return cleaned
    
    def get_available_providers(self) -> List[str]:
        """Get list of available LLM providers"""
        providers = []
        if self.openai_client:
            providers.append("openai")
        if self.anthropic_client:
            providers.append("anthropic")
        return providers
    
    def is_available(self) -> bool:
        """Check if any LLM provider is available"""
        return bool(self.openai_client or self.anthropic_client)