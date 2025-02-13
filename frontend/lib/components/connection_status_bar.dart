
import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:frontend/l10n/l10n.dart';

// Create a Dio instance for making HTTP requests
Dio _dio = Dio();

/// Checks if the device has an active internet connection.
/// Sends a GET request to a reliable endpoint and checks the response status code.
Future<bool> hasInternet(Dio dio) async {

  try {
     final response = await dio.get(
      'https://httpbin.org/get',
      options: Options(
        receiveTimeout: Duration(seconds: 2), // Timeout for response
        sendTimeout: Duration(seconds: 1), // Timeout for sending request
      ),
    );
    return response.statusCode == 200; // Return true if the request is successful
  } catch (e) {
    return false; // Return false if there's an error (e.g., no internet)
  }
}

/// A widget that monitors the internet connection status and displays a banner
/// when the connection is lost or restored.
class ConnectionStatusWidget extends StatefulWidget {
  final Widget child; // The main content of the app
  final L10n l10n; // Localization instance for translating text
  final Dio? dio; // Dio instance

  const ConnectionStatusWidget({super.key, required this.child, required this.l10n, this.dio});

  @override
  ConnectionStatusWidgetState createState() => ConnectionStatusWidgetState();
}

class ConnectionStatusWidgetState extends State<ConnectionStatusWidget> {
  double internetStatus = 0; // 1: connected, -1: unconnected, 0: default;
  late Timer _timer; // Timer to hide the connection restored banner
  bool isUnmounted = false;

  @override
  void initState() {
    super.initState();
    // Start checking the internet connection on widget initialization
    internetCheck(true);
  }

  /// Checks the internet connection and updates the state accordingly.
  /// [isFirstCheck] is true during the initial check and false for subsequent checks.
  void internetCheck(bool isFirstCheck) async {
    if(isUnmounted){
      return;
    }
    bool connected = await hasInternet(widget.dio??_dio);
    if(isFirstCheck){
      // Update the state only if it's the first check and there's no internet
      if(!connected && internetStatus == 0){
        setState(() {
          internetStatus = -1;
        });
      }
    }
    else{
      // Update the state based on the connection status and only if it is changed
      double newInternetStatus = connected ? 1 : -1;
      if(newInternetStatus != internetStatus){
        setState(() {
          internetStatus = connected ? 1 : -1;
        });
        // If the connection is restored, start a timer to hide the banner after 3 seconds
        if(connected){
          try{
            _timer.cancel();  // Cancel any existing timer
          }
          catch(e){
            // Ignore errors if the timer is not initialized
          }
          _timer = Timer(const Duration(seconds: 3), () {
            setState(() {
              internetStatus = 0;  // Reset the status to default
            });
          });
        }
      }
    }
    // Schedule the next check after 6 seconds
    await Future.delayed(Duration(seconds: 6));
    internetCheck(false);
  }
  

  @override
  void dispose() {
    isUnmounted = true;
    // Cancel the timer to avoid memory leaks
    try{
      _timer.cancel();
    }
    catch(e){
      // Ignore errors if the timer is not initialized
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    String currentLanguage = Localizations.localeOf(context).languageCode;
    bool isConnectionRestored = internetStatus == 1;
    bool isConnectionLost = internetStatus == -1;
    return Stack(
      children: [
        // The main content of the app
        widget.child,
        // Display a banner if the connection is lost or restored
        if (isConnectionRestored || isConnectionLost)
          Positioned(
            top: 0,
            left: 100,
            right: 100,
            child: Opacity(
              opacity: 0.5,
              child: Center(
                child: Container(
                  alignment: Alignment.center,
                  color: isConnectionLost ? Colors.red : Colors.green,
                  padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.8, // Optional: Limit max width
                  ),
                  child: Text(
                    isConnectionLost
                        ? widget.l10n.translate("Oops! You're Offline. Attempting to reconnect....", currentLanguage)
                        : widget.l10n.translate("Connection Restored!", currentLanguage),
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                    softWrap: true, // Allow text to wrap to the next line
                    textAlign: TextAlign.center, // Center-align the text
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
