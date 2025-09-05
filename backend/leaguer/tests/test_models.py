# pylint: disable=protected-access,too-many-instance-attributes
"""
Comprehensive test suite for leaguer models.

This module provides tests for:
- ContactMessage model functionality
- ContactMessageInternationalization model functionality
- ContactMessageQuerySet functionality
- ContactMessagePerformance
- ContactMessageSerializer
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils.translation import activate, gettext_lazy as _
from django.utils import timezone as django_timezone
from rest_framework.test import APIRequestFactory

from leaguer.models import ContactMessage
from leaguer.serializers import ContactMessageSerializer

User = get_user_model()


class ContactMessageModelTest(TestCase):
    """Test cases for ContactMessage model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword123',
            current_language='en',
        )
        self.valid_contact_data = {
            'name': 'John Doe',
            'email': 'john.doe@example.com',
            'subject': 'support',
            'message': 'This is a test message with sufficient length to pass validation.',
            'user': self.user
        }
        activate(self.user.current_language)

    def test_contact_message_creation_success(self):
        """Test successful creation of ContactMessage."""
        contact = ContactMessage.objects.create(**self.valid_contact_data)
        self.assertEqual(contact.name, 'John Doe')
        self.assertEqual(contact.email, 'john.doe@example.com')
        self.assertEqual(contact.subject, 'support')
        self.assertEqual(contact.message,
                'This is a test message with sufficient length to pass validation.')
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
        expected_str = f"John Doe - Technical Support ({contact.created_at.strftime(
            '%Y-%m-%d')})"
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
        self.assertEqual(contact_with_notes.admin_notes,
                         'This is an admin note for internal use.')

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
        _contact = ContactMessage.objects.create(**self.contact_data)
        # The choices should use gettext_lazy for translation
        choices_dict = dict(ContactMessage.SUBJECT_CHOICES)
        # Verify all expected choices exist
        expected_subjects = ['support', 'billing', 'feature', 'partnership', 'other']
        for subject in expected_subjects:
            self.assertIn(subject, choices_dict)

    def test_status_choices_translations(self):
        """Test that status choices support translation."""
        _contact = ContactMessage.objects.create(**self.contact_data)
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
        _contact1 = ContactMessage.objects.create(
            name='Alice Smith',
            email='alice@example.com',
            subject='support',
            message='Technical support message with sufficient length.',
            status='new',
            user=self.user1
        )
        _contact2 = ContactMessage.objects.create(
            name='Bob Johnson',
            email='bob@example.com',
            subject='billing',
            message='Billing inquiry message with sufficient length.',
            status='in_progress',
            user=self.user2
        )
        _contact3 = ContactMessage.objects.create(
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
        # Filter by the actual date when the contacts were created
        # Since all contacts are created in the same test, they should all have the same date
        actual_date = ContactMessage.objects.filter().values_list('created_at__date', flat=True)[0]
        # All contacts should be created on the same date as our test contacts
        today_contacts = ContactMessage.objects.filter(created_at__date=actual_date)
        self.assertEqual(today_contacts.count(), 3)
        # Test filtering by created_at range using datetime range instead of date
        start_of_day = django_timezone.make_aware(
            django_timezone.datetime.combine(actual_date,
                                             django_timezone.datetime.min.time())
        )
        end_of_day = django_timezone.make_aware(
            django_timezone.datetime.combine(actual_date,
                                             django_timezone.datetime.max.time())
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
                    user=self.users[i % 10] if i % 2 == 0 else None,
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
                user=self.users[i % 10],
            )
        # Query without select_related (should make multiple queries)
        with self.assertNumQueries(21):  # 1 for contacts + 20 for users
            contacts = ContactMessage.objects.all()
            for contact in contacts:
                __ = contact.user.username if contact.user else None
        # Query with select_related (should make only 1 query)
        with self.assertNumQueries(1):
            contacts = ContactMessage.objects.select_related('user').all()
            for contact in contacts:
                __ = contact.user.username if contact.user else None


class ContactMessageSerializerTest(TestCase):
    """Test cases for ContactMessage serializers."""

    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username='testuser',
            email='testuser@example.com',
            password='testpassword123',
            current_language='en',
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
        activate(self.user.current_language)

    def test_contact_message_serializer_valid_data(self):
        """Test ContactMessageSerializer with valid data."""
        serializer = ContactMessageSerializer(data=self.valid_contact_data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['name'], 'John Doe')
        self.assertEqual(serializer.validated_data['email'], 'john.doe@example.com')
        self.assertEqual(serializer.validated_data['subject'], 'support')
        self.assertEqual(serializer.validated_data['message'],
                'This is a test message with sufficient length to pass validation.')

    def test_contact_message_serializer_create_without_user(self):
        """Test creating contact message without authenticated user."""
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
        data = self.valid_contact_data.copy()
        data['message'] = 'Too short'  # Only 9 characters
        serializer = ContactMessageSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('message', serializer.errors)
        self.assertIn('at least 10 characters', str(serializer.errors['message'][0]))

    def test_contact_message_serializer_message_with_whitespace(self):
        """Test ContactMessageSerializer strips whitespace from message."""        
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
        """Test ContactMessageSerializer custom name validation that actually
        triggers our validator."""
        # Test a name that passes Django's basic validation but fails our custom validation
        # This is tricky because CharField with blank=False will catch most cases
        # Our custom validator mainly serves to strip whitespace and provide custom message
        # Test that our validator strips whitespace properly
        data = self.valid_contact_data.copy()
        data['name'] = '  Valid Name  '  # Name with whitespace
        serializer = ContactMessageSerializer(data=data)
        self.assertTrue(serializer.is_valid())
         # Should be stripped
        self.assertEqual(serializer.validated_data['name'], 'Valid Name')

    def test_contact_message_serializer_name_with_whitespace(self):
        """Test ContactMessageSerializer strips whitespace from name."""        
        data = self.valid_contact_data.copy()
        data['name'] = '   John Doe   '
        serializer = ContactMessageSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['name'], 'John Doe')

    def test_contact_message_serializer_missing_required_fields(self):
        """Test ContactMessageSerializer with missing required fields."""        
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
        data = self.valid_contact_data.copy()
        data['email'] = 'invalid-email-format'
        serializer = ContactMessageSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('email', serializer.errors)

    def test_contact_message_serializer_invalid_subject_choice(self):
        """Test ContactMessageSerializer with invalid subject choice."""        
        data = self.valid_contact_data.copy()
        data['subject'] = 'invalid_subject'
        serializer = ContactMessageSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('subject', serializer.errors)

    def test_contact_message_serializer_serialization(self):
        """Test ContactMessageSerializer serialization of existing object."""        
        serializer = ContactMessageSerializer(self.contact_message)
        data = serializer.data
        self.assertEqual(data['id'], self.contact_message.id)
        self.assertEqual(data['name'], 'John Doe')
        self.assertEqual(data['email'], 'john.doe@example.com')
        self.assertEqual(data['subject'], 'support')
        self.assertEqual(data['message'],
                'This is a test message with sufficient length to pass validation.')
        self.assertIn('created_at', data)

    def test_contact_message_serializer_read_only_fields(self):
        """Test that read-only fields cannot be updated."""        
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
