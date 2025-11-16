package com.triviaparty.display

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.enableEdgeToEdge
import kotlin.system.exitProcess

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)

    // Configure WebView for full resolution display on Android TV
    val webView = findViewById<WebView>(resources.getIdentifier("wv", "id", packageName))
    webView?.apply {
      settings.apply {
        // Enable zoom support
        setSupportZoom(true)
        builtInZoomControls = false
        displayZoomControls = false

        // Use wide viewport
        useWideViewPort = true
        loadWithOverviewMode = false

        // Enable hardware acceleration
        setRenderPriority(android.webkit.WebSettings.RenderPriority.HIGH)
      }

      // Inject zoom adjustment after page loads to compensate for high DPR
      webViewClient = object : WebViewClient() {
        override fun onPageFinished(view: WebView?, url: String?) {
          super.onPageFinished(view, url)
          // Scale content by inverse of devicePixelRatio to get full resolution
          view?.evaluateJavascript(
            "document.body.style.zoom = 1 / window.devicePixelRatio;",
            null
          )
          android.util.Log.d("TriviaParty", "Applied zoom adjustment for DPR: " +
            "document.body.style.zoom = 1 / window.devicePixelRatio")
        }
      }
    }
  }

  override fun onDestroy() {
    super.onDestroy()

    // Force-kill the process to prevent Shutdown thread from lingering
    // This fixes the alternating crash pattern caused by previous instance's
    // Shutdown thread interfering with ICU initialization on next launch
    android.util.Log.i("TriviaParty", "Force-killing process to ensure clean exit")
    exitProcess(0)
  }
}
