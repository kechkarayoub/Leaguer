import 'package:flutter_test/flutter_test.dart';
import 'package:frontend_flutter/ws_channels/ws_channel.dart';

import '../mocks/ws_mocks.dart';


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
