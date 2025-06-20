"""
Configuration module for Matrix AI Bot
"""

import os
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class BotConfig:
    """Configuration class for the Matrix AI Bot"""
    
    def __init__(self):
        # Matrix server configuration
        self.matrix_server_url = os.getenv('MATRIX_SERVER_URL', 'http://localhost:8008')
        self.matrix_username = os.getenv('MATRIX_USERNAME', '@aibot:localhost')
        self.matrix_password = os.getenv('MATRIX_PASSWORD', 'aibot_password')
        
        # Application service configuration
        self.as_token = os.getenv('AS_TOKEN', 'aibot_application_service_token_here')
        self.hs_token = os.getenv('HS_TOKEN', 'homeserver_token_for_aibot_here')
        
        # LLM provider configuration
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
        self.preferred_llm = os.getenv('PREFERRED_LLM', 'openai')  # 'openai' or 'anthropic'
        
        # Bot behavior configuration
        self.max_conversation_history = int(os.getenv('MAX_CONVERSATION_HISTORY', '20'))
        self.response_timeout = int(os.getenv('RESPONSE_TIMEOUT', '30'))
        self.max_response_length = int(os.getenv('MAX_RESPONSE_LENGTH', '2000'))
        
        # Bot personality
        self.bot_name = os.getenv('BOT_NAME', 'Matrix AI Assistant')
        self.bot_personality = os.getenv('BOT_PERSONALITY', 
            'You are a helpful AI assistant in a Matrix chat room. '
            'You are friendly, knowledgeable, and concise in your responses. '
            'You can help with various tasks, answer questions, and engage in conversation.'
        )
        
        # Validate required configuration
        self._validate_config()
    
    def _validate_config(self):
        """Validate that required configuration is present"""
        if not self.matrix_server_url:
            raise ValueError("MATRIX_SERVER_URL is required")
        
        if not self.matrix_username:
            raise ValueError("MATRIX_USERNAME is required")
        
        if not self.matrix_password:
            raise ValueError("MATRIX_PASSWORD is required")
        
        if not self.openai_api_key and not self.anthropic_api_key:
            raise ValueError("Either OPENAI_API_KEY or ANTHROPIC_API_KEY is required")
    
    def has_openai_key(self) -> bool:
        """Check if OpenAI API key is configured"""
        return bool(self.openai_api_key)
    
    def has_anthropic_key(self) -> bool:
        """Check if Anthropic API key is configured"""
        return bool(self.anthropic_api_key)
    
    def get_system_prompt(self) -> str:
        """Get the system prompt for the LLM"""
        return f"""You are {self.bot_name}, an AI assistant in a Matrix chat room.

{self.bot_personality}

Guidelines:
- Keep responses concise and helpful
- Use emojis occasionally to make responses more friendly
- If you're not sure about something, say so
- Be respectful and inclusive
- If asked about your capabilities, explain that you're an AI assistant that can help with various tasks
- Maximum response length: {self.max_response_length} characters

Current timestamp: {os.getenv('CURRENT_TIME', 'unknown')}
"""

    def __repr__(self):
        return f"BotConfig(server={self.matrix_server_url}, user={self.matrix_username})"