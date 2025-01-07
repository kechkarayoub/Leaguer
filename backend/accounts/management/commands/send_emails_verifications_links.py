from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.core.validators import validate_email
from ...models import User


class Command(BaseCommand):
    help = """
        This command will sent verification links to emails that are not yet verified.
        Ex of execution:
            python manage.py send_emails_verifications_links
    """

    # noinspection PyMethodMayBeStatic
    def add_arguments(self, parser):
        # Parameters for the command
        parser.add_argument(
            '--email', '-e', type=str,
            help='To send verification link to a specific email address.',
        )

    # noinspection PyMethodMayBeStatic
    def handle(self, *args, **options):
        email = options.get('email')
        self.stdout.write(f'Begin executing send_emails_verifications_links command.')
        if email:
            try:
                validate_email(email)
            except ValidationError:
                self.stdout.write(f'Command not executed due to invalid email parameter: {email}.')
                return
        result = User.send_emails_verifications_links(email=email)
        self.stdout.write(f'{result}')
        self.stdout.write(f'Ending executing send_emails_verifications_links command.')
