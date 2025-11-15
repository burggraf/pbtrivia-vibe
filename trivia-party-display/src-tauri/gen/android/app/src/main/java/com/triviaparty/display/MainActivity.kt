package com.triviaparty.display

import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import kotlin.system.exitProcess

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    enableEdgeToEdge()
    super.onCreate(savedInstanceState)
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
