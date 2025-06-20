library;

/// A customizable button widget with support for loading indicators, icons, and various states.
/// 
/// This widget provides a reusable button component that can:
/// - Display text and optional icons
/// - Show a loading indicator
/// - Handle enabled/disabled states
/// - Support custom margins
/// 
/// Example usage:
/// ```dart
/// CustomButton(
///   text: 'Submit',
///   onPressed: () => submitForm(),
///   showLoader: isLoading,
///   icon: Icon(Icons.send),
/// )
/// ```
/// 

import 'package:flutter/material.dart';

/// A reusable custom button widget with extended functionality.
///
/// This button supports:
/// - Standard button functionality with [onPressed] callback
/// - Loading state visualization with [showLoader]
/// - Enabled/disabled state with [isEnabled]
/// - Optional leading [icon]
/// - Custom [margin] around the button
/// - Custom [keyWidget] for testing and identification
class CustomButton extends StatelessWidget {
  /// The callback that is called when the button is pressed.
  /// 
  /// If null, the button will be disabled.
  final VoidCallback? onPressed;
  
  /// The text to display on the button.
  /// 
  /// This is the primary label that users will see.
  final String text;
  
  /// Whether to show a loading indicator instead of the normal button state.
  /// 
  /// When true, a circular progress indicator will be shown before the text.
  final bool showLoader;
  
  /// Whether the button is enabled and interactive.
  /// 
  /// When false, the button will appear disabled and won't respond to taps.
  final bool isEnabled;
  
  /// An optional icon to display before the text.
  /// 
  /// This can be any widget, but typically an [Icon] is used.
  final Widget? icon;

  /// The margin around the button.
  /// 
  /// If not provided, defaults to `EdgeInsets.only(bottom: 10)`.
  final EdgeInsetsGeometry? margin;
  
  /// An optional key to identify this widget.
  /// 
  /// Useful for integration tests and widget identification.
  final Key? keyWidget;

  final Color? backgroundColor; // Background color for button

  final BorderRadiusGeometry? borderRadius; // Border radius for button

  /// Creates a [CustomButton].
  ///
  /// The [text] and [onPressed] parameters are required.
  ///
  /// The [showLoader] parameter defaults to false.
  /// The [isEnabled] parameter defaults to true.
  const CustomButton({
    super.key, 
    required this.text,
    required this.onPressed,
    this.showLoader = false,
    this.isEnabled = true,
    this.icon,
    this.margin,
    this.keyWidget,
    this.backgroundColor,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin ?? const EdgeInsets.only(bottom: 10),
      child: ElevatedButton(
        style: backgroundColor == null || borderRadius == null ? null : ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          shape: borderRadius == null ? null : RoundedRectangleBorder(
            borderRadius: borderRadius ?? BorderRadius.circular(8),
          ),
        ),
        key: keyWidget,
        onPressed: isEnabled ? onPressed : null,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (showLoader)
              Padding(
                padding: const EdgeInsets.only(right: 8.0),
                child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    strokeWidth: 2.0,
                  ),
                ),
              ),
            if (icon != null) ...[
              icon!,
              const SizedBox(width: 8),
            ],
            Text(text),
          ],
        ),
      ),
    );
  }
}
