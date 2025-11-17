import 'dart:html' as html;
import 'dart:async';
import 'package:flutter/material.dart';
import 'dart:ui' as ui;
import 'dart:js' as js;

class MonacoEditorWidget extends StatefulWidget {
  @override
  _MonacoEditorWidgetState createState() => _MonacoEditorWidgetState();
}

class _MonacoEditorWidgetState extends State<MonacoEditorWidget> {
  late StreamSubscription<html.MessageEvent> _messageSubscription;

  @override
  void initState() {
    super.initState();

    _messageSubscription = html.window.onMessage.listen((event) {
      print(event.data);
    });
  }

  @override
  void dispose() {
    _messageSubscription.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    //iFrame
    final String iframeId = 'monaco-editor-container';

    //create iframe element
    final html.IFrameElement iframeElement = html.IFrameElement()
      ..src = 'monaco_editor.html'
      ..style.border = 'none';

    //register iframe
    //ignore:undefined_prefixed_name
    ui.platformViewRegistry.registerViewFactory(
      iframeId,
      (int viewId) => iframeElement,
    );

    return HtmlElementView(viewType: iframeId);
  }
}



/* import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';

typedef CodeChangedCallback = void Function(String code);

class MonacoEditorWidget extends StatefulWidget {
  final String initialCode;
  final String language;
  final String theme;
  final CodeChangedCallback? onCodeChanged;

  const MonacoEditorWidget({
    super.key,
    required this.initialCode,
    required this.language,
    required this.theme,
    this.onCodeChanged,
  });

  @override
  State<MonacoEditorWidget> createState() => MonacoEditorWidgetState();
}

class MonacoEditorWidgetState extends State<MonacoEditorWidget> {
  InAppWebViewController? _controller;
  bool _initialized = false;

  @override
  Widget build(BuildContext context) {
    return InAppWebView(
      initialFile: 'assets/monaco_host.html',
      initialSettings: InAppWebViewSettings(
        javaScriptEnabled: true,
        disableHorizontalScroll: false,
        disableVerticalScroll: false,
        transparentBackground: true,
      ),
      onWebViewCreated: (controller) {
        _controller = controller;
        controller.addJavaScriptHandler(
          handlerName: 'monacoMessage',
          callback: (args) {
            // args[0] is our message object from JS
            if (args.isEmpty) return;
            final msg = args[0] as Map<dynamic, dynamic>;
            final type = msg['type'];
            final payload = msg['payload'];

            if (type == 'codeChanged' && payload is String) {
              widget.onCodeChanged?.call(payload);
            }

            return null;
          },
        );
      },
      onLoadStop: (controller, url) async {
        // Initialize Monaco with current props
        await _sendMessageToMonaco(
          type: 'init',
          payload: {
            'code': widget.initialCode,
            'language': widget.language,
            'theme': widget.theme,
          },
        );
        _initialized = true;
      },
    );
  }

  Future<void> _sendMessageToMonaco({
    required String type,
    Map<String, dynamic>? payload,
  }) async {
    if (_controller == null) return;
    final message = jsonEncode({'type': type, 'payload': payload ?? {}});
    final js = "window.postMessage($message, '*');";
    await _controller!.evaluateJavascript(source: js);
  }

  Future<void> setCode(String code) async {
    if (!_initialized) return;
    await _sendMessageToMonaco(
      type: 'setCode',
      payload: {'code': code},
    );
  }

  Future<void> setLanguage(String language) async {
    if (!_initialized) return;
    await _sendMessageToMonaco(
      type: 'setLanguage',
      payload: {'language': language},
    );
  }

  Future<void> setTheme(String theme) async {
    if (!_initialized) return;
    await _sendMessageToMonaco(
      type: 'setTheme',
      payload: {'theme': theme},
    );
  }

  Future<String?> getCode() async {
    if (!_initialized || _controller == null) return null;

    // Ask Monaco to send back a 'codeSnapshot' message
    final completer = Completer<String>();
    late JavaScriptHandlerCallback handler;

    handler = (args) {
      if (args.isEmpty) return null;
      final msg = args[0] as Map<dynamic, dynamic>;
      final type = msg['type'];
      final payload = msg['payload'];

      if (type == 'codeSnapshot' && payload is String) {
        if (!completer.isCompleted) {
          completer.complete(payload);
        }
      }
      return null;
    };

    _controller!.addJavaScriptHandler(
      handlerName: 'monacoMessage',
      callback: handler,
    );

    await _sendMessageToMonaco(type: 'getCode');

    final result = await completer.future;

    // (Optional) Could remove the handler again here.

    return result;
  }
}
*/