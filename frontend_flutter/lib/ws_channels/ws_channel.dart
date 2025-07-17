// WebSocket channel utilities for connecting, listening, sending, and keeping alive connections in the app.
// Provides helpers for robust, testable, and maintainable WebSocket usage.
import 'package:frontend_flutter/utils/utils.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'dart:async';

/// Creates a WebSocketChannel to the backend server.
/// Returns the channel if successful, or null if connection fails.
WebSocketChannel? createChannel(String backendHost, int port, String path) {
  try{
    // Replace <backend_host>, <port>, and <path> with your backend WebSocket server details
    return WebSocketChannel.connect(
      Uri.parse('ws://$backendHost:$port/ws/$path/'),
    );
  } catch (e) {
    logMessage('Profile WebSocket connection error: $e', "Profile WebSocket connection error", "e");
    return null; // Return null if the connection fails
  }
}

/// Async helper to connect and wait for the first event (message or error).
/// Returns the channel if a message is received, or null if error/timeout.
Future<WebSocketChannel?> connectAndWaitForFirstEvent(String host, int port, String path, Function(String message) onMessage, {Duration timeout = const Duration(seconds: waitForChannelsConnectionDuration)}) async {
  final channel = createChannel(host, port, path);
  final completer = Completer<WebSocketChannel?>();
  late StreamSubscription sub;
  sub = channel!.stream.listen(
    (message) {
      if (!completer.isCompleted) {
        completer.complete(channel);
      }
      else{
        onMessage(message); // Call the provided callback with the message
      }
    },
    onError: (error) {
      if (!completer.isCompleted) {
        completer.complete(null);
        sub.cancel();
      }
    },
    onDone: () {
      if (!completer.isCompleted) {
        completer.complete(null);
      }
    },
    cancelOnError: true,
  );
  Future.delayed(timeout, () {
    if (!completer.isCompleted) {
      completer.complete(null);
      sub.cancel();
    }
  });
  return completer.future;
}

/// Listens to a WebSocket channel and calls [onMessage] for each message received.
void listenToChannel(WebSocketChannel channel, Function(String message) onMessage) {
  channel.stream.listen((message) {
    onMessage(message);
  });
}

/// Sends a message through the WebSocket channel.
void sendMessage(WebSocketChannel channel, String message) {
  channel.sink.add(message);
}

/// Closes the WebSocket channel.
void closeChannel(WebSocketChannel channel) {
  channel.sink.close();
}

/// Starts a periodic ping to keep the WebSocket connection alive.
/// Returns the Timer so you can cancel it when closing the channel.
Timer startWebSocketPing(WebSocketChannel channel, {Duration interval = const Duration(seconds: 30), String pingMessage = 'ping'}) {
  return Timer.periodic(interval, (timer) {
    try {
      channel.sink.add(pingMessage);
    } catch (e) {
      // Optionally log or handle errors
    }
  });
}
