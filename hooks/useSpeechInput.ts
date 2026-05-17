import { useState, useCallback } from 'react'
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition'

export function useSpeechInput(onResult: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useSpeechRecognitionEvent('start', () => setIsListening(true))
  useSpeechRecognitionEvent('end', () => setIsListening(false))
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript
    if (transcript) onResult(transcript)
  })
  useSpeechRecognitionEvent('error', (event) => {
    setError(event.message ?? event.error)
    setIsListening(false)
  })

  const start = useCallback(async () => {
    setError(null)
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
    if (!granted) {
      setError('Chưa cấp quyền micro')
      return
    }
    ExpoSpeechRecognitionModule.start({ lang: 'vi-VN', interimResults: false, continuous: false })
  }, [])

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop()
  }, [])

  return { isListening, error, start, stop }
}
