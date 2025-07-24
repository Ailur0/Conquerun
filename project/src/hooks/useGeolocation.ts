import { useState, useEffect, useRef } from 'react';
import { LocationUpdate } from '../types';

interface GeolocationState {
  location: LocationUpdate | null;
  error: string | null;
  isLoading: boolean;
  isSupported: boolean;
}

export const useGeolocation = (options?: PositionOptions) => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    isLoading: true,
    isSupported: 'geolocation' in navigator,
  });

  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Geolocation is not supported by this browser',
      }));
      return;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
      ...options,
    };

    const handleSuccess = (position: GeolocationPosition) => {
      const location: LocationUpdate = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: new Date(),
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || undefined,
      };

      setState(prev => ({
        ...prev,
        location,
        error: null,
        isLoading: false,
      }));
    };

    const handleError = (error: GeolocationPositionError) => {
      let errorMessage = 'An unknown error occurred';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location services.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out.';
          break;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, defaultOptions);

    // Watch position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      defaultOptions
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [state.isSupported]);

  const clearWatch = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  return {
    ...state,
    clearWatch,
  };
};