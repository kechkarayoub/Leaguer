
from channels.layers import get_channel_layer
from channels.testing import WebsocketCommunicator
from django.test import TransactionTestCase
from leaguer.asgi import application
from leaguer.ws_consumers import ProfileConsumer
from leaguer.ws_utils import notify_profile_update_async
import asyncio
import json

class ProfileConsumerTest(TransactionTestCase):

    def test_profile_consumer_connect_and_update(self):
        async def async_test():
            user_id = "123"
            communicator = WebsocketCommunicator(application, f"/ws/profile/{user_id}/")
            connected, _ = await communicator.connect()
            self.assertTrue(connected)

            # Test initial connection message
            response = await communicator.receive_from()
            data = json.loads(response)
            self.assertTrue(data["connected"])
            self.assertEqual(data["user_id"], user_id)


            # Simulate sending a profile update event to the group using the channel layer
            channel_layer = get_channel_layer()
            new_profile_data = {"id": user_id, "name": "Test User"}
            await channel_layer.group_send(
                f"profile_{user_id}",
                {
                    "type": "profile_update",
                    "new_profile_data": new_profile_data,
                }
            )
            # The consumer should send the new profile data back
            response = await communicator.receive_from()
            data = json.loads(response)
            self.assertEqual(data, new_profile_data)

            # Disconnect and ensure it completes without error
            disconnect_result = await communicator.disconnect()
            self.assertIsNone(disconnect_result)  # Should return None if clean


        asyncio.get_event_loop().run_until_complete(async_test())


    def test_notify_profile_update(self):
        async def async_test():
            user_id = "555"
            communicator = WebsocketCommunicator(application, f"/ws/profile/{user_id}/")
            connected, _ = await communicator.connect()
            self.assertTrue(connected)
            await communicator.receive_from()  # initial connection message

            # Call the function to notify profile update
            new_profile_data = {"id": user_id, "name": "Integration Test"}
            await notify_profile_update_async(user_id, new_profile_data, password_updated=True)

            # The consumer should send the new profile data back
            response = await communicator.receive_from()
            data = json.loads(response)
            self.assertEqual(data, new_profile_data)

            await communicator.disconnect()

        asyncio.get_event_loop().run_until_complete(async_test())

