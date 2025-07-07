from channels.generic.websocket import AsyncWebsocketConsumer
import json

class ProfileConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """
        Called when a WebSocket connection is opened.
        Adds the user to a group based on their user_id and accepts the connection.
        Sends an initial message to confirm connection.
        """
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.group_name = f"profile_{self.user_id}"
        # Add this channel to the user's group
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        # Send a confirmation message to the client
        await self.send(text_data=json.dumps({"connected": True, "user_id": self.user_id}))

    async def disconnect(self, close_code):
        """
        Called when the WebSocket connection is closed.
        Removes the channel from the user's group.
        """
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        """
        Called when a message is received from the client.
        (Currently not handling any client messages.)
        """
        pass

    async def profile_update(self, event):
        """
        Called when a profile update event is sent to the group.
        Sends the new profile data to the client.
        """
        await self.send(text_data=json.dumps(event))
