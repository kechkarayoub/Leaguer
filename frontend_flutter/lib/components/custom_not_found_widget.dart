// CustomNotFoundWidget: A reusable widget for displaying a custom 404 (Not Found) page.
// Shows an error icon, a localized message, and Home/Logout buttons depending on authentication state.
//
// Usage:
//   - isLoggedIn: Whether the user is authenticated (shows Logout if true)
//   - l10n: Localization instance for translations
//   - onHome: Callback for Home button
//   - onLogout: Optional callback for Logout button
import 'package:flutter/material.dart';
import 'package:frontend_flutter/l10n/l10n.dart';

/// A custom widget to display a 404 Not Found error page.
///
/// Shows an error icon, a localized message, and Home/Logout buttons.
/// - [isLoggedIn]: Whether the user is authenticated (shows Logout button if true).
/// - [l10n]: Localization instance for translations.
/// - [onHome]: Callback for Home button.
/// - [onLogout]: Optional callback for Logout button.
class CustomNotFoundWidget extends StatelessWidget {
  /// Whether the user is logged in (shows Logout button if true).
  final bool isLoggedIn;
  /// Localization instance for translations.
  final L10n l10n;
  /// Callback for Home button.
  final VoidCallback onHome;
  /// Optional callback for Logout button.
  final VoidCallback? onLogout;
  final Map<String, dynamic>? arguments;

  /// Creates a custom 404 Not Found widget.
  const CustomNotFoundWidget({
    super.key,
    required this.l10n,
    required this.isLoggedIn,
    required this.onHome,
    this.onLogout,
    this.arguments,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Error icon
          Icon(Icons.error_outline, size: 64, color: Colors.redAccent),
          const SizedBox(height: 16),
          // Localized 404 message
          Text(
            l10n.translate("Page Not Found", Localizations.localeOf(context).languageCode),
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          // Home button
          ElevatedButton.icon(
            icon: const Icon(Icons.home),
            label: Text(l10n.translate("Home", Localizations.localeOf(context).languageCode)),
            onPressed: onHome,
          ),
          // Logout button (if logged in)
          if (isLoggedIn && onLogout != null) ...[
            const SizedBox(height: 12),
            ElevatedButton.icon(
              icon: const Icon(Icons.logout),
              label: Text(l10n.translate("Logout", Localizations.localeOf(context).languageCode)),
              onPressed: onLogout,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
