import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface GPSClientOptions {
  deviceIdentifier: string
  intervalSeconds?: number
  highAccuracy?: boolean
}

interface ClientState {
  running: boolean
  position: GeolocationPosition | null
  lastSent: Date | null
  error: string | null
  positionsCount: number
  battery: number | null
}

export function useGPSClient({ deviceIdentifier, intervalSeconds = 30, highAccuracy = true }: GPSClientOptions) {
  const [state, setState] = useState<ClientState>({
    running: false,
    position: null,
    lastSent: null,
    error: null,
    positionsCount: 0,
    battery: null,
  })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const watchRef = useRef<number | null>(null)
  const latestPos = useRef<GeolocationPosition | null>(null)

  // Battery API
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setState(prev => ({ ...prev, battery: Math.round(battery.level * 100) }))
        battery.addEventListener('levelchange', () => {
          setState(prev => ({ ...prev, battery: Math.round(battery.level * 100) }))
        })
      }).catch(() => {})
    }
  }, [])

  const sendPosition = useCallback(async (pos: GeolocationPosition, battery: number | null) => {
    const { coords, timestamp } = pos
    try {
      const { error } = await supabase.rpc('upsert_position', {
        p_identifier: deviceIdentifier,
        p_lat: coords.latitude,
        p_lng: coords.longitude,
        p_speed: coords.speed ? Math.round(coords.speed * 3.6) : 0, // m/s to km/h
        p_course: coords.heading ?? 0,
        p_altitude: coords.altitude ?? 0,
        p_accuracy: coords.accuracy ?? 0,
        p_battery: battery,
        p_satellites: null,
      })

      if (error) throw new Error(error.message)

      setState(prev => ({
        ...prev,
        lastSent: new Date(timestamp),
        positionsCount: prev.positionsCount + 1,
        error: null,
      }))
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }))
    }
  }, [deviceIdentifier])

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Gjeolokacioni nuk suportohet nga ky browser.' }))
      return
    }

    setState(prev => ({ ...prev, running: true, error: null }))

    // Watch position continuously
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        latestPos.current = pos
        setState(prev => ({ ...prev, position: pos }))
      },
      (err) => setState(prev => ({ ...prev, error: err.message })),
      { enableHighAccuracy: highAccuracy, timeout: 10000, maximumAge: 5000 }
    )

    // Send on interval
    const send = () => {
      if (latestPos.current) {
        sendPosition(latestPos.current, state.battery)
      }
    }
    send() // send immediately
    intervalRef.current = setInterval(send, intervalSeconds * 1000)
  }, [intervalSeconds, highAccuracy, sendPosition, state.battery])

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
    setState(prev => ({ ...prev, running: false }))
  }, [])

  useEffect(() => () => { stop() }, [stop])

  return { ...state, start, stop }
}
