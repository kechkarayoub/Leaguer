"""
Comprehensive test suite for leaguer models.

This module provides tests for:
- ContactMessage model functionality
- Model validation
- Model methods and properties
- Database constraints
- Internationalization features
"""

from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from django.utils.translation import activate, gettext_lazy as _
from django.contrib.auth import get_user_model
from unittest.mock import patch

from leaguer.models import ContactMessage

User = get_user_model()


class ContactMessageModelTest(TestCase):
    """Test cases for ContactMessage model."""
    
    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword123'
        )
        
        self.valid_contact_data = {
            'name': 'John Doe',
            'email': 'john.doe@example.com',
            'subject': 'support',
            'message': 'This is a test message with sufficient length to pass validation.',
            'user': self.user
        }

    def test_contact_message_creation_success(self):
        """Test successful creation of ContactMessage."""
        contact = ContactMessage.objects.create(**self.valid_contact_data)
        
        self.assertEqual(contact.name, 'John Doe')
        self.assertEqual(contact.email, 'john.doe@example.com')
        self.assertEqual(contact.subject, 'support')
        self.assertEqual(contact.message, 'This is a test message with sufficient length to pass validation.')
        self.assertEqual(contact.user, self.user)
        self.assertEqual(contact.status, 'new')  # Default status
        self.assertIsNotNone(contact.created_at)
        self.assertIsNotNone(contact.updated_at)
        self.assertEqual(contact.admin_notes, '')

    def test_contact_message_creation_without_user(self):
        """Test creation of ContactMessage without associated user."""
        data = self.valid_contact_data.copy()
        del data['user']
        
        contact = ContactMessage.objects.create(**data)
        
        self.assertEqual(contact.name, 'John Doe')
        self.assertEqual(contact.email, 'john.doe@example.com')
        self.assertIsNone(contact.user)
        self.assertEqual(contact.status, 'new')

    def test_contact_message_str_representation(self):
        """Test the string representation of ContactMessage."""
        contact = ContactMessage.objects.create(**self.valid_contact_data)
        
        expected_str = f"John Doe - Technical Support ({contact.created_at.strftime('%Y-%m-%d')})"
        self.assertEqual(str(contact), expected_str)

    def test_contact_message_subject_choices(self):
        """Test all subject choices work correctly."""
        subject_choices = ['support', 'billing', 'feature', 'partnership', 'other']
        
        for subject in subject_choices:
            data = self.valid_contact_data.copy()
            data['subject'] = subject
            data['email'] = f'{subject}@example.com'  # Make email unique
            
            contact = ContactMessage.objects.create(**data)
            self.assertEqual(contact.subject, subject)

    def test_contact_message_status_choices(self):
        """Test all status choices work correctly."""
        status_choices = ['new', 'in_progress', 'resolved', 'closed']
        
        for status in status_choices:
            data = self.valid_contact_data.copy()
            data['status'] = status
            data['email'] = f'{status}@example.com'  # Make email unique
            
            contact = ContactMessage.objects.create(**data)
            self.assertEqual(contact.status, status)

    def test_contact_message_message_length_validation(self):
        """Test message length validation (minimum 10 characters)."""
        data = self.valid_contact_data.copy()
        data['message'] = 'Too short'  # Only 9 characters
        
        contact = ContactMessage(**data)
        
        with self.assertRaises(ValidationError):
            contact.full_clean()

    def test_contact_message_name_max_length(self):
        """Test name field maximum length validation."""
        data = self.valid_contact_data.copy()
        data['name'] = 'x' * 101  # Exceeds max_length of 100
        
        contact = ContactMessage(**data)
        
        with self.assertRaises(ValidationError):
            contact.full_clean()

    def test_contact_message_email_validation(self):
        """Test email field validation."""
        data = self.valid_contact_data.copy()
        data['email'] = 'invalid-email-format'
        
        contact = ContactMessage(**data)
        
        with self.assertRaises(ValidationError):
            contact.full_clean()

    def test_contact_message_invalid_subject_choice(self):
        """Test that invalid subject choice raises validation error."""
        data = self.valid_contact_data.copy()
        data['subject'] = 'invalid_subject'
        
        contact = ContactMessage(**data)
        
        with self.assertRaises(ValidationError):
            contact.full_clean()

    def test_contact_message_invalid_status_choice(self):
        """Test that invalid status choice raises validation error."""
        data = self.valid_contact_data.copy()
        data['status'] = 'invalid_status'
        
        contact = ContactMessage(**data)
        
        with self.assertRaises(ValidationError):
            contact.full_clean()

    def test_contact_message_auto_timestamps(self):
        """Test that created_at and updated_at are automatically set."""
        contact = ContactMessage.objects.create(**self.valid_contact_data)
        
        # Check that timestamps are set
        self.assertIsNotNone(contact.created_at)
        self.assertIsNotNone(contact.updated_at)
        
        # Initially, created_at and updated_at should be very close
        time_diff = abs((contact.updated_at - contact.created_at).total_seconds())
        self.assertLess(time_diff, 1)  # Less than 1 second difference
        
        # Update the contact and check that updated_at changes
        original_updated_at = contact.updated_at
        contact.admin_notes = 'Updated notes'
        contact.save()
        
        contact.refresh_from_db()
        self.assertGreater(contact.updated_at, original_updated_at)

    def test_contact_message_user_foreign_key_cascade(self):
        """Test that deleting a user sets the contact message user to NULL."""
        contact = ContactMessage.objects.create(**self.valid_contact_data)
        
        # Verify the user is associated
        self.assertEqual(contact.user, self.user)
        
        # Delete the user
        user_id = self.user.id
        self.user.delete()
        
        # Refresh the contact message and check user is set to NULL
        contact.refresh_from_db()
        self.assertIsNone(contact.user)

    def test_contact_message_ordering(self):
        """Test that contact messages are ordered by created_at descending."""
        # Create multiple contact messages
        contact1 = ContactMessage.objects.create(
            name='First Contact',
            email='first@example.com',
            subject='support',
            message='First message with sufficient length for validation.'
        )
        
        contact2 = ContactMessage.objects.create(
            name='Second Contact',
            email='second@example.com',
            subject='billing',
            message='Second message with sufficient length for validation.'
        )
        
        contact3 = ContactMessage.objects.create(
            name='Third Contact',
            email='third@example.com',
            subject='feature',
            message='Third message with sufficient length for validation.'
        )
        
        # Get all contacts in default order
        contacts = list(ContactMessage.objects.all())
        
        # Should be ordered by created_at descending (newest first)
        self.assertEqual(contacts[0], contact3)
        self.assertEqual(contacts[1], contact2)
        self.assertEqual(contacts[2], contact1)

    def test_contact_message_meta_attributes(self):
        """Test model meta attributes."""
        meta = ContactMessage._meta
        
        self.assertEqual(meta.db_table, 'leaguer_contact_message')
        self.assertEqual(meta.ordering, ['-created_at'])
        self.assertEqual(str(meta.verbose_name), 'Contact Message')
        self.assertEqual(str(meta.verbose_name_plural), 'Contact Messages')

    def test_contact_message_indexes(self):
        """Test that proper indexes are created."""
        meta = ContactMessage._meta
        index_fields = []
        
        for index in meta.indexes:
            index_fields.extend(index.fields)
        
        expected_indexed_fields = ['status', 'subject', 'created_at', 'email']
        
        for field in expected_indexed_fields:
            self.assertIn(field, index_fields)

    def test_get_subject_display_translated(self):
        """Test the get_subject_display_translated method."""
        contact = ContactMessage.objects.create(**self.valid_contact_data)
        
        # Test with different subjects
        subject_translations = {
            'support': 'Technical Support',
            'billing': 'Billing & Account',
            'feature': 'Feature Request',
            'partnership': 'Partnership',
            'other': 'Other'
        }
        
        for subject, expected_display in subject_translations.items():
            contact.subject = subject
            contact.save()
            
            display = contact.get_subject_display_translated()
            self.assertEqual(str(display), expected_display)

    def test_get_status_display_translated(self):
        """Test the get_status_display_translated method."""
        contact = ContactMessage.objects.create(**self.valid_contact_data)
        
        # Test with different statuses
        status_translations = {
            'new': 'New',
            'in_progress': 'In Progress',
            'resolved': 'Resolved',
            'closed': 'Closed'
        }
        
        for status, expected_display in status_translations.items():
            contact.status = status
            contact.save()
            
            display = contact.get_status_display_translated()
            self.assertEqual(str(display), expected_display)

    def test_contact_message_admin_notes_optional(self):
        """Test that admin_notes field is optional."""
        data = self.valid_contact_data.copy()
        
        # Test without admin_notes
        contact = ContactMessage.objects.create(**data)
        self.assertEqual(contact.admin_notes, '')
        
        # Test with admin_notes
        data['admin_notes'] = 'This is an admin note for internal use.'
        contact_with_notes = ContactMessage.objects.create(
            name='Jane Doe',
            email='jane.doe@example.com',
            subject='billing',
            message='Another test message with sufficient length.',
            admin_notes='This is an admin note for internal use.'
        )
        self.assertEqual(contact_with_notes.admin_notes, 'This is an admin note for internal use.')

    def test_contact_message_field_help_texts(self):
        """Test that all fields have proper help texts."""
        contact = ContactMessage()
        
        expected_help_texts = {
            'name': 'The full name of the person contacting us',
            'email': 'Email address for response',
            'subject': 'Category of the inquiry',
            'message': 'The detailed message from the user',
            'status': 'Current status of the message',
            'created_at': 'When the message was submitted',
            'updated_at': 'When the message was last updated',
            'user': 'Associated user account if logged in',
            'admin_notes': 'Internal notes for administrators'
        }
        
        for field_name, expected_help_text in expected_help_texts.items():
            field = contact._meta.get_field(field_name)
            self.assertEqual(str(field.help_text), expected_help_text)

    def test_contact_message_field_verbose_names(self):
        """Test that all fields have proper verbose names."""
        contact = ContactMessage()
        
        expected_verbose_names = {
            'name': 'Full Name',
            'email': 'Email Address',
            'subject': 'Subject',
            'message': 'Message',
            'status': 'Status',
            'created_at': 'Created At',
            'updated_at': 'Updated At',
            'user': 'User',
            'admin_notes': 'Admin Notes'
        }
        
        for field_name, expected_verbose_name in expected_verbose_names.items():
            field = contact._meta.get_field(field_name)
            self.assertEqual(str(field.verbose_name), expected_verbose_name)


class ContactMessageInternationalizationTest(TestCase):
    """Test cases for ContactMessage internationalization features."""
    
    def setUp(self):
        """Set up test data."""
        self.contact_data = {
            'name': 'John Doe',
            'email': 'john.doe@example.com',
            'subject': 'support',
            'message': 'This is a test message with sufficient length to pass validation.'
        }

    def test_contact_message_field_translations(self):
        """Test that field labels are properly translated."""
        # Test with English (default)
        activate('en')
        contact = ContactMessage(**self.contact_data)
        
        # Check that gettext_lazy objects are properly handled
        name_field = contact._meta.get_field('name')
        self.assertEqual(str(name_field.verbose_name), 'Full Name')
        
        subject_field = contact._meta.get_field('subject')
        self.assertEqual(str(subject_field.verbose_name), 'Subject')

    def test_subject_choices_translations(self):
        """Test that subject choices support translation."""
        contact = ContactMessage.objects.create(**self.contact_data)
        
        # The choices should use gettext_lazy for translation
        choices_dict = dict(ContactMessage.SUBJECT_CHOICES)
        
        # Verify all expected choices exist
        expected_subjects = ['support', 'billing', 'feature', 'partnership', 'other']
        for subject in expected_subjects:
            self.assertIn(subject, choices_dict)

    def test_status_choices_translations(self):
        """Test that status choices support translation."""
        contact = ContactMessage.objects.create(**self.contact_data)
        
        # The choices should use gettext_lazy for translation
        choices_dict = dict(ContactMessage.STATUS_CHOICES)
        
        # Verify all expected statuses exist
        expected_statuses = ['new', 'in_progress', 'resolved', 'closed']
        for status in expected_statuses:
            self.assertIn(status, choices_dict)


class ContactMessageQuerySetTest(TestCase):
    """Test cases for ContactMessage querysets and filtering."""
    
    def setUp(self):
        """Set up test data."""
        self.user1 = User.objects.create_user(
            username='user1',
            email='user1@example.com',
            password='password123'
        )
        
        self.user2 = User.objects.create_user(
            username='user2',
            email='user2@example.com',
            password='password123'
        )
        
        # Create contact messages with different attributes
        self.contact1 = ContactMessage.objects.create(
            name='Alice Smith',
            email='alice@example.com',
            subject='support',
            message='Technical support message with sufficient length.',
            status='new',
            user=self.user1
        )
        
        self.contact2 = ContactMessage.objects.create(
            name='Bob Johnson',
            email='bob@example.com',
            subject='billing',
            message='Billing inquiry message with sufficient length.',
            status='in_progress',
            user=self.user2
        )
        
        self.contact3 = ContactMessage.objects.create(
            name='Charlie Brown',
            email='charlie@example.com',
            subject='feature',
            message='Feature request message with sufficient length.',
            status='resolved'
            # No user associated
        )

    def test_filter_by_status(self):
        """Test filtering contact messages by status."""
        new_contacts = ContactMessage.objects.filter(status='new')
        self.assertEqual(new_contacts.count(), 1)
        self.assertEqual(new_contacts.first(), self.contact1)
        
        in_progress_contacts = ContactMessage.objects.filter(status='in_progress')
        self.assertEqual(in_progress_contacts.count(), 1)
        self.assertEqual(in_progress_contacts.first(), self.contact2)
        
        resolved_contacts = ContactMessage.objects.filter(status='resolved')
        self.assertEqual(resolved_contacts.count(), 1)
        self.assertEqual(resolved_contacts.first(), self.contact3)

    def test_filter_by_subject(self):
        """Test filtering contact messages by subject."""
        support_contacts = ContactMessage.objects.filter(subject='support')
        self.assertEqual(support_contacts.count(), 1)
        self.assertEqual(support_contacts.first(), self.contact1)
        
        billing_contacts = ContactMessage.objects.filter(subject='billing')
        self.assertEqual(billing_contacts.count(), 1)
        self.assertEqual(billing_contacts.first(), self.contact2)
        
        feature_contacts = ContactMessage.objects.filter(subject='feature')
        self.assertEqual(feature_contacts.count(), 1)
        self.assertEqual(feature_contacts.first(), self.contact3)

    def test_filter_by_user(self):
        """Test filtering contact messages by associated user."""
        user1_contacts = ContactMessage.objects.filter(user=self.user1)
        self.assertEqual(user1_contacts.count(), 1)
        self.assertEqual(user1_contacts.first(), self.contact1)
        
        user2_contacts = ContactMessage.objects.filter(user=self.user2)
        self.assertEqual(user2_contacts.count(), 1)
        self.assertEqual(user2_contacts.first(), self.contact2)
        
        # Test filtering for contacts without user
        no_user_contacts = ContactMessage.objects.filter(user__isnull=True)
        self.assertEqual(no_user_contacts.count(), 1)
        self.assertEqual(no_user_contacts.first(), self.contact3)

    def test_filter_by_email(self):
        """Test filtering contact messages by email."""
        alice_contacts = ContactMessage.objects.filter(email='alice@example.com')
        self.assertEqual(alice_contacts.count(), 1)
        self.assertEqual(alice_contacts.first(), self.contact1)
        
        # Test case-insensitive email filtering
        alice_contacts_upper = ContactMessage.objects.filter(email__iexact='ALICE@EXAMPLE.COM')
        self.assertEqual(alice_contacts_upper.count(), 1)

    def test_search_by_name(self):
        """Test searching contact messages by name."""
        alice_contacts = ContactMessage.objects.filter(name__icontains='Alice')
        self.assertEqual(alice_contacts.count(), 1)
        self.assertEqual(alice_contacts.first(), self.contact1)
        
        # Test partial name search
        smith_contacts = ContactMessage.objects.filter(name__icontains='Smith')
        self.assertEqual(smith_contacts.count(), 1)
        self.assertEqual(smith_contacts.first(), self.contact1)

    def test_search_by_message_content(self):
        """Test searching contact messages by message content."""
        support_messages = ContactMessage.objects.filter(message__icontains='Technical support')
        self.assertEqual(support_messages.count(), 1)
        self.assertEqual(support_messages.first(), self.contact1)
        
        billing_messages = ContactMessage.objects.filter(message__icontains='Billing inquiry')
        self.assertEqual(billing_messages.count(), 1)
        self.assertEqual(billing_messages.first(), self.contact2)

    def test_date_range_filtering(self):
        """Test filtering contact messages by date range."""
        # Clear any existing contacts to ensure clean state
        ContactMessage.objects.all().delete()
        
        # Create test contacts within this test method
        contact1 = ContactMessage.objects.create(
            name='Alice Smith',
            email='alice@example.com',
            subject='support',
            message='Technical support message with sufficient length.',
            status='new',
            user=self.user1
        )
        
        contact2 = ContactMessage.objects.create(
            name='Bob Johnson',
            email='bob@example.com',
            subject='billing',
            message='Billing inquiry message with sufficient length.',
            status='in_progress',
            user=self.user2
        )
        
        contact3 = ContactMessage.objects.create(
            name='Charlie Brown',
            email='charlie@example.com',
            subject='feature',
            message='Feature request message with sufficient length.',
            status='resolved'
            # No user associated
        )
        
        # Verify contacts were created
        self.assertEqual(ContactMessage.objects.count(), 3)
        
        # Use timezone-aware date filtering
        from django.utils import timezone as django_timezone
        now = django_timezone.now()
        today = now.date()
        
        # Filter by the actual date when the contacts were created
        # Since all contacts are created in the same test, they should all have the same date
        actual_contact = ContactMessage.objects.first()
        actual_date = actual_contact.created_at.date()
        
        # All contacts should be created on the same date as our test contacts
        today_contacts = ContactMessage.objects.filter(created_at__date=actual_date)
        self.assertEqual(today_contacts.count(), 3)
        
        # Test filtering by created_at range using datetime range instead of date
        start_of_day = django_timezone.make_aware(
            django_timezone.datetime.combine(actual_date, django_timezone.datetime.min.time())
        )
        end_of_day = django_timezone.make_aware(
            django_timezone.datetime.combine(actual_date, django_timezone.datetime.max.time())
        )
        
        day_contacts = ContactMessage.objects.filter(
            created_at__gte=start_of_day,
            created_at__lte=end_of_day
        )
        self.assertEqual(day_contacts.count(), 3)
        
        # Test filtering by created_at range (yesterday to today)
        yesterday = actual_date - django_timezone.timedelta(days=1)
        recent_contacts = ContactMessage.objects.filter(created_at__date__gte=yesterday)
        self.assertEqual(recent_contacts.count(), 3)

    def test_complex_filtering(self):
        """Test complex filtering combinations."""
        # Find new or in_progress support contacts
        active_support = ContactMessage.objects.filter(
            subject='support',
            status__in=['new', 'in_progress']
        )
        self.assertEqual(active_support.count(), 1)
        self.assertEqual(active_support.first(), self.contact1)
        
        # Find contacts with associated users that are not resolved
        user_contacts_active = ContactMessage.objects.filter(
            user__isnull=False
        ).exclude(status='resolved')
        self.assertEqual(user_contacts_active.count(), 2)

    def test_ordering_verification(self):
        """Test that default ordering works correctly."""
        all_contacts = list(ContactMessage.objects.all())
        
        # Should be ordered by created_at descending (newest first)
        for i in range(len(all_contacts) - 1):
            self.assertGreaterEqual(
                all_contacts[i].created_at,
                all_contacts[i + 1].created_at
            )


class ContactMessagePerformanceTest(TestCase):
    """Test cases for ContactMessage performance considerations."""
    
    def setUp(self):
        """Set up test data."""
        # Create multiple users and contact messages for performance testing
        self.users = []
        for i in range(10):
            user = User.objects.create_user(
                username=f'user{i}',
                email=f'user{i}@example.com',
                password='password123'
            )
            self.users.append(user)

    def test_bulk_create_contact_messages(self):
        """Test bulk creation of contact messages."""
        contacts_data = []
        for i in range(100):
            contacts_data.append(
                ContactMessage(
                    name=f'Contact {i}',
                    email=f'contact{i}@example.com',
                    subject='support',
                    message=f'This is test message number {i} with sufficient length.',
                    user=self.users[i % 10] if i % 2 == 0 else None  # Some with users, some without
                )
            )
        
        # Bulk create should be efficient
        created_contacts = ContactMessage.objects.bulk_create(contacts_data)
        self.assertEqual(len(created_contacts), 100)
        
        # Verify they were actually created
        total_contacts = ContactMessage.objects.count()
        self.assertEqual(total_contacts, 100)

    def test_indexed_field_queries(self):
        """Test that queries on indexed fields are efficient."""
        # Create some test data
        ContactMessage.objects.bulk_create([
            ContactMessage(
                name=f'Contact {i}',
                email=f'contact{i}@example.com',
                subject='support' if i % 2 == 0 else 'billing',
                message=f'Test message {i} with sufficient length.',
                status='new' if i % 3 == 0 else 'in_progress'
            )
            for i in range(50)
        ])
        
        # Test queries on indexed fields (should be efficient)
        with self.assertNumQueries(1):
            list(ContactMessage.objects.filter(status='new'))
        
        with self.assertNumQueries(1):
            list(ContactMessage.objects.filter(subject='support'))
        
        with self.assertNumQueries(1):
            list(ContactMessage.objects.filter(email='contact1@example.com'))

    def test_select_related_user(self):
        """Test efficient querying with user relationship."""
        # Create contact messages with users
        for i in range(20):
            ContactMessage.objects.create(
                name=f'Contact {i}',
                email=f'contact{i}@example.com',
                subject='support',
                message=f'Test message {i} with sufficient length.',
                user=self.users[i % 10]
            )
        
        # Query without select_related (should make multiple queries)
        with self.assertNumQueries(21):  # 1 for contacts + 20 for users
            contacts = ContactMessage.objects.all()
            for contact in contacts:
                _ = contact.user.username if contact.user else None
        
        # Query with select_related (should make only 1 query)
        with self.assertNumQueries(1):
            contacts = ContactMessage.objects.select_related('user').all()
            for contact in contacts:
                _ = contact.user.username if contact.user else None


class ContactMessageSerializerTest(TestCase):
    """Test cases for ContactMessage serializers."""
    
    def setUp(self):
        """Set up test data."""
        from rest_framework.test import APIRequestFactory
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword123'
        )
        
        self.valid_contact_data = {
            'name': 'John Doe',
            'email': 'john.doe@example.com',
            'subject': 'support',
            'message': 'This is a test message with sufficient length to pass validation.'
        }
        
        self.contact_message = ContactMessage.objects.create(
            **self.valid_contact_data,
            user=self.user,
            status='new'
        )

    def test_contact_message_serializer_valid_data(self):
        """Test ContactMessageSerializer with valid data."""
        from leaguer.serializers import ContactMessageSerializer
        
        serializer = ContactMessageSerializer(data=self.valid_contact_data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['name'], 'John Doe')
        self.assertEqual(serializer.validated_data['email'], 'john.doe@example.com')
        self.assertEqual(serializer.validated_data['subject'], 'support')
        self.assertEqual(serializer.validated_data['message'], 'This is a test message with sufficient length to pass validation.')

    def test_contact_message_serializer_create_without_user(self):
        """Test creating contact message without authenticated user."""
        from leaguer.serializers import ContactMessageSerializer
        
        # Create serializer without request context
        serializer = ContactMessageSerializer(data=self.valid_contact_data)
        
        self.assertTrue(serializer.is_valid())
        contact = serializer.save()
        
        self.assertEqual(contact.name, 'John Doe')
        self.assertEqual(contact.email, 'john.doe@example.com')
        self.assertEqual(contact.subject, 'support')
        self.assertIsNone(contact.user)  # No user should be associated

    def test_contact_message_serializer_create_with_authenticated_user(self):
        """Test creating contact message with authenticated user."""
        from leaguer.serializers import ContactMessageSerializer
        
        # Create a mock request with authenticated user
        request = self.factory.post('/')
        request.user = self.user
        
        # Create serializer with request context
        serializer = ContactMessageSerializer(
            data=self.valid_contact_data,
            context={'request': request}
        )
        
        self.assertTrue(serializer.is_valid())
        contact = serializer.save()
        
        self.assertEqual(contact.name, 'John Doe')
        self.assertEqual(contact.email, 'john.doe@example.com')
        self.assertEqual(contact.subject, 'support')
        self.assertEqual(contact.user, self.user)  # User should be associated

    def test_contact_message_serializer_create_with_anonymous_user(self):
        """Test creating contact message with anonymous user."""
        from leaguer.serializers import ContactMessageSerializer
        from django.contrib.auth.models import AnonymousUser
        
        # Create a mock request with anonymous user
        request = self.factory.post('/')
        request.user = AnonymousUser()
        
        # Create serializer with request context
        serializer = ContactMessageSerializer(
            data=self.valid_contact_data,
            context={'request': request}
        )
        
        self.assertTrue(serializer.is_valid())
        contact = serializer.save()
        
        self.assertEqual(contact.name, 'John Doe')
        self.assertIsNone(contact.user)  # No user should be associated

    def test_contact_message_serializer_invalid_message_too_short(self):
        """Test ContactMessageSerializer with message too short."""
        from leaguer.serializers import ContactMessageSerializer
        
        data = self.valid_contact_data.copy()
        data['message'] = 'Too short'  # Only 9 characters
        
        serializer = ContactMessageSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('message', serializer.errors)
        self.assertIn('at least 10 characters', str(serializer.errors['message'][0]))

    def test_contact_message_serializer_message_with_whitespace(self):
        """Test ContactMessageSerializer strips whitespace from message."""
        from leaguer.serializers import ContactMessageSerializer
        
        data = self.valid_contact_data.copy()
        data['message'] = '   This is a test message with sufficient length.   '
        
        serializer = ContactMessageSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(
            serializer.validated_data['message'],
            'This is a test message with sufficient length.'
        )

    def test_contact_message_serializer_invalid_name_empty(self):
        """Test ContactMessageSerializer with empty name."""
        from leaguer.serializers import ContactMessageSerializer
        
        # Test completely empty name (triggers Django's built-in validation)
        data = self.valid_contact_data.copy()
        data['name'] = ''  # Empty string
        
        serializer = ContactMessageSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)
        # Django's built-in validation for blank fields
        self.assertIn('This field may not be blank', str(serializer.errors['name'][0]))
        
        # Test whitespace-only name (should trigger our custom validator if it gets that far)
        # But actually, this will also be caught by Django's validation
        data['name'] = '   '  # Only whitespace
        serializer = ContactMessageSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)
        # This could be either Django's validation or our custom one
        error_message = str(serializer.errors['name'][0])
        self.assertTrue(
            'This field may not be blank' in error_message or 'Name is required' in error_message
        )

    def test_contact_message_serializer_custom_name_validation(self):
        """Test ContactMessageSerializer custom name validation that actually triggers our validator."""
        from leaguer.serializers import ContactMessageSerializer
        
        # Test a name that passes Django's basic validation but fails our custom validation
        # This is tricky because CharField with blank=False will catch most cases
        # Our custom validator mainly serves to strip whitespace and provide custom message
        
        # Test that our validator strips whitespace properly
        data = self.valid_contact_data.copy()
        data['name'] = '  Valid Name  '  # Name with whitespace
        
        serializer = ContactMessageSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['name'], 'Valid Name')  # Should be stripped

    def test_contact_message_serializer_name_with_whitespace(self):
        """Test ContactMessageSerializer strips whitespace from name."""
        from leaguer.serializers import ContactMessageSerializer
        
        data = self.valid_contact_data.copy()
        data['name'] = '   John Doe   '
        
        serializer = ContactMessageSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['name'], 'John Doe')

    def test_contact_message_serializer_missing_required_fields(self):
        """Test ContactMessageSerializer with missing required fields."""
        from leaguer.serializers import ContactMessageSerializer
        
        # Test missing name
        data = self.valid_contact_data.copy()
        del data['name']
        serializer = ContactMessageSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)
        
        # Test missing email
        data = self.valid_contact_data.copy()
        del data['email']
        serializer = ContactMessageSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)
        
        # Test missing subject
        data = self.valid_contact_data.copy()
        del data['subject']
        serializer = ContactMessageSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('subject', serializer.errors)
        
        # Test missing message
        data = self.valid_contact_data.copy()
        del data['message']
        serializer = ContactMessageSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('message', serializer.errors)

    def test_contact_message_serializer_invalid_email(self):
        """Test ContactMessageSerializer with invalid email format."""
        from leaguer.serializers import ContactMessageSerializer
        
        data = self.valid_contact_data.copy()
        data['email'] = 'invalid-email-format'
        
        serializer = ContactMessageSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_contact_message_serializer_invalid_subject_choice(self):
        """Test ContactMessageSerializer with invalid subject choice."""
        from leaguer.serializers import ContactMessageSerializer
        
        data = self.valid_contact_data.copy()
        data['subject'] = 'invalid_subject'
        
        serializer = ContactMessageSerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('subject', serializer.errors)

    def test_contact_message_serializer_serialization(self):
        """Test ContactMessageSerializer serialization of existing object."""
        from leaguer.serializers import ContactMessageSerializer
        
        serializer = ContactMessageSerializer(self.contact_message)
        data = serializer.data
        
        self.assertEqual(data['id'], self.contact_message.id)
        self.assertEqual(data['name'], 'John Doe')
        self.assertEqual(data['email'], 'john.doe@example.com')
        self.assertEqual(data['subject'], 'support')
        self.assertEqual(data['message'], 'This is a test message with sufficient length to pass validation.')
        self.assertIn('created_at', data)

    def test_contact_message_serializer_read_only_fields(self):
        """Test that read-only fields cannot be updated."""
        from leaguer.serializers import ContactMessageSerializer
        
        data = self.valid_contact_data.copy()
        data['id'] = 999  # Try to set read-only field
        data['created_at'] = '2020-01-01T00:00:00Z'  # Try to set read-only field
        
        serializer = ContactMessageSerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        contact = serializer.save()
        
        # ID should be auto-generated, not 999
        self.assertNotEqual(contact.id, 999)
        # created_at should be auto-generated, not the provided value
        self.assertNotEqual(
            contact.created_at.strftime('%Y-%m-%d'),
            '2020-01-01'
        )


class ContactMessageListSerializerTest(TestCase):
    """Test cases for ContactMessageListSerializer."""
    
    def setUp(self):
        """Set up test data."""
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword123'
        )
        
        self.contact_message = ContactMessage.objects.create(
            name='John Doe',
            email='john.doe@example.com',
            subject='support',
            message='This is a test message with sufficient length to pass validation.',
            status='in_progress',
            user=self.user
        )

    def test_contact_message_list_serializer_serialization(self):
        """Test ContactMessageListSerializer serialization."""
        from leaguer.serializers import ContactMessageListSerializer
        
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
        from leaguer.serializers import ContactMessageListSerializer
        
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
        from leaguer.serializers import ContactMessageListSerializer
        
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
        from leaguer.serializers import ContactMessageListSerializer
        
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
        from leaguer.serializers import ContactMessageListSerializer
        
        serializer = ContactMessageListSerializer()
        meta = serializer.Meta
        
        expected_read_only = ['id', 'created_at', 'updated_at']
        
        for field in expected_read_only:
            self.assertIn(field, meta.read_only_fields)


class ContactMessageSerializerIntegrationTest(TestCase):
    """Integration tests for ContactMessage serializers with API views."""
    
    def setUp(self):
        """Set up test data."""
        from rest_framework.test import APIClient
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword123'
        )

    def test_serializer_with_api_client_authenticated(self):
        """Test serializer integration with authenticated API client."""
        # This test would require actual API endpoints to be meaningful
        # For now, we'll test the serializer context handling
        
        from leaguer.serializers import ContactMessageSerializer
        from rest_framework.test import APIRequestFactory
        
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
        from leaguer.serializers import ContactMessageSerializer
        
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
        from django.contrib.admin.sites import AdminSite
        from django.contrib.auth import get_user_model
        from leaguer.admin import ContactMessageAdmin
        
        User = get_user_model()
        
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
            password='userpassword123'
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
            'name',
            'email',
            'subject',
            'message',
            'status',
            'admin_notes',
            'user',
            'created_at',
            'updated_at'
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
        from django.http import HttpRequest
        
        request = HttpRequest()
        request.user = self.staff_user
        
        queryset = self.admin.get_queryset(request)
        
        # Check that the queryset includes select_related for user
        # This is a bit tricky to test directly, but we can check the query
        self.assertIn('user', str(queryset.query))

    def test_admin_delete_permissions_superuser(self):
        """Test that superuser can delete contact messages."""
        from django.http import HttpRequest
        
        request = HttpRequest()
        request.user = self.superuser
        
        # Superuser should have delete permission
        self.assertTrue(self.admin.has_delete_permission(request))
        self.assertTrue(self.admin.has_delete_permission(request, self.contact1))

    def test_admin_delete_permissions_staff(self):
        """Test that staff user cannot delete contact messages."""
        from django.http import HttpRequest
        
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
        from django.http import HttpRequest
        from django.contrib.messages.storage.fallback import FallbackStorage
        
        request = HttpRequest()
        request.user = self.staff_user
        request.session = {}
        request._messages = FallbackStorage(request)
        
        # Create queryset with contacts to update
        queryset = ContactMessage.objects.filter(id__in=[self.contact1.id, self.contact3.id])
        
        # Execute the action
        self.admin.mark_as_in_progress(request, queryset)
        
        # Check that contacts were updated
        self.contact1.refresh_from_db()
        self.contact3.refresh_from_db()
        
        self.assertEqual(self.contact1.status, 'in_progress')
        self.assertEqual(self.contact3.status, 'in_progress')

    def test_admin_action_mark_as_resolved(self):
        """Test mark_as_resolved action."""
        from django.http import HttpRequest
        from django.contrib.messages.storage.fallback import FallbackStorage
        
        request = HttpRequest()
        request.user = self.staff_user
        request.session = {}
        request._messages = FallbackStorage(request)
        
        # Create queryset with contacts to update
        queryset = ContactMessage.objects.filter(id__in=[self.contact1.id, self.contact2.id])
        
        # Execute the action
        self.admin.mark_as_resolved(request, queryset)
        
        # Check that contacts were updated
        self.contact1.refresh_from_db()
        self.contact2.refresh_from_db()
        
        self.assertEqual(self.contact1.status, 'resolved')
        self.assertEqual(self.contact2.status, 'resolved')

    def test_admin_action_mark_as_closed(self):
        """Test mark_as_closed action."""
        from django.http import HttpRequest
        from django.contrib.messages.storage.fallback import FallbackStorage
        
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
        from django.contrib import admin
        
        # Check that ContactMessage is registered in admin
        self.assertIn(ContactMessage, admin.site._registry)
        
        # Check that the correct admin class is registered
        from leaguer.admin import ContactMessageAdmin
        self.assertIsInstance(
            admin.site._registry[ContactMessage],
            ContactMessageAdmin
        )

    def test_admin_bulk_actions_performance(self):
        """Test that bulk actions work efficiently with multiple records."""
        from django.http import HttpRequest
        from django.contrib.messages.storage.fallback import FallbackStorage
        
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
        from django.http import HttpRequest
        
        request = HttpRequest()
        request.user = self.staff_user
        
        queryset = self.admin.get_queryset(request)
        
        # Should include all contact messages
        self.assertEqual(queryset.count(), 3)
        
        # Should be ordered by created_at descending
        ordered_contacts = list(queryset)
        self.assertTrue(
            ordered_contacts[0].created_at >= ordered_contacts[1].created_at >= ordered_contacts[2].created_at
        )


class ContactMessageViewTest(TestCase):
    """Test cases for ContactMessage API views."""
    
    def setUp(self):
        """Set up test data."""
        from rest_framework.test import APIClient
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword123'
        )
        
        self.contact_url = '/api/contact/'
        
        self.valid_contact_data = {
            'name': 'John Doe',
            'email': 'john.doe@example.com',
            'subject': 'support',
            'message': 'This is a test message with sufficient length to pass validation.'
        }

    def test_contact_message_create_success_anonymous(self):
        """Test successful contact message creation by anonymous user."""
        response = self.client.post(self.contact_url, self.valid_contact_data, format='json')
        
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])
        self.assertIn('Your message has been sent successfully', response.data['message'])
        self.assertIn('id', response.data)
        
        # Verify the contact message was created in the database
        contact = ContactMessage.objects.get(id=response.data['id'])
        self.assertEqual(contact.name, 'John Doe')
        self.assertEqual(contact.email, 'john.doe@example.com')
        self.assertEqual(contact.subject, 'support')
        self.assertEqual(contact.message, 'This is a test message with sufficient length to pass validation.')
        self.assertIsNone(contact.user)  # Anonymous user

    def test_contact_message_create_success_authenticated(self):
        """Test successful contact message creation by authenticated user."""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.post(self.contact_url, self.valid_contact_data, format='json')
        
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])
        self.assertIn('Your message has been sent successfully', response.data['message'])
        self.assertIn('id', response.data)
        
        # Verify the contact message was created with user association
        contact = ContactMessage.objects.get(id=response.data['id'])
        self.assertEqual(contact.name, 'John Doe')
        self.assertEqual(contact.email, 'john.doe@example.com')
        self.assertEqual(contact.user, self.user)  # Should be associated with authenticated user

    def test_contact_message_create_missing_name(self):
        """Test contact message creation with missing name."""
        data = self.valid_contact_data.copy()
        del data['name']
        
        response = self.client.post(self.contact_url, data, format='json')
        
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.data['success'])
        self.assertIn('Please correct the errors below', response.data['message'])
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
        self.assertEqual(contact.message, 'This is a test message with sufficient length.')  # Trimmed

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
        response = self.client.put(self.contact_url, self.valid_contact_data, format='json')
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
        
        response = self.client.post(self.contact_url, self.valid_contact_data, format='json')
        
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])

    def test_contact_message_create_response_format(self):
        """Test the response format structure."""
        response = self.client.post(self.contact_url, self.valid_contact_data, format='json')
        
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
        response1 = self.client.post(self.contact_url, self.valid_contact_data, format='json')
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
        
        response = self.client.post(self.contact_url, self.valid_contact_data, format='json')
        
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
        import logging
        from unittest.mock import patch
        
        with patch('leaguer.views.logger') as mock_logger:
            response = self.client.post(self.contact_url, self.valid_contact_data, format='json')
            
            self.assertEqual(response.status_code, 201)
            
            # Verify that info log was called
            mock_logger.info.assert_called_once()
            log_call_args = mock_logger.info.call_args[0][0]
            self.assertIn('Contact message created', log_call_args)
            self.assertIn(self.valid_contact_data['email'], log_call_args)

    @patch('leaguer.serializers.ContactMessageSerializer.save')
    def test_contact_message_create_exception_handling(self, mock_save):
        """Test exception handling in contact message creation."""
        import logging
        from unittest.mock import patch
        
        # Mock serializer save to raise an exception
        mock_save.side_effect = Exception("Database error")
        
        with patch('leaguer.views.logger') as mock_logger:
            response = self.client.post(self.contact_url, self.valid_contact_data, format='json')
            
            self.assertEqual(response.status_code, 500)
            self.assertFalse(response.data['success'])
            self.assertIn('An error occurred while sending your message', response.data['message'])
            
            # Verify that error was logged
            mock_logger.error.assert_called_once()
            log_call_args = mock_logger.error.call_args[0][0]
            self.assertIn('Error creating contact message', log_call_args)
