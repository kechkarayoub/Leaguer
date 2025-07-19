"""
Custom exceptions for the leaguer project.
"""


class LeaguerBaseException(Exception):
    """Base exception for all leaguer-related exceptions."""
    pass


class GeolocationException(LeaguerBaseException):
    """Exception raised when geolocation services fail."""
    pass


class FileUploadException(LeaguerBaseException):
    """Exception raised when file upload fails."""
    pass


class MessageSendException(LeaguerBaseException):
    """Exception raised when message sending fails."""
    pass


class PhoneNumberException(LeaguerBaseException):
    """Exception raised for phone number related issues."""
    pass


class EmailException(LeaguerBaseException):
    """Exception raised for email related issues."""
    pass


class ValidationException(LeaguerBaseException):
    """Exception raised for validation failures."""
    pass
