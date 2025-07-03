import 'dart:async';
import 'package:flutter_test/flutter_test.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:frontend/ws_channels/ws_channel.dart';

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

void main() {
  test('SendMessage sends message to sink', () async {
    final channel = MockWebSocketChannel();
    sendMessage(channel, 'hello');
    expect(channel.mockSink.sent, contains('hello'));
  });

  test('ListenToChannel receives messages', () async {
    final channel = MockWebSocketChannel();
    final messages = <String>[];
    listenToChannel(channel, (msg) => messages.add(msg));
    channel.addIncoming('msg1');
    channel.addIncoming('msg2');
    await Future.delayed(Duration(milliseconds: 10));
    expect(messages, ['msg1', 'msg2']);
  });

  test('StartWebSocketPing sends ping periodically', () async {
    final channel = MockWebSocketChannel();
    final timer = startWebSocketPing(channel, interval: Duration(milliseconds: 50), pingMessage: 'ping!');
    await Future.delayed(Duration(milliseconds: 120));
    timer.cancel();
    expect(channel.mockSink.sent.length >= 2, true);
    expect(channel.mockSink.sent.every((m) => m == 'ping!'), true);
  });

  test('CloseChannel closes the sink', () async {
    final channel = MockWebSocketChannel();
    closeChannel(channel);
    expect(channel.mockSink.closed, true);
  });
  
}
