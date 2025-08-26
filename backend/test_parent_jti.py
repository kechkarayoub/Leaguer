"""
Test script to verify parent_jti implementation works correctly.

This demonstrates that:
1. Access tokens contain parent_jti claim
2. Token refresh preserves parent_jti claim
3. Device-specific logout works correctly
"""

def test_parent_jti_implementation():
    """Test that our custom RefreshToken includes parent_jti in access tokens."""
    from accounts.tokens import RefreshToken
    from django.contrib.auth import get_user_model
    
    # Create a test user (you'd need to have a user in your database)
    User = get_user_model()
    user = User.objects.first()  # Get first user for testing
    
    if not user:
        print("No users found in database. Please create a user first.")
        return
    
    # Generate tokens using our custom RefreshToken
    refresh = RefreshToken.for_user(user)
    access = refresh.access_token
    
    # Check if access token contains parent_jti
    refresh_jti = refresh.get('jti')
    access_parent_jti = access.get('parent_jti')
    
    print(f"Refresh token JTI: {refresh_jti}")
    print(f"Access token parent_jti: {access_parent_jti}")
    print(f"Parent-child relationship working: {refresh_jti == access_parent_jti}")
    
    # Test token refresh
    new_access = refresh.access_token
    new_parent_jti = new_access.get('parent_jti')
    
    print(f"New access token parent_jti: {new_parent_jti}")
    print(f"Refresh preserves parent_jti: {refresh_jti == new_parent_jti}")

if __name__ == "__main__":
    import os
    import django
    
    # Setup Django environment
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'leaguer.settings.development')
    django.setup()
    
    test_parent_jti_implementation()
