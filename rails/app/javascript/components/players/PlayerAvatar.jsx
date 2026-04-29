import React, { useState, useEffect, useRef } from 'react';
import { Box, Image, Text } from 'grommet';

// Simple gray circle placeholder SVG
const DEFAULT_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%23cccccc"/%3E%3C/svg%3E';

// Request deduplication and rate limiting
const imageCache = new Map();
const pendingRequests = new Map();
const requestQueue = [];
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 3; // Limit concurrent image requests

async function processQueue() {
  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    const { bbrefid, resolve, reject } = requestQueue.shift();
    activeRequests++;

    fetch(`/api/player_images/${bbrefid}`)
      .then(res => res.json())
      .then(data => {
        const imageUrl = data.image_url && data.image_url !== DEFAULT_IMAGE ? data.image_url : DEFAULT_IMAGE;
        imageCache.set(bbrefid, imageUrl);
        pendingRequests.delete(bbrefid);
        resolve(imageUrl);
      })
      .catch(err => {
        console.error('Failed to fetch player image:', err);
        pendingRequests.delete(bbrefid);
        resolve(DEFAULT_IMAGE);
      })
      .finally(() => {
        activeRequests--;
        processQueue(); // Process next in queue
      });
  }
}

async function fetchPlayerImage(bbrefid) {
  // Check cache first
  if (imageCache.has(bbrefid)) {
    return imageCache.get(bbrefid);
  }

  // Check if there's already a pending request
  if (pendingRequests.has(bbrefid)) {
    return pendingRequests.get(bbrefid);
  }

  // Create new request and add to queue
  const promise = new Promise((resolve, reject) => {
    requestQueue.push({ bbrefid, resolve, reject });
    processQueue();
  });

  pendingRequests.set(bbrefid, promise);
  return promise;
}

function PlayerAvatar({ bbrefid, size = 'small', name }) {
  const [imageUrl, setImageUrl] = useState(DEFAULT_IMAGE);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { rootMargin: '50px' }
    );

    observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Fetch image URL only when visible
  useEffect(() => {
    if (!isVisible || !bbrefid) {
      return;
    }

    let isMounted = true;

    fetchPlayerImage(bbrefid).then(url => {
      if (isMounted && url !== DEFAULT_IMAGE) {
        setImageUrl(url);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [bbrefid, isVisible]);

  const sizeMap = {
    small: '32px',
    medium: '48px',
    large: '64px',
  };

  const imgSize = sizeMap[size] || sizeMap.small;

  return (
    <Box
      ref={containerRef}
      width={imgSize}
      height={imgSize}
      round="full"
      overflow="hidden"
      flex={false}
      background="light-3"
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={name || 'Player'}
          fit="cover"
          onError={() => {
            if (!error) {
              setImageUrl(DEFAULT_IMAGE);
              setError(true);
            }
          }}
        />
      )}
    </Box>
  );
}

export default PlayerAvatar;
