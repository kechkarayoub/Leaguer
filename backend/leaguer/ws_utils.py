from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


# Async version: Use this in async contexts (e.g., async Django views, async tests)
async def notify_profile_update_async(user_id, new_profile_data, password_updated=False):
    """
    Asynchronously sends a profile update event to all WebSocket clients in the user's group.

    Args:
        user_id (str or int): The ID of the user whose profile was updated.
        new_profile_data (dict): The updated profile data to send to clients.
        password_updated (bool): Whether the password was updated (default: False).
    """
    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        f"profile_{user_id}",
        {
            "type": "profile_update",
            "new_profile_data": new_profile_data,
            "password_updated": password_updated,
        }
    )


# Sync version: Use this in synchronous Django code (e.g., regular views, signals)
def notify_profile_update(user_id, new_profile_data, password_updated=False):
    """
    Synchronously sends a profile update event to all WebSocket clients in the user's group.
    This wraps the async version for use in non-async code.

    Args:
        user_id (str or int): The ID of the user whose profile was updated.
        new_profile_data (dict): The updated profile data to send to clients.
        password_updated (bool): Whether the password was updated (default: False).
    """
    async_to_sync(notify_profile_update_async)(user_id, new_profile_data, password_updated)

