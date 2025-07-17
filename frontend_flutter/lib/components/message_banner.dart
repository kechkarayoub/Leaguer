// Main entry point and app configuration for the Flutter application.
// Handles routing, localization, storage, and platform-specific setup.
import 'package:flutter/material.dart';


/// A reusable message banner widget for displaying dismissible messages.
class MessageBanner extends StatelessWidget {
  // The distance from the top of the parent widget (used for stacking multiple banners)
  final double top;
  // The distance from the left of the parent widget
  final double left;
  // The distance from the right of the parent widget
  final double right;
  // The background color of the banner
  final Color bgColor;
  // The padding inside the banner
  final EdgeInsets padding;
  // The message text to display
  final String message;
  // Callback when the close button is pressed (if null, no close button is shown)
  final VoidCallback? onClose;
  // Maximum number of lines for the message text
  final int maxLines;
  // How to handle text overflow (e.g., ellipsis)
  final TextOverflow overflow;
  // Custom text style for the message
  final TextStyle? textStyle;
  // Text alignment for the message
  final TextAlign textAlign;
  // Optional icon to display at the start of the banner
  final Widget? icon;

  /// Creates a [MessageBanner].
  ///
  /// [message] is required. All other parameters have sensible defaults.
  const MessageBanner({
    super.key,
    this.top = 0.0,
    this.left = 0.0,
    this.right = 0.0,
    this.bgColor = const Color(0xFFD32F2F), // Colors.red.shade700
    this.padding = const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
    required this.message,
    this.onClose,
    this.maxLines = 2,
    this.overflow = TextOverflow.ellipsis,
    this.textStyle,
    this.textAlign = TextAlign.center,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    // Positioned widget allows the banner to be placed anywhere in a Stack
    return Positioned(
      top: top,
      left: left,
      right: right,
      child: Material(
        color: Colors.transparent,
        child: Container(
          color: bgColor,
          padding: padding,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Show the provided icon or a default error icon
              icon ?? const Icon(Icons.error_outline, color: Colors.white),
              const SizedBox(width: 8),
              // The message text, expanded to fill available space
              Expanded(
                child: Text(
                  message,
                  style: textStyle ?? const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  textAlign: textAlign,
                  maxLines: maxLines,
                  overflow: overflow,
                ),
              ),
              // Show a close button if onClose is provided
              if(onClose != null)
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: onClose,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

