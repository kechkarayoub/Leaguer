import 'dart:async';
import 'package:web_socket_channel/web_socket_channel.dart';

// Mock sink to capture add/close calls
class MockSink implements WebSocketSink {
  final List<dynamic> sent = [];
  bool closed = false;
  @override
  void add(dynamic data) => sent.add(data);
  @override
  Future close([int? closeCode, String? closeReason]) async { closed = true; }
  // The following are required overrides but not used in these tests
  @override
  void addError(error, [StackTrace? stackTrace]) {}
  @override
  Future addStream(Stream<dynamic> stream) => Future.value();
  @override
  Future get done => Future.value();
  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class MockWebSocketChannel implements WebSocketChannel {
  final _controller = StreamController<String>.broadcast();
  final MockSink mockSink = MockSink();
  @override
  Stream<String> get stream => _controller.stream;
  @override
  WebSocketSink get sink => mockSink;
  void addIncoming(String message) => _controller.add(message);
  @override
  noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
