"""
WebSocket consumers for real-time functionality.
"""

from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from django.utils.translation import gettext_lazy as _
import json
import logging


logger = logging.getLogger(__name__)


class BaseConsumer(AsyncWebsocketConsumer):
    """Base WebSocket consumer with common functionality."""
    
    async def connect(self):
        """Handle WebSocket connection."""
        await self.accept()
        logger.info(f"WebSocket connection established: {self.channel_name}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        logger.info(f"WebSocket disconnected: {self.channel_name}, code: {close_code}")
    
    async def send_error(self, message, code="error"):
        """Send error message to client."""
        await self.send(text_data=json.dumps({
            "type": "error",
            "code": code,
            "message": str(message)
        }))
    
    async def send_success(self, data, message="Success"):
        """Send success message to client."""
        await self.send(text_data=json.dumps({
            "type": "success",
            "message": str(message),  # Convert to string to handle lazy translations
            "data": data
        }))


class ProfileConsumer(BaseConsumer):
    """WebSocket consumer for profile-related real-time updates."""
    
    async def connect(self):
        """
        Handle WebSocket connection for profile updates.
        Authenticates user and adds them to their profile group.
        """
        self.user = self.scope.get('user')
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        
        # Check if user is authenticated
        if isinstance(self.user, AnonymousUser):
            await self.close(code=4001)
            return
        
        # Check if user can access this profile
        if str(self.user.id) != str(self.user_id):
            await self.close(code=4003)
            return
        
        self.group_name = f"profile_{self.user_id}"
        
        # Add this channel to the user's group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        
        await super().connect()
        
        # Send confirmation message
        await self.send_success({
            "connected": True,
            "user_id": self.user_id,
            "group": self.group_name
        }, _("Connected to profile updates"))
    
    async def disconnect(self, close_code):
        """
        Handle WebSocket disconnection.
        Removes the channel from the user's group.
        """
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        
        await super().disconnect(close_code)
    
    async def receive(self, text_data):
        """
        Handle messages received from the client.
        Currently handles ping/pong for connection monitoring.
        """
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    "type": "pong",
                    "timestamp": data.get('timestamp')
                }))
            else:
                await self.send_error(_("Unknown message type"), "unknown_type")
                
        except json.JSONDecodeError:
            await self.send_error(_("Invalid JSON format"), "invalid_json")
        except Exception as e:
            logger.error(f"Error in ProfileConsumer.receive: {str(e)}")
            await self.send_error(_("Internal server error"), "internal_error")
    
    async def profile_update(self, event):
        """
        Handle profile update events sent to the group.
        Forwards the update to the WebSocket client.
        """
        try:
            # Check if this update should be sent to this specific client
            device_id = event.get('device_id')
            if device_id and hasattr(self, 'device_id') and self.device_id == device_id:
                # Skip sending to the device that initiated the update
                return
            
            await self.send(text_data=json.dumps({
                "type": "profile_update",
                "data": event.get('new_profile_data', {}),
                "password_updated": event.get('password_updated', False),
                "timestamp": event.get('timestamp')
            }))
            
        except Exception as e:
            logger.error(f"Error in ProfileConsumer.profile_update: {str(e)}")
            await self.send_error(_("Error processing profile update"), "update_error")
    
    async def notification(self, event):
        """
        Handle general notification events.
        """
        try:
            await self.send(text_data=json.dumps({
                "type": "notification",
                "data": event.get('data', {}),
                "message": event.get('message', ''),
                "timestamp": event.get('timestamp')
            }))
            
        except Exception as e:
            logger.error(f"Error in ProfileConsumer.notification: {str(e)}")
            await self.send_error(_("Error processing notification"), "notification_error")
