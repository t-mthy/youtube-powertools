import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Card, CardMedia } from '@mui/material';

// Active tab ID to communicate with new window
const getTabIdFromURL = () => {
  const queryParams = new URLSearchParams(window.location.search);
  return queryParams.get('tabId');
};

const App = () => {
  // Extract tab ID from URL
  const tabId = parseInt(getTabIdFromURL());

  // States
  const [thumbnail, setThumbnail] = useState('');

  // Video details
  const fetchVideoDetails = async (videoId) => {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;

    try {
      const response = await axios.get(url);
      const thumbnailUrl = response.data.items[0].snippet.thumbnails.high.url;
      setThumbnail(thumbnailUrl);
    } catch (error) {
      console.error('Error fetching video details:', error);
    }
  };

  // Mount
  useEffect(() => {
    if (!isNaN(tabId)) {
      chrome.tabs.sendMessage(
        tabId,
        { message: 'GetYoutubeVideoId' },
        (response) => {
          if (response && response.videoId) {
            fetchVideoDetails(response.videoId);
          }
        }
      );
    }
  }, [tabId]);

  return (
    <Box sx={{ padding: 2 }}>
      {thumbnail && (
        <Card>
          <CardMedia
            component="img"
            image={thumbnail}
            alt="Video Thumbnail"
            sx={{ height: 210, width: 375 }}
          />
        </Card>
      )}
    </Box>
  );
};

export default App;
