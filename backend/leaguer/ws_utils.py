"""
WebSocket utility functions for real-time notifications.
"""

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone
import logging


logger = logging.getLogger(__name__)


class WebSocketNotificationService:
    """Service for sending WebSocket notifications."""
    
    @staticmethod
    def get_channel_layer():
        """Get the channel layer instance."""
        return get_channel_layer()
    
    @staticmethod
    async def send_to_group(group_name, event_type, data):
        """
        Send an event to a WebSocket group.
        
        Args:
            group_name (str): Name of the group to send to
            event_type (str): Type of event (e.g., 'profile_update')
            data (dict): Event data
        """
        channel_layer = get_channel_layer()
        if channel_layer:
            try:
                await channel_layer.group_send(group_name, {
                    "type": event_type,
                    "timestamp": timezone.now().isoformat(),
                    **data
                })
            except Exception as e:
                logger.error(f"Failed to send WebSocket event to group {group_name}: {str(e)}")
        else:
            logger.warning("Channel layer not configured")


# Async version: Use this in async contexts
async def notify_profile_update_async(user_id, new_profile_data, password_updated=False, device_id=None):
    """
    Asynchronously sends a profile update event to all WebSocket clients in the user's group.

    Args:
        user_id (str or int): The ID of the user whose profile was updated
        new_profile_data (dict): The updated profile data to send to clients
        password_updated (bool): Whether the password was updated (default: False)
        device_id (str, optional): Device ID to exclude from receiving the update
    """
    try:
        await WebSocketNotificationService.send_to_group(
            f"profile_{user_id}",
            "profile_update",
            {
                "new_profile_data": new_profile_data,
                "password_updated": password_updated,
                "device_id": device_id,
            }
        )
    except Exception as e:
        logger.error(f"Failed to send profile update notification for user {user_id}: {str(e)}")


# Sync version: Use this in synchronous Django code
def notify_profile_update(user_id, new_profile_data, password_updated=False, device_id=None):
    """
    Synchronously sends a profile update event to all WebSocket clients in the user's group.
    This wraps the async version for use in non-async code.

    Args:
        user_id (str or int): The ID of the user whose profile was updated
        new_profile_data (dict): The updated profile data to send to clients
        password_updated (bool): Whether the password was updated (default: False)
        device_id (str, optional): Device ID to exclude from receiving the update
    """
    try:
        async_to_sync(notify_profile_update_async)(user_id, new_profile_data, password_updated, device_id)
    except Exception as e:
        logger.error(f"Failed to send sync profile update notification for user {user_id}: {str(e)}")


# General notification functions
async def notify_user_async(user_id, message, data=None):
    """
    Send a general notification to a user.
    
    Args:
        user_id (str or int): User ID to notify
        message (str): Notification message
        data (dict, optional): Additional data
    """
    try:
        await WebSocketNotificationService.send_to_group(
            f"profile_{user_id}",
            "notification",
            {
                "message": message,
                "data": data or {},
            }
        )
    except Exception as e:
        logger.error(f"Failed to send notification to user {user_id}: {str(e)}")


def notify_user(user_id, message, data=None):
    """
    Synchronously send a general notification to a user.
    
    Args:
        user_id (str or int): User ID to notify
        message (str): Notification message
        data (dict, optional): Additional data
    """
    try:
        async_to_sync(notify_user_async)(user_id, message, data)
    except Exception as e:
        logger.error(f"Failed to send sync notification to user {user_id}: {str(e)}")


# Bulk notification functions
async def notify_multiple_users_async(user_ids, message, data=None):
    """
    Send notifications to multiple users.
    
    Args:
        user_ids (list): List of user IDs
        message (str): Notification message
        data (dict, optional): Additional data
    """
    for user_id in user_ids:
        await notify_user_async(user_id, message, data)


def notify_multiple_users(user_ids, message, data=None):
    """
    Synchronously send notifications to multiple users.
    
    Args:
        user_ids (list): List of user IDs
        message (str): Notification message
        data (dict, optional): Additional data
    """
    try:
        async_to_sync(notify_multiple_users_async)(user_ids, message, data)
    except Exception as e:
        logger.error(f"Failed to send bulk notifications: {str(e)}")


# Connection monitoring
async def ping_user_connection(user_id):
    """
    Send a ping to check if user's WebSocket connection is active.
    
    Args:
        user_id (str or int): User ID to ping
    """
    try:
        await WebSocketNotificationService.send_to_group(
            f"profile_{user_id}",
            "ping",
            {}
        )
    except Exception as e:
        logger.error(f"Failed to ping user {user_id}: {str(e)}")


def ping_user_connection_sync(user_id):
    """
    Synchronously ping user's WebSocket connection.
    
    Args:
        user_id (str or int): User ID to ping
    """
    try:
        async_to_sync(ping_user_connection)(user_id)
    except Exception as e:
        logger.error(f"Failed to ping user {user_id} synchronously: {str(e)}")

