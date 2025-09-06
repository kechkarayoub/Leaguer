# pylint: disable=protected-access,too-many-instance-attributes,R0801
"""
Comprehensive test suite for leaguer models.

This module provides tests for:
- ContactMessageListSerializer functionality
- ContactMessageSerializerIntegration
- ContactMessageAdmin
- ContactMessageView
"""

from unittest.mock import patch

from django.contrib import admin
from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.contrib.messages.storage.fallback import FallbackStorage
from django.http import HttpRequest
from django.test import TestCase
from django.utils.translation import activate, gettext_lazy as _
from rest_framework.test import APIClient, APIRequestFactory

from leaguer.admin import ContactMessageAdmin
from leaguer.models import ContactMessage
from leaguer.serializers import ContactMessageSerializer, ContactMessageListSerializer

User = get_user_model()


class ContactMessageListSerializerTest(TestCase):
    """Test cases for ContactMessageListSerializer."""

    def setUp(self):
        """Set up test data."""        
        self.user = User.objects.create_user(
            username='testusermsgsr',
            email='testusermsgsr@example.com',
            password='testpassword123',
            current_language='en',
        )
        self.contact_message = ContactMessage.objects.create(
            name='John Doe',
            email='john.doe@example.com',
            subject='support',
            message='This is a test message with sufficient length to pass validation.',
            status='in_progress',
            user=self.user
        )
        activate(self.user.current_language)

    def test_contact_message_list_serializer_serialization(self):
        """Test ContactMessageListSerializer serialization."""        
        serializer = ContactMessageListSerializer(self.contact_message)
        data = serializer.data
        self.assertEqual(data['id'], self.contact_message.id)
        self.assertEqual(data['name'], 'John Doe')
        self.assertEqual(data['email'], 'john.doe@example.com')
        self.assertEqual(data['subject'], 'support')
        self.assertEqual(data['subject_display'], 'Technical Support')
        self.assertEqual(data['status'], 'in_progress')
        self.assertEqual(data['status_display'], 'In Progress')
        self.assertIn('created_at', data)
        self.assertIn('updated_at', data)

    def test_contact_message_list_serializer_multiple_objects(self):
        """Test ContactMessageListSerializer with multiple objects."""        
        # Create additional contact messages
        contact2 = ContactMessage.objects.create(
            name='Jane Smith',
            email='jane.smith@example.com',
            subject='billing',
            message='Billing inquiry message with sufficient length.',
            status='resolved'
        )
        contact3 = ContactMessage.objects.create(
            name='Bob Johnson',
            email='bob.johnson@example.com',
            subject='feature',
            message='Feature request message with sufficient length.',
            status='new'
        )
        contacts = [self.contact_message, contact2, contact3]
        serializer = ContactMessageListSerializer(contacts, many=True)
        data = serializer.data
        self.assertEqual(len(data), 3)
        # Check first contact
        self.assertEqual(data[0]['name'], 'John Doe')
        self.assertEqual(data[0]['subject_display'], 'Technical Support')
        self.assertEqual(data[0]['status_display'], 'In Progress')
        # Check second contact
        self.assertEqual(data[1]['name'], 'Jane Smith')
        self.assertEqual(data[1]['subject_display'], 'Billing & Account')
        self.assertEqual(data[1]['status_display'], 'Resolved')
        # Check third contact
        self.assertEqual(data[2]['name'], 'Bob Johnson')
        self.assertEqual(data[2]['subject_display'], 'Feature Request')
        self.assertEqual(data[2]['status_display'], 'New')

    def test_contact_message_list_serializer_all_subject_choices(self):
        """Test ContactMessageListSerializer with all subject choices."""        
        subjects = [
            ('support', 'Technical Support'),
            ('billing', 'Billing & Account'),
            ('feature', 'Feature Request'),
            ('partnership', 'Partnership'),
            ('other', 'Other')
        ]
        contacts = []
        for subject, expected_display in subjects:
            contact = ContactMessage.objects.create(
                name=f'Test {subject}',
                email=f'{subject}@example.com',
                subject=subject,
                message=f'Test message for {subject} with sufficient length.'
            )
            contacts.append(contact)
        serializer = ContactMessageListSerializer(contacts, many=True)
        data = serializer.data
        for i, (subject, expected_display) in enumerate(subjects):
            self.assertEqual(data[i]['subject'], subject)
            self.assertEqual(data[i]['subject_display'], expected_display)

    def test_contact_message_list_serializer_all_status_choices(self):
        """Test ContactMessageListSerializer with all status choices."""        
        statuses = [
            ('new', 'New'),
            ('in_progress', 'In Progress'),
            ('resolved', 'Resolved'),
            ('closed', 'Closed')
        ]
        contacts = []
        for status, expected_display in statuses:
            contact = ContactMessage.objects.create(
                name=f'Test {status}',
                email=f'{status}@example.com',
                subject='support',
                message=f'Test message for {status} with sufficient length.',
                status=status
            )
            contacts.append(contact)
        serializer = ContactMessageListSerializer(contacts, many=True)
        data = serializer.data
        for i, (status, expected_display) in enumerate(statuses):
            self.assertEqual(data[i]['status'], status)
            self.assertEqual(data[i]['status_display'], expected_display)

    def test_contact_message_list_serializer_read_only_fields(self):
        """Test that all fields in list serializer are read-only as expected."""        
        serializer = ContactMessageListSerializer()
        meta = serializer.Meta
        expected_read_only = ['id', 'created_at', 'updated_at']
        for field in expected_read_only:
            self.assertIn(field, meta.read_only_fields)


class ContactMessageSerializerIntegrationTest(TestCase):
    """Integration tests for ContactMessage serializers with API views."""

    def setUp(self):
        """Set up test data."""        
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testusermsgsrint',
            email='testusermsgsrint@example.com',
            password='testpassword123',
            current_language='en',
        )

    def test_serializer_with_api_client_authenticated(self):
        """Test serializer integration with authenticated API client."""
        # This test would require actual API endpoints to be meaningful
        # For now, we'll test the serializer context handling
        factory = APIRequestFactory()
        request = factory.post('/')
        request.user = self.user
        data = {
            'name': 'API Test User',
            'email': 'apitest@example.com',
            'subject': 'support',
            'message': 'This is an API test message with sufficient length.'
        }
        serializer = ContactMessageSerializer(
            data=data,
            context={'request': request}
        )
        self.assertTrue(serializer.is_valid())
        contact = serializer.save()
        # Verify the user was automatically associated
        self.assertEqual(contact.user, self.user)
        self.assertEqual(contact.name, 'API Test User')

    def test_serializer_validation_edge_cases(self):
        """Test serializer validation with edge cases."""        
        # Test message with exactly 10 characters (minimum)
        data = {
            'name': 'Edge Case',
            'email': 'edge@example.com',
            'subject': 'support',
            'message': '1234567890'  # Exactly 10 characters
        }
        serializer = ContactMessageSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        # Test message with 9 characters (should fail)
        data['message'] = '123456789'  # 9 characters
        serializer = ContactMessageSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        # Test name with only whitespace variations
        test_names = ['', '   ', '\t\t', '\n\n', '  \t \n  ']
        for name in test_names:
            data = {
                'name': name,
                'email': 'test@example.com',
                'subject': 'support',
                'message': 'Valid message with sufficient length.'
            }
            serializer = ContactMessageSerializer(data=data)
            self.assertFalse(serializer.is_valid())
            self.assertIn('name', serializer.errors)


class ContactMessageAdminTest(TestCase):
    """Test cases for ContactMessage admin interface."""

    def setUp(self):
        """Set up test data."""
        self.site = AdminSite()
        self.admin = ContactMessageAdmin(ContactMessage, self.site)
        # Create test users
        self.superuser = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpassword123'
        )
        self.staff_user = User.objects.create_user(
            username='staff',
            email='staff@example.com',
            password='staffpassword123',
            is_staff=True
        )
        self.regular_user = User.objects.create_user(
            username='user',
            email='user@example.com',
            password='userpassword123',
            current_language='en',
        )
        # Create test contact messages
        self.contact1 = ContactMessage.objects.create(
            name='John Doe',
            email='john@example.com',
            subject='support',
            message='Technical support message with sufficient length.',
            status='new',
            user=self.regular_user
        )
        self.contact2 = ContactMessage.objects.create(
            name='Jane Smith',
            email='jane@example.com',
            subject='billing',
            message='Billing inquiry message with sufficient length.',
            status='in_progress'
        )
        self.contact3 = ContactMessage.objects.create(
            name='Bob Johnson',
            email='bob@example.com',
            subject='feature',
            message='Feature request message with sufficient length.',
            status='resolved'
        )
        activate(self.regular_user.current_language)

    def test_admin_list_display(self):
        """Test that list display fields are correctly configured."""
        expected_fields = [
            'name',
            'email', 
            'subject',
            'status',
            'created_at',
            'updated_at'
        ]
        self.assertEqual(self.admin.list_display, expected_fields)

    def test_admin_list_filter(self):
        """Test that list filter fields are correctly configured."""
        expected_filters = [
            'status',
            'subject',
            'created_at',
            'updated_at'
        ]
        self.assertEqual(self.admin.list_filter, expected_filters)

    def test_admin_search_fields(self):
        """Test that search fields are correctly configured."""
        expected_search_fields = [
            'name',
            'email',
            'message',
            'admin_notes'
        ]
        self.assertEqual(self.admin.search_fields, expected_search_fields)

    def test_admin_readonly_fields(self):
        """Test that readonly fields are correctly configured."""
        expected_readonly_fields = [
            'created_at',
            'updated_at',
            'user'
        ]
        self.assertEqual(self.admin.readonly_fields, expected_readonly_fields)

    def test_admin_fields_configuration(self):
        """Test that field ordering is correctly configured."""
        expected_fields = [
            'name', 'email', 'subject', 'message', 'status', 'admin_notes',
            'user', 'created_at', 'updated_at'
        ]
        self.assertEqual(self.admin.fields, expected_fields)

    def test_admin_ordering(self):
        """Test that default ordering is correctly configured."""
        expected_ordering = ['-created_at']
        self.assertEqual(self.admin.ordering, expected_ordering)

    def test_admin_list_per_page(self):
        """Test that pagination is correctly configured."""
        self.assertEqual(self.admin.list_per_page, 25)

    def test_admin_get_queryset_optimization(self):
        """Test that queryset is optimized with select_related."""
        request = HttpRequest()
        request.user = self.staff_user
        queryset = self.admin.get_queryset(request)
        # Check that the queryset includes select_related for user
        # This is a bit tricky to test directly, but we can check the query
        self.assertIn('user', str(queryset.query))

    def test_admin_delete_permissions_superuser(self):
        """Test that superuser can delete contact messages."""
        request = HttpRequest()
        request.user = self.superuser
        # Superuser should have delete permission
        self.assertTrue(self.admin.has_delete_permission(request))
        self.assertTrue(self.admin.has_delete_permission(request, self.contact1))

    def test_admin_delete_permissions_staff(self):
        """Test that staff user cannot delete contact messages."""
        request = HttpRequest()
        request.user = self.staff_user
        # Staff user should not have delete permission
        self.assertFalse(self.admin.has_delete_permission(request))
        self.assertFalse(self.admin.has_delete_permission(request, self.contact1))

    def test_admin_actions_available(self):
        """Test that custom actions are available."""
        expected_actions = ['mark_as_in_progress', 'mark_as_resolved', 'mark_as_closed']
        for action in expected_actions:
            self.assertIn(action, self.admin.actions)

    def test_admin_action_mark_as_in_progress(self):
        """Test mark_as_in_progress action."""
        request = HttpRequest()
        request.user = self.staff_user
        request.session = {}
        request._messages = FallbackStorage(request)
        # Create queryset with contacts to update
        queryset = ContactMessage.objects.filter(
            id__in=[self.contact1.id, self.contact3.id])
        # Execute the action
        self.admin.mark_as_in_progress(request, queryset)
        # Check that contacts were updated
        self.contact1.refresh_from_db()
        self.contact3.refresh_from_db()
        self.assertEqual(self.contact1.status, 'in_progress')
        self.assertEqual(self.contact3.status, 'in_progress')

    def test_admin_action_mark_as_resolved(self):
        """Test mark_as_resolved action."""
        request = HttpRequest()
        request.user = self.staff_user
        request.session = {}
        request._messages = FallbackStorage(request)
        # Create queryset with contacts to update
        queryset = ContactMessage.objects.filter(
            id__in=[self.contact1.id, self.contact2.id])
        # Execute the action
        self.admin.mark_as_resolved(request, queryset)
        # Check that contacts were updated
        self.contact1.refresh_from_db()
        self.contact2.refresh_from_db()
        self.assertEqual(self.contact1.status, 'resolved')
        self.assertEqual(self.contact2.status, 'resolved')

    def test_admin_action_mark_as_closed(self):
        """Test mark_as_closed action."""
        request = HttpRequest()
        request.user = self.staff_user
        request.session = {}
        request._messages = FallbackStorage(request)
        # Create queryset with contacts to update
        queryset = ContactMessage.objects.filter(id=self.contact1.id)
        # Execute the action
        self.admin.mark_as_closed(request, queryset)
        # Check that contact was updated
        self.contact1.refresh_from_db()
        self.assertEqual(self.contact1.status, 'closed')

    def test_admin_action_descriptions(self):
        """Test that action descriptions are properly set."""
        self.assertEqual(
            self.admin.mark_as_in_progress.short_description,
            'Mark as in progress'
        )
        self.assertEqual(
            self.admin.mark_as_resolved.short_description,
            'Mark as resolved'
        )
        self.assertEqual(
            self.admin.mark_as_closed.short_description,
            'Mark as closed'
        )

    def test_admin_integration_with_model(self):
        """Test admin integration with ContactMessage model."""
        # Check that ContactMessage is registered in admin
        self.assertIn(ContactMessage, admin.site._registry)
        # Check that the correct admin class is registered
        self.assertIsInstance(
            admin.site._registry[ContactMessage],
            ContactMessageAdmin
        )

    def test_admin_bulk_actions_performance(self):
        """Test that bulk actions work efficiently with multiple records."""
        # Create multiple contact messages
        contacts = []
        for i in range(10):
            contact = ContactMessage.objects.create(
                name=f'Bulk Contact {i}',
                email=f'bulk{i}@example.com',
                subject='support',
                message=f'Bulk test message {i} with sufficient length.',
                status='new'
            )
            contacts.append(contact)
        request = HttpRequest()
        request.user = self.staff_user
        request.session = {}
        request._messages = FallbackStorage(request)
        # Test bulk update
        queryset = ContactMessage.objects.filter(
            id__in=[contact.id for contact in contacts]
        )
        self.admin.mark_as_resolved(request, queryset)
        # Verify all contacts were updated
        for contact in contacts:
            contact.refresh_from_db()
            self.assertEqual(contact.status, 'resolved')

    def test_admin_queryset_with_user_relationship(self):
        """Test that admin queryset properly handles user relationships."""
        request = HttpRequest()
        request.user = self.staff_user
        queryset = self.admin.get_queryset(request)
        # Should include all contact messages
        self.assertEqual(queryset.count(), 3)
        # Should be ordered by created_at descending
        ordered_contacts = list(queryset)
        self.assertTrue(ordered_contacts[0].created_at >= ordered_contacts[1].created_at >= ordered_contacts[2].created_at) # pylint: disable=line-too-long


class ContactMessageViewTest(TestCase):
    """Test cases for ContactMessage API views."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testusermsg',
            email='testusermsg@example.com',
            password='testpassword123',
            current_language='en',
        )
        self.contact_url = '/api/contact/'
        self.valid_contact_data = {
            'name': 'John Doe',
            'email': 'john.doe@example.com',
            'subject': 'support',
            'message': 'This is a test message with sufficient length to pass validation.'
        }
        activate(self.user.current_language)

    def test_contact_message_create_success_anonymous(self):
        """Test successful contact message creation by anonymous user."""
        response = self.client.post(
            self.contact_url, self.valid_contact_data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])
        self.assertEqual(
            _('Your message has been sent successfully. We will get back to you within 24'
              ' hours.'), response.data['message'])
        self.assertIn('id', response.data)
        # Verify the contact message was created in the database
        contact = ContactMessage.objects.get(id=response.data['id'])
        self.assertEqual(contact.name, 'John Doe')
        self.assertEqual(contact.email, 'john.doe@example.com')
        self.assertEqual(contact.subject, 'support')
        self.assertEqual(contact.message,
            'This is a test message with sufficient length to pass validation.')
        self.assertIsNone(contact.user)  # Anonymous user

    def test_contact_message_create_success_authenticated(self):
        """Test successful contact message creation by authenticated user."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.contact_url, self.valid_contact_data,
                                    format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])
        self.assertEqual(_('Your message has been sent successfully. We will get back to'
                           ' you within 24 hours.'), response.data['message'])
        self.assertIn('id', response.data)
        # Verify the contact message was created with user association
        contact = ContactMessage.objects.get(id=response.data['id'])
        self.assertEqual(contact.name, 'John Doe')
        self.assertEqual(contact.email, 'john.doe@example.com')
        # Should be associated with authenticated user
        self.assertEqual(contact.user, self.user)

    def test_contact_message_create_missing_name(self):
        """Test contact message creation with missing name."""
        data = self.valid_contact_data.copy()
        del data['name']
        response = self.client.post(self.contact_url, data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])
        self.assertEqual(_('Please correct the errors below.'), response.data['message'])
        self.assertIn('name', response.data['errors'])

    def test_contact_message_create_missing_email(self):
        """Test contact message creation with missing email."""
        data = self.valid_contact_data.copy()
        del data['email']
        response = self.client.post(self.contact_url, data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])
        self.assertIn('email', response.data['errors'])

    def test_contact_message_create_missing_subject(self):
        """Test contact message creation with missing subject."""
        data = self.valid_contact_data.copy()
        del data['subject']
        response = self.client.post(self.contact_url, data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])
        self.assertIn('subject', response.data['errors'])

    def test_contact_message_create_missing_message(self):
        """Test contact message creation with missing message."""
        data = self.valid_contact_data.copy()
        del data['message']
        response = self.client.post(self.contact_url, data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])
        self.assertIn('message', response.data['errors'])

    def test_contact_message_create_invalid_email(self):
        """Test contact message creation with invalid email format."""
        data = self.valid_contact_data.copy()
        data['email'] = 'invalid-email-format'
        response = self.client.post(self.contact_url, data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])
        self.assertIn('email', response.data['errors'])

    def test_contact_message_create_invalid_subject(self):
        """Test contact message creation with invalid subject choice."""
        data = self.valid_contact_data.copy()
        data['subject'] = 'invalid_subject'
        response = self.client.post(self.contact_url, data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])
        self.assertIn('subject', response.data['errors'])

    def test_contact_message_create_message_too_short(self):
        """Test contact message creation with message too short."""
        data = self.valid_contact_data.copy()
        data['message'] = 'Too short'  # Only 9 characters
        response = self.client.post(self.contact_url, data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])
        self.assertIn('message', response.data['errors'])
        # The error message might be in different languages, so check for key content
        error_message = str(response.data['errors']['message'][0])
        self.assertTrue(
            'at least 10 characters' in error_message or 
            'au moins 10 caractères' in error_message or
            '10' in error_message
        )

    def test_contact_message_create_empty_name(self):
        """Test contact message creation with empty name."""
        data = self.valid_contact_data.copy()
        data['name'] = ''
        response = self.client.post(self.contact_url, data, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])
        self.assertIn('name', response.data['errors'])

    def test_contact_message_create_whitespace_trimming(self):
        """Test that whitespace is properly trimmed from fields."""
        data = self.valid_contact_data.copy()
        data['name'] = '  John Doe  '
        data['message'] = '  This is a test message with sufficient length.  '
        response = self.client.post(self.contact_url, data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])
        # Verify the trimming in the database
        contact = ContactMessage.objects.get(id=response.data['id'])
        self.assertEqual(contact.name, 'John Doe')  # Trimmed
        self.assertEqual(contact.message, 'This is a test message with sufficient length.')

    def test_contact_message_create_all_subject_choices(self):
        """Test contact message creation with all valid subject choices."""
        subjects = ['support', 'billing', 'feature', 'partnership', 'other']
        for subject in subjects:
            data = self.valid_contact_data.copy()
            data['subject'] = subject
            data['email'] = f'{subject}@example.com'  # Make email unique
            response = self.client.post(self.contact_url, data, format='json')
            self.assertEqual(response.status_code, 201)
            self.assertTrue(response.data['success'])
            # Verify in database
            contact = ContactMessage.objects.get(id=response.data['id'])
            self.assertEqual(contact.subject, subject)

    def test_contact_message_create_http_methods(self):
        """Test that only POST method is allowed."""
        # Test GET method (should not be allowed)
        response = self.client.get(self.contact_url)
        self.assertEqual(response.status_code, 405)  # Method Not Allowed
        # Test PUT method (should not be allowed)
        response = self.client.put(self.contact_url, self.valid_contact_data,
                                   format='json')
        self.assertEqual(response.status_code, 405)  # Method Not Allowed
        # Test DELETE method (should not be allowed)
        response = self.client.delete(self.contact_url)
        self.assertEqual(response.status_code, 405)  # Method Not Allowed
        # Test PATCH method (should not be allowed)
        response = self.client.patch(self.contact_url, self.valid_contact_data, format='json')
        self.assertEqual(response.status_code, 405)  # Method Not Allowed

    def test_contact_message_create_anonymous_permissions(self):
        """Test that anonymous users can create contact messages."""
        # Ensure client is not authenticated
        self.client.force_authenticate(user=None)
        response = self.client.post(self.contact_url, self.valid_contact_data,
                                    format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])

    def test_contact_message_create_response_format(self):
        """Test the response format structure."""
        response = self.client.post(self.contact_url, self.valid_contact_data,
                                    format='json')
        self.assertEqual(response.status_code, 201)
        # Check response structure
        self.assertIn('success', response.data)
        self.assertIn('message', response.data)
        self.assertIn('id', response.data)
        self.assertIsInstance(response.data['success'], bool)
        # Convert message to string to handle translated strings
        self.assertIsInstance(str(response.data['message']), str)
        self.assertIsInstance(response.data['id'], int)

    def test_contact_message_create_error_response_format(self):
        """Test the error response format structure."""
        data = self.valid_contact_data.copy()
        data['email'] = 'invalid-email'
        response = self.client.post(self.contact_url, data, format='json')
        self.assertEqual(response.status_code, 400)
        # Check error response structure
        self.assertIn('success', response.data)
        self.assertIn('message', response.data)
        self.assertIn('errors', response.data)
        self.assertFalse(response.data['success'])
        # Convert message to string to handle translated strings
        self.assertIsInstance(str(response.data['message']), str)
        self.assertIsInstance(response.data['errors'], dict)

    def test_contact_message_create_content_type_json(self):
        """Test contact message creation with JSON content type."""
        response = self.client.post(
            self.contact_url,
            self.valid_contact_data,
            format='json'
        )
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])

    def test_contact_message_create_content_type_form_data(self):
        """Test contact message creation with form data."""
        response = self.client.post(self.contact_url, self.valid_contact_data)
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])

    def test_contact_message_create_unicode_content(self):
        """Test contact message creation with unicode characters."""
        data = self.valid_contact_data.copy()
        data['name'] = 'José María'
        data['message'] = 'Mensaje con caracteres especiales: ñáéíóú ç €'
        response = self.client.post(self.contact_url, data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])
        # Verify unicode handling in database
        contact = ContactMessage.objects.get(id=response.data['id'])
        self.assertEqual(contact.name, 'José María')
        self.assertEqual(contact.message, 'Mensaje con caracteres especiales: ñáéíóú ç €')

    def test_contact_message_create_long_content(self):
        """Test contact message creation with long content."""
        data = self.valid_contact_data.copy()
        # Create a long message (still within reasonable limits)
        data['message'] = 'This is a very long message. ' * 50  # 1400+ characters
        response = self.client.post(self.contact_url, data, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])

    def test_contact_message_create_multiple_messages_same_user(self):
        """Test creating multiple contact messages from the same user."""
        self.client.force_authenticate(user=self.user)
        # Create first message
        response1 = self.client.post(self.contact_url, self.valid_contact_data,
                                     format='json')
        self.assertEqual(response1.status_code, 201)
        # Create second message with different content
        data2 = self.valid_contact_data.copy()
        data2['subject'] = 'billing'
        data2['message'] = 'This is a second message with different content and sufficient length.'
        response2 = self.client.post(self.contact_url, data2, format='json')
        self.assertEqual(response2.status_code, 201)
        # Verify both messages exist in database
        self.assertEqual(ContactMessage.objects.filter(user=self.user).count(), 2)

    def test_contact_message_create_database_persistence(self):
        """Test that contact messages are properly saved to database."""
        initial_count = ContactMessage.objects.count()
        response = self.client.post(self.contact_url, self.valid_contact_data,
                                    format='json')
        self.assertEqual(response.status_code, 201)
        # Check that count increased by 1
        final_count = ContactMessage.objects.count()
        self.assertEqual(final_count, initial_count + 1)
        # Verify the created message
        contact = ContactMessage.objects.get(id=response.data['id'])
        self.assertEqual(contact.name, self.valid_contact_data['name'])
        self.assertEqual(contact.email, self.valid_contact_data['email'])
        self.assertEqual(contact.subject, self.valid_contact_data['subject'])
        self.assertEqual(contact.message, self.valid_contact_data['message'])
        self.assertEqual(contact.status, 'new')  # Default status
        self.assertIsNotNone(contact.created_at)
        self.assertIsNotNone(contact.updated_at)

    def test_contact_message_create_logging(self):
        """Test that contact message creation is properly logged."""
        with patch('leaguer.views.logger') as mock_logger:
            response = self.client.post(self.contact_url, self.valid_contact_data,
                                        format='json')
            self.assertEqual(response.status_code, 201)
            # Verify that info log was called
            mock_logger.info.assert_called_once()
            log_call_args = mock_logger.info.call_args[0][0]
            self.assertIn('Contact message created', log_call_args)
            self.assertIn(self.valid_contact_data['email'], log_call_args)

    @patch('leaguer.serializers.ContactMessageSerializer.save')
    def test_contact_message_create_exception_handling(self, mock_save):
        """Test exception handling in contact message creation."""
        # Mock serializer save to raise an exception
        mock_save.side_effect = Exception("Database error")
        with patch('leaguer.views.logger') as mock_logger:
            response = self.client.post(self.contact_url, self.valid_contact_data,
                                        format='json')
            self.assertEqual(response.status_code, 500)
            self.assertFalse(response.data['success'])
            self.assertEqual(_('An error occurred while sending your message. Please '
                               'try again later.'), response.data['message'])
            # Verify that error was logged
            mock_logger.error.assert_called_once()
            log_call_args = mock_logger.error.call_args[0][0]
            string_translation = str(_('Error creating contact message'))
            self.assertIn(string_translation, log_call_args)
